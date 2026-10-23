import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crawlLotteonKeyword } from '../dist/sources/lotteon.js';

function pageFor(cards, html = '') {
  return {
    goto: async () => {}, waitForLoadState: async () => {}, waitForTimeout: async () => {}, content: async () => html,
    locator: selector => ({ count: async () => selector === '.c-product-card' ? cards.length : 0, evaluateAll: async () => cards }),
  };
}
const card = (name, priceText = '47,800원') => ({ name, priceText, imageUrl: '', productUrl: '/p/product/LM123456' });

test('black label implicit twelve years matches Black but not Black Ruby', async () => {
  const page = pageFor([card('조니워커 블랙 루비 (700ML)'), card('조니워커 블랙 (700ML)')]);
  const { result } = await crawlLotteonKeyword(page, '조니워커 블랙 라벨 12년 700ml');
  assert.equal(result.bestMatch.name, '조니워커 블랙 (700ML)');
});

test('zero-price DOM results are discarded and decimal litres are converted correctly', async () => {
  const page = pageFor([card('위스키 1.75L', '0원'), card('위스키 1.75L')]);
  const { result } = await crawlLotteonKeyword(page, '위스키 1.75L');
  assert.equal(result.bestMatch.volumeMl, 1750);
  assert.equal(result.bestMatch.currentPrice, 47800);
  assert.equal(result.bestMatch.alcoholPercent, 0);
});

test('script numeric strings become integer prices without string concatenation', async () => {
  const name = 'C.Y.O.C Private Bottle 벤로막 SC 2014 (700ML)';
  const item = JSON.stringify({ item_name: encodeURIComponent(name), item_id: 'LM5020613097858', price: '199000', discount: '10000' }).replaceAll('"', '&quot;');
  const { result } = await crawlLotteonKeyword(pageFor([], `<div data-item="${item}"></div>`), name);
  assert.equal(result.strategy, 'script');
  assert.equal(result.bestMatch.currentPrice, 199000);
  assert.equal(typeof result.bestMatch.currentPrice, 'number');
  assert.equal(result.bestMatch.originalPrice, 209000);
});

for (const price of ['0', '-1', '1.5', 'not-a-price', '2147483648']) {
  test(`invalid script price ${price} is discarded`, async () => {
    const item = JSON.stringify({ item_name: 'Whisky 700ml', item_id: 'LM123', price, discount: 0 }).replaceAll('"', '&quot;');
    const { result } = await crawlLotteonKeyword(pageFor([], `<div data-item="${item}"></div>`), 'Whisky 700ml');
    assert.equal(result.bestMatch, null);
  });
}
