const assert = require("node:assert/strict");
const { buildWebMap, brazilianDate } = require("../tmp/map-tests/lib/web-map.js");

const map = buildWebMap("Marina Costa", "1994-05-17", "2026-10-03");
assert.equal(map.readings.length, 9);
assert.equal(new Set(map.readings.map(r => r.id)).size, 9);
assert.deepEqual(map.readings.map(r => r.value), [9, 6, 9, 6, 8, 6, 5, 6, 9]);
for (const reading of map.readings) {
  assert.ok(reading.paragraphs.length >= 2, `${reading.id}: detailed interpretation`);
  assert.ok(reading.paragraphs.join(" ").length > 300, `${reading.id}: substantive content`);
  assert.ok(!reading.paragraphs.join(" ").includes("{name}"), `${reading.id}: interpolated name`);
}
assert.equal(brazilianDate(new Date("2027-01-01T01:00:00Z")), "2026-12-31");
const nextYear = buildWebMap("Marina Costa", "17/05/1994", "2027-01-01");
assert.deepEqual(nextYear.readings.slice(0, 6).map(r => r.value), map.readings.slice(0, 6).map(r => r.value));
assert.deepEqual(nextYear.readings.slice(6).map(r => r.value), [6, 7, 8]);
assert.ok(nextYear.readings[6].subtitle.includes("2027"));
const master = buildWebMap("Ana Silva", "1990-11-22", "2026-10-03");
assert.equal(master.readings[4].value, 22);
assert.ok(master.readings.every(r => r.paragraphs.length > 0));
console.log("PASS: nine interpretations, numeric fixtures, master numbers, Brazilian midnight, year/month/day rollover.");
