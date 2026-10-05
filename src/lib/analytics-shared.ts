export const EVENT_NAMES = ["page_view", "page_exit", "heartbeat", "section_view", "section_time", "scroll_depth", "click", "faq_open", "faq_close", "form_start", "field_focus", "field_complete", "field_invalid", "form_submit", "bump_toggle", "checkout_submit", "checkout_error", "pix_created", "pix_copy", "payment_seen", "payment_state", "delivery_seen", "upsell_open", "web_vital", "client_error"] as const;
export type EventName = typeof EVENT_NAMES[number];
export type AnalyticsContext = { source: string; medium: string; campaign: string; content: string; device: string; version: string };
export type AnalyticsEvent = { event_id: string; session_id: string; occurred_at: string; name: EventName; path: string; section: string; target: string; value: number; context: AnalyticsContext };
export const uuid = (v: unknown): v is string => typeof v === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
export function safePath(path: string) {
  if (["/", "/sinastria", "/acesso", "/mapa/demo"].includes(path)) return path;
  return /^\/mapa\/[^/]+$/.test(path) ? "/mapa/:id" : "/other";
}
export const token = (v: unknown, max = 100) => typeof v === "string" ? v.replace(/[^a-zA-Z0-9_.:/-]/g, "_").slice(0, max) : "";
export function cleanContext(value: unknown): AnalyticsContext {
  const c = value && typeof value === "object" ? value as Record<string, unknown> : {};
  return { source: token(c.source, 80), medium: token(c.medium, 80), campaign: token(c.campaign, 80), content: token(c.content, 80), device: ["mobile", "tablet", "desktop"].includes(String(c.device)) ? String(c.device) : "desktop", version: token(c.version, 40) };
}
export function validateEvent(input: unknown, now = Date.now()): AnalyticsEvent | null {
  if (!input || typeof input !== "object") return null;
  const e = input as AnalyticsEvent;
  const time = Date.parse(e.occurred_at);
  if (!uuid(e.event_id) || !uuid(e.session_id) || !EVENT_NAMES.includes(e.name) || !Number.isFinite(time) || time < now - 86400000 || time > now + 60000 || typeof e.path !== "string") return null;
  if (!Number.isInteger(e.value) || e.value < 0 || e.value > 86400000) return null;
  return { event_id: e.event_id, session_id: e.session_id, occurred_at: new Date(time).toISOString(), name: e.name, path: e.path === "/mapa/:id" ? e.path : safePath(e.path), section: token(e.section), target: token(e.target), value: e.value, context: cleanContext(e.context) };
}
