const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const captured = { sessions: [], rows: [], notices: [], after: [] };
const mocks = {
  'next/server': { NextResponse: { json: (body, init) => Response.json(body, init) }, after: fn => captured.after.push(fn) },
  '@/lib/stripe': { getStripe: () => ({ checkout: { sessions: { create: async params => {
    captured.sessions.push(params);
    return { id: 'cs_mock_only', url: 'https://example.invalid/checkout', livemode: false, currency: 'usd' };
  } } } }) },
  '@/lib/supabase': { getSupabaseAdmin: () => ({ from: table => ({ insert: async row => {
    assert.equal(table, 'payments'); captured.rows.push(row); return { error: null };
  } }) }) },
  '@/lib/telegram': { sendTelegramCheckoutInitiated: async data => { captured.notices.push(data); } },
};
const cache = {};
function load(relative) {
  if (cache[relative]) return cache[relative];
  const filename = path.join(root, relative);
  const source = fs.readFileSync(filename, 'utf8');
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const module = { exports: {} };
  const allowed = { '@/lib/pricing': 'src/lib/pricing.ts', '@/lib/orderBumps': 'src/lib/orderBumps.ts' };
  const context = vm.createContext({
    exports: module.exports, module,
    require: id => { if (Object.hasOwn(mocks, id)) return mocks[id]; if (allowed[id]) return load(allowed[id]); throw Error(`Blocked import: ${id}`); },
    process: { env: {} }, console: { info() {}, error: console.error },
    fetch: () => { throw Error('Network forbidden'); },
  });
  new vm.Script(js, { filename }).runInContext(context);
  return cache[relative] = module.exports;
}
(async () => {
  const { POST } = load('src/app/api/checkout/route.ts');
  const { ORDER_BUMPS } = load('src/lib/orderBumps.ts');
  const { FULL_READING_PRICE_CENTS } = load('src/lib/pricing.ts');
  assert.equal(FULL_READING_PRICE_CENTS, 900);
  for (const bump of ORDER_BUMPS) assert.equal(bump.priceCents, 299);
  const results = [];
  for (let mask = 0; mask < 8; mask++) {
    for (const values of Object.values(captured)) values.length = 0;
    const selected = ORDER_BUMPS.filter((_, i) => mask & (1 << i));
    const selections = Object.fromEntries(selected.map(b => [b.key, true]));
    const response = await POST(new Request('http://localhost/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Local Test', email: 'test@example.invalid', birthDate: '1990-01-01', orderBumps: selections }) }));
    assert.equal(response.status, 200);
    assert.equal((await response.json()).success, true);
    assert.equal(captured.sessions.length, 1);
    assert.equal(captured.after.length, 1);
    await captured.after[0]();
    const items = captured.sessions[0].line_items;
    const expected = 900 + selected.length * 299;
    const sent = items.reduce((sum, item) => sum + item.price_data.unit_amount * item.quantity, 0);
    assert.equal(items.length, 1 + selected.length);
    assert.equal(items[0].price_data.unit_amount, 900);
    assert.equal(sent, expected);
    assert.equal(captured.rows.length, 1);
    assert.equal(captured.notices.length, 1);
    assert.equal(captured.rows[0].amount_cents, expected);
    assert.equal(captured.notices[0].amountCents, expected);
    results.push({ selected: selected.map(b => b.key).join(', ') || 'none', expectedCents: expected, sentCents: sent, excessCents: sent - expected, lineAmounts: items.map(item => item.price_data.unit_amount), storedCents: captured.rows[0].amount_cents });
  }
  console.log(JSON.stringify({ cases: results, conclusion: 'All 8 checkout combinations charge each add-on exactly once. No external modules, credentials, network, or real payments used.' }, null, 2));
})().catch(error => { console.error(error); process.exitCode = 1; });
