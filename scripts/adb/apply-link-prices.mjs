import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { identityName, volumeFromName } from './validate.mjs';
import { database } from './database.mjs';
import { reviewedIdentity } from './reviewed-identities.mjs';
import { listedPrice, pickupState } from './price-details.mjs';

export function verifiedListedPrice(row) {
  try {
    const p=listedPrice(row.detail_text||[],row.discount_text);
    return ['LISTED_SALE','STANDARD_BREAKDOWN'].includes(row.price_basis)&&p.price_basis===row.price_basis
      &&p.displayed_price===row.displayed_price&&p.original_price===row.original_price;
  }catch{return false;}
}
export function confirmedPrice(row) {
  const c=row.confirmation;
  return !!c&&verifiedListedPrice(c)&&c.name===row.name&&c.volume_ml===row.volume_ml&&c.product_id===row.product_id
    &&c.source===row.source&&c.resolved_url===row.resolved_url&&c.displayed_price===row.displayed_price
    &&Date.parse(c.observed_at)>=Date.parse(row.observed_at)&&Date.parse(c.observed_at)-Date.parse(row.observed_at)<600000;
}
export function verifiedSoldOut(row,liquor,now=Date.now()) {
  const text=row.detail_text||[];
  let source=false;
  try{const u=new URL(row.resolved_url);source=u.protocol==='https:'&&u.hostname==='eapp.emart.com'
    &&u.pathname==='/webapp/wine/view/'+row.product_id&&u.searchParams.get('storeType')===(row.source==='EMART'?'E':row.source==='EMART_TRADERS'?'T':null);}catch{}
  return source&&row.status==='unpriced'&&text.includes('온라인 품절')&&!text.includes('판매가')
    &&liquor&&row.volume_ml===liquor.volume_ml&&volumeFromName(row.name||'')===liquor.volume_ml
    &&(identityName(row.name||'')===identityName(liquor.product_name||'')||reviewedIdentity(row,liquor))
    &&now-Date.parse(row.observed_at)>=-60000&&now-Date.parse(row.observed_at)<86400000;
}

export function priceReview(row, liquor, prices, now = Date.now(), verifiedBinding = false, allowInsert = false) {
  const reasons = [];
  if (row.status !== 'observed' || !liquor || (!verifiedBinding && !reviewedIdentity(row,liquor) && identityName(row.name || '') !== identityName(liquor.product_name || ''))
    || row.volume_ml !== liquor.volume_ml || volumeFromName(row.name || '') !== liquor.volume_ml) reasons.push('identity');
  const text = row.detail_text || [];
  const listed=verifiedListedPrice(row);
  if (!listed&&(row.conditions?.length || text.some(t => /최대할인가|카드할인|쿠폰|회원가/.test(t)))) reasons.push('conditional');
  const availability=pickupState(text);
  if (availability==='discontinued'||(!listed&&availability==='unavailable')) reasons.push('unavailable');
  if (availability==='unknown') reasons.push('availability_unknown');
  const age = now - Date.parse(row.observed_at);
  if (!Number.isFinite(age) || age < -60000 || age > 86400000) reasons.push('stale');
  if (!Number.isSafeInteger(row.displayed_price) || row.displayed_price <= 0) reasons.push('price');
  const vendor = row.source === 'EMART' ? 'E' : row.source === 'EMART_TRADERS' ? 'T' : null;
  try {
    const url = new URL(row.resolved_url);
    if (!vendor || url.hostname !== 'eapp.emart.com' || url.searchParams.get('storeType') !== vendor
      || url.pathname !== '/webapp/wine/view/' + row.product_id) reasons.push('source');
  } catch { reasons.push('source'); }
  if (prices.length > 1 || prices.length===0 && !(allowInsert&&listed&&confirmedPrice(row))) reasons.push('price_row_count');
  if (prices[0]?.current_price > 0 && Math.abs(row.displayed_price / prices[0].current_price - 1) > .4 && !confirmedPrice(row)) reasons.push('large_change');
  return reasons;
}

async function main() {
  const file = process.argv[2];
  if (!file) throw Error('Usage: apply-link-prices.mjs OBSERVATIONS_JSON [--apply]');
  const apply = process.argv.includes('--apply');
  const strict = process.argv.includes('--strict-identity');
  const { request, all } = database();
  const before = { liquor: await all('liquor'), liquor_price: await all('liquor_price') };
  const bindings = await all('liquor_url');
  const observations = [...new Map(JSON.parse(fs.readFileSync(file, 'utf8')).map(r => [r.queue_id, r])).values()];
  const report = { apply, started_at: new Date().toISOString(), before, reviewed: [], updated: [], retired: [], unpriced: [] };
  const receipt = path.join(path.dirname(file), 'price-apply-' + Date.now() + '.json');
  const save = () => fs.writeFileSync(receipt, JSON.stringify(report, null, 2));
  save();
  for (const row of observations) {
    const liquor = before.liquor.find(l => l.id === row.liquor_id);
    const prices = before.liquor_price.filter(p => p.liquor_id === row.liquor_id && p.source === row.source);
    const binding = bindings.some(b => b.liquor_id === row.liquor_id && b.source === row.source && b.product_url === row.product_url);
    if(verifiedSoldOut(row,liquor)&&binding&&prices.length<=1) {
      report.reviewed.push({id:row.liquor_id,source:row.source,name:row.name,reasons:[]});
      report.unpriced.push({id:row.liquor_id,source:row.source,name:row.name,reason:'online_sold_out',observed_at:row.observed_at});
      const old=prices[0];
      if(apply&&old) {
        const removed=await request(`liquor_price?id=eq.${old.id}&current_price=eq.${old.current_price}&crawled_at=eq.${encodeURIComponent(old.crawled_at)}`,'DELETE');
        if(removed.length!==1)throw Error('Concurrent sold-out modification');
        report.retired.push({...old,reason:'online_sold_out',observed_at:row.observed_at});save();
        if((await request(`liquor_price?id=eq.${old.id}`)).length)throw Error('Sold-out retirement read-back mismatch');
      }
      continue;
    }
    const reasons = priceReview(row, liquor, prices, Date.now(), strict ? false : binding, true);
    if (!binding) reasons.push('missing_live_link_binding');
    // Confirmed data error: both Blonde links open Black Ruby. Do not publish
    // another product's price under Blonde merely because a URL was stored.
    if (row.liquor_id === 865 && identityName(row.name || '').includes('블랙루비')) reasons.push('confirmed_wrong_product_link');
    report.reviewed.push({ id: row.liquor_id, source: row.source, name: row.name, reasons });
    if (reasons.length || !apply) continue;
    let old = prices[0];
    const observed = Date.parse(row.observed_at);
    const previousTime = old?Date.parse(old.crawled_at?.endsWith('Z') ? old.crawled_at : old.crawled_at + 'Z'):NaN;
    if (previousTime >= observed) continue;
    const values={current_price:row.displayed_price,original_price:verifiedListedPrice(row)?row.original_price:row.displayed_price,crawled_at:row.observed_at};
    let updated;
    if(old) {
      const route = `liquor_price?id=eq.${old.id}&current_price=eq.${old.current_price}&crawled_at=eq.${encodeURIComponent(old.crawled_at)}`;
      updated=await request(route,'PATCH',values);
    }else{
      const existing=await request(`liquor_price?liquor_id=eq.${row.liquor_id}&source=eq.${row.source}`);
      if(existing.length)throw Error('Price row appeared concurrently');
      updated=await request('liquor_price','POST',{liquor_id:row.liquor_id,source:row.source,...values});
    }
    if (updated.length !== 1) throw Error('Concurrent modification: ' + row.liquor_id);
    report.updated.push({ id: updated[0].id, name: row.name, source: row.source, before: old?.current_price??null, after: row.displayed_price,
      inserted:!old,availability:pickupState(textFor(row)),observed_at:row.observed_at });
    save();
    const [verified] = await request('liquor_price?id=eq.' + updated[0].id + '&select=*');
    if (verified.current_price !== values.current_price||verified.original_price!==values.original_price) throw Error('Read-back mismatch');
  }
  report.finished_at = new Date().toISOString(); save();
  console.log(JSON.stringify({ reviewed: report.reviewed.length, eligible: report.reviewed.filter(r => !r.reasons.length).length,
    updated: report.updated.length, amount_changed: report.updated.filter(r => r.before !== r.after).length, receipt }));
}
function textFor(row){return row.detail_text||[];}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
