import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { previewIngest } from '../dist/core/ingest-preview.js';
import { applyIngestWrite } from '../dist/core/ingest-write.js';
import { evaluateSafetyGate } from '../dist/core/safety-gates.js';

const originalFetch = globalThis.fetch;
const envNames = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
const originalEnv = Object.fromEntries(envNames.map(name => [name, process.env[name]]));
let tables, requests, failRpc;
const candidate = () => ({ source: 'LOTTEON', name: '라가불린 16년 (700ML)', brand: '라가불린',
  category: 'Whisky', clazz: '16년', volumeMl: 700, alcoholPercent: 0,
  currentPrice: 149800, originalPrice: 149800, productCode: 'LOTTEON_LM5000281005409',
  productUrl: 'https://www.lotteon.com/p/product/LM5000281005409', imageUrl: '' });

beforeEach(() => {
  process.env.SUPABASE_URL = 'https://audit.invalid';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'audit-only-not-a-real-key';
  requests = []; failRpc = false;
  tables = {
    liquor_info: [{ id: 1, brand: '라가불린', category: 'Whisky', clazz: '16년', volume_ml: 700, alcohol_percent: 43 }],
    liquor: [{ id: 870, brand: '라가불린', volume_ml: 700, class: '16년' }],
    liquor_price: [{ id: 10, liquor_id: 870, source: 'LOTTEON', current_price: 144800, original_price: 144800, crawled_at: '2026-09-03T13:56:24' }],
    liquor_url: [{ id: 20, liquor_id: 870, source: 'LOTTEON', product_url: 'old' }],
    liquor_price_history: [],
  };
  globalThis.fetch = async (input, init) => {
    const url = new URL(input);
    assert.equal(url.host, 'audit.invalid');
    const table = url.pathname.split('/').at(-1);
    const method = init?.method ?? 'GET';
    const payload = init?.body ? JSON.parse(init.body) : null;
    requests.push({ table, method, payload });
    if (url.pathname === '/rest/v1/rpc/ingest_existing_liquor') {
      if (failRpc) return new Response('simulated atomic failure', { status: 503 });
      const { p } = payload;
      Object.assign(tables.liquor_price[0], { current_price: p.currentPrice, original_price: p.originalPrice, crawled_at: p.observedAt });
      tables.liquor_url[0].product_url = p.productUrl;
      tables.liquor_price_history.push({ current_price: p.currentPrice, crawled_at: p.observedAt });
      return Response.json({ observedAt: p.observedAt });
    }
    assert.equal(method, 'GET', 'writes must only use the atomic RPC');
    const rows = (tables[table] ?? []).filter(row => [...url.searchParams].every(([key, value]) =>
      ['select', 'order', 'limit'].includes(key) || String(row[key]) === value.slice(3)));
    return Response.json(rows);
  };
});
afterEach(() => {
  globalThis.fetch = originalFetch;
  for (const name of envNames) {
    if (originalEnv[name] === undefined) delete process.env[name]; else process.env[name] = originalEnv[name];
  }
});
async function prepare(row) {
  const preview = await previewIngest(row);
  const safetyGate = evaluateSafetyGate({ source: row.source, bestScore: 154, ingestPreview: preview });
  return { candidate: row, preview, safetyGate };
}

test('one RPC saves price, URL and history with a shared new observation time', async () => {
  const result = await applyIngestWrite(await prepare(candidate()));
  assert.equal(result.wrote, true);
  assert.equal(tables.liquor_price[0].current_price, 149800);
  assert.notEqual(tables.liquor_price[0].crawled_at, '2026-09-03T13:56:24');
  assert.equal(tables.liquor_price_history[0].crawled_at, tables.liquor_price[0].crawled_at);
  assert.equal(requests.filter(request => request.method !== 'GET').length, 1);
});

test('invalid prices are blocked without reads or writes to the database', async () => {
  for (const price of [0, -1, NaN, Infinity, 1.5, 2147483648]) {
    requests = [];
    const params = await prepare({ ...candidate(), currentPrice: price, originalPrice: price });
    assert.equal(params.safetyGate.autoWriteAllowed, false);
    assert.equal((await applyIngestWrite(params)).blocked, true);
    assert.equal(requests.length, 0);
    assert.equal(tables.liquor_price[0].current_price, 144800);
  }
});

test('failed RPC propagates failure and never falls back to separate writes', async () => {
  const params = await prepare(candidate());
  failRpc = true;
  await assert.rejects(applyIngestWrite(params), /503/);
  assert.equal(tables.liquor_price[0].current_price, 144800);
  assert.equal(tables.liquor_url[0].product_url, 'old');
  assert.equal(tables.liquor_price_history.length, 0);
  assert.equal(requests.filter(request => request.method !== 'GET').length, 1);
});

test('canonical 43 percent replaces a missing or inferred alcohol value', async () => {
  const { preview } = await prepare(candidate());
  assert.equal(preview.matchedLiquorInfo.alcoholPercent, 43);
  assert.equal(preview.normalizedCandidate.alcoholPercent, 43);
});

test('a forged permissive gate cannot override invalid prices', async () => {
  const params = await prepare({ ...candidate(), currentPrice: 0 });
  params.safetyGate.autoWriteAllowed = true;
  assert.equal((await applyIngestWrite(params)).blocked, true);
  assert.equal(requests.length, 0);
});

test('writer uses validated normalized prices rather than original candidate values', async () => {
  const params = await prepare(candidate());
  params.candidate.currentPrice = 0;
  params.candidate.originalPrice = 0;
  await applyIngestWrite(params);
  assert.equal(tables.liquor_price[0].current_price, 149800);
  assert.equal(tables.liquor_price[0].original_price, 149800);
});
