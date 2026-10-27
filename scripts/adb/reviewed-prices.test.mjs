import test from 'node:test';
import assert from 'node:assert/strict';
import {priceReview,verifiedSoldOut} from './apply-link-prices.mjs';
const now=Date.now();
const product={id:123,product_name:'테스트 700ml',volume_ml:700};
const row={status:'observed',name:'테스트 700ml',volume_ml:700,product_id:'123',source:'EMART',resolved_url:'https://eapp.emart.com/webapp/wine/view/123?storeType=E',
 displayed_price:20000,original_price:20000,price_basis:'LISTED_SALE',detail_text:['상품 정보','테스트 700ml','판매가','20,000','픽업불가'],observed_at:new Date(now).toISOString()};
test('verified listed price can update while preserving unavailable stock evidence',()=>assert.deepEqual(priceReview(row,product,[{current_price:20000}],now),[]));
test('unconfirmed large change and missing price row stay blocked',()=>{
 assert.ok(priceReview(row,product,[{current_price:10000}],now).includes('large_change'));
 assert.ok(priceReview(row,product,[],now,false,true).includes('price_row_count'));
});
test('reopened matching price permits confirmed change or creation, never wrong product',()=>{
 const verified={...row,confirmation:{...row,observed_at:new Date(now+1000).toISOString()}};
 assert.deepEqual(priceReview(verified,product,[{current_price:10000}],now),[]);
 assert.deepEqual(priceReview(verified,product,[],now,false,true),[]);
 assert.ok(priceReview({...verified,confirmation:{...verified.confirmation,name:'다른 상품 700ml'}},product,[],now,false,true).includes('price_row_count'));
});
test('sold-out quote retirement requires fresh matching product, source, and no visible sale price',()=>{
 const sold={...row,status:'unpriced',detail_text:['상품 정보','테스트 700ml','온라인 품절','픽업불가']};
 assert.equal(verifiedSoldOut(sold,product,now),true);
 assert.equal(verifiedSoldOut({...sold,detail_text:[...sold.detail_text,'판매가','20,000']},product,now),false);
 assert.equal(verifiedSoldOut({...sold,name:'다른 상품 700ml'},product,now),false);
 assert.equal(verifiedSoldOut({...sold,source:'EMART_TRADERS'},product,now),false);
});
