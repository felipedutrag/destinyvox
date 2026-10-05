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
    single() { return resolve(true); },
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
    if (table === "synastry_reports") return { data: [], error: state.schemaError || null };
    return { data: null, error: null };
  }
  return methods;
}
const db = { from: query, auth: { getUser: async () => ({ data: { user: state.user }, error: null }) }, rpc: async (name, args) => { state.synastryCall = { name, args }; return { data: { id: "synastry-report" }, error: state.synastryError || null }; } };
let realDelivery;
const stubs = {
  "next/server": { NextResponse: Response, after: callback => { void callback(); } },
  "@/lib/supabase": { getSupabaseAdmin: () => db },
  "@/lib/ggpix": { getGGPIXApiKey: () => "test-key", verifyGGPIXWebhook: () => ({ valid: true }) },
  "@/lib/catalog": catalog,
  "@/lib/web-map": { brazilianDate: () => "2026-10-04", buildWebMap },
  "@/lib/map-products": products,
  "@/lib/synastry": require("../tmp/map-tests/lib/synastry.js"),
  "@/lib/map-auth": { getMapAuth: async () => db, sameOrigin: request => request.headers.get("origin") === new URL(request.url).origin, PRIVATE_HEADERS: { "Cache-Control": "private, no-store" } },
  "@/utils/cpf": { generateRandomCPF: () => "00000000000" },
  "qrcode": { toDataURL: async () => "data:image/png;base64,test-qr" },
  "@/lib/delivery": { deliverNumerologyMap: async params => { state.delivery.push(params); return { success: true, emailSent: true }; } },
  "@/lib/map-email": { generateMapLink: async email => ({ userId: "owner", token: "test-token" }), sendMapAccessEmail: async (...args) => { state.delivery.push(args); return "test-email"; } },
  "@/lib/telegram": { sendTelegramPixNotification: async () => {}, sendTelegramPixCreatedAlert: async () => {} },
  "@/lib/reddit-capi": { getRedditAttribution: () => ({}), sendRedditPurchase: async () => {} },
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
stubs["@/lib/analytics-shared"] = load("src/lib/analytics-shared.ts");
const checkout = load("src/app/api/checkout/route.ts").POST;
const webhook = load("src/app/api/webhooks/ggpix/route.ts").POST;
const status = load("src/app/api/status/route.ts").GET;
realDelivery = load("src/lib/delivery.ts").deliverNumerologyMap;
const request = body => new Request("https://example.com/api/checkout", { method: "POST", headers: { origin: "https://example.com", "Content-Type": "application/json" }, body: JSON.stringify(body) });
const customer = { name: "Marina Costa", email: "marina@example.com", birthDate: "1994-05-17" };
const partner = { name: "Rafael Almeida", birthDate: "1992-09-23" };

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
  const analyticsId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  assert.equal((await checkout(request({ ...customer, analytics: { session_id: analyticsId, context: { source: "reddit", email: "do-not-store@example.com" } } }))).status, 200);
  assert.equal(state.writes[0].value.metadata.analytics.session_id, analyticsId);
  assert.equal(state.writes[0].value.metadata.analytics.context.email, undefined);
  assert.equal(state.writes[0].value.amount_cents, 1990);
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
  reset();
  assert.equal((await checkout(request({ product: "synastry_credit", sourceMapId: mapId }))).status, 401);
  state.user = { id: "owner" };
  assert.equal((await checkout(request({ product: "synastry_credit", sourceMapId: mapId }))).status, 404);
  state.map = { id: mapId, customer_name: customer.name, customer_email: customer.email, birth_date: customer.birthDate };
  state.existing = [{ id: "already-paid-atlas" }];
  assert.equal((await checkout(request({ product: "synastry_credit", sourceMapId: mapId, email: "forged@example.com", amountCents: 1 }))).status, 200);
  assert.equal(state.gatewayCalls[0].body.amountCents, 1490);
  assert.equal(state.gatewayCalls[0].body.customerEmail, customer.email);
  assert.equal(state.writes[0].value.user_id, "owner");
  assert.equal(state.writes[0].value.metadata.sourceMapId, mapId);
  reset();
  for (const synastryPerson of [undefined, null, {}, { ...partner, birthDate: "2025-02-29" }, { ...partner, birthDate: "2030-01-01" }, { ...partner, name: "Rafael" }]) {
    assert.equal((await checkout(request({ ...customer, bumps: ["synastry"], synastryPerson }))).status, 400);
  }
  assert.equal(state.gatewayCalls.length, 0, "invalid partner cannot create a charge");
  assert.equal((await checkout(request({ ...customer, bumps: ["synastry"], synastryPerson: partner }))).status, 200);
  assert.equal(state.gatewayCalls[0].body.amountCents, 2980);
  assert.equal(state.writes[0].value.metadata.synastryPerson.name, partner.name);
  assert.equal(state.writes[0].value.metadata.synastryPerson.birthDate, partner.birthDate);
  reset();
  assert.equal((await checkout(request({ ...customer, bumps: [], synastryPerson: partner }))).status, 200);
  assert.equal(state.writes[0].value.metadata.synastryPerson, undefined, "unchecked bump discards partner data");
  assert.equal(state.gatewayCalls[0].body.amountCents, 1990);
  reset(); state.schemaError = new Error("missing schema");
  assert.equal((await checkout(request({ ...customer, bumps: ["synastry"], synastryPerson: partner }))).status, 503);
  assert.equal(state.gatewayCalls.length, 0, "never sell a credit before schema is installed");
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
  reset();
  state.map = { id: mapId };
  state.payment = { id: "credit-payment", status: "PAID", payer_name: customer.name, payer_email: customer.email, amount_cents: 1490, transaction_id: "credit-paid", metadata: { product: "synastry_credit", sourceMapId: mapId, birthDate: customer.birthDate } };
  const credit = await realDelivery({ transactionId: "credit-paid" });
  assert.equal(credit.mapId, mapId);
  assert.equal(credit.emailSent, true);
  assert.equal(state.writes.filter(w => w.table === "numerology_maps").length, 0, "a new credit cannot overwrite the source map or create a duplicate");
  assert.equal(state.delivery[0][5], "synastry_credit");
  state.payment.map_id = mapId; state.payment.metadata.web_access_sent = true;
  assert.equal((await realDelivery({ transactionId: "credit-paid" })).alreadyDelivered, true);
  assert.equal(state.delivery.length, 1);
  console.log("PASS: checkout totals, tamper resistance, no VIP bypass, database/gateway failures, owned-map upsell, duplicate upsell, webhook amount check, late events, paid-only delivery, purchased modules, stored customer identity, idempotent delivery, product email.");
  reset();
  state.payment = { id: "auto-synastry-payment", status: "PAID", payer_name: customer.name, payer_email: customer.email, amount_cents: 2980, transaction_id: "automatic", metadata: { product: "map", bumps: ["synastry"], synastryPerson: partner, birthDate: customer.birthDate, referenceDate: "2026-10-04" } };
  state.synastryError = new Error("temporary comparison failure");
  await assert.rejects(() => realDelivery({ transactionId: "automatic" }));
  assert.equal(state.delivery.length, 0, "do not email access before the comparison is ready");
  state.synastryError = null;
  const ready = await realDelivery({ transactionId: "automatic", synastryPerson: { name: "Forged Person" } });
  assert.equal(ready.emailSent, true);
  assert.equal(state.synastryCall.name, "create_synastry");
  assert.equal(state.synastryCall.args.p_report.b.name, partner.name, "delivery uses stored partner only");
  assert.equal(state.synastryCall.args.p_report.dimensions.length, 5);
  console.log("PASS: checkout partner validation, deselected bump, automatic comparison, failure before email, safe retry, stored partner identity.");
})().catch(error => { console.error(error); process.exitCode = 1; });
