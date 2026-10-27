import test from 'node:test';
import assert from 'node:assert/strict';
import { detailAccessIssue, recoverExistingSession } from './detail-access.mjs';
test('real app 5.3.0 login gate is reported before missing retailer', () => {
  assert.equal(detailAccessIssue(['상품 정보', '로그인 후 이용할 수 있는 서비스예요.', '로그인하기']), 'emart_login_required');
});
test('product with generic login navigation is not mistaken for a blocked screen', () => {
  assert.equal(detailAccessIssue(['상품 정보', '로그인 혜택', '이마트', '테스트 700ml', '판매가', '19,800', '픽업가능']), null);
});

const gate = [{ text: '로그인 후 이용할 수 있는 서비스예요.' }, { text: '로그인하기', clickable: 'true' }];
test('cached session recovery reopens the requested product before returning nodes', async () => {
  const events = [];
  const screens = [[{ text: '상품 정보' }, { text: '다른 상품' }], [{ text: '상품 정보' }, { text: '요청 상품' }]];
  const result = await recoverExistingSession(gate, {
    tap: async () => events.push('login'), capture: async () => { events.push('capture'); return screens.shift(); },
    reopen: async () => events.push('reopen'),
  });
  assert.deepEqual(events, ['login', 'capture', 'reopen', 'capture']);
  assert.equal(result[1].text, '요청 상품');
});
test('credential, verification, consent and persistent login gates stop without further clicks', async () => {
  for (const screen of [gate, [{ text: '상품 정보' }, { password: 'true' }], [{ text: '상품 정보' }, { text: '동의하기' }], [{ text: '네이버 로그인' }]]) {
    let taps = 0;
    await assert.rejects(recoverExistingSession(gate, { tap: async () => taps++, capture: async () => screen,
      reopen: async () => assert.fail('must not navigate past authentication') }), /emart_login_required/);
    assert.equal(taps, 1);
  }
});
test('ordinary product pages do not trigger session interaction', async () => {
  const nodes = [{ text: '상품 정보' }];
  assert.equal(await recoverExistingSession(nodes, { tap: () => assert.fail(), capture: () => assert.fail(), reopen: () => assert.fail() }), nodes);
});
