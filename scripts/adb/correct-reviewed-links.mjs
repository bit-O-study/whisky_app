// One-time corrections backed by real app product/search/share verification.
import fs from 'node:fs';
import path from 'node:path';
import {database} from './database.mjs';
const apply=process.argv.includes('--apply');
const db=database();
const before={links:await db.all('liquor_url'),prices:await db.all('liquor_price')};
const plans=[
 {id:40,liquor_id:865,source:'EMART',old:'https://emart.kr/1aTBr',url:'https://eapp.emart.com/webapp/wine/view/5000267190525?storeType=E',reason:'Actual Blonde share URL; previous URL opens Black Ruby'},
 {id:41,liquor_id:865,source:'EMART_TRADERS',old:'https://emart.kr/1aUGR',remove:true,reason:'Previous link opens Black Ruby; actual Blonde code reports not currently sold by Traders'},
 {id:26,liquor_id:877,source:'EMART_TRADERS',old:'https://emart.kr/1aUNE',remove:true,reason:'Stored link redirects to Emart; actual code 5000387905634 is not currently sold in either channel; app search bell returned no product'},
 {id:148,liquor_id:949,source:'EMART_TRADERS',old:'https://emart.kr/1aWqt',newSource:'EMART',url:'https://eapp.emart.com/webapp/wine/view/0080480301033?storeType=E',reason:'Actual 375ml product is Emart 22800 KRW; source was wrongly labelled Traders'},
];
const report={started_at:new Date().toISOString(),apply,before,changes:[]};
const root=path.resolve('artifacts/adb/corrections-20261027');fs.mkdirSync(root,{recursive:true});
const file=path.join(root,'link-correction-'+Date.now()+'.json');
const save=()=>fs.writeFileSync(file,JSON.stringify(report,null,2));save();
console.log(JSON.stringify(plans.map(p=>({...p,current_link:before.links.find(l=>l.id===p.id),current_prices:before.prices.filter(r=>r.liquor_id===p.liquor_id&&['EMART','EMART_TRADERS'].includes(r.source))})),null,2));
if(!apply)process.exit(0);
for(const plan of plans){
 const row=before.links.find(r=>r.id===plan.id);
 if(!row&&plan.remove)continue;
 if(row?.product_url===plan.url&&row.source===(plan.newSource||plan.source))continue;
 if(!row||row.liquor_id!==plan.liquor_id||row.source!==plan.source||row.product_url!==plan.old)throw Error('Link changed since review: '+plan.id);
 const linkFilter=`liquor_url?id=eq.${row.id}&liquor_id=eq.${row.liquor_id}&source=eq.${row.source}&product_url=eq.${encodeURIComponent(row.product_url)}`;
 if(plan.remove||plan.newSource){
  const prices=before.prices.filter(p=>p.liquor_id===plan.liquor_id&&p.source===plan.source);
  if(prices.length>1)throw Error('Duplicate source prices');
  for(const p of prices){
   const filter=`liquor_price?id=eq.${p.id}&source=eq.${p.source}&current_price=eq.${p.current_price}&crawled_at=eq.${encodeURIComponent(p.crawled_at)}`;
   const target=before.prices.filter(q=>q.liquor_id===plan.liquor_id&&q.source===plan.newSource);
   const moved=plan.newSource&&!target.length;
   const changed=await db.request(filter,moved?'PATCH':'DELETE',moved?{source:plan.newSource}:undefined);
   if(changed.length!==1)throw Error('Concurrent price change');
   report.changes.push({table:'liquor_price',id:p.id,operation:moved?'correct_source':'retire_wrong_source',reason:plan.reason});save();
  }
 }
 let changed;
 if(plan.remove)changed=await db.request(linkFilter,'DELETE');
 else {
  const duplicates=before.links.filter(l=>l.id!==row.id&&l.liquor_id===row.liquor_id&&l.source===(plan.newSource||row.source));
  if(duplicates.length)throw Error('Target link already exists; review duplicate before changing');
  changed=await db.request(linkFilter,'PATCH',{product_url:plan.url,...(plan.newSource?{source:plan.newSource}:{})});
 }
 if(changed.length!==1)throw Error('Concurrent link change');
 report.changes.push({table:'liquor_url',id:row.id,operation:plan.remove?'retire_wrong_link':'correct_link',reason:plan.reason});save();
}
report.after={links:(await db.all('liquor_url')).filter(r=>plans.some(p=>p.liquor_id===r.liquor_id)),prices:(await db.all('liquor_price')).filter(r=>plans.some(p=>p.liquor_id===r.liquor_id))};
report.finished_at=new Date().toISOString();save();console.log(JSON.stringify({changes:report.changes,after:report.after,receipt:file}));
