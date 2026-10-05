// Local-only API/UI fixture. Never connects to Supabase, sends payments or emails.
// Run after next build. Pass --serve to keep the fixture available for visual QA.
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
const appPort = 4317, dbPort = 4318;
const base = `http://localhost:${appPort}`;
const password = "local-qa-only-not-a-real-password-2026";
const events = [], payments = [], buckets = new Map();
const context = { source: "qa-reddit", medium: "paid_social", campaign: "dados-ficticios", content: "imagem_01", device: "mobile", version: "v1" };
for (let i = 0; i < 12; i++) {
  const session_id = randomUUID();
  const start = Date.now() - 3600000 * (i + 1);
  const emit = (name, options = {}) => events.push({ event_id: randomUUID(), session_id, occurred_at: new Date(start + events.length * 1000).toISOString(), name, path: "/", section: "", target: "", value: 0, context, ...options });
  emit("page_view"); emit("section_view", { section: "hero" }); emit("heartbeat", { value: 15000 }); emit("section_time", { section: "hero", value: 8000 });
  if (i < 9) { emit("click", { target: "cta-hero", section: "hero" }); emit("section_view", { section: "seu-mapa" }); emit("form_start", { target: "checkout-map" }); emit("field_focus", { target: "email" }); emit("section_time", { section: "seu-mapa", value: 25000 }); }
  if (i < 6) { emit("checkout_submit", { target: "map", value: 2980 }); emit("bump_toggle", { target: "calendar", value: 1 }); emit("pix_copy", { target: "map" }); payments.push({ id: randomUUID(), created_at: new Date(start + 50000).toISOString(), status: i < 3 ? "PAID" : "PENDING", amount_cents: 2980, transaction_id: `fixture-${i}`, product: "map", bumps: ["calendar"], analytics: { session_id, context } }); }
  emit("page_exit", { section: i < 9 ? "seu-mapa" : "hero", value: i < 9 ? 75 : 25 });
}
const mock = createServer(async (req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${dbPort}`);
  let raw = ""; for await (const chunk of req) raw += chunk;
  res.setHeader("Content-Type", "application/json");
  if (url.pathname === "/rest/v1/rpc/analytics_allow") {
    const { p_key, p_limit } = JSON.parse(raw); const hits = (buckets.get(p_key) || 0) + 1; buckets.set(p_key, hits); res.end(JSON.stringify(hits <= p_limit)); return;
  }
  if (url.pathname === "/rest/v1/analytics_events" && req.method === "POST") {
    const data = JSON.parse(raw); for (const e of data) if (!events.some(row => row.event_id === e.event_id)) events.push(e);
    res.statusCode = 201; res.end(); return;
  }
  if (["/rest/v1/analytics_events", "/rest/v1/payments"].includes(url.pathname)) {
    const rows = url.pathname.endsWith("payments") ? payments : events;
    const offset = Number(url.searchParams.get("offset") || 0), limit = Number(url.searchParams.get("limit") || 1000);
    res.end(JSON.stringify(rows.slice(offset, offset + limit))); return;
  }
  res.statusCode = 404; res.end(JSON.stringify({ error: "Unexpected local fixture request" }));
});
await new Promise(resolve => mock.listen(dbPort, "127.0.0.1", resolve));
const app = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", String(appPort)], { env: { ...process.env, SUPABASE_URL: `http://127.0.0.1:${dbPort}`, SUPABASE_SERVICE_ROLE_KEY: "fixture-service-key", ANALYTICS_ADMIN_PASSWORD: password }, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
let output = "";
app.stdout.on("data", b => { output += b; }); app.stderr.on("data", b => { output += b; });
const close = () => { app.kill(); mock.close(); };
process.on("SIGINT", () => { close(); process.exit(); }); process.on("SIGTERM", () => { close(); process.exit(); });
try {
  let ready = false;
  for (let i = 0; i < 60; i++) { try { if ((await fetch(`${base}/admin/analytics`)).ok) { ready = true; break; } } catch {} await new Promise(r => setTimeout(r, 500)); }
  assert.ok(ready, output);
  assert.equal((await fetch(`${base}/api/analytics/report`)).status, 401);
  const post = (path, body, origin = base) => fetch(`${base}${path}`, { method: "POST", headers: { Origin: origin, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  assert.equal((await post("/api/analytics/events", [events[0]], "https://evil.invalid")).status, 403);
  assert.equal((await post("/api/analytics/events", [{ ...events[0], name: "purchase" }])).status, 400);
  assert.equal((await post("/api/analytics/events", Array(26).fill(events[0]))).status, 400);
  assert.equal((await post("/api/analytics/events", [events[0]])).status, 204);
  assert.equal((await post("/api/analytics/auth", { password: "wrong" })).status, 401);
  const auth = await post("/api/analytics/auth", { password });
  assert.equal(auth.status, 200);
  const cookie = auth.headers.get("set-cookie");
  assert.match(cookie, /HttpOnly/i); assert.match(cookie, /SameSite=strict/i);
  const response = await fetch(`${base}/api/analytics/report?days=7`, { headers: { cookie: cookie.split(";")[0] } });
  assert.equal(response.status, 200);
  const report = await response.json();
  assert.equal(report.totals.sessions, 12); assert.equal(report.totals.orders, 3); assert.equal(report.totals.revenue, 8940);
  assert.equal(report.funnel.at(-1).count, 3);
  assert.match(response.headers.get("cache-control"), /no-store/);
  assert.equal((await fetch(`${base}/api/analytics/report?days=999`, { headers: { cookie: cookie.split(";")[0] } })).status, 400);
  assert.equal((await fetch(`${base}/api/analytics/report`, { headers: { cookie: "dv_analytics_admin=invalid" } })).status, 401);
  assert.equal((await fetch(`${base}/api/analytics/auth`, { method: "DELETE", headers: { Origin: base } })).status, 200);
  console.log("Analytics API: protected report, origin validation, event validation, login, cookie, filters and trusted payment totals passed.");
  if (process.argv.includes("--serve")) console.log(`Local fixture ready at ${base}/admin/analytics. Password: ${password}. All data is synthetic.`);
  else close();
} catch (error) { close(); console.error(output); throw error; }
