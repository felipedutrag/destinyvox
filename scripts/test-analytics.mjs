import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import { PGlite } from "@electric-sql/pglite";
const require = createRequire(import.meta.url);
const { validateEvent, safePath, cleanContext } = require("../tmp/analytics-tests/analytics-shared.js");
const { buildReport } = require("../tmp/analytics-tests/analytics-report.js");
const uid = n => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const now = Date.now();
const context = { source: "reddit", medium: "paid_social", campaign: "mapa", content: "image1", device: "mobile", version: "v1" };
let sequence = 0;
const event = (name, props = {}) => ({ event_id: uid(++sequence), session_id: uid(100), occurred_at: new Date(now - 3600000 + sequence * 1000).toISOString(), name, path: "/", section: "", target: "", value: 0, context, ...props });
const valid = event("page_view");
assert.ok(validateEvent(valid));
assert.equal(validateEvent({ ...valid, visitor_id: "bad" }), null);
assert.equal(validateEvent(valid).visitor_id, null, "older collectors remain supported");
assert.equal(validateEvent({ ...valid, visitor_id: uid(700) }).visitor_id, uid(700));
assert.equal(validateEvent({ ...valid, name: "purchase" }), null, "client cannot submit trusted purchases");
assert.equal(validateEvent({ ...valid, value: -1 }), null);
assert.equal(validateEvent({ ...valid, session_id: "bad" }), null);
assert.equal(validateEvent({ ...valid, occurred_at: "1990-01-01" }), null);
assert.equal(safePath(`/mapa/${uid(99)}`), "/mapa/:id");
assert.equal(safePath("/acesso?token=secret"), "/other");
assert.deepEqual(Object.keys(cleanContext({ ...context, email: "private@example.com", birthDate: "1990-01-01" })), Object.keys(context));
assert.equal(validateEvent({ ...valid, context: { ...context, name: "Secret" }, email: "secret" }).email, undefined);

const events = [valid, event("section_view", { section: "seu-mapa" }), event("form_start", { target: "checkout-map" }), event("checkout_submit", { target: "map" }), event("section_view", { section: "bump-calendar" }), event("bump_toggle", { target: "calendar", value: 1 }), event("heartbeat", { value: 20000, section: "seu-mapa" }), event("section_time", { section: "seu-mapa", value: 12000 }), event("page_exit", { section: "seu-mapa", value: 75 }), event("page_view", { session_id: uid(101) }), event("payment_seen", { session_id: uid(101), value: 99999 }), event("page_view", { session_id: uid(102), context: { ...context, source: "google" } })];
const order = { id: uid(500), created_at: new Date(now - 3500000).toISOString(), status: "PAID", amount_cents: 2980, transaction_id: "test", product: "map", bumps: ["calendar"], analytics: { session_id: uid(100), context } };
const filters = { source: "", campaign: "", device: "", path: "", version: "" };
const identifiedEvents = events.map(e => ({ ...e, visitor_id: e.session_id }));
const report = buildReport(identifiedEvents, [order, { ...order, id: uid(501), status: "PENDING" }], filters);
assert.equal(report.totals.sessions, 3);
assert.equal(report.totals.orders, 1, "payment_seen never counts as revenue");
assert.equal(report.totals.revenue, 2980);
assert.equal(report.totals.activeSeconds, 7);
assert.equal(report.funnel.at(-1).count, 1);
assert.equal(report.bumps.find(b => b.id === "calendar").acceptance, 100);
assert.equal(report.sections.find(s => s.section === "seu-mapa").seconds, 12);
assert.equal(buildReport(events, [order], { ...filters, source: "google" }).totals.revenue, 0);
assert.equal(buildReport([], [], filters).totals.conversion, 0);
const outOfOrder = [event("page_view"), event("checkout_submit", { target: "map" }), event("form_start", { target: "checkout-map" }), event("section_view", { section: "seu-mapa" })].map(e => ({ ...e, visitor_id: uid(700) }));
assert.deepEqual(buildReport(outOfOrder, [order], filters).funnel.map(s => s.count), [1, 1, 0, 0, 0, 0]);
assert.equal(buildReport(outOfOrder, [order], filters).funnel.at(-1).count, 0, "funnel requires chronological steps");

// Deduplicate visitors only after finding an ordered journey within each session.
const journey = (session, visitor, length = 4, props = {}) => [
  ["page_view", {}],
  ["section_view", { section: "seu-mapa" }],
  ["form_start", { target: "checkout-map" }],
  ["checkout_submit", { target: "map" }],
].slice(0, length).map(([name, step]) => event(name, { session_id: uid(session), visitor_id: visitor ? uid(visitor) : null, ...props, ...step }));
const repeatedVisitor = [...journey(301, 801), ...journey(302, 801, 4, { path: "/sinastria" })];
const splitJourney = [...journey(303, 802, 2), ...journey(304, 802).filter(e => e.name !== "section_view")];
const conflictingJourney = journey(308, 805);
conflictingJourney[1].visitor_id = uid(806);
const funnelEvents = [
  ...repeatedVisitor,
  ...splitJourney,
  ...journey(305, 803),
  ...journey(306, 804, 1, { context: { ...context, source: "google" } }),
  ...journey(307, null),
  ...conflictingJourney,
  ...journey(309, 807, 4, { path: "/acesso" }),
];
const funnelOrders = [301, 302, 304, 305, 307, 308, 309].map(session => ({ ...order, id: uid(session + 1000), status: session === 305 ? "PENDING" : "PAID", analytics: { session_id: uid(session), context } }));
const uniqueFunnel = buildReport(funnelEvents, funnelOrders, filters);
assert.deepEqual(uniqueFunnel.funnel.map(s => s.count), [4, 3, 2, 2, 2, 1], "return visits and repeat purchases count once; steps from different sessions never combine");
assert.deepEqual(uniqueFunnel.funnel.map(s => s.rate), [100, 75, 66.7, 100, 100, 50], "rates use unique visitors in the previous stage");
assert.deepEqual(uniqueFunnel.funnel.map(s => s.lost), [0, 1, 1, 0, 0, 1], "losses use unique visitors, not sessions");
assert.equal(uniqueFunnel.funnelUnidentifiedSessions, 2, "missing or conflicting visitor IDs are excluded explicitly");
assert.equal(uniqueFunnel.totals.orders, 6, "purchase totals still count paid orders, including repeat buyers");
assert.deepEqual(buildReport(funnelEvents, funnelOrders, { ...filters, path: "/sinastria" }).funnel.map(s => s.count), [1, 1, 1, 1, 1, 1], "visitor deduplication respects the selected landing");
assert.deepEqual(buildReport(funnelEvents, funnelOrders, { ...filters, source: "reddit" }).funnel.map(s => s.count), [3, 3, 2, 2, 2, 1], "visitor deduplication respects attribution filters");
const anonymousFunnel = buildReport(journey(307, null), funnelOrders, filters);
assert.ok(anonymousFunnel.funnel.every(s => s.count === 0 && s.lost === 0), "historical sessions are never substituted for unique visitors");
assert.ok(anonymousFunnel.funnel.slice(1).every(s => s.rate === 0), "zero visitors never produces invalid rates");
assert.equal(anonymousFunnel.funnelUnidentifiedSessions, 1);
const emptyFunnel = buildReport([], [], filters);
assert.ok(emptyFunnel.funnel.every(s => s.count === 0 && s.lost === 0));
assert.equal(emptyFunnel.funnelUnidentifiedSessions, 0);

const db = new PGlite();
const visitorEvents = [event("page_view", { session_id: uid(201), visitor_id: uid(701) }), event("page_view", { session_id: uid(202), visitor_id: uid(701) }), event("page_view", { session_id: uid(203), visitor_id: uid(702) }), event("page_view", { session_id: uid(204) })];
const visitorStart = new Date(now - 86400000).toISOString();
const visitorHistory = { [uid(701)]: new Date(now - 10 * 86400000).toISOString(), [uid(702)]: new Date(now - 3600000).toISOString() };
const visitorReport = buildReport(visitorEvents, [], filters, visitorHistory, visitorStart);
assert.deepEqual(visitorReport.visitorStats, { unique: 2, new: 1, returning: 1, unknown: 0, unidentifiedSessions: 1, sessionsPerVisitor: 1.5 });
assert.equal(visitorReport.visitors.find(v => v.id === uid(701)).sessions, 2);
assert.equal(buildReport(visitorEvents, [], { ...filters, source: "missing" }, visitorHistory, visitorStart).visitorStats.unique, 0);
try {
  await db.exec("create role anon; create role authenticated; create role service_role bypassrls; grant usage on schema public to anon, authenticated, service_role;");
  const sql = fs.readFileSync("scripts/analytics-schema.sql", "utf8");
  await db.exec(sql); await db.exec(sql);
  const visitorSql = fs.readFileSync("scripts/analytics-visitors.sql", "utf8");
  await db.exec(visitorSql); await db.exec(visitorSql);
  for (const role of ["anon", "authenticated"]) {
    await db.exec(`set role ${role}`);
    await assert.rejects(() => db.query("select * from analytics_events"), /permission denied/);
    await assert.rejects(() => db.query("select * from analytics_visitors"), /permission denied/);
    await assert.rejects(() => db.query("insert into analytics_visitors values ($1,now(),now())", [uid(700)]), /permission denied/);
    await assert.rejects(() => db.query("update analytics_visitors set first_seen_at=now()"), /permission denied/);
    await assert.rejects(() => db.query("delete from analytics_visitors"), /permission denied/);
    await assert.rejects(() => db.query("insert into analytics_events(event_id,session_id,occurred_at,name,path) values ($1,$2,now(),'page_view','/')", [uid(1), uid(2)]), /permission denied/);
    await assert.rejects(() => db.query("update analytics_events set name='click'"), /permission denied/);
    await assert.rejects(() => db.query("delete from analytics_events"), /permission denied/);
    await assert.rejects(() => db.query("select analytics_allow('test',2,60)"), /permission denied/);
    await db.exec("reset role");
  }
  await db.exec("set role service_role");
  const insert = () => db.query("insert into analytics_events(event_id,session_id,occurred_at,name,path) values ($1,$2,now(),'page_view','/') on conflict(event_id) do nothing", [uid(1), uid(2)]);
  await insert(); await insert();
  assert.equal((await db.query("select count(*)::int n from analytics_events")).rows[0].n, 1);
  const visit = (id, time) => db.query("insert into analytics_events(event_id,session_id,visitor_id,occurred_at,name,path) values ($1,$2,$3,$4,'page_view','/') on conflict(event_id) do nothing", [uid(id), uid(id + 100), uid(700), time]);
  await visit(10, "2026-10-05T12:00:00Z"); await visit(11, "2026-10-04T12:00:00Z"); await visit(11, "2026-10-01T12:00:00Z");
  const visitor = (await db.query("select * from analytics_visitors")).rows[0];
  assert.equal(new Date(visitor.first_seen_at).toISOString(), "2026-10-04T12:00:00.000Z");
  assert.equal(new Date(visitor.last_seen_at).toISOString(), "2026-10-05T12:00:00.000Z");
  assert.equal((await db.query("select visitor_id from analytics_events where event_id=$1", [uid(1)])).rows[0].visitor_id, null, "no retroactive identification");
  const allowed = () => db.query("select analytics_allow('test',2,60) as ok");
  assert.equal((await allowed()).rows[0].ok, true);
  assert.equal((await allowed()).rows[0].ok, true);
  assert.equal((await allowed()).rows[0].ok, false);
  await db.query("update analytics_limits set window_start=now()-interval '2 minutes'");
  assert.equal((await allowed()).rows[0].ok, true);
  await db.exec("reset role");
  const rls = await db.query("select relrowsecurity from pg_class where relname in ('analytics_events','analytics_limits')");
  assert.ok(rls.rows.every(r => r.relrowsecurity));
} finally { await db.close(); }

// Browser collector transport: private inputs never enter its API; retry IDs are stable.
globalThis.window = {};
globalThis.location = { pathname: "/", search: "?utm_source=reddit&utm_campaign=test", origin: "https://example.com" };
globalThis.document = { referrer: "" };
globalThis.innerWidth = 390;
const storage = new Map();
globalThis.localStorage = globalThis.sessionStorage = { getItem: k => storage.get(k) || null, setItem: (k, v) => storage.set(k, v) };
const client = require("../tmp/analytics-tests/analytics-client.js");
assert.ok(client.analyticsSession().id);
const originalSession = client.analyticsSession().id;
assert.equal(client.analyticsSession().id, originalSession);
const visitorId = client.analyticsVisitor();
assert.ok(visitorId);
assert.equal(client.analyticsVisitor(), visitorId);
delete require.cache[require.resolve("../tmp/analytics-tests/analytics-client.js")];
assert.equal(require("../tmp/analytics-tests/analytics-client.js").analyticsVisitor(), visitorId, "another tab/module shares visitor storage");
storage.set("dv:analytics:visitor", JSON.stringify({ id: visitorId, expires: Date.now() - 1 }));
assert.notEqual(client.analyticsVisitor(), visitorId, "expired visitor rotates");
const workingStorage = globalThis.localStorage;
globalThis.localStorage = { getItem() { throw Error("blocked"); }, setItem() { throw Error("blocked"); } };
assert.equal(client.analyticsVisitor(), null);
globalThis.localStorage = workingStorage;
let calls = [];
globalThis.fetch = async (_url, options) => { calls.push(JSON.parse(options.body)); return { ok: calls.length > 1, status: calls.length > 1 ? 204 : 503 }; };
client.track("click", { target: "cta-hero" });
await client.flushAnalytics(); await client.flushAnalytics();
assert.equal(calls[0][0].event_id, calls[1][0].event_id);
location.pathname = "/admin/analytics";
assert.equal(client.analyticsEnabled(), false);
location.pathname = "/"; storage.set("dv:analytics:off", "1");
assert.equal(client.analyticsSession(), undefined);
assert.equal(client.analyticsVisitor(), null, "opt-out disables persistent identification");
console.log("Analytics: validation, attribution, ordered unique-visitor funnel, privacy, retry deduplication, SQL idempotency, RLS and rate limits passed.");
