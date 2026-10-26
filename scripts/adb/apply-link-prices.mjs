import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { identityName, volumeFromName } from './validate.mjs';
import { database } from './database.mjs';

export function priceReview(row, liquor, prices, now = Date.now(), verifiedBinding = false) {
  const reasons = [];
  if (row.status !== 'observed' || !liquor || (!verifiedBinding && identityName(row.name || '') !== identityName(liquor.product_name || ''))
    || row.volume_ml !== liquor.volume_ml || volumeFromName(row.name || '') !== liquor.volume_ml) reasons.push('identity');
  const text = row.detail_text || [];
  if (row.conditions?.length || text.some(t => /최대할인가|카드할인|쿠폰|회원가/.test(t))) reasons.push('conditional');
  if (text.some(t => /품절|픽업불가|판매종료/.test(t))) reasons.push('unavailable');
  if (!text.some(t => /픽업가능/.test(t))) reasons.push('availability_unknown');
  const age = now - Date.parse(row.observed_at);
  if (!Number.isFinite(age) || age < -60000 || age > 86400000) reasons.push('stale');
  if (!Number.isSafeInteger(row.displayed_price) || row.displayed_price <= 0) reasons.push('price');
  const vendor = row.source === 'EMART' ? 'E' : row.source === 'EMART_TRADERS' ? 'T' : null;
  try {
    const url = new URL(row.resolved_url);
    if (!vendor || url.hostname !== 'eapp.emart.com' || url.searchParams.get('storeType') !== vendor
      || url.pathname !== '/webapp/wine/view/' + row.product_id) reasons.push('source');
  } catch { reasons.push('source'); }
  if (prices.length !== 1) reasons.push('price_row_count');
  if (prices[0]?.current_price > 0 && Math.abs(row.displayed_price / prices[0].current_price - 1) > .4) reasons.push('large_change');
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
  const report = { apply, started_at: new Date().toISOString(), before, reviewed: [], updated: [] };
  const receipt = path.join(path.dirname(file), 'price-apply-' + Date.now() + '.json');
  const save = () => fs.writeFileSync(receipt, JSON.stringify(report, null, 2));
  save();
  for (const row of observations) {
    const liquor = before.liquor.find(l => l.id === row.liquor_id);
    const prices = before.liquor_price.filter(p => p.liquor_id === row.liquor_id && p.source === row.source);
    const binding = bindings.some(b => b.liquor_id === row.liquor_id && b.source === row.source && b.product_url === row.product_url);
    const reasons = priceReview(row, liquor, prices, Date.now(), strict ? false : binding);
    if (!binding) reasons.push('missing_live_link_binding');
    // Confirmed data error: both Blonde links open Black Ruby. Do not publish
    // another product's price under Blonde merely because a URL was stored.
    if (row.liquor_id === 865 && identityName(row.name || '').includes('블랙루비')) reasons.push('confirmed_wrong_product_link');
    report.reviewed.push({ id: row.liquor_id, source: row.source, name: row.name, reasons });
    if (reasons.length || !apply) continue;
    const old = prices[0];
    const observed = Date.parse(row.observed_at);
    const previousTime = Date.parse(old.crawled_at?.endsWith('Z') ? old.crawled_at : old.crawled_at + 'Z');
    if (previousTime >= observed) continue;
    const route = `liquor_price?id=eq.${old.id}&current_price=eq.${old.current_price}&crawled_at=eq.${encodeURIComponent(old.crawled_at)}`;
    const updated = await request(route, 'PATCH', { current_price: row.displayed_price, original_price: row.displayed_price, crawled_at: row.observed_at });
    if (updated.length !== 1) throw Error('Concurrent modification: ' + old.id);
    report.updated.push({ id: old.id, name: row.name, source: row.source, before: old.current_price, after: row.displayed_price, observed_at: row.observed_at });
    save();
    const [verified] = await request('liquor_price?id=eq.' + old.id + '&select=*');
    if (verified.current_price !== row.displayed_price) throw Error('Read-back mismatch');
  }
  report.finished_at = new Date().toISOString(); save();
  console.log(JSON.stringify({ reviewed: report.reviewed.length, eligible: report.reviewed.filter(r => !r.reasons.length).length,
    updated: report.updated.length, amount_changed: report.updated.filter(r => r.before !== r.after).length, receipt }));
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
