import test from 'node:test';
import assert from 'node:assert/strict';
import { volumeFromName, validateObservation } from './validate.mjs';
const observation={key:'a',source:'EMART',channel:'WINEGRAB_APP',name:'산토리 가쿠빈 700ml',volume_ml:700,displayed_price:39800,price_kind:'DISPLAYED_SALE',conditions:[],observed_at:new Date().toISOString()};
const db=[{id:1,product_name:'산토리 가쿠빈 (700ML)',volume_ml:700}];
test('exact identity permits formatting changes only',()=>assert.equal(validateObservation(observation,db,[]).identity_and_price_checks_passed,true));
test('rye / cask strength / gift sets must not become ordinary SKU',()=>{
 for (const suffix of [' 라이',' CS 배치 2',' (전용잔 기획)']) {
 const p={...observation,name:'산토리 가쿠빈'+suffix+' 700ml'};
 assert.ok(validateObservation(p,db,[]).reasons.includes('no_exact_identity'));
 }
});
test('comma volumes are 1750 not 750',()=>assert.equal(volumeFromName('벤치마크 (1,750ML)'),1750));
test('database name/volume disagreement blocks write',()=>{
 const p={...observation,name:'벤치마크 750ml',volume_ml:750};
 const rows=[{id:1,product_name:'벤치마크 (1,750ML)',volume_ml:750}];
 assert.ok(validateObservation(p,rows,[]).reasons.includes('database_volume_mismatch'));
});
test('conditional prices excluded',()=>assert.ok(validateObservation({...observation,conditions:['카드할인']},db,[]).reasons.includes('conditional_price')));
test('ambiguous, stale and large changes flagged',()=>{
 assert.ok(validateObservation(observation,[...db,...db],[]).reasons.includes('ambiguous_identity'));
 assert.ok(validateObservation({...observation,observed_at:'2020-01-01'},db,[]).reasons.includes('stale_observation'));
 assert.ok(validateObservation(observation,db,[{liquor_id:1,source:'EMART',current_price:10000}]).reasons.includes('large_price_change'));
});
