// Real Supabase + real Next handlers. GGPIX, Resend and Telegram are intercepted
// inside a separate localhost process. Only uniquely named QA fixtures are changed.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { randomUUID, createHmac } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const run = randomUUID();
const email = `synastry-qa-${run}@example.com`;
const otherEmail = `synastry-qa-${run}-other@example.com`;
const origin = "http://localhost:3005";
const url = process.env.SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const options = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY, options);
const anon = createClient(url, anonKey, options);
const statePath = path.resolve(`tmp/synastry-qa-${run}.json`);
const logPath = path.resolve(`tmp/synastry-qa-${run}.log`);
const users = [];
let server, logHandle;
const bearer = `qa-${run}`, secret = `qa-secret-${run}`;
const read = () => JSON.parse(fs.readFileSync(statePath, "utf8"));
const edit = fn => { const state = read(); fn(state); fs.writeFileSync(statePath, JSON.stringify(state)); };
const post = (route, body, cookie = "", extraHeaders = {}) => fetch(`${origin}${route}`, {
  method: "POST", headers: { Origin: origin, "Content-Type": "application/json", Cookie: cookie, ...extraHeaders }, body: typeof body === "string" ? body : JSON.stringify(body),
});
const get = (route, cookie) => fetch(`${origin}${route}`, { headers: { Cookie: cookie || "" } });
async function ok(response, status = 200) {
  assert.equal(response.status, status, await response.clone().text());
  return response.json();
}
async function login(address, mapId) {
  const { data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email: address });
  assert.ifError(error);
  const result = await post("/api/access/verify", { token_hash: data.properties.hashed_token, mapId });
  await ok(result);
  assert.ok(result.headers.getSetCookie().every(c => /HttpOnly/i.test(c)));
  return result.headers.getSetCookie().map(c => c.split(";")[0]).join("; ");
}
async function rlsClient(address) {
  const { data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email: address });
  assert.ifError(error);
  const client = createClient(url, anonKey, options);
  const verified = await client.auth.verifyOtp({ token_hash: data.properties.hashed_token, type: "email" });
  assert.ifError(verified.error);
  return client;
}
async function payment(transaction) {
  const { data, error } = await admin.from("payments").select("*").eq("transaction_id", transaction.transaction_id).eq("payer_email", email).single();
  assert.ifError(error); return data;
}
async function webhook(transaction, amount = transaction.amount_cents, authenticated = true) {
  const payload = JSON.stringify({ transactionId: transaction.transaction_id, externalId: transaction.external_id, status: "COMPLETE", type: "PIX_IN", amount });
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = createHmac("sha256", secret).update(`${timestamp}.${payload}`).digest("hex");
  return post("/api/webhooks/ggpix", payload, "", authenticated ? { Authorization: `Bearer ${bearer}`, "X-Webhook-Signature": `t=${timestamp},v1=${signature}` } : {});
}

try {
  for (const table of ["relationship_people", "synastry_reports"]) {
    const result = await admin.from(table).select("id").limit(0);
    assert.ifError(result.error);
    const denied = await anon.from(table).select("id").limit(1);
    assert.ok(denied.error || denied.data.length === 0, `${table} not public`);
  }
  const missing = randomUUID();
  const rpc = await admin.rpc("create_synastry", { p_user: missing, p_map: missing, p_person: missing, p_report: {} });
  assert.match(rpc.error?.message || "", /MAP_NOT_FOUND/, "function installed and validates ownership");
  console.log("PASS live schema: both tables exist; anonymous reads denied; transactional function installed.");

  for (const address of [email, otherEmail]) {
    const { data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email: address });
    assert.ifError(error); users.push(data.user.id);
    assert.ifError((await admin.from("profiles").upsert({ id: data.user.id, email: address, full_name: "Teste Sinastria" }, { onConflict: "id", ignoreDuplicates: true })).error);
  }
  fs.mkdirSync(path.dirname(statePath), { recursive: true });
  fs.writeFileSync(statePath, JSON.stringify({ email, transactions: {}, emails: [], autoPay: false }));
  logHandle = fs.openSync(logPath, "w");
  server = spawn(process.execPath, ["--require", path.resolve("scripts/payment-qa-network.cjs"), "node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", "3005"], {
    cwd: process.cwd(), windowsHide: true, stdio: ["ignore", logHandle, logHandle],
    env: { ...process.env, PAYMENT_QA_STATE: statePath, GGPIX_KEY_FINAL: "qa-no-live-key", GGPIX_API_KEY: "qa-no-live-key", GGPIX_WEBHOOK_TOKEN: bearer, GGPIX_WEBHOOK_SECRET: secret, RESEND_API_KEY: "re_qa_no_live_key", APP_URL: "https://qa.invalid", NEXT_PUBLIC_APP_URL: "https://qa.invalid" },
  });
  let ready = false;
  for (let i = 0; i < 50; i++) {
    if (server.exitCode !== null) throw new Error("QA server failed to start");
    try { if ((await fetch(`${origin}/sinastria`)).ok) { ready = true; break; } } catch {}
    await new Promise(resolve => setTimeout(resolve, 400));
  }
  assert.ok(ready, "isolated QA server ready");

  const base = await ok(await post("/api/checkout", { name: "Marina Costa", birthDate: "1994-05-17", email, product: "map", bumps: ["synastry"], amountCents: 1 }));
  assert.equal(base.amount_cents, 2980); assert.ok(base.qr_code_base64);
  assert.equal((await payment(base)).status, "PENDING");
  assert.equal((await ok(await get(`/api/status?id=${base.transaction_id}`))).status, "PENDING");
  assert.equal((await webhook(base, 2980, false)).status, 401);
  assert.equal((await webhook(base, 1)).status, 409);
  await ok(await webhook(base));
  const paidBase = await payment(base);
  assert.equal(paidBase.status, "PAID"); assert.equal(paidBase.user_id, users[0]); assert.ok(paidBase.map_id);
  const mapId = paidBase.map_id;
  const cookie = await login(email, mapId);
  const originalMap = await ok(await get(`/api/maps/${mapId}`, cookie));
  assert.equal(originalMap.readings.length, 9);
  assert.ok(originalMap.purchase.bumps.includes("synastry"));
  const endpoint = `/api/maps/${mapId}/relationships`;
  const space = () => get(endpoint, cookie).then(r => ok(r));
  assert.equal((await space()).credits, 1);
  console.log("PASS map checkout: QR, authoritative R$29.80 total, authenticated webhook, amount mismatch rejection, map delivery and first credit.");

  assert.equal((await post(endpoint, { action: "person", name: "Pessoa Teste", birthDate: "2025-02-29" }, cookie)).status, 400);
  assert.equal((await post(endpoint, { action: "person", name: "Pessoa Teste", birthDate: "1990-01-01" }, cookie, { Origin: "https://invalid.example" })).status, 403);
  const person = (await ok(await post(endpoint, { action: "person", name: "Rafael Almeida", birthDate: "1992-09-23" }, cookie), 201)).person;
  const repeatedPerson = await ok(await post(endpoint, { action: "person", name: "Rafael Almeida", birthDate: "1992-09-23" }, cookie));
  assert.equal(repeatedPerson.person.id, person.id);
  assert.equal((await space()).credits, 1, "registration free");
  const duplicateRequests = await Promise.all(Array.from({ length: 3 }, () => post(endpoint, { action: "compare", personId: person.id, report: { forged: true } }, cookie).then(r => ok(r))));
  assert.equal(new Set(duplicateRequests.map(r => r.report.id)).size, 1);
  const firstReport = duplicateRequests[0].report;
  assert.equal(firstReport.report.dimensions.length, 5);
  assert.equal(firstReport.report.a.name, "Marina Costa");
  assert.equal(firstReport.report.b.name, "Rafael Almeida");
  assert.equal((await space()).credits, 0);
  assert.equal((await space()).reports.length, 1);
  const reread = await ok(await post(endpoint, { action: "compare", personId: person.id }, cookie));
  assert.deepEqual(reread.report, firstReport);
  console.log("PASS first comparison: free registration, 5 calculated axes, three parallel requests produce one report, free reread, one credit consumed.");

  const second = (await ok(await post(endpoint, { action: "person", name: "Ana Silva", birthDate: "1990-01-01" }, cookie), 201)).person;
  const third = (await ok(await post(endpoint, { action: "person", name: "Julia Santos", birthDate: "1993-06-12" }, cookie), 201)).person;
  assert.equal((await post(endpoint, { action: "compare", personId: second.id }, cookie)).status, 402);
  const credit = await ok(await post("/api/checkout", { product: "synastry_credit", sourceMapId: mapId, email: "forged@example.com", amountCents: 1 }, cookie));
  assert.equal(credit.amount_cents, 1490);
  assert.equal((await space()).credits, 0, "pending credit not usable");
  edit(s => { s.transactions[credit.transaction_id].status = "COMPLETE"; });
  assert.equal((await ok(await get(`/api/status?id=${credit.transaction_id}`))).status, "PAID");
  assert.equal((await ok(await post("/api/deliver", credit))).email_sent, true);
  assert.equal((await payment(credit)).map_id, mapId);
  assert.deepEqual(await ok(await get(`/api/maps/${mapId}`, cookie)), originalMap, "credit does not overwrite map");
  assert.equal((await space()).credits, 1);
  const emailCount = read().emails.length;
  await Promise.all([webhook(credit), webhook(credit), post("/api/deliver", credit)]);
  assert.equal(read().emails.length, emailCount, "delivery/webhook retries do not resend");
  const competing = await Promise.all([second, third].map(p => post(endpoint, { action: "compare", personId: p.id }, cookie)));
  assert.deepEqual(competing.map(r => r.status).sort(), [200, 402], "one credit cannot serve two people concurrently");
  assert.equal((await space()).credits, 0);
  assert.equal((await space()).reports.length, 2);
  console.log("PASS extra credit: R$14.90, unpaid blocked, polling confirms, original map preserved, duplicate delivery idempotent, concurrent spend accepts only one person.");

  // Account B has a separate fixture map, never a real customer's map.
  const otherMap = randomUUID();
  assert.ifError((await admin.from("numerology_maps").insert({ id: otherMap, user_id: users[1], customer_name: "Pessoa Teste", customer_email: otherEmail, birth_date: "1990-01-01", life_path: 3, expression: 1, soul_urge: 1, personality: 1, birthday: 1, maturity: 4, personal_year: 3, status: "completed", full_interpretation: { purchase: { product: "map", bumps: [] } } })).error);
  const otherCookie = await login(otherEmail, otherMap);
  assert.equal((await get(endpoint)).status, 401);
  assert.equal((await get(endpoint, otherCookie)).status, 404);
  assert.equal((await post(`/api/maps/${otherMap}/relationships`, { action: "compare", personId: person.id }, otherCookie)).status, 404);
  assert.equal((await post("/api/checkout", { product: "synastry_credit", sourceMapId: mapId }, otherCookie)).status, 404);
  const clientA = await rlsClient(email), clientB = await rlsClient(otherEmail);
  assert.equal((await clientA.from("synastry_reports").select("id").eq("map_id", mapId)).data.length, 2);
  assert.equal((await clientB.from("synastry_reports").select("id").eq("map_id", mapId)).data.length, 0);
  assert.equal((await clientB.from("relationship_people").select("id").eq("id", person.id)).data.length, 0);
  assert.ok((await clientA.from("relationship_people").update({ name: "Rafael Almeida" }).eq("id", person.id)).error);
  assert.ok((await clientA.from("synastry_reports").update({ report: firstReport.report }).eq("id", firstReport.id)).error);
  assert.ok((await clientA.rpc("create_synastry", { p_user: users[0], p_map: mapId, p_person: person.id, p_report: {} })).error);
  const denied = await admin.rpc("create_synastry", { p_user: users[1], p_map: mapId, p_person: person.id, p_report: {} });
  assert.match(denied.error?.message || "", /MAP_NOT_FOUND/);
  console.log("PASS security: session/CSRF, private map and people, actual Supabase RLS, client writes/RPC forbidden, server function ownership verified.");
  assert.equal(read().emails.length, 2);
  console.log("PASS full live integration. Gateway, emails and Telegram were simulated; no real charge or message sent.");
} finally {
  if (server && server.exitCode === null) {
    server.kill();
    await new Promise(resolve => { server.once("exit", resolve); setTimeout(resolve, 3000); });
  }
  if (logHandle !== undefined) fs.closeSync(logHandle);
  // Delete only rows linked to the two freshly created, unique QA users/emails.
  if (users.length) {
    const attempts = [
      () => admin.from("synastry_reports").delete().in("user_id", users),
      () => admin.from("relationship_people").delete().in("user_id", users),
      () => admin.from("payments").delete().in("payer_email", [email, otherEmail]),
      () => admin.from("numerology_maps").delete().in("customer_email", [email, otherEmail]),
    ];
    for (const cleanup of attempts) assert.ifError((await cleanup()).error);
    for (const id of users) assert.ifError((await admin.auth.admin.deleteUser(id)).error);
  }
  for (const table of ["synastry_reports", "relationship_people"]) {
    if (users.length) {
      const { data, error } = await admin.from(table).select("id").in("user_id", users);
      assert.ifError(error); assert.equal(data.length, 0);
    }
  }
  for (const file of [statePath, logPath]) if (fs.existsSync(file)) fs.unlinkSync(file);
  console.log("QA fixtures removed; temporary server stopped.");
}
