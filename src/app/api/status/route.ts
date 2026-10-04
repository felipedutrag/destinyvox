import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getGGPIXApiKey } from "@/lib/ggpix";
import { PRIVATE_HEADERS } from "@/lib/map-auth";

export async function GET(request: Request) {
  const transactionId = new URL(request.url).searchParams.get("id");
  if (!transactionId || transactionId.length > 150) return NextResponse.json({ error: "Transação inválida." }, { status: 400 });
  const reply = (status: string) => NextResponse.json({ status }, { headers: PRIVATE_HEADERS });
  try {
    const supabase = getSupabaseAdmin();
    const { data: payment, error } = await supabase.from("payments").select("id, status, amount_cents").eq("transaction_id", transactionId).maybeSingle();
    if (error) throw error;
    if (!payment) return reply("PENDING");
    if (payment.status === "PAID") return reply("PAID");
    if (["FAILED", "CANCELED", "EXPIRED"].includes(payment.status)) return reply(payment.status);
    const apiKey = getGGPIXApiKey();
    if (!apiKey) return reply("PENDING");
    const response = await fetch(`https://ggpixapi.com/api/v1/transactions/${encodeURIComponent(transactionId)}`, { headers: { "X-API-Key": apiKey }, cache: "no-store", signal: AbortSignal.timeout(10000) });
    const data = await response.json();
    if (!response.ok || data.error) return reply("PENDING");
    if (data.status === "COMPLETE" || data.status === "paid") {
      const receivedAmount = data.amountCents ?? data.amount;
      if (receivedAmount !== undefined && Number(receivedAmount) !== payment.amount_cents) return reply("PENDING");
      const { error: updateError } = await supabase.from("payments").update({ status: "PAID", paid_at: new Date().toISOString() }).eq("id", payment.id);
      if (updateError) throw updateError;
      return reply("PAID");
    }
    return reply("PENDING");
  } catch (error) {
    console.error("[Status] Falha ao consultar pagamento", error);
    return NextResponse.json({ error: "Não foi possível verificar agora." }, { status: 503, headers: PRIVATE_HEADERS });
  }
}
