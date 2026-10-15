import test from 'node:test';
import assert from 'node:assert/strict';
import { priceReview } from './apply-link-prices.mjs';
const liquor = { product_name: '테스트 (700ml)', volume_ml: 700 };
const row = { name: '테스트 700ml', volume_ml: 700, status: 'observed', observed_at: new Date().toISOString(),
  source: 'EMART', product_id: '123', resolved_url: 'https://eapp.emart.com/webapp/wine/view/123?storeType=E',
  displayed_price: 10000, conditions: [], detail_text: ['판매가', '10,000', '내일부터 픽업가능'] };
test('matching current available ordinary price passes', () => assert.deepEqual(priceReview(row, liquor, [{ current_price: 9000 }]), []));
test('verified DB link binding tolerates naming variants', () => {
  assert.deepEqual(priceReview({ ...row, name: '더 테스트 700ml' }, liquor, [{ current_price: 9000 }], Date.now(), true), []);
});
test('wrong product, conditional price, wrong retailer and unavailable stock are blocked', () => {
  for (const [patch, reason] of [[{ name: '다른상품 700ml' }, 'identity'], [{ conditions: ['카드할인'] }, 'conditional'],
    [{ source: 'EMART_TRADERS' }, 'source'], [{ detail_text: ['픽업불가'] }, 'unavailable']]) {
    assert.ok(priceReview({ ...row, ...patch }, liquor, [{ current_price: 9000 }]).includes(reason));
  }
});
