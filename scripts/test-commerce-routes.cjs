// Run route handlers against in-memory doubles. Never reaches a gateway or sends email.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const catalog = require("../tmp/map-tests/lib/catalog.js");
const products = require("../tmp/map-tests/lib/map-products.js");
const { buildWebMap } = require("../tmp/map-tests/lib/web-map.js");
const mapId = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";
let state;
function reset() { state = { writes: [], gatewayCalls: [], delivery: [], user: null, existing: [], insertError: null, gatewayOk: true, map: null, payment: null }; }
function query(table) {
  const q = { op: "read", value: null, filters: [] };
  const methods = {
    select() { return methods; },
    insert(value) { q.op = "insert"; q.value = value; return methods; },
    update(value) { q.op = "update"; q.value = value; return methods; },
    upsert(value) { q.op = "upsert"; q.value = value; return methods; },
    eq(...filter) { q.filters.push(filter); return methods; }, neq() { return methods; }, is() { return methods; },
    contains() { return methods; }, limit() { return methods; },
    maybeSingle() { return resolve(true); },
    then(yes, no) { return resolve(false).then(yes, no); },
  };
  async function resolve(single) {
    if (q.op !== "read") {
      state.writes.push({ table, ...q });
      if (q.op === "insert") return { error: state.insertError };
      return { data: single ? { id: "payment-id" } : [], error: null };
    }
    if (table === "numerology_maps") return { data: state.map, error: null };
    if (table === "payments") return { data: single ? state.payment : state.existing, error: null };
    return { data: null, error: null };
  }
  return methods;
}
const db = { from: query, auth: { getUser: async () => ({ data: { user: state.user }, error: null }) } };
let realDelivery;
const stubs = {
  "next/server": { NextResponse: Response },
  "@/lib/supabase": { getSupabaseAdmin: () => db },
  "@/lib/ggpix": { getGGPIXApiKey: () => "test-key", verifyGGPIXWebhook: () => ({ valid: true }) },
  "@/lib/catalog": catalog,
  "@/lib/web-map": { brazilianDate: () => "2026-10-04", buildWebMap },
  "@/lib/map-products": products,
  "@/lib/map-auth": { getMapAuth: async () => db, sameOrigin: request => request.headers.get("origin") === new URL(request.url).origin, PRIVATE_HEADERS: { "Cache-Control": "private, no-store" } },
  "@/utils/cpf": { generateRandomCPF: () => "00000000000" },
  "qrcode": { toDataURL: async () => "data:image/png;base64,test-qr" },
  "@/lib/delivery": { deliverNumerologyMap: async params => { state.delivery.push(params); return { success: true, emailSent: true }; } },
  "@/lib/map-email": { generateMapLink: async email => ({ userId: "owner", token: "test-token" }), sendMapAccessEmail: async (...args) => { state.delivery.push(args); return "test-email"; } },
  "@/lib/telegram": { sendTelegramPixNotification: async () => {} },
  "@/utils/numerology": require("../tmp/map-tests/utils/numerology.js"),
  "@/utils/interpretations": require("../tmp/map-tests/utils/interpretations/index.js"),
};
function load(file) {
  const output = ts.transpileModule(fs.readFileSync(file, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(`(function(require,module,exports){${output}\n})`, {
    Request, Response, URL, AbortSignal, process: { env: { APP_URL: "https://example.com" } },
    console: { log() {}, warn() {}, error() {} },
    fetch: async (url, options) => {
      state.gatewayCalls.push({ url, body: options?.body ? JSON.parse(options.body) : null });
      return Response.json(state.gatewayBody || { id: "gateway-id", pixCode: "pix-code" }, { status: state.gatewayOk ? 200 : 500 });
    },
  })(id => Object.hasOwn(stubs, id) ? stubs[id] : require(id), module, module.exports);
  return module.exports;
}
const checkout = load("src/app/api/checkout/route.ts").POST;
const webhook = load("src/app/api/webhooks/ggpix/route.ts").POST;
const status = load("src/app/api/status/route.ts").GET;
realDelivery = load("src/lib/delivery.ts").deliverNumerologyMap;
const request = body => new Request("https://example.com/api/checkout", { method: "POST", headers: { origin: "https://example.com", "Content-Type": "application/json" }, body: JSON.stringify(body) });
const customer = { name: "Marina Costa", email: "marina@example.com", birthDate: "1994-05-17" };

(async () => {
  reset();
  const response = await checkout(request({ ...customer, product: "map", bumps: ["name", "calendar"], amountCents: 1, auto_paid: true }));
  assert.equal(response.status, 200);
  assert.equal((await response.json()).amount_cents, 3770);
  assert.equal(state.gatewayCalls[0].body.amountCents, 3770);
  assert.equal(state.writes[0].value.amount_cents, 3770);
  assert.deepEqual(Array.from(state.writes[0].value.metadata.bumps), ["calendar", "name"]);
  assert.equal(state.writes[0].value.status, "PENDING");
  assert.ok(!state.writes[0].value.external_id.includes(customer.email));
  reset();
  assert.equal((await checkout(request({ ...customer, email: "felipedutra@outlook.com" }))).status, 200);
  assert.equal(state.gatewayCalls.length, 1, "email cannot bypass a real charge");
  reset();
  assert.equal((await checkout(request({ ...customer, bumps: ["atlas"] }))).status, 400);
  assert.equal((await checkout(request({ ...customer, birthDate: "2025-02-29" }))).status, 400);
  assert.equal((await checkout(new Request("https://example.com/api/checkout", { method: "POST", body: "{}" }))).status, 403);
  assert.equal(state.gatewayCalls.length, 0);
  reset(); state.insertError = new Error("database unavailable");
  assert.equal((await checkout(request(customer))).status, 503);
  assert.equal(state.gatewayCalls.length, 0, "no charge when order could not be persisted");
  reset(); state.gatewayOk = false;
  assert.equal((await checkout(request(customer))).status, 503);
  reset();
  assert.equal((await checkout(request({ product: "atlas", sourceMapId: mapId }))).status, 401);
  state.user = { id: "owner" };
  assert.equal((await checkout(request({ product: "atlas", sourceMapId: mapId }))).status, 404);
  state.map = { id: mapId, customer_name: customer.name, customer_email: customer.email, birth_date: customer.birthDate };
  assert.equal((await checkout(request({ product: "atlas", sourceMapId: mapId, ...customer, email: "attacker@example.com" }))).status, 200);
  assert.equal(state.gatewayCalls[0].body.customerEmail, customer.email, "upgrade identity comes from the owned map");
  assert.equal(state.gatewayCalls[0].body.amountCents, 2990);
  assert.equal(state.writes[0].value.metadata.sourceMapId, mapId);
  state.existing = [{ id: "already-paid" }];
  assert.equal((await checkout(request({ product: "atlas", sourceMapId: mapId }))).status, 409);
  reset(); state.payment = { id: "payment", external_id: "stored-id", amount_cents: 1990, payer_name: customer.name, payer_email: customer.email, metadata: { birthDate: customer.birthDate }, status: "PENDING" };
  assert.equal((await webhook(request({ status: "COMPLETE", transactionId: "gateway-id", amount: 1 }))).status, 409);
  assert.equal(state.delivery.length, 0);
  assert.equal((await webhook(request({ status: "COMPLETE", transactionId: "gateway-id", amount: 1990 }))).status, 200);
  assert.equal(state.delivery.length, 1);
  assert.equal(state.delivery[0].externalId, "stored-id");
  state.payment.status = "PAID"; state.writes = [];
  await webhook(request({ status: "FAILED", transactionId: "gateway-id", amount: 1990 }));
  assert.equal(state.writes.length, 0, "late failure cannot overwrite paid status");
  reset();
  assert.equal((await status(new Request("https://example.com/api/status?id=VIP_FELIPEDUTRA_123"))).status, 200);
  assert.equal(state.writes.length, 0, "transaction text cannot approve a payment");
  for (const product of ["map", "atlas"]) {
    reset(); state.payment = { id: "payment-id", status: "PAID", payer_name: customer.name, payer_email: customer.email, amount_cents: product === "map" ? 4760 : 2990, external_id: "stored", transaction_id: "confirmed", metadata: { product, bumps: product === "map" ? ["calendar", "name", "challenges"] : [], birthDate: customer.birthDate, referenceDate: "2026-10-04" } };
    const result = await realDelivery({ transactionId: "confirmed", name: "FORGED", email: "forged@example.com", birthDate: "2000-01-01" });
    assert.equal(result.emailSent, true);
    const delivered = state.writes.find(w => w.table === "numerology_maps").value;
    assert.equal(delivered.customer_name, customer.name);
    assert.equal(delivered.customer_email, customer.email);
    assert.equal(delivered.full_interpretation.purchase.product, product);
    assert.deepEqual(Array.from(delivered.full_interpretation.modules.map(m => m.id)), product === "map" ? ["calendar", "name", "challenges"] : ["atlas"]);
    assert.equal(state.delivery[0][5], product, "email identifies delivered product");
    state.payment.metadata = { ...state.payment.metadata, web_access_sent: true }; state.payment.map_id = "payment-id";
    const again = await realDelivery({ transactionId: "confirmed" });
    assert.equal(again.alreadyDelivered, true);
    assert.equal(state.delivery.length, 1, "retries do not resend delivered purchases");
  }
  reset(); state.payment = { status: "PENDING" };
  await assert.rejects(() => realDelivery({ transactionId: "unpaid" }));
  assert.equal(state.delivery.length, 0);
  console.log("PASS: checkout totals, tamper resistance, no VIP bypass, database/gateway failures, owned-map upsell, duplicate upsell, webhook amount check, late events, paid-only delivery, purchased modules, stored customer identity, idempotent delivery, product email.");
})().catch(error => { console.error(error); process.exitCode = 1; });
