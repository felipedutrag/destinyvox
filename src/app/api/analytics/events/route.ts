import { sameOrigin } from "@/lib/map-auth";
import { allowAnalytics } from "@/lib/analytics-server";
import { validateEvent } from "@/lib/analytics-shared";
import { getSupabaseAdmin } from "@/lib/supabase";
export async function POST(request: Request) {
  if (!sameOrigin(request)) return new Response(null, { status: 403 });
  if (Number(request.headers.get("content-length")) > 32000) return new Response(null, { status: 413 });
  try {
    const reader = request.body?.getReader();
    if (!reader) return new Response(null, { status: 400 });
    const chunks: Uint8Array[] = []; let size = 0;
    while (true) { const { done, value } = await reader.read(); if (done) break; size += value.length; if (size > 32000) { await reader.cancel(); return new Response(null, { status: 413 }); } chunks.push(value); }
    let input;
    try { input = JSON.parse(Buffer.concat(chunks).toString("utf8")); } catch { return new Response(null, { status: 400 }); }
    if (!Array.isArray(input) || !input.length || input.length > 25) return new Response(null, { status: 400 });
    const events = input.map(e => validateEvent(e));
    if (events.some(e => !e)) return new Response(null, { status: 400 });
    if (!await allowAnalytics(request, "ingest", 240, 60)) return new Response(null, { status: 429 });
    const { error } = await getSupabaseAdmin().from("analytics_events").upsert(events.filter(e => e !== null), { onConflict: "event_id", ignoreDuplicates: true });
    if (error) throw error;
    return new Response(null, { status: 204 });
  } catch { return new Response(null, { status: 503 }); }
}
