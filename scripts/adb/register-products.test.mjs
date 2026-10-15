import test from 'node:test';
import assert from 'node:assert/strict';
import { registrationPlan } from './register-products.mjs';
const p = { key: 'a', name: '테스트 12년 700ml', volume_ml: 700, source: 'EMART',
  channel: 'WINEGRAB_APP', raw_text: '테스트 12년 700ml 판매가 30,000 원', conditions: ['카드할인'], product_url: 'https://emart.kr/test' };
test('conditional prices do not block metadata registration or become published prices', () => {
  const [r] = registrationPlan([p], []);
  assert.equal(r.action, 'insert');
  assert.deepEqual(Object.keys(r.payload).sort(), ['normalized_name', 'product_name', 'product_url', 'volume_ml']);
});
test('same product across retailers registers once; editions remain separate', () => {
  assert.deepEqual(registrationPlan([p, { ...p, source: 'TRADERS' }], []).map(r => r.action), ['insert', 'batch_duplicate']);
  assert.equal(registrationPlan([p], [{ id: 1, product_name: '테스트 12년 (700ML)', volume_ml: 700 }])[0].action, 'existing');
  assert.equal(registrationPlan([p], [{ id: 1, product_name: '테스트 12년 전용잔 700ml', volume_ml: 700 }])[0].action, 'insert');
});
test('invalid volume and ambiguous identity require review', () => {
  assert.equal(registrationPlan([{ ...p, product_url: null }], [])[0].action, 'review');
  assert.equal(registrationPlan([{ ...p, volume_ml: 750 }], [])[0].action, 'review');
  const row = { product_name: p.name, volume_ml: 700 };
  assert.equal(registrationPlan([p], [row, row])[0].action, 'review');
});
