import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lotteonCode, parseProductIds, sendObservations, INGEST_URL, OIDC_AUDIENCE, CATALOG_URL } from '../dist/core/daily-lotteon.js';
test('retry IDs are explicit positive safe integers', () => {
  assert.equal(parseProductIds(''), null);
  assert.deepEqual([...parseProductIds('917,918,917')], [917,918]);
  for (const invalid of ['0', '-1', '917,', '917;echo', '1.5', '9007199254740993']) {
    assert.throws(() => parseProductIds(invalid));
  }
});
test('existing product identity is host and path constrained', () => {
  assert.equal(lotteonCode('https://www.lotteon.com/p/product/LM123?x=1'), 'LM123');
  assert.equal(lotteonCode('https://evil.test/p/product/LM123'), null);
  assert.equal(lotteonCode('http://www.lotteon.com/p/product/LM123'), null);
});
test('requests audience scoped token and sends it only to fixed ingest endpoint', async () => {
  process.env.ACTIONS_ID_TOKEN_REQUEST_URL = 'https://actions.test/token?foo=bar';
  process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN = 'request-token';
  const calls = [];
  const mock = async (url, options) => {
    calls.push({ url: String(url), options });
    return Response.json(calls.length === 1 ? { value: 'signed-token' } : { updated: 1 });
  };
  try {
    assert.equal(await sendObservations([{ liquorId: 1 }], mock), 1);
    assert.equal(new URL(calls[0].url).searchParams.get('audience'), OIDC_AUDIENCE);
    assert.equal(INGEST_URL, 'https://whisky.helthssu.co.kr/api/internal/lotteon-ingest');
    assert.equal(new URL(CATALOG_URL).origin, new URL(INGEST_URL).origin);
    assert.equal(calls[1].url, INGEST_URL);
    assert.equal(calls[1].options.redirect, 'error');
    assert.equal(calls[1].options.headers.Authorization, 'Bearer signed-token');
    await assert.rejects(sendObservations([{}], async () => new Response('', { status: 401 })));
  } finally {
    delete process.env.ACTIONS_ID_TOKEN_REQUEST_URL;
    delete process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN;
  }
});
