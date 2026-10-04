const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const uid = n => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const owner = uid(1), other = uid(2), mapId = uid(10), personId = uid(20);
let state;
function reset() {
  state = { user: owner, dbError: null, rpcError: null, rpcCalls: [], tables: {
    numerology_maps: [{ id: mapId, user_id: owner, status: "completed", customer_name: "Marina Costa", birth_date: "1994-05-17", full_interpretation: {} }],
    relationship_people: [{ id: personId, user_id: owner, name: "Rafael Almeida", birth_date: "1992-09-23" }, { id: uid(21), user_id: other, name: "Pessoa Privada", birth_date: "1990-01-01" }],
    synastry_reports: [], payments: [],
  } };
}
function query(table) {
  const filters = []; let value, count = false;
  const q = {
    select(_columns, options) { count = options?.count === "exact"; return q; },
    eq(k, v) { filters.push([k, v]); return q; }, order() { return q; }, or() { return q; },
    upsert(v) { value = v; return q; },
    maybeSingle() { return run(true); }, single() { return run(true); },
    then(a, b) { return run(false).then(a, b); },
  };
  async function run(single) {
    if (state.dbError) return { data: null, error: state.dbError };
    if (value) { const row = { id: uid(50), ...value }; state.tables[table].push(row); return { data: row, error: null }; }
    const rows = state.tables[table].filter(row => filters.every(([k, v]) => row[k] === v));
    return { data: single ? rows[0] || null : rows, count: count ? rows.length : null, error: null };
  }
  return q;
}
const db = {
  from: query,
  auth: { getUser: async () => ({ data: { user: state.user ? { id: state.user } : null }, error: null }) },
  rpc: async (name, args) => {
    state.rpcCalls.push({ name, args });
    return { data: state.rpcError ? null : { id: uid(99), person_id: args.p_person, report: args.p_report, created_at: "2026-10-04" }, error: state.rpcError };
  },
};
const stubs = {
  "next/server": { NextResponse: Response },
  "@/lib/map-auth": { getMapAuth: async () => db, PRIVATE_HEADERS: { "Cache-Control": "private, no-store" }, sameOrigin: req => req.headers.get("origin") === new URL(req.url).origin },
  "@/lib/supabase": { getSupabaseAdmin: () => db },
  "@/lib/catalog": require("../tmp/map-tests/lib/catalog.js"),
  "@/lib/synastry": require("../tmp/map-tests/lib/synastry.js"),
  "@/lib/web-map": { brazilianDate: () => "2026-10-04" },
};
const source = ts.transpileModule(fs.readFileSync("src/app/api/maps/[id]/relationships/route.ts", "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
const loaded = { exports: {} };
vm.runInNewContext(`(function(require,module,exports){${source}\n})`, { Request, Response, URL, console })(id => stubs[id] || require(id), loaded, loaded.exports);
const { GET, POST } = loaded.exports;
const context = { params: Promise.resolve({ id: mapId }) };
const request = body => new Request(`https://example.com/api/maps/${mapId}/relationships`, { method: "POST", headers: { origin: "https://example.com", "Content-Type": "application/json" }, body: JSON.stringify(body) });
const post = body => POST(request(body), context);
(async () => {
  reset(); state.user = null;
  assert.equal((await GET(request({}), context)).status, 401);
  assert.equal((await post({ action: "compare", personId })).status, 401);
  reset(); state.user = other;
  assert.equal((await GET(request({}), context)).status, 404);
  assert.equal((await post({ action: "person", name: "Pessoa Nova", birthDate: "1990-01-01" })).status, 404);
  reset();
  assert.equal((await POST(new Request("https://example.com/api", { method: "POST", body: "{}" }), context)).status, 403);
  assert.equal((await post(null)).status, 400);
  assert.equal((await post({ action: "person", name: "Pessoa Nova", birthDate: "2025-02-29" })).status, 400);
  assert.equal((await post({ action: "person", name: "Pessoa Nova", birthDate: "2030-01-01" })).status, 400);
  assert.equal((await post({ action: "person", name: "Pessoa Nova", birthDate: "1990-01-01", user_id: other })).status, 201);
  assert.equal(state.tables.relationship_people.at(-1).user_id, owner, "owner always comes from the session");
  assert.equal((await post({ action: "person", name: "Pessoa Nova", birthDate: "1990-01-01" })).status, 200);
  assert.equal(state.tables.relationship_people.length, 3, "repeat registration reuses the profile");
  assert.equal((await post({ action: "compare", personId: uid(21) })).status, 404);
  assert.equal(state.rpcCalls.length, 0);
  state.rpcError = { message: "NO_CREDIT" };
  assert.equal((await post({ action: "compare", personId })).status, 402);
  state.rpcError = null;
  const response = await post({ action: "compare", personId, report: { fake: true }, user_id: other });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  const args = state.rpcCalls.at(-1).args;
  assert.equal(args.p_user, owner);
  assert.equal(args.p_report.a.name, "Marina Costa");
  assert.equal(args.p_report.b.name, "Rafael Almeida");
  assert.equal(args.p_report.dimensions.length, 5, "server builds the report, ignoring forged contents");
  state.tables.payments = [
    { id: uid(30), user_id: owner, status: "PAID", map_id: mapId, metadata: { product: "map", bumps: ["synastry"] } },
    { id: uid(31), user_id: owner, status: "PAID", metadata: { product: "synastry_credit", sourceMapId: mapId } },
    { id: uid(32), user_id: owner, status: "PENDING", metadata: { product: "synastry_credit", sourceMapId: mapId } },
    { id: uid(33), user_id: owner, status: "PAID", metadata: { product: "synastry_credit", sourceMapId: uid(11) } },
    { id: uid(34), user_id: other, status: "PAID", map_id: mapId, metadata: { product: "map", bumps: ["synastry"] } },
    { id: uid(35), user_id: owner, status: "PAID", map_id: mapId, metadata: { product: "map", bumps: [] } },
  ];
  state.tables.synastry_reports = [{ id: uid(40), user_id: owner, map_id: mapId, payment_id: uid(30), report: { saved: true } }];
  const space = await (await GET(request({}), context)).json();
  assert.equal(space.credits, 1, "only paid, unspent credit on this map");
  assert.equal(space.people.some(p => p.user_id === other), false);
  assert.equal(space.reports[0].payment_id, undefined, "payment IDs stay private");
  state.dbError = new Error("database missing");
  assert.equal((await GET(request({}), context)).status, 503);
  console.log("PASS routes: authentication, CSRF, map/person ownership, validation, server-calculated report, credit balance, private caching, schema failures.");
})().catch(error => { console.error(error); process.exitCode = 1; });
