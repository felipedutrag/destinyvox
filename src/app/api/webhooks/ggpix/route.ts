import { NextResponse } from "next/server";
import { verifyGGPIXWebhook, GGPIXWebhookPayload } from "@/lib/ggpix";
import { getSupabaseAdmin } from "@/lib/supabase";
import { deliverNumerologyMap } from "@/lib/delivery";

export async function GET() {
  return NextResponse.json({
    status: "active",
    service: "DestinyVox GGPIX Webhook Listener",
    timestamp: new Date().toISOString(),
  });
}

function parseExternalId(externalId?: string) {
  if (!externalId || !externalId.startsWith("MAPA_")) return null;
  const parts = externalId.split("__||__");
  if (parts.length < 5) return null;
  try {
    return {
      timestamp: parts[0].replace("MAPA_", ""),
      name: decodeURIComponent(parts[1]),
      email: decodeURIComponent(parts[2]),
      birthDate: parts[3],
      plan: parts[4],
    };
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signatureHeader = request.headers.get("x-webhook-signature");
    const authHeader = request.headers.get("authorization");

    // 1. Verificação de Segurança (HMAC ou Bearer)
    const verification = verifyGGPIXWebhook({
      rawBody,
      signatureHeader,
      authHeader,
    });

    if (!verification.valid) {
      console.warn(`[GGPIX Webhook] ❌ Autenticação rejeitada: ${verification.reason}`);
      return NextResponse.json(
        { error: "Assinatura ou token inválido", reason: verification.reason },
        { status: 401 }
      );
    }

    let payload: GGPIXWebhookPayload;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
    }

    console.log(`⚡ [GGPIX Webhook] Evento recebido: Tipo=${payload.type} | Status=${payload.status} | ID=${payload.transactionId}`);

    // 2. Tratar disparo de teste do painel GGPIX
    if (payload.test || (payload.transactionId && payload.transactionId.startsWith("test_"))) {
      console.log("[GGPIX Webhook] 🧪 Teste de webhook validado com sucesso.");
      return NextResponse.json({
        success: true,
        responseStatus: 200,
        responseBody: "OK",
      });
    }

    const supabase = getSupabaseAdmin();
    const { transactionId, externalId, status, amount } = payload;

    // 3. Localizar registro de pagamento existente
    let paymentRecord: {
      id: string;
      payer_name: string;
      payer_email: string;
      metadata: Record<string, unknown> | null;
      map_id: string | null;
    } | null = null;

    if (transactionId || externalId) {
      const query = supabase.from("payments").select("id, payer_name, payer_email, metadata, map_id");
      if (transactionId) {
        query.eq("transaction_id", String(transactionId));
      } else if (externalId) {
        query.eq("external_id", externalId);
      }
      const { data } = await query.maybeSingle();
      paymentRecord = data;
    }

    // 4. Tratar Status de Pagamento Concluído (COMPLETE)
    if (status === "COMPLETE") {
      const parsedMeta = parseExternalId(externalId);

      const customerName =
        paymentRecord?.payer_name ||
        payload.payer?.name ||
        parsedMeta?.name ||
        "Cliente";

      const customerEmail =
        paymentRecord?.payer_email ||
        parsedMeta?.email ||
        "";

      const birthDate =
        (paymentRecord?.metadata?.birthDate as string) ||
        parsedMeta?.birthDate ||
        "1990-01-01";

      const plan =
        (paymentRecord?.metadata?.plan as string) ||
        parsedMeta?.plan ||
        "10_questions";

      // Atualizar status do pagamento para PAID
      try {
        const updateQuery = supabase
          .from("payments")
          .update({
            status: "PAID",
            paid_at: payload.paidAt || new Date().toISOString(),
            amount_cents: amount || undefined,
            transaction_id: String(transactionId || ""),
          });

        if (paymentRecord?.id) {
          await updateQuery.eq("id", paymentRecord.id);
        } else if (externalId) {
          await updateQuery.eq("external_id", externalId);
        }
      } catch (updErr) {
        console.warn("[GGPIX Webhook] Erro ao atualizar status do pagamento:", updErr);
      }

      // Se temos o e-mail do cliente, processar e entregar o Mapa Pitagórico
      if (customerEmail) {
        try {
          console.log(`🚀 [GGPIX Webhook] Disparando geração/entrega do Mapa Pitagórico para ${customerEmail}...`);
          await deliverNumerologyMap({
            name: customerName,
            email: customerEmail,
            birthDate: birthDate,
            transactionId: transactionId,
            externalId: externalId,
            amountCents: amount,
            plan: plan,
          });
          console.log(`✅ [GGPIX Webhook] Entrega processada com sucesso para ${customerEmail}`);
        } catch (deliveryError) {
          console.error("[GGPIX Webhook] ❌ Falha na entrega do mapa:", deliveryError);
        }
      } else {
        console.warn("[GGPIX Webhook] ⚠️ E-mail do cliente não encontrado para disparo automático.");
      }
    } else if (status === "FAILED") {
      console.warn(`[GGPIX Webhook] Transação FALHOU: ${transactionId}. Motivo: ${payload.failureReason}`);
      if (externalId || transactionId) {
        await supabase
          .from("payments")
          .update({
            status: "FAILED",
            metadata: { failureReason: payload.failureReason },
          })
          .or(`transaction_id.eq.${transactionId},external_id.eq.${externalId}`);
      }
    } else if (status === "CANCELED") {
      console.log(`[GGPIX Webhook] Transação CANCELADA: ${transactionId}`);
      if (externalId || transactionId) {
        await supabase
          .from("payments")
          .update({ status: "CANCELED" })
          .or(`transaction_id.eq.${transactionId},external_id.eq.${externalId}`);
      }
    }

    // Retorna 200 OK para confirmar o recebimento à GGPIX
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[GGPIX Webhook] 💥 Erro interno no processamento do webhook:", error);
    // Retornamos 200 para evitar retries desnecessários caso seja erro não transitório,
    // ou 500 se quisermos que a GGPIX tente novamente em até 24h.
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
