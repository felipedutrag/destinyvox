"use client";
import { cleanContext, safePath, token, uuid, type AnalyticsContext, type AnalyticsEvent, type EventName } from "./analytics-shared";

type Session = { id: string; last: number; context: AnalyticsContext };
let session: Session | undefined;
let queue: AnalyticsEvent[] = [];
let sending = false;
let trackedSession: string | undefined;
export function analyticsEnabled() {
  return typeof window !== "undefined" && !location.pathname.startsWith("/admin") && navigator.doNotTrack !== "1" && !(navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl && localStorageSafe("dv:analytics:off") !== "1";
}
function localStorageSafe(key: string) { try { return localStorage.getItem(key); } catch { return null; } }
/** Shared across tabs on this origin. No fingerprint or identity from form data. */
export function analyticsVisitor(): string | null {
  if (!analyticsEnabled()) return null;
  try {
    const key = "dv:analytics:visitor";
    let saved;
    try { saved = JSON.parse(localStorage.getItem(key) || "null"); } catch { /* Replace malformed storage. */ }
    if (!uuid(saved?.id) || !Number.isFinite(saved?.expires) || saved.expires <= Date.now()) {
      saved = { id: crypto.randomUUID(), expires: Date.now() + 365 * 86400000 };
      localStorage.setItem(key, JSON.stringify(saved));
    }
    return saved.id;
  } catch { return null; /* Do not count a unique visitor without persistence. */ }
}
export function analyticsSession() {
  if (!analyticsEnabled()) return undefined;
  const now = Date.now();
  if (!session) { try { session = JSON.parse(sessionStorage.getItem("dv:analytics:session") || "null") || undefined; } catch { /* Storage may be blocked. */ } }
  if (!session || !uuid(session.id) || !Number.isFinite(session.last) || !session.context || now - session.last > 30 * 60000) {
    const q = new URLSearchParams(location.search);
    let ref = "direct";
    try { const url = new URL(document.referrer); if (url.origin !== location.origin) ref = url.hostname; } catch { /* Direct visit. */ }
    session = { id: crypto.randomUUID(), last: now, context: cleanContext({ source: q.get("utm_source") || ref, medium: q.get("utm_medium") || "", campaign: q.get("utm_campaign") || "", content: q.get("utm_content") || "", device: innerWidth < 768 ? "mobile" : innerWidth < 1024 ? "tablet" : "desktop", version: process.env.NEXT_PUBLIC_ANALYTICS_COPY_VERSION || "v1" }) };
  }
  session.last = now;
  try { sessionStorage.setItem("dv:analytics:session", JSON.stringify(session)); } catch { /* Memory fallback. */ }
  return session;
}
export function track(name: EventName, opts: { section?: string; target?: string; value?: number; path?: string } = {}) {
  const s = analyticsSession();
  if (!s) return;
  const visitor_id = analyticsVisitor();
  if (trackedSession !== s.id) {
    trackedSession = s.id;
    if (name !== "page_view") queue.push({ event_id: crypto.randomUUID(), session_id: s.id, visitor_id, occurred_at: new Date().toISOString(), name: "page_view", path: safePath(opts.path || location.pathname), section: "", target: "", value: 0, context: s.context });
  }
  queue.push({ event_id: crypto.randomUUID(), session_id: s.id, visitor_id, occurred_at: new Date().toISOString(), name, path: safePath(opts.path || location.pathname), section: token(opts.section), target: token(opts.target), value: Math.max(0, Math.round(opts.value || 0)), context: s.context });
  if (queue.length > 200) queue.shift();
}
export async function flushAnalytics(beacon = false) {
  if (!queue.length) return;
  if (beacon) {
    const batch = queue.slice(0, 25);
    if (navigator.sendBeacon?.("/api/analytics/events", new Blob([JSON.stringify(batch)], { type: "application/json" }))) queue.splice(0, batch.length);
    return;
  }
  if (sending) return;
  sending = true;
  const batch = queue.splice(0, 25);
  try {
    const response = await fetch("/api/analytics/events", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(batch), keepalive: true });
    if (!response.ok && response.status >= 500) queue = [...batch, ...queue].slice(0, 200);
  } catch { queue = [...batch, ...queue].slice(0, 200); }
  finally { sending = false; }
}
