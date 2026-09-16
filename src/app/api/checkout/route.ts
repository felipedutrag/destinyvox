import { NextResponse } from "next/server";
import { generateRandomCPF } from "@/utils/cpf";
import QRCode from "qrcode";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getGGPIXApiKey } from "@/lib/ggpix";

export async function POST(request: Request) {
  try {
    const { name, email, birthDate, plan } = await request.json();

    if (!name || !email || !birthDate) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
    }

    const cpf = generateRandomCPF();
    // Embutindo todos os dados no external_id porque o webhook da GGPIX não retorna dados do cliente
    const external_id = `MAPA_${Date.now()}__||__${encodeURIComponent(name)}__||__${encodeURIComponent(email)}__||__${birthDate}__||__${plan || "30_questions"}`;
    const cleanEmail = email.trim().toLowerCase();
    const isSpecialVip = cleanEmail === "felipedutra@outlook.com";

    const amountCents = process.env.NODE_ENV === 'production' 
      ? 3990 
      : 100;

    // Se for o e-mail VIP felipedutra@outlook.com, aprova o pagamento imediatamente
    if (isSpecialVip) {
      const transactionId = `VIP_FELIPEDUTRA_${Date.now()}`;
      try {
        const supabase = getSupabaseAdmin();
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("email", cleanEmail)
          .maybeSingle();

        await supabase.from("payments").insert({
          gateway: "ggpix",
          external_id: external_id,
          transaction_id: transactionId,
          user_id: profile?.id || null,
          payer_name: name,
          payer_email: cleanEmail,
          payer_cpf: cpf,
          amount_cents: amountCents,
          status: "PAID",
          paid_at: new Date().toISOString(),
          pix_code: "VIP_AUTO_APPROVED",
          pix_qr_code_base64: "",
          metadata: {
            birthDate,
            plan: plan || "30_questions",
            auto_approved: true,
          },
        });
        console.log(`[Supabase] ⚡ Pagamento VIP aprovado automaticamente para ${cleanEmail}`);
      } catch (dbErr) {
        console.error("[Supabase] Erro ao gravar pagamento VIP:", dbErr);
      }

      return NextResponse.json({
        success: true,
        status: "PAID",
        auto_paid: true,
        transaction_id: transactionId,
        external_id: external_id,
        qr_code: "VIP_AUTO_APPROVED",
        pix_copy_paste: "VIP_AUTO_APPROVED",
      });
    }

    const apiKey = getGGPIXApiKey();
    if (!apiKey) {
      console.error("❌ ERRO: GGPIX_KEY_FINAL não está configurada na Vercel!");
      return NextResponse.json({ error: "Configuração do servidor incompleta" }, { status: 500 });
    }

    console.log(`🚀 [GGPIX-DEBUG] Chave: [${apiKey.substring(0, 5)}...] | Iniciando chamada...`);

    const description = "DestinyVox Oráculo — 30 Consultas & Mapa Pitagórico Completo";

    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "https://destinyvox.online").replace(/\/$/, "");
    const webhookUrl = `${appUrl}/api/webhooks/ggpix`;

    const ggpixResponse = await fetch("https://ggpixapi.com/api/v1/pix/in", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
      body: JSON.stringify({
        amountCents,
        description,
        externalId: external_id,
        payerName: name,
        payerDocument: cpf,
        customerEmail: email,
        webhookUrl: webhookUrl,
      }),
    });

    const data = await ggpixResponse.json();
    console.log("Resposta GGPIX completa:", data);

    if (!ggpixResponse.ok) {
      console.error("Erro GGPIX:", data);
      return NextResponse.json({ error: "Erro ao gerar PIX" }, { status: 500 });
    }

    // Gerar o QR Code em base64 caso a API não tenha enviado a imagem pronta
    const pixCode = data.pixCopyPaste || data.pixCode;
    let qrCodeBase64 = "";
    if (pixCode) {
      qrCodeBase64 = await QRCode.toDataURL(pixCode);
      qrCodeBase64 = qrCodeBase64.replace(/^data:image\/png;base64,/, "");
    }

    // Persistir pagamento no Supabase
    try {
      const supabase = getSupabaseAdmin();
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email.trim().toLowerCase())
        .maybeSingle();

      await supabase.from("payments").insert({
        gateway: "ggpix",
        external_id: external_id,
        transaction_id: String(data.id || ""),
        user_id: profile?.id || null,
        payer_name: name,
        payer_email: email.trim().toLowerCase(),
        payer_cpf: cpf,
        amount_cents: amountCents,
        status: "PENDING",
        pix_code: pixCode,
        pix_qr_code_base64: qrCodeBase64,
        metadata: {
          birthDate,
          plan: plan || "30_questions",
          rawResponse: data,
        },
      });
      console.log(`[Supabase] Pagamento pendente registrado para ${email}`);
    } catch (dbErr) {
      console.error("[Supabase] Aviso: Falha ao registrar pagamento pendente:", dbErr);
    }

    return NextResponse.json({
      success: true,
      transaction_id: data.id,
      qr_code: pixCode,
      qr_code_base64: qrCodeBase64,
      pix_copy_paste: pixCode,
      external_id: external_id
    });

  } catch (error) {
    console.error("Erro no Checkout:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
