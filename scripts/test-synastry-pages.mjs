// Requires a running local development server; reads pages without creating payments.
import assert from "node:assert/strict";
const origin = process.env.TEST_ORIGIN || "http://localhost:3000";
for (const [path, count] of [["/", 3], ["/sinastria", 4]]) {
  const response = await fetch(`${origin}${path}`);
  assert.equal(response.status, 200);
  const html = await response.text();
  const inputs = html.match(/<input\b[^>]*>/g) || [];
  const bumps = inputs.filter(tag => tag.includes('type="checkbox"'));
  assert.equal(bumps.length, count);
  assert.equal(bumps.filter(tag => tag.includes(' checked=')).length, path === "/sinastria" ? 1 : 0);
  for (const field of ["customer-name", "customer-email", "customer-birth"]) assert.ok(inputs.some(tag => tag.includes(`id="${field}"`)));
  if (path === "/sinastria") {
    assert.ok(bumps[0].includes('name="bump-synastry"') && bumps[0].includes(' checked='), "synastry is first and selected");
    for (const id of ["crush-name", "crush-birth"]) assert.ok(inputs.some(tag => tag.includes(`id="${id}"`) && tag.includes("required")));
    assert.ok(html.includes("Minha primeira sinastria"));
    assert.ok(html.includes("29,80"));
    assert.ok(html.includes("14,90"));
  }
  console.log(`PASS HTTP ${path}: checkout rendered, ${count} optional bumps, customer fields.`);
}
const preview = await fetch(`${origin}/mapa/demo`);
assert.equal(preview.status, 200);
const html = await preview.text();
assert.ok(html.includes('id="relacionamentos"'));
assert.ok(html.includes("Rafael"));
assert.ok(html.includes("Necessidades afetivas"));
assert.ok(html.includes("Como vocês se expressam"));
assert.ok(html.includes("Ver como calculamos"));
const locked = await fetch(`${origin}/api/maps/00000000-0000-4000-8000-000000000010/relationships`);
assert.equal(locked.status, 401);
assert.equal(locked.headers.get("cache-control"), "private, no-store");
console.log("PASS HTTP product: example report, calculations and private API protection.");
