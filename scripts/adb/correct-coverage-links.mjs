import fs from 'node:fs';
import {database} from './database.mjs';
const db=database(),links=await db.all('liquor_url');
const plans=[{id:16,liquor_id:864,source:'EMART',item:'1000675902523',code:'5000267198576'},
 {id:15,liquor_id:863,source:'EMART',item:'1000727226217',code:'5000267114279'},
 {liquor_id:871,source:'EMART_TRADERS',code:'4901777169043'}];
const report={before:links,started_at:new Date().toISOString(),changes:[],apply:process.argv.includes('--apply')};
const file='artifacts/adb/coverage-corrections-'+Date.now()+'.json';
const save=()=>fs.writeFileSync(file,JSON.stringify(report,null,2));save();
for(const p of plans){
 const product_url=`https://eapp.emart.com/webapp/wine/view/${p.code}?storeType=${p.source==='EMART'?'E':'T'}`;
 const existing=links.filter(l=>l.liquor_id===p.liquor_id&&l.source===p.source);
 if(existing.some(l=>l.product_url===product_url))continue;
 if(p.id){
  const old=existing.find(l=>l.id===p.id);
  if(existing.length!==1||!old||new URL(old.product_url).hostname!=='emart.ssg.com'||new URL(old.product_url).searchParams.get('itemId')!==p.item)throw Error('Unexpected existing link');
  if(report.apply){const r=await db.request(`liquor_url?id=eq.${p.id}&product_url=eq.${encodeURIComponent(old.product_url)}`,'PATCH',{product_url});if(r.length!==1)throw Error('Concurrent link modification');}
 }else{
  if(existing.length)throw Error('Vendor link already exists');
  if(report.apply)await db.request('liquor_url','POST',{liquor_id:p.liquor_id,source:p.source,product_url});
 }
 report.changes.push({liquor_id:p.liquor_id,source:p.source,product_url});save();
}
report.finished_at=new Date().toISOString();save();console.log(JSON.stringify({changes:report.changes,apply:report.apply,receipt:file}));
