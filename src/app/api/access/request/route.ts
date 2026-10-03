import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { generateMapLink, sendMapAccessEmail } from "@/lib/map-email";
import { PRIVATE_HEADERS, sameOrigin } from "@/lib/map-auth";

const reply = () => NextResponse.json({ message: "Se houver um mapa para este e-mail, você receberá um novo link. Confira também o spam." }, { headers: PRIVATE_HEADERS });

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({}, { status: 403 });
  try {
    const { email } = await request.json();
    if (typeof email !== "string" || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return reply();
    const normalized = email.trim().toLowerCase();
    const admin = getSupabaseAdmin();
    const { data: payment, error } = await admin.from("payments")
      .select("id, map_id, payer_name, metadata").eq("payer_email", normalized).eq("status", "PAID")
      .not("map_id", "is", null).order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (error) throw error;
    if (!payment?.map_id) return reply();
    const meta = (payment.metadata || {}) as Record<string, unknown>;
    if (meta.delivering === true) return reply();
    const now = Date.now();
    const lastRequest = Number(meta.access_requested_at || 0);
    const windowStart = Number(meta.access_window_start || 0);
    const inWindow = now - windowStart < 3_600_000;
    const count = inWindow ? Number(meta.access_request_count || 0) : 0;
    if (now - lastRequest < 60_000 || count >= 5) return reply();
    // Persistent, atomic cooldown per purchase works across serverless instances.
    let claim = admin.from("payments").update({ metadata: {
      ...meta, access_requested_at: now, access_window_start: inWindow ? windowStart : now, access_request_count: count + 1,
    } }).eq("id", payment.id);
    claim = payment.metadata === null ? claim.is("metadata", null) : claim.eq("metadata", JSON.stringify(payment.metadata));
    const { data: acquired, error: claimError } = await claim.select("id").maybeSingle();
    if (claimError) throw claimError;
    if (!acquired) return reply();
    const access = await generateMapLink(normalized);
    // Repairs legacy purchases whose old PDF delivery did not associate an Auth user.
    const { error: profileError } = await admin.from("profiles").upsert({ id: access.userId, email: normalized, full_name: payment.payer_name }, { onConflict: "id", ignoreDuplicates: true });
    if (profileError) throw profileError;
    const { data: owned, error: ownerError } = await admin.from("numerology_maps")
      .update({ user_id: access.userId }).eq("id", payment.map_id).eq("customer_email", normalized).select("id").maybeSingle();
    if (ownerError || !owned) throw new Error("Mapa indisponível");
    await sendMapAccessEmail(payment.payer_name, normalized, payment.map_id, access.token);
    return reply();
  } catch {
    // Do not reveal whether an address has purchased a reading.
    return reply();
  }
}
