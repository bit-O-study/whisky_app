import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { identityName, volumeFromName } from './validate.mjs';

// Read-only audit. Full database evidence remains in the ignored artifacts tree.
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const env = Object.fromEntries(fs.readFileSync(path.join(repo, 'frontend/.env.local'), 'utf8').split(/\r?\n/)
  .map(l => l.match(/^([A-Z_]+)=(.*)$/)).filter(Boolean).map(m => [m[1], m[2].replace(/^['"]|['"]$/g, '')]));
const base = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
if (new URL(base).hostname !== 'jeqvxzkvumkiraclauvo.supabase.co') throw Error('Wrong DB');
const db = {};
for (const table of ['liquor', 'liquor_price', 'liquor_url']) {
  db[table] = [];
  for (let offset = 0; ; offset += 1000) {
    const response = await fetch(`${base}/rest/v1/${table}?select=*&order=id&limit=1000&offset=${offset}`, {
      headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: 'Bearer ' + env.SUPABASE_SERVICE_ROLE_KEY },
      signal: AbortSignal.timeout(20000) });
    if (!response.ok) throw Error('DB HTTP ' + response.status);
    const rows = await response.json(); db[table].push(...rows);
    if (rows.length < 1000) break;
  }
}
const report = { checked_at: new Date().toISOString(), counts: Object.fromEntries(Object.entries(db).map(([k,v]) => [k,v.length])),
  encoding_issues: [], suspicious_text: [], missing_names: [], invalid_prices: [], orphan_rows: [], invalid_urls: [],
  volume_mismatches: [], duplicate_prices: [], duplicate_links: [], duplicate_product_identity: [], receipt_mismatches: [], new_products: [] };
const ids = new Set(db.liquor.map(r => r.id));
for (const [table, rows] of Object.entries(db)) {
  for (const row of rows) {
    for (const [field, value] of Object.entries(row)) {
      if (typeof value !== 'string') continue;
      if (/[\uFFFD\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\uD800-\uDFFF]/u.test(value))
        report.encoding_issues.push({ table, id: row.id, field, value });
      if (['product_name', 'normalized_name', 'brand', 'category'].includes(field)
        && (/\?{2,}|Ã.|Â.|ì[\u0080-\u00ff]|媛|吏|쒖|꾩/.test(value))) report.suspicious_text.push({ table, id: row.id, field, value });
    }
    if (table !== 'liquor' && !ids.has(row.liquor_id)) report.orphan_rows.push({ table, id: row.id, liquor_id: row.liquor_id });
    if (row.product_url) {
      try { if (!['http:', 'https:'].includes(new URL(row.product_url).protocol)) throw Error(); }
      catch { report.invalid_urls.push({ table, id: row.id, url: row.product_url }); }
    }
  }
}
for (const row of db.liquor) {
  if (!row.product_name?.trim() || !row.normalized_name?.trim()) report.missing_names.push(row.id);
  const volume = volumeFromName(row.product_name || '');
  if (volume && volume !== row.volume_ml) report.volume_mismatches.push({ id: row.id, name: row.product_name, name_volume: volume, stored_volume: row.volume_ml });
}
for (const row of db.liquor_price) if (!Number.isSafeInteger(row.current_price) || row.current_price <= 0)
  report.invalid_prices.push({ id: row.id, price: row.current_price });
function duplicates(rows, key) {
  const groups = new Map();
  for (const row of rows) { const k = key(row); groups.set(k, [...(groups.get(k) || []), row.id]); }
  return [...groups].filter(([,ids]) => ids.length > 1).map(([key,ids]) => ({ key, ids }));
}
report.duplicate_prices = duplicates(db.liquor_price, r => `${r.liquor_id}|${r.source}`);
report.duplicate_links = duplicates(db.liquor_url, r => `${r.liquor_id}|${r.source}|${r.product_url}`);
report.duplicate_product_identity = duplicates(db.liquor, r => identityName(r.product_name || '') + '|' + r.volume_ml);
const receiptDir = path.join(repo, 'artifacts/adb/full-20261015');
const updates = new Map();
for (const file of fs.readdirSync(receiptDir).filter(n => /^price-apply-\d+\.json$/.test(n)).sort()) {
  for (const row of JSON.parse(fs.readFileSync(path.join(receiptDir,file),'utf8')).updated) updates.set(row.id,row);
}
report.updated_price_rows_checked = updates.size;
for (const [id, expected] of updates) {
  const row = db.liquor_price.find(r => r.id === id);
  if (!row || row.current_price !== expected.after || row.source !== expected.source
    || Date.parse(row.crawled_at.endsWith('Z') ? row.crawled_at : row.crawled_at + 'Z') !== Date.parse(expected.observed_at))
    report.receipt_mismatches.push({ id, expected_price: expected.after });
}
const newDir = path.join(repo, 'artifacts/adb/full-links-20261015');
for (const file of fs.readdirSync(newDir).filter(n => /^registration-\d+\.json$/.test(n))) {
  const receipt = JSON.parse(fs.readFileSync(path.join(newDir,file),'utf8'));
  for (const item of receipt.inserted || []) {
    const row = db.liquor.find(r => r.id === item.id);
    const planned = receipt.plan.find(r => r.name === item.name)?.payload;
    const links = db.liquor_url.filter(r => r.liquor_id === item.id);
    const matches = !!row && !!planned && Object.entries(planned).every(([k,v]) => row[k] === v)
      && links.some(r => r.product_url === planned.product_url);
    report.new_products.push({ id: item.id, name: row?.product_name, matches_receipt: matches, link_count: links.length,
      price_count: db.liquor_price.filter(r => r.liquor_id === item.id).length,
      pending_metadata: ['brand','category','image_url'].filter(k => !row?.[k]) });
    if (!matches) report.receipt_mismatches.push({ id: item.id, table: 'liquor' });
  }
}
fs.mkdirSync(path.join(repo,'artifacts/adb/data-audit-20261015'),{recursive:true});
fs.writeFileSync(path.join(repo,'artifacts/adb/data-audit-20261015/db-snapshot.json'),JSON.stringify(db,null,2));
fs.writeFileSync(path.join(repo,'docs/reports/20261015-data-audit.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
