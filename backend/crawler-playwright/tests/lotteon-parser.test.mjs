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
