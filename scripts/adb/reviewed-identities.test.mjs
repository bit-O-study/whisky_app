import test from 'node:test';
import assert from 'node:assert/strict';
import { reviewedIdentity } from './reviewed-identities.mjs';
test('reviewed alias requires exact catalog id, product code, both names and volume',()=>{
 const row={product_id:'5060716145384',name:'더 글렌드로낙 12년 700ml',volume_ml:700};
 const liquor={id:868,product_name:'글렌드로낙 12년 (700ML)',volume_ml:700};
 assert.equal(reviewedIdentity(row,liquor),true);
 for(const bad of [{...row,product_id:'123'},{...row,name:'더 글렌드로낙 15년 700ml'},{...row,name:'더 글렌드로낙 12년 1L'}])assert.equal(reviewedIdentity(bad,liquor),false);
 assert.equal(reviewedIdentity(row,{...liquor,id:869}),false);
 assert.equal(reviewedIdentity(row,{...liquor,product_name:'글렌드로낙 12년 선물세트 700ml'}),false);
});
