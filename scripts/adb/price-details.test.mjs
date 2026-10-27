import test from 'node:test';
import assert from 'node:assert/strict';
import { discountPrices, listedPrice, pickupState } from './price-details.mjs';
test('actual Gilbeys price discount is ordinary despite maximum-discount footer',()=>{
 const popup=['상품금액','10,800원','가격할인','- 2,000원','최대할인가','8,800원','신세계포인트 및 카드할인 등 모든 할인 조건'];
 assert.equal(listedPrice(['판매가','8,800','최대할인가'],popup).displayed_price,8800);
 assert.equal(discountPrices(popup).original_price,10800);
});
test('card and member deductions never become the standard selling price',()=>{
 const popup=['상품금액','100,000원','가격할인','- 10,000원','신세계포인트','- 5,000원','카드할인','- 10,000원','최대할인가','75,000원'];
 assert.equal(listedPrice(['판매가','75,000','최대할인가'],popup).displayed_price,90000);
});
test('missing breakdown, mismatched totals, unknown deductions and conditional-only prices fail closed',()=>{
 assert.throws(()=>listedPrice(['판매가','8,800','최대할인가']));
 assert.throws(()=>discountPrices(['상품금액','10,000원','가격할인','- 100원','최대할인가','8,000원']));
 assert.throws(()=>discountPrices(['상품금액','10,000원','특수할인','- 2,000원','최대할인가','8,000원']));
 assert.throws(()=>listedPrice(['판매가','8,000','회원가']));
});
test('stock state is separate from a verified listed selling price',()=>{
 assert.equal(listedPrice(['판매가','53,800','은평점 픽업불가']).displayed_price,53800);
 assert.equal(pickupState(['내일부터 픽업가능','재고 일시품절']), 'unavailable');
 assert.equal(pickupState(['판매종료']), 'discontinued');
});
