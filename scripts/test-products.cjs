const assert = require("node:assert/strict");
const { createOrder, validateCustomer } = require("../tmp/map-tests/lib/catalog.js");
const { buildPurchasedMap, buildProductModules, challengeNumbers, pinnacleNumbers, nameFrequencies, readPurchase } = require("../tmp/map-tests/lib/map-products.js");
const ids = ["calendar", "name", "challenges"];
for (let mask = 0; mask < 8; mask++) {
  const bumps = ids.filter((_, i) => mask & (1 << i));
  const expected = 1990 + (mask & 1 ? 990 : 0) + (mask & 2 ? 790 : 0) + (mask & 4 ? 990 : 0);
  assert.equal(createOrder("map", bumps).amountCents, expected);
  const map = buildPurchasedMap("Marina Costa", "1994-05-17", { product: "map", bumps, referenceDate: "2026-10-04" }, "2026-10-04");
  assert.equal(map.readings.length, 9);
  assert.deepEqual(map.modules.map(m => m.id), bumps, "only purchased modules are delivered");
}
assert.equal(createOrder("atlas").amountCents, 2990);
for (const args of [["bad"], ["map", ["atlas"]], ["map", ["name", "name"]], ["atlas", ["name"]], ["map", "name"]]) assert.throws(() => createOrder(...args));
const customer = { name: "  Marina   Costa ", email: " MARINA@example.com ", birthDate: "17/05/1994" };
assert.deepEqual(validateCustomer(customer, "2026-10-04"), { name: "Marina Costa", email: "marina@example.com", birthDate: "1994-05-17" });
for (const date of ["2025-02-29", "2026-13-01", "2026-04-31", "2027-01-01", "1899-01-01", "abcd", "1994-17-05"]) assert.throws(() => validateCustomer({ ...customer, birthDate: date }, "2026-10-04"));
assert.equal(validateCustomer({ ...customer, birthDate: "2000-02-29" }, "2026-10-04").birthDate, "2000-02-29");
assert.throws(() => validateCustomer({ ...customer, name: "Marina" }, "2026-10-04"));
assert.throws(() => validateCustomer({ ...customer, email: "not-email" }, "2026-10-04"));
assert.deepEqual(nameFrequencies("Marina Costa"), [4, 1, 1, 1, 1, 1, 0, 0, 2]);
assert.deepEqual(nameFrequencies("Ána Sá"), nameFrequencies("Ana Sa"));
assert.deepEqual(challengeNumbers("1994-05-17"), [3, 3, 0, 0]);
assert.deepEqual(pinnacleNumbers("1994-05-17"), [4, 4, 8, 1]);
assert.deepEqual(pinnacleNumbers("1990-11-22"), [33, 5, 11, 3]);
const purchase = { product: "map", bumps: ids, referenceDate: "2026-10-04" };
const modules = buildProductModules("Marina Costa", "1994-05-17", purchase, "2027-01-01");
assert.equal(modules[0].entries.length, 12);
assert.deepEqual(modules[0].entries.slice(0, 4).map(e => e.number), ["6", "7", "8", "7"]);
assert.equal(modules[0].entries[0].title, "outubro de 2026", "calendar stays anchored to purchase month");
assert.equal(modules[0].entries[11].title, "setembro de 2027");
assert.equal(modules[0].entries.filter(e => e.current).length, 1);
assert.deepEqual(modules[1].entries.map(e => e.number), ["1", "7", "8"]);
const tied = buildProductModules("Abc", "1994-05-17", { ...purchase, bumps: ["name"] });
assert.equal(tied[0].entries.filter(e => e.title.startsWith("Força")).length, 3);
const complete = buildProductModules("Abcdefghi", "1994-05-17", { ...purchase, bumps: ["name"] });
assert.ok(complete[0].entries.some(e => e.title === "Todos os valores presentes"));
const atlas = { product: "atlas", bumps: [], referenceDate: "2026-10-04" };
for (const [date, index] of [["2022-05-16", 0], ["2022-05-17", 1], ["2031-05-16", 1], ["2031-05-17", 2], ["2040-05-17", 3]]) {
  const chapters = buildProductModules("Marina Costa", "1994-05-17", atlas, date)[0].entries;
  assert.equal(chapters.findIndex(e => e.current), index, `pinnacle boundary on ${date}`);
  assert.equal(chapters.filter(e => e.current).length, 1);
}
assert.deepEqual(readPurchase(null, "2026-10-04"), { product: "map", bumps: [], referenceDate: "2026-10-04" });
for (const module of [...modules, ...buildProductModules("Marina Costa", "1994-05-17", atlas)]) {
  for (const entry of module.entries) {
    assert.ok(entry.paragraphs.join(" ").length > 200, `${module.id}: substantive content`);
    assert.ok(entry.calculation && entry.practice);
    assert.ok(!entry.paragraphs.join(" ").includes("{name}"));
  }
}
console.log("PASS: all eight cart combinations, authoritative prices, invalid products, customer/date validation, purchased-only modules, frequencies/ties/accents, zero challenges, master pinnacles, birthday boundaries, 12-month rollover, legacy maps.");
