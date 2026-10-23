import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assertLotteonAccessible, LotteonAccessBlocked } from '../dist/sources/lotteon.js';
test('blocked runner response is an explicit error rather than an empty search', () => {
  assert.throws(() => assertLotteonAccessible('<iframe src="/_Incapsula_Resource?incident_id=123">Request unsuccessful. Incapsula incident ID: 123</iframe>'), LotteonAccessBlocked);
  assert.doesNotThrow(() => assertLotteonAccessible('<html><h1>검색 결과가 없습니다</h1></html>'));
  assert.doesNotThrow(() => assertLotteonAccessible('<script src="/_Incapsula_Resource"></script><div>상품 47800원</div>'));
});
