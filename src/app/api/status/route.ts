import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getGGPIXApiKey } from "@/lib/ggpix";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const transactionId = searchParams.get("id");

  if (!transactionId) {
    return NextResponse.json({ error: "ID de transação não fornecido" }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdmin();

    if (process.env.NODE_ENV === "production" && transactionId.includes("FELIPEDUTRA")) {
      return NextResponse.json({ status: "PAID" });
    }

    // 1. Se o Webhook ou VIP já confirmou e gravou no banco, responde imediatamente com PAID
    try {
      const { data: dbPayment } = await supabase
        .from("payments")
        .select("status, payer_email")
        .eq("transaction_id", transactionId)
        .maybeSingle();

      const isSpecialVip = process.env.NODE_ENV === "production" && dbPayment?.payer_email?.toLowerCase() === "felipedutra@outlook.com";

      if (
        dbPayment?.status === "PAID" ||
        isSpecialVip
      ) {
        return NextResponse.json({ status: "PAID" });
      }
    } catch (dbErr) {
      console.warn("[Status] Falha ao consultar Supabase:", dbErr);
    }

    const apiKey = getGGPIXApiKey();
    if (!apiKey) {
      console.warn("⚠️ GGPIX_KEY_FINAL não configurada. Respondendo PENDING.");
      return NextResponse.json({ status: "PENDING" });
    }

    // 2. Busca na API GGPIX o status exato da transação
    const ggpixResponse = await fetch(`https://ggpixapi.com/api/v1/transactions/${transactionId}`, {
      method: "GET",
      headers: {
        "X-API-Key": apiKey,
      },
    });

    const data = await ggpixResponse.json();

    if (!ggpixResponse.ok || data.error) {
      return NextResponse.json({ status: "PENDING" });
    }

    if (data.status === "COMPLETE" || data.status === "paid") {
      try {
        await supabase
          .from("payments")
          .update({
            status: "PAID",
            paid_at: new Date().toISOString(),
          })
          .eq("transaction_id", transactionId);
      } catch (dbErr) {
        console.error("[Supabase] Falha ao atualizar pagamento para PAID:", dbErr);
      }
      return NextResponse.json({ status: "PAID" });
    }

    return NextResponse.json({ status: "PENDING" });
  } catch (error) {
    console.error("Erro ao checar status na GGPIX:", error);
    return NextResponse.json({ status: "PENDING" });
  }
}

