import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkHttp, lotteonCode, parseProductIds, retryTransient, sendObservations, INGEST_URL, OIDC_AUDIENCE, CATALOG_URL } from '../dist/core/daily-lotteon.js';

test('transient timeout and HTTP 502 recover within three attempts', async () => {
  let attempts = 0;
  const waits = [];
  const result = await retryTransient('search', async () => {
    if (++attempts === 1) throw new DOMException('deadline', 'TimeoutError');
    if (attempts === 2) checkHttp(new Response('', { status: 502 }), 'Catalog');
    return 'ok';
  }, async ms => { waits.push(ms); });
  assert.equal(result, 'ok');
  assert.deepEqual(waits, [2000, 8000]);
});

test('permanent validation errors stop immediately; persistent fetch errors exhaust retries', async () => {
  let attempts = 0;
  await assert.rejects(retryTransient('save', async () => {
    attempts++;
    checkHttp(new Response('', { status: 400 }), 'Price save', true);
  }, async () => {}), /400/);
  assert.equal(attempts, 1);
  attempts = 0;
  await assert.rejects(retryTransient('save', async () => {
    attempts++;
    throw new TypeError('fetch failed');
  }, async () => {}), /fetch failed/);
  assert.equal(attempts, 3);
});
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
    const posts = [];
    let tokens = 0;
    const observations = [{ liquorId: 1, observedAt: '2026-11-09T04:00:00.000Z' }];
    assert.equal(await retryTransient('save', () => sendObservations(observations, async (url, options) => {
      if (String(url) !== INGEST_URL) return Response.json({ value: `signed-${++tokens}` });
      posts.push(options);
      return posts.length === 1 ? new Response('', { status: 401 }) : Response.json({ updated: 1 });
    }), async () => {}), 1);
    assert.deepEqual(posts.map(post => post.headers.Authorization), ['Bearer signed-1', 'Bearer signed-2']);
    assert.equal(posts[0].body, posts[1].body);
  } finally {
    delete process.env.ACTIONS_ID_TOKEN_REQUEST_URL;
    delete process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN;
  }
});
