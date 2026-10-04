const assert = require("node:assert/strict");
const { buildSynastry } = require("../tmp/map-tests/lib/synastry.js");
const { createOrder } = require("../tmp/map-tests/lib/catalog.js");
const { buildPurchasedMap } = require("../tmp/map-tests/lib/map-products.js");
const a = { name: "Marina Costa", birthDate: "1994-05-17" };
const b = { name: "Rafael Almeida", birthDate: "1992-09-23" };
const report = buildSynastry(a, b, "2026-10-04");
assert.equal(report.dimensions.length, 5);
assert.deepEqual(report.dimensions.map(d => d.a), [9, 9, 6, 6, 5]);
const reversed = buildSynastry(b, a, "2026-10-04");
for (let i = 0; i < 5; i++) {
  const d = report.dimensions[i];
  assert.equal(d.a, reversed.dimensions[i].b);
  assert.equal(d.b, reversed.dimensions[i].a);
  assert.equal(d.connection, reversed.dimensions[i].connection);
  assert.ok(d.affinity.length > 100 && d.friction.length > 100 && d.practice.length > 100);
  assert.ok(!JSON.stringify(d).includes("undefined"));
}
const accentA = buildSynastry({ name: "Júlia Sá", birthDate: "1990-11-22" }, b, "2026-10-04");
const accentB = buildSynastry({ name: "Julia Sa", birthDate: "1990-11-22" }, b, "2026-10-04");
assert.deepEqual(accentA.dimensions.map(d => d.a), accentB.dimensions.map(d => d.a));
const missing = buildSynastry({ name: "Rhythm Lynch", birthDate: "2000-01-01" }, b, "2026-10-04");
if (missing.dimensions[1].a === 0) assert.equal(missing.dimensions[1].connection, null);
const nextYear = buildSynastry(a, b, "2027-01-01");
assert.deepEqual(report.dimensions.slice(0, 4), nextYear.dimensions.slice(0, 4));
assert.notEqual(report.dimensions[4].a, nextYear.dimensions[4].a);
const ids = ["calendar", "name", "challenges", "synastry"];
for (let mask = 0; mask < 16; mask++) {
  const bumps = ids.filter((_, i) => mask & (1 << i));
  assert.equal(createOrder("map", bumps).amountCents, 1990 + (mask & 1 ? 990 : 0) + (mask & 2 ? 790 : 0) + (mask & 4 ? 990 : 0) + (mask & 8 ? 990 : 0));
  const map = buildPurchasedMap(a.name, a.birthDate, { product: "map", bumps, referenceDate: "2026-10-04" });
  assert.equal(map.readings.length, 9);
  assert.deepEqual(map.purchase.bumps, bumps);
  assert.ok(!map.modules.some(m => m.id === "synastry"), "buying a credit does not fabricate a second person's reading");
}
assert.equal(createOrder("synastry_credit").amountCents, 1490);
assert.throws(() => createOrder("synastry_credit", ["synastry"]));
console.log("PASS: five comparison axes, symmetry, names/accents, year boundary, 16 cart combinations, optional bump entitlement, credit price.");
