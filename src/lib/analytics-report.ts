import type { AnalyticsContext, AnalyticsEvent } from "./analytics-shared";
export type AnalyticsPayment = { id: string; created_at: string; status: string; amount_cents: number; transaction_id: string | null; product: string; bumps: string[]; analytics: { session_id?: string; context?: AnalyticsContext } | null };
export type AnalyticsFilters = { source: string; campaign: string; device: string; path: string; version: string };
const pct = (n: number, d: number) => d ? Math.round(n / d * 1000) / 10 : 0;
export function buildReport(events: AnalyticsEvent[], payments: AnalyticsPayment[], filters: AnalyticsFilters) {
  const groups = new Map<string, AnalyticsEvent[]>();
  for (const e of events) { const rows = groups.get(e.session_id) || []; rows.push(e); groups.set(e.session_id, rows); }
  for (const rows of groups.values()) rows.sort((a, b) => a.occurred_at.localeCompare(b.occurred_at));
  const allSessions = [...groups].map(([id, rows]) => {
    const first = rows.find(e => e.name === "page_view") || rows[0];
    const last = rows.at(-1)!;
    const lastSection = rows.filter(e => e.section && ["heartbeat", "page_exit", "section_view", "click", "field_focus"].includes(e.name)).at(-1)?.section || "";
    return { id, rows, first, last, lastSection, active: rows.filter(e => e.name === "heartbeat").reduce((s, e) => s + e.value, 0), depth: Math.max(0, ...rows.filter(e => ["scroll_depth", "page_exit"].includes(e.name)).map(e => e.value)) };
  });
  const options = { sources: [...new Set(allSessions.map(s => s.first.context.source))].sort(), campaigns: [...new Set(allSessions.map(s => s.first.context.campaign).filter(Boolean))].sort(), versions: [...new Set(allSessions.map(s => s.first.context.version))].sort() };
  const sessions = allSessions.filter(s => (!filters.source || s.first.context.source === filters.source) && (!filters.campaign || s.first.context.campaign === filters.campaign) && (!filters.device || s.first.context.device === filters.device) && (!filters.path || s.first.path === filters.path) && (!filters.version || s.first.context.version === filters.version));
  const ids = new Set(sessions.map(s => s.id));
  const rows = sessions.flatMap(s => s.rows);
  const orders = payments.filter(p => p.analytics?.session_id && ids.has(p.analytics.session_id));
  const paid = orders.filter(p => p.status === "PAID");
  const revenue = paid.reduce((n, p) => n + p.amount_cents, 0);
  const base = sessions.filter(s => ["/", "/sinastria"].includes(s.first.path));
  // Nested, chronological stages: each denominator is the previous reached stage.
  let funnelSessions = base.map(s => ({ ...s, after: s.first.occurred_at }));
  const funnel = [{ label: "Visitou a landing", count: base.length, rate: 100, lost: 0 }];
  for (const [label, name, target] of [["Viu a oferta", "section_view", "seu-mapa"], ["Começou o formulário", "form_start", "checkout-map"], ["Enviou o pedido", "checkout_submit", "map"]]) {
    const before = funnelSessions.length;
    funnelSessions = funnelSessions.flatMap(s => { const e = s.rows.find(e => e.name === name && (e.target === target || e.section === target) && e.occurred_at >= s.after); return e ? [{ ...s, after: e.occurred_at }] : []; });
    funnel.push({ label, count: funnelSessions.length, rate: pct(funnelSessions.length, before), lost: before - funnelSessions.length });
  }
  for (const [label, onlyPaid] of [["Pix gerado (servidor)", false], ["Compra confirmada", true]] as const) {
    const before = funnelSessions.length;
    funnelSessions = funnelSessions.filter(s => orders.some(p => p.analytics?.session_id === s.id && p.product === "map" && p.transaction_id && (!onlyPaid || p.status === "PAID")));
    funnel.push({ label, count: funnelSessions.length, rate: pct(funnelSessions.length, before), lost: before - funnelSessions.length });
  }
  const sections = [...new Set(rows.filter(e => e.name === "section_view").map(e => `${e.path}|${e.section}`))].map(key => {
    const [path, section] = key.split("|");
    const viewed = sessions.filter(s => s.rows.some(e => e.name === "section_view" && e.section === section && e.path === path));
    const time = rows.filter(e => e.name === "section_time" && e.section === section && e.path === path).reduce((n, e) => n + e.value, 0);
    const exits = sessions.filter(s => s.lastSection === section && s.last.path === path && Date.now() - Date.parse(s.last.occurred_at) >= 30 * 60000).length;
    const buyers = viewed.filter(s => paid.some(p => p.analytics?.session_id === s.id)).length;
    return { path, section, views: viewed.length, reach: pct(viewed.length, sessions.length), seconds: viewed.length ? Math.round(time / viewed.length / 1000) : 0, exits, buyers };
  }).sort((a, b) => b.views - a.views);
  const interactions = [...new Set(rows.filter(e => ["click", "faq_open", "field_focus", "field_complete", "field_invalid", "bump_toggle", "checkout_error", "pix_copy", "upsell_open", "client_error"].includes(e.name)).map(e => `${e.name}|${e.path}|${e.section}|${e.target}|${e.name === "bump_toggle" ? e.value : ""}`))].map(key => {
    const [event, path, section, target, value] = key.split("|");
    const matching = rows.filter(e => e.name === event && e.path === path && e.section === section && e.target === target && (event !== "bump_toggle" || String(e.value) === value));
    return { event, path, section, target: target + (event === "bump_toggle" ? value === "1" ? " / marcou" : " / desmarcou" : ""), count: matching.length, sessions: new Set(matching.map(e => e.session_id)).size };
  }).sort((a, b) => b.sessions - a.sessions);
  const sources = [...new Set(sessions.map(s => `${s.first.context.source}|${s.first.context.campaign}|${s.first.context.content}`))].map(key => {
    const [source, campaign, content] = key.split("|");
    const cohort = sessions.filter(s => s.first.context.source === source && s.first.context.campaign === campaign && s.first.context.content === content);
    const selected = paid.filter(p => cohort.some(s => s.id === p.analytics?.session_id));
    return { source, campaign, content, sessions: cohort.length, buyers: new Set(selected.map(p => p.analytics?.session_id)).size, revenue: selected.reduce((n, p) => n + p.amount_cents, 0) };
  });
  const mainPaid = paid.filter(p => p.product === "map");
  const bumps = ["calendar", "challenges", "synastry", "name"].map(id => ({ id, viewed: new Set(rows.filter(e => e.name === "section_view" && e.section === `bump-${id}`).map(e => e.session_id)).size, selected: new Set(rows.filter(e => e.name === "bump_toggle" && e.target === id && e.value === 1).map(e => e.session_id)).size, paid: mainPaid.filter(p => Array.isArray(p.bumps) && p.bumps.includes(id)).length, acceptance: pct(mainPaid.filter(p => Array.isArray(p.bumps) && p.bumps.includes(id)).length, mainPaid.length) }));
  const daily = [...new Set(sessions.map(s => new Date(s.first.occurred_at).toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" })))].sort().map(day => {
    const cohort = sessions.filter(s => new Date(s.first.occurred_at).toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" }) === day);
    const selected = paid.filter(p => cohort.some(s => s.id === p.analytics?.session_id));
    return { day, sessions: cohort.length, orders: selected.length, revenue: selected.reduce((n, p) => n + p.amount_cents, 0) };
  });
  const buyers = new Set(paid.map(p => p.analytics?.session_id)).size;
  const lcp = rows.filter(e => e.name === "web_vital" && e.target === "lcp_ms");
  const lcpValues = sessions.map(s => Math.max(0, ...lcp.filter(e => e.session_id === s.id).map(e => e.value))).filter(Boolean).sort((a, b) => a - b);
  return { options, totals: { sessions: sessions.length, pageViews: rows.filter(e => e.name === "page_view").length, activeSeconds: sessions.length ? Math.round(sessions.reduce((n, s) => n + s.active, 0) / sessions.length / 1000) : 0, buyers, conversion: pct(buyers, sessions.length), orders: paid.length, revenue, averageOrder: paid.length ? Math.round(revenue / paid.length) : 0, revenuePerSession: sessions.length ? Math.round(revenue / sessions.length) : 0, pix: orders.filter(p => p.transaction_id).length, lcpP75: lcpValues[Math.max(0, Math.ceil(lcpValues.length * .75) - 1)] || 0 }, funnel, sections, interactions, sources, bumps, daily,
    upsell: { views: new Set(rows.filter(e => e.name === "section_view" && e.section === "upsell-atlas").map(e => e.session_id)).size, opens: new Set(rows.filter(e => e.name === "upsell_open").map(e => e.session_id)).size, orders: paid.filter(p => p.product === "atlas").length, revenue: paid.filter(p => p.product === "atlas").reduce((n, p) => n + p.amount_cents, 0) },
    sessions: sessions.slice().sort((a, b) => b.last.occurred_at.localeCompare(a.last.occurred_at)).slice(0, 100).map(s => ({ id: s.id, started: s.first.occurred_at, source: s.first.context.source, campaign: s.first.context.campaign, device: s.first.context.device, path: s.first.path, seconds: Math.round(s.active / 1000), depth: s.depth, lastSection: s.lastSection, lastEvent: s.last.name, ended: Date.now() - Date.parse(s.last.occurred_at) >= 30 * 60000, paid: paid.some(p => p.analytics?.session_id === s.id), timeline: s.rows.filter(e => !["heartbeat", "section_time"].includes(e.name)).slice(-100).map(e => ({ time: e.occurred_at, event: e.name, section: e.section, target: e.target, value: e.value })) })) };
}
export type AnalyticsReport = ReturnType<typeof buildReport>;
