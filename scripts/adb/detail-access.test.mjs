import test from 'node:test';
import assert from 'node:assert/strict';
import { detailAccessIssue } from './detail-access.mjs';
test('real app 5.3.0 login gate is reported before missing retailer', () => {
  assert.equal(detailAccessIssue(['상품 정보', '로그인 후 이용할 수 있는 서비스예요.', '로그인하기']), 'emart_login_required');
});
test('product with generic login navigation is not mistaken for a blocked screen', () => {
  assert.equal(detailAccessIssue(['상품 정보', '로그인 혜택', '이마트', '테스트 700ml', '판매가', '19,800', '픽업가능']), null);
});
