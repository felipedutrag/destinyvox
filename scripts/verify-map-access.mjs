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
    const inserted = await admin.from("numerology_maps").insert({ id, user_id: data.user.id, customer_name: "Marina Costa", customer_email: email, birth_date: "1994-05-17", life_path: 9, expression: 6, soul_urge: 9, personality: 6, birthday: 8, maturity: 6, personal_year: 5, personal_month: 6, personal_day: 9, status: "completed", full_interpretation: { purchase: { product: label === "a" ? "map" : "atlas", bumps: label === "a" ? ["calendar"] : [], referenceDate: "2026-10-04" } } });
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
  const ownMap = await own.json();
  assert.equal(ownMap.readings.length, 9);
  assert.deepEqual(ownMap.modules.map(m => m.id), ["calendar"], "only the purchased bump is exposed");
  assert.equal(ownMap.modules[0].entries.length, 12);
  const library = await fetch(`${origin}/api/maps`, { headers: { Cookie: cookie } });
  assert.equal(library.status, 200);
  assert.deepEqual((await library.json()).maps.map(m => m.id), [a.id], "library is scoped to the authenticated owner");
  assert.equal((await post("/api/checkout", { product: "atlas", sourceMapId: b.id }, cookie)).status, 404, "cannot upgrade another customer's map");
  assert.equal((await post("/api/checkout", { product: "atlas", sourceMapId: a.id })).status, 401, "upgrade requires login");
  const loginB = await post("/api/access/verify", { token_hash: b.token_hash, mapId: b.id });
  assert.equal(loginB.status, 200);
  const cookieB = loginB.headers.getSetCookie().map(c => c.split(";")[0]).join("; ");
  const atlas = await fetch(`${origin}/api/maps/${b.id}`, { headers: { Cookie: cookieB } });
  assert.equal(atlas.status, 200);
  const atlasData = await atlas.json();
  assert.equal(atlasData.purchase.product, "atlas");
  assert.deepEqual(atlasData.modules.map(m => m.id), ["atlas"]);
  assert.equal(atlasData.modules[0].entries.length, 4);
  assert.equal((await post("/api/checkout", { product: "atlas", sourceMapId: b.id }, cookieB)).status, 404, "an Atlas cannot be used as a base map");
  const other = await fetch(`${origin}/api/maps/${b.id}`, { headers: { Cookie: cookie } });
  assert.equal(other.status, 404, "another customer's map must remain inaccessible");
  assert.equal((await post("/api/access/verify", authBody)).status, 401, "magic links are one-use");
  assert.equal((await post("/api/access/verify", { token_hash: "invalid", mapId: a.id })).status, 400);
  const delivery = await post("/api/deliver", { transaction_id: `UNPAID-QA-${run}`, name: "Teste", email: "nobody@example.com", birthDate: "17/05/1994" });
  assert.equal(delivery.status, 500, "unpaid requests cannot trigger delivery");
  const logout = await post("/api/access/logout", {}, cookie);
  assert.equal(logout.status, 200);
  assert.ok(logout.headers.getSetCookie().some(c => /Max-Age=0/i.test(c)), "logout clears session");
  console.log("PASS: live RLS, link authentication, HttpOnly session, owner isolation, purchased-only bumps, Atlas delivery/read, private library, authenticated upsell, private caching, replay rejection, invalid link, CSRF, unpaid delivery rejection, logout.");
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
