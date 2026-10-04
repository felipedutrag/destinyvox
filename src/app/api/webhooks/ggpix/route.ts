import { NextResponse } from "next/server";
import { verifyGGPIXWebhook, type GGPIXWebhookPayload } from "@/lib/ggpix";
import { getSupabaseAdmin } from "@/lib/supabase";
import { deliverNumerologyMap } from "@/lib/delivery";

export async function GET() { return NextResponse.json({ status: "active", service: "DestinyVox GGPIX Webhook Listener" }); }

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const verification = verifyGGPIXWebhook({ rawBody, signatureHeader: request.headers.get("x-webhook-signature"), authHeader: request.headers.get("authorization") });
    if (!verification.valid) return NextResponse.json({ error: "Assinatura inválida" }, { status: 401 });
    let payload: GGPIXWebhookPayload;
    try { payload = JSON.parse(rawBody); } catch { return NextResponse.json({ error: "JSON inválido" }, { status: 400 }); }
    if (payload.test || payload.transactionId?.startsWith("test_")) return NextResponse.json({ success: true });
    const supabase = getSupabaseAdmin();
    const fields = "id, status, payer_name, payer_email, metadata, amount_cents, transaction_id, external_id";
    let payment;
    if (payload.transactionId) {
      const { data, error } = await supabase.from("payments").select(fields).eq("transaction_id", payload.transactionId).maybeSingle();
      if (error) throw error;
      payment = data;
    }
    if (!payment && payload.externalId) {
      const { data, error } = await supabase.from("payments").select(fields).eq("external_id", payload.externalId).maybeSingle();
      if (error) throw error;
      payment = data;
    }
    // Entitlements come from our stored order, never webhook fallbacks.
    if (!payment) return NextResponse.json({ error: "Pagamento ainda não registrado" }, { status: 503 });
    if (payload.status === "COMPLETE") {
      if (Number(payload.amount) !== payment.amount_cents) return NextResponse.json({ error: "Valor divergente" }, { status: 409 });
      const { error } = await supabase.from("payments").update({ status: "PAID", paid_at: payload.paidAt || new Date().toISOString(), transaction_id: payload.transactionId || payment.transaction_id }).eq("id", payment.id);
      if (error) throw error;
      await deliverNumerologyMap({ name: payment.payer_name, email: payment.payer_email, birthDate: payment.metadata?.birthDate || "", externalId: payment.external_id });
    } else if (["FAILED", "CANCELED"].includes(payload.status) && payment.status !== "PAID") {
      const { error } = await supabase.from("payments").update({ status: payload.status }).eq("id", payment.id).neq("status", "PAID");
      if (error) throw error;
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[GGPIX Webhook] Falha transitória", error);
    return NextResponse.json({ error: "Processamento temporariamente indisponível" }, { status: 503 });
  }
}
