import test from 'node:test';
import assert from 'node:assert/strict';
import { activeScreen, extractProducts } from './winegrab-parser.mjs';
const n = (attrs, children = '') => `<node ${attrs}>${children}</node>`;
const view = body => n('class="android.webkit.WebView" bounds="[0,0][1080,2200]"', body);
const heading = n('text="카테고리" bounds="[200,0][800,170]"');
const badge = n('text="이마트" class="android.widget.TextView" bounds="[510,800][660,860]"');
const row = (raw = '테스트 700ml 판매가 39,800 원', price = '39,800', box = '[444,900][1020,1200]', priceBox = '[444,1000][700,1080]') => n(`content-desc="${raw}" bounds="${box}"`, n(`text="${price}" bounds="${priceBox}"`));
const xml = body => `<hierarchy>${body}</hierarchy>`;
test('visible product: volume and price, no invented store or ID', () => {
 const [p] = extractProducts(xml(view(heading + badge + row())));
 assert.equal(p.volume_ml, 700); assert.equal(p.displayed_price, 39800);
 assert.equal(p.source, 'EMART'); assert.equal(p.store, null); assert.equal(p.product_id, null);
});
test('conditional price is not ordinary price; original and per-unit stay separate', () => {
 const [p] = extractProducts(xml(view(heading + badge + row('라이 750ml 할인율 41 % 정상가 119,800 원 판매가 69,800 원 최대할인가 100ml당 9,307원 카드할인', '69,800'))));
 assert.equal(p.regular_price, 119800); assert.equal(p.displayed_price, 69800);
 assert.equal(p.price_kind, 'CONDITIONAL_DISPLAY'); assert.deepEqual(p.conditions, ['최대할인가','카드할인']);
});
test('background WebView excluded, even with positive bounds', () => {
 assert.deepEqual(extractProducts(xml(view(heading + badge + row()) + view(heading))), []);
});
test('login overlay never falls back to background category', () => {
 assert.throws(() => extractProducts(xml(view(heading + badge + row()) + view(n('text="로그인"')))), /카테고리/);
});
test('zero-height and footer-clipped prices excluded', () => {
 assert.deepEqual(extractProducts(xml(view(heading + badge + row(undefined, undefined, '[444,2196][1020,2196]')))), []);
 const footer = n('content-desc="홈" bounds="[0,1800][1080,2000]"');
 assert.deepEqual(extractProducts(xml(view(heading + badge + row(undefined, undefined, undefined, '[444,1780][700,1840]') + footer))), []);
});
test('no badge means no attribution', () => assert.deepEqual(extractProducts(xml(view(heading + row()))), []));
test('entities decoded and litre normalized; name distinguishes volume', () => {
 const a = extractProducts(xml(view(heading + badge + row('A &amp; B 1L 판매가 39,800 원'))))[0];
 const b = extractProducts(xml(view(heading + badge + row('A &amp; B 700ml 판매가 39,800 원'))))[0];
 assert.equal(a.name, 'A & B 1L'); assert.equal(a.volume_ml, 1000); assert.notEqual(a.key, b.key);
});
test('truncated XML rejected', () => assert.throws(() => activeScreen('<hierarchy>'), /불완전/));

test('scrolled category header can be offscreen while rows remain readable', () => {
 const hiddenHeading = n('text="카테고리" bounds="[0,0][0,0]"');
 assert.equal(extractProducts(xml(view(hiddenHeading + badge + row()))).length, 1);
});
