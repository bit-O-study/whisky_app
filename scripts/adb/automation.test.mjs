import test from 'node:test';
import assert from 'node:assert/strict';
import { selectDevice } from './device.mjs';
import { makeQueue } from './automate.mjs';
import { priceReview } from './apply-link-prices.mjs';

test('unauthorized, offline, missing and ambiguous devices fail closed', () => {
  for (const text of ['', 'abc unauthorized', 'abc offline', 'abc device\ndef device']) assert.throws(() => selectDevice(text));
  assert.equal(selectDevice('List of devices attached\nabc device product:a model:b'), 'abc');
  assert.equal(selectDevice('abc device\ndef device', 'def'), 'def');
  assert.throws(() => selectDevice('abc device', 'def'));
});
test('queue only includes registered supported app URLs and deduplicates exact bindings', () => {
  const row = { id: 1, liquor_id: 2, source: 'EMART', product_url: 'https://emart.kr/a' };
  assert.deepEqual(makeQueue([row, { ...row, id: 2 }, { ...row, source: 'LOTTE' }, { ...row, product_url: 'https://ssg.com/a' },
    { ...row, product_url: 'http://emart.kr/a' }]), [row]);
});
test('unattended mode blocks stale-screen names even when stored link exists', () => {
  const row = { status: 'observed', name: '다른상품 700ml', volume_ml: 700, observed_at: new Date().toISOString(),
    displayed_price: 10000, source: 'EMART', product_id: '1', resolved_url: 'https://eapp.emart.com/webapp/wine/view/1?storeType=E',
    detail_text: ['픽업가능'], conditions: [] };
  assert.ok(priceReview(row, { product_name: '테스트 700ml', volume_ml: 700 }, [{ current_price: 10000 }], Date.now(), false).includes('identity'));
});
