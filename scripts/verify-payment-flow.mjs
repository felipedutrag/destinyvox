// Real Next HTTP handlers + disposable Supabase fixtures. Gateway and outbound
// messages are intercepted by payment-qa-network.cjs, never sent externally.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { randomUUID, createHmac } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const run = randomUUID();
const email = `payment-qa-${run}@example.com`;
const origin = "http://localhost:3003";
const statePath = path.resolve("tmp/payment-qa-state.json");
const finishPath = path.resolve("tmp/payment-qa-finish");
const bearer = `qa-bearer-${run}`, secret = `qa-hmac-${run}`;
const admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const read = () => JSON.parse(fs.readFileSync(statePath, "utf8"));
const edit = fn => { const value = read(); fn(value); fs.writeFileSync(statePath, JSON.stringify(value)); };
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
if (fs.existsSync(finishPath)) fs.unlinkSync(finishPath);
fs.writeFileSync(statePath, JSON.stringify({ email, transactions: {}, emails: [], autoPay: false }));
const logs = fs.openSync("tmp/payment-qa-server.log", "w");
const server = spawn(process.execPath, ["--require", path.resolve("scripts/payment-qa-network.cjs"), "node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", "3003"], {
  cwd: process.cwd(), windowsHide: true, stdio: ["ignore", logs, logs], env: { ...process.env, PAYMENT_QA_STATE: statePath, GGPIX_KEY_FINAL: "qa-no-live-key", GGPIX_API_KEY: "qa-no-live-key", GGPIX_WEBHOOK_TOKEN: bearer, GGPIX_WEBHOOK_SECRET: secret, RESEND_API_KEY: "re_qa_no_live_key", APP_URL: "https://qa.invalid", NEXT_PUBLIC_APP_URL: "https://qa.invalid" },
});
let ready = false;
const post = (url, body, headers = {}) => fetch(`${origin}${url}`, { method: "POST", headers: { Origin: origin, "Content-Type": "application/json", ...headers }, body: typeof body === "string" ? body : JSON.stringify(body) });
const payment = async transaction => { const result = await admin.from("payments").select("id, status, metadata, map_id, user_id, amount_cents").eq("transaction_id", transaction.transaction_id).eq("payer_email", email).single(); assert.ifError(result.error); return result.data; };
const checkout = async () => {
  const response = await post("/api/checkout", { name: "Marina Costa", email, birthDate: "1994-05-17", product: "map", bumps: ["calendar", "name", "challenges"] });
  assert.equal(response.status, 200, await response.clone().text()); return response.json();
};
const poll = async transaction => { const response = await fetch(`${origin}/api/status?id=${encodeURIComponent(transaction.transaction_id)}`); assert.equal(response.status, 200); return (await response.json()).status; };
function headers(body, timestamp = Math.floor(Date.now() / 1000)) { return { Authorization: `Bearer ${bearer}`, "x-webhook-signature": `t=${timestamp},v1=${createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex")}` }; }
const webhook = (transaction, changes = {}, auth = "valid", timestamp) => {
  const body = JSON.stringify({ type: "PIX_IN", status: "COMPLETE", amount: 4760, transactionId: transaction.transaction_id, externalId: transaction.external_id, ...changes });
  return post("/api/webhooks/ggpix", body, auth === "valid" ? headers(body, timestamp) : { Authorization: "Bearer invalid-qa" });
};
async function delivered(transaction) {
  const row = await payment(transaction);
  assert.equal(row.status, "PAID"); assert.equal(row.metadata.web_access_sent, true); assert.ok(row.map_id);
  const map = await admin.from("numerology_maps").select("full_interpretation").eq("id", row.map_id).eq("customer_email", email).single();
  assert.ifError(map.error); assert.deepEqual(map.data.full_interpretation.modules.map(m => m.id), ["calendar", "name", "challenges"]);
}
try {
  for (let i = 0; i < 60; i++) { try { if ((await fetch(origin)).ok) { ready = true; break; } } catch {} await sleep(500); }
  assert.ok(ready, "isolated QA server ready");
  const polling = await checkout();
  assert.equal(await poll(polling), "PENDING");
  edit(s => { s.transactions[polling.transaction_id].networkError = true; });
  assert.equal(await poll(polling), "PENDING");
  assert.equal((await payment(polling)).status, "PENDING");
  edit(s => { const t = s.transactions[polling.transaction_id]; t.networkError = false; t.status = "COMPLETE"; t.amount = 1; });
  assert.equal(await poll(polling), "PENDING", "wrong amount cannot approve");
  edit(s => { s.transactions[polling.transaction_id].amount = 4760; });
  assert.equal(await poll(polling), "PAID");
  const delivery = await post("/api/deliver", polling);
  assert.equal(delivery.status, 200, await delivery.clone().text());
  assert.equal((await delivery.json()).email_sent, true);
  await delivered(polling);
  const count = read().emails.length;
  assert.equal((await post("/api/deliver", polling)).status, 200);
  assert.equal(read().emails.length, count, "repeated polling delivery is idempotent");
  console.log("PASS polling: pending, gateway outage, mismatched amount, paid transition, persisted product, one delivery.");

  const hook = await checkout();
  assert.equal((await webhook(hook, {}, "invalid")).status, 401);
  assert.equal((await webhook(hook, {}, "valid", Math.floor(Date.now() / 1000) - 3600)).status, 401);
  assert.equal((await webhook(hook, { amount: 1 })).status, 409);
  assert.equal((await payment(hook)).status, "PENDING");
  const response = await webhook(hook);
  assert.equal(response.status, 200, await response.clone().text());
  await delivered(hook);
  assert.equal(await poll(hook), "PAID", "polling sees webhook update");
  const hookCount = read().emails.length;
  await Promise.all([webhook(hook), webhook(hook), post("/api/deliver", hook)]);
  assert.equal(read().emails.length, hookCount, "duplicate events do not resend");
  await webhook(hook, { status: "FAILED" });
  assert.equal((await payment(hook)).status, "PAID");
  console.log("PASS webhook: bearer + HMAC, expired/invalid auth rejected, amount checked, product delivered, duplicates ignored, paid status preserved.");

  const retry = await checkout();
  edit(s => { s.failEmail = true; });
  assert.equal((await webhook(retry)).status, 503);
  const failed = await payment(retry);
  assert.equal(failed.status, "PAID"); assert.equal(failed.metadata.delivering, false); assert.notEqual(failed.metadata.web_access_sent, true);
  edit(s => { s.failEmail = false; });
  assert.equal((await webhook(retry)).status, 200);
  await delivered(retry);
  console.log("PASS retry: email outage returns 503, releases delivery lock, retry completes without another charge.");

  const concurrent = await checkout();
  edit(s => { s.transactions[concurrent.transaction_id].status = "COMPLETE"; });
  await poll(concurrent);
  const concurrentBefore = read().emails.length;
  await Promise.all([webhook(concurrent), post("/api/deliver", concurrent), webhook(concurrent)]);
  await delivered(concurrent);
  assert.equal(read().emails.length, concurrentBefore + 1, "webhook and polling race produces one email");
  console.log("PASS concurrency: simultaneous webhook and polling deliver only once.");

  if (process.argv.includes("--ui")) {
    edit(s => { s.autoPay = true; });
    console.log(`UI_READY ${JSON.stringify({ origin, email, instruction: "Checkout is simulated and becomes paid after three polls. Create tmp/payment-qa-finish to stop and clean fixtures." })}`);
    for (let i = 0; i < 1200 && !fs.existsSync(finishPath); i++) await sleep(500);
    const state = read();
    const uiIds = Object.entries(state.transactions).filter(([, t]) => t.autoPay);
    assert.ok(uiIds.length > 0, "UI checkout exercised");
    for (const [id] of uiIds) await delivered({ transaction_id: id });
    console.log("PASS UI checkout: automatic polling reached delivery with the three-poll gateway simulation.");
  }
} finally {
  server.kill(); fs.closeSync(logs);
  const rows = await admin.from("payments").select("id, map_id, user_id").eq("payer_email", email);
  assert.ifError(rows.error);
  const mapIds = [...new Set(rows.data.map(r => r.map_id).filter(Boolean))];
  const userIds = [...new Set(rows.data.map(r => r.user_id).filter(Boolean))];
  if (rows.data.length) { const removed = await admin.from("payments").delete().in("id", rows.data.map(r => r.id)).eq("payer_email", email); assert.ifError(removed.error); }
  if (mapIds.length) { const removed = await admin.from("numerology_maps").delete().in("id", mapIds).eq("customer_email", email); assert.ifError(removed.error); }
  for (const id of userIds) { const removed = await admin.auth.admin.deleteUser(id); assert.ifError(removed.error); }
  console.log("CLEANUP: disposable payments/maps/users removed. No real charge, email or Telegram message was sent.");
}
