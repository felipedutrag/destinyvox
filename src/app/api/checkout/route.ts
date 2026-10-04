import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { generateRandomCPF } from "@/utils/cpf";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getGGPIXApiKey } from "@/lib/ggpix";
import { getMapAuth, sameOrigin } from "@/lib/map-auth";
import { CATALOG, createOrder, validateCustomer } from "@/lib/catalog";
import { brazilianDate } from "@/lib/web-map";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Origem inválida." }, { status: 403 });
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Dados inválidos." }, { status: 400 }); }
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  let order;
  try { order = createOrder(body.product, body.bumps); } catch (error) { return NextResponse.json({ error: (error as Error).message }, { status: 400 }); }
  try {
    let customerInput = body;
    let sourceMapId: string | null = null;
    let userId: string | null = null;
    if (order.product === "atlas") {
      const client = await getMapAuth();
      const { data: { user }, error: authError } = await client.auth.getUser();
      if (authError || !user) return NextResponse.json({ error: "Entre no seu mapa para adquirir o Atlas." }, { status: 401 });
      if (typeof body.sourceMapId !== "string" || !/^[a-f0-9-]{36}$/i.test(body.sourceMapId)) return NextResponse.json({ error: "Mapa inválido." }, { status: 400 });
      const { data: map, error } = await client.from("numerology_maps").select("id, customer_name, customer_email, birth_date, full_interpretation").eq("id", body.sourceMapId).eq("user_id", user.id).eq("status", "completed").maybeSingle();
      if (error) throw error;
      if (!map || map.full_interpretation?.purchase?.product === "atlas") return NextResponse.json({ error: "Mapa de origem não encontrado." }, { status: 404 });
      const { data: existing, error: existingError } = await client.from("payments").select("id").eq("user_id", user.id).eq("status", "PAID").contains("metadata", { sourceMapId: map.id, product: "atlas" }).limit(1);
      if (existingError) throw existingError;
      if (existing?.length) return NextResponse.json({ error: "Você já adquiriu este Atlas. Atualize seu mapa ou consulte seu e-mail para acessá-lo." }, { status: 409 });
      customerInput = { name: map.customer_name, email: map.customer_email, birthDate: map.birth_date };
      sourceMapId = map.id; userId = user.id;
    }
    let customer;
    try { customer = validateCustomer(customerInput, brazilianDate()); } catch (error) { return NextResponse.json({ error: (error as Error).message }, { status: 400 }); }
    const apiKey = getGGPIXApiKey();
    if (!apiKey) throw new Error("Gateway indisponível");
    const supabase = getSupabaseAdmin();
    const paymentId = randomUUID(), externalId = `MAPA_${paymentId}`;
    const cpf = generateRandomCPF();
    const metadata = { ...order, birthDate: customer.birthDate, referenceDate: brazilianDate(), sourceMapId, plan: CATALOG[order.product].name };
    // Persist before the gateway call so an early webhook finds the order by external_id.
    const { error: insertError } = await supabase.from("payments").insert({ id: paymentId, gateway: "ggpix", external_id: externalId, user_id: userId, payer_name: customer.name, payer_email: customer.email, payer_cpf: cpf, amount_cents: order.amountCents, status: "PENDING", metadata });
    if (insertError) throw insertError;
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "https://destinyvox.online").replace(/\/$/, "");
    const response = await fetch("https://ggpixapi.com/api/v1/pix/in", {
      method: "POST", headers: { "Content-Type": "application/json", "X-API-Key": apiKey },
      body: JSON.stringify({ amountCents: order.amountCents, description: `DestinyVox — ${CATALOG[order.product].name}${order.bumps.length ? ` + ${order.bumps.length} adicionais` : ""}`, externalId, payerName: customer.name, payerDocument: cpf, customerEmail: customer.email, webhookUrl: `${appUrl}/api/webhooks/ggpix` }),
      signal: AbortSignal.timeout(25000),
    });
    const data = await response.json();
    const pixCode = data.pixCopyPaste || data.pixCode;
    if (!response.ok || !data.id || !pixCode) throw new Error("Não foi possível gerar o Pix");
    const qr = (await QRCode.toDataURL(pixCode)).replace(/^data:image\/png;base64,/, "");
    const { error: updateError } = await supabase.from("payments").update({ transaction_id: String(data.id), pix_code: pixCode, pix_qr_code_base64: qr }).eq("id", paymentId);
    if (updateError) throw updateError;
    return NextResponse.json({ success: true, transaction_id: String(data.id), external_id: externalId, qr_code_base64: qr, pix_copy_paste: pixCode, amount_cents: order.amountCents });
  } catch (error) {
    console.error("[Checkout] Falha ao preparar compra", error);
    return NextResponse.json({ error: "Não foi possível gerar seu Pix agora. Tente novamente em instantes." }, { status: 503 });
  }
}
