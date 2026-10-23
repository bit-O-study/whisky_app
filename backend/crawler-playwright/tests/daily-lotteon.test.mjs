import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lotteonCode, sendObservations, INGEST_URL } from '../dist/core/daily-lotteon.js';
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
    assert.equal(new URL(calls[0].url).searchParams.get('audience'), INGEST_URL);
    assert.equal(calls[1].url, INGEST_URL);
    assert.equal(calls[1].options.redirect, 'error');
    assert.equal(calls[1].options.headers.Authorization, 'Bearer signed-token');
    await assert.rejects(sendObservations([{}], async () => new Response('', { status: 401 })));
  } finally {
    delete process.env.ACTIONS_ID_TOKEN_REQUEST_URL;
    delete process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN;
  }
});
