import test from 'node:test';
import assert from 'node:assert/strict';
import { readSharedLink } from './share-link.mjs';
const xml = (title, url) => `<hierarchy><node resource-id="android:id/content_preview_title" text="${title}"/><node resource-id="android:id/content_preview_text" text="${url}"/></hierarchy>`;
test('only a matching product preview yields a real retailer URL', () => {
  assert.equal(readSharedLink(xml('제품 700ml', 'https://emart.kr/abc'), '제품 700ml'), 'https://emart.kr/abc');
  assert.throws(() => readSharedLink(xml('다른 제품', 'https://emart.kr/abc'), '제품 700ml'));
  assert.throws(() => readSharedLink(xml('제품 700ml', 'https://example.com/abc'), '제품 700ml'));
  assert.throws(() => readSharedLink(xml('제품 700ml', 'http://emart.kr/abc'), '제품 700ml'));
});
