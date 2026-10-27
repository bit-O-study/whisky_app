import test from 'node:test';
import assert from 'node:assert/strict';
import {coverageIssues} from './automate.mjs';
test('legacy web links and orphan vendor prices are visible coverage failures',()=>{
 const links=[{liquor_id:864,source:'EMART',product_url:'https://emart.ssg.com/item/itemView.ssg?itemId=123'}];
 const prices=[{liquor_id:864,source:'EMART'},{liquor_id:871,source:'EMART_TRADERS'},{liquor_id:1,source:'LOTTEON'}];
 assert.deepEqual(coverageIssues(links,prices),[{liquor_id:864,source:'EMART',reason:'unsupported_registered_link'},{liquor_id:871,source:'EMART_TRADERS',reason:'missing_registered_link'}]);
});
test('verified app link covers vendor even when currently unpriced',()=>{
 assert.deepEqual(coverageIssues([{liquor_id:864,source:'EMART',product_url:'https://eapp.emart.com/webapp/wine/view/5000267198576?storeType=E'}],[]),[]);
});
