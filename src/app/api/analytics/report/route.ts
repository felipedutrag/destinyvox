import { getSupabaseAdmin } from "@/lib/supabase";
import { analyticsHeaders, isAnalyticsAdmin } from "@/lib/analytics-server";
import { buildReport, type AnalyticsPayment } from "@/lib/analytics-report";
import type { AnalyticsEvent } from "@/lib/analytics-shared";
export async function GET(request: Request) {
  if (!await isAnalyticsAdmin()) return Response.json({ error: "Entre para visualizar." }, { status: 401, headers: analyticsHeaders });
  const q = new URL(request.url).searchParams;
  const days = Number(q.get("days") || 7);
  if (![1, 7, 14, 30].includes(days)) return new Response(null, { status: 400 });
  const end = new Date().toISOString(), start = new Date(Date.now() - days * 86400000).toISOString();
  try {
    const db = getSupabaseAdmin();
    const events: AnalyticsEvent[] = [], payments: AnalyticsPayment[] = [];
    let truncated = false;
    for (let from = 0; from < 50000; from += 1000) {
      const { data, error } = await db.from("analytics_events").select("event_id,session_id,occurred_at,name,path,section,target,value,context").gte("occurred_at", start).lt("occurred_at", end).order("occurred_at").order("id").range(from, from + 999);
      if (error) throw error;
      events.push(...data as AnalyticsEvent[]);
      if (data.length < 1000) break;
      if (from === 49000) truncated = true;
    }
    for (let from = 0; from < 10000; from += 1000) {
      // Explicit projection: no payer details, access IDs, or payment codes leave this endpoint.
      const { data, error } = await db.from("payments").select("id,created_at,status,amount_cents,transaction_id,product:metadata->>product,bumps:metadata->bumps,analytics:metadata->analytics").gte("created_at", start).lt("created_at", end).order("created_at").order("id").range(from, from + 999);
      if (error) throw error;
      payments.push(...data as unknown as AnalyticsPayment[]);
      if (data.length < 1000) break;
      if (from === 9000) truncated = true;
    }
    const report = buildReport(events, payments, { source: q.get("source") || "", campaign: q.get("campaign") || "", device: q.get("device") || "", path: q.get("path") || "", version: q.get("version") || "" });
    return Response.json({ ...report, start, end, truncated, unattributedPaid: payments.filter(p => p.status === "PAID" && !events.some(e => e.session_id === p.analytics?.session_id)).length }, { headers: analyticsHeaders });
  } catch { return Response.json({ error: "Não foi possível consultar os dados. Confira scripts/analytics-schema.sql e a conexão com o Supabase." }, { status: 503, headers: analyticsHeaders }); }
}
