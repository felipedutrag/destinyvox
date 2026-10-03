// Integration QA: creates two isolated Auth/map fixtures; never sends email or creates payments.
// Removes exactly those fixtures in finally. Run with --env-file=.env.local against local Next.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const origin = process.env.MAP_QA_ORIGIN || "http://localhost:3001";
const url = process.env.SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const anon = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
const run = randomUUID();
const users = [];
const maps = [];
const fixtures = [];
const post = (path, body, cookie = "", requestOrigin = origin) => fetch(`${origin}${path}`, { method: "POST", headers: { Origin: requestOrigin, "Content-Type": "application/json", Cookie: cookie }, body: JSON.stringify(body) });
try {
  for (const label of ["a", "b"]) {
    const email = `destinyvox-qa-${run}-${label}@example.com`;
    const { data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email });
    assert.ifError(error); users.push(data.user.id);
    const profile = await admin.from("profiles").upsert({ id: data.user.id, email, full_name: "Teste de acesso" });
    assert.ifError(profile.error);
    const id = randomUUID(); maps.push(id);
    const inserted = await admin.from("numerology_maps").insert({ id, user_id: data.user.id, customer_name: "Marina Costa", customer_email: email, birth_date: "1994-05-17", life_path: 9, expression: 6, soul_urge: 9, personality: 6, birthday: 8, maturity: 6, personal_year: 5, personal_month: 6, personal_day: 9, status: "completed" });
    assert.ifError(inserted.error);
    fixtures.push({ id, token_hash: data.properties.hashed_token });
  }
  const publicRead = await anon.from("numerology_maps").select("id").in("id", maps);
  assert.ok(publicRead.error || publicRead.data.length === 0, "anonymous RLS must not expose maps");
  const a = fixtures[0], b = fixtures[1];
  const authBody = { token_hash: a.token_hash, mapId: a.id };
  assert.equal((await fetch(`${origin}/api/maps/${a.id}`)).status, 401);
  assert.equal((await post("/api/access/verify", authBody, "", "https://invalid.example")).status, 403);
  const login = await post("/api/access/verify", authBody);
  assert.equal(login.status, 200, `valid link should authenticate: ${await login.clone().text()}`);
  const setCookies = login.headers.getSetCookie();
  assert.ok(setCookies.length > 0 && setCookies.every(c => /HttpOnly/i.test(c)), "cookies are HttpOnly");
  const cookie = setCookies.map(c => c.split(";")[0]).join("; ");
  const own = await fetch(`${origin}/api/maps/${a.id}`, { headers: { Cookie: cookie } });
  assert.equal(own.status, 200);
  assert.match(own.headers.get("cache-control"), /no-store/);
  assert.equal((await own.json()).readings.length, 9);
  const other = await fetch(`${origin}/api/maps/${b.id}`, { headers: { Cookie: cookie } });
  assert.equal(other.status, 404, "another customer's map must remain inaccessible");
  assert.equal((await post("/api/access/verify", authBody)).status, 401, "magic links are one-use");
  assert.equal((await post("/api/access/verify", { token_hash: "invalid", mapId: a.id })).status, 400);
  const delivery = await post("/api/deliver", { transaction_id: `UNPAID-QA-${run}`, name: "Teste", email: "nobody@example.com", birthDate: "17/05/1994" });
  assert.equal(delivery.status, 500, "unpaid requests cannot trigger delivery");
  const logout = await post("/api/access/logout", {}, cookie);
  assert.equal(logout.status, 200);
  assert.ok(logout.headers.getSetCookie().some(c => /Max-Age=0/i.test(c)), "logout clears session");
  console.log("PASS: live RLS, link authentication, HttpOnly session, owner isolation, private caching, replay rejection, invalid link, CSRF, unpaid delivery rejection, logout.");
} finally {
  if (maps.length) {
    const cleanup = await admin.from("numerology_maps").delete().in("id", maps);
    if (cleanup.error) throw new Error("QA map cleanup failed; inspect QA fixture IDs in this run.");
  }
  for (const id of users) {
    const { error } = await admin.auth.admin.deleteUser(id);
    assert.ifError(error);
  }
  console.log("QA fixtures removed. No emails sent; no payments created.");
}
