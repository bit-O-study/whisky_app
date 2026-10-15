import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { identityName, volumeFromName } from './validate.mjs';

// Product discovery is independent of price publication. Conditional prices
// must not prevent a real product from entering the catalog.
export function registrationPlan(products, liquors) {
  const seen = new Map();
  return products.map(product => {
    let validLink = false;
    try { const url = new URL(product.product_url); validLink = url.protocol === 'https:' && ['emart.kr', 'eapp.emart.com'].includes(url.hostname); } catch { /* needs actual link */ }
    const identity = identityName(product.name) + '|' + product.volume_ml;
    const matches = liquors.filter(row => identityName(row.product_name || '') === identityName(product.name)
      && row.volume_ml === product.volume_ml);
    const valid = validLink && ['EMART', 'TRADERS'].includes(product.source)
      && product.channel === 'WINEGRAB_APP' && product.volume_ml > 0
      && volumeFromName(product.name) === product.volume_ml
      && product.raw_text?.startsWith(product.name);
    const action = !valid || matches.length > 1 ? 'review' : matches.length ? 'existing'
      : seen.has(identity) ? 'batch_duplicate' : 'insert';
    seen.set(identity, true);
    return { key: product.key, name: product.name, identity, action, liquor_id: matches[0]?.id ?? null,
      payload: { normalized_name: identityName(product.name), product_name: product.name,
        volume_ml: product.volume_ml, product_url: product.product_url } };
  });
}

async function main() {
  const args = process.argv.slice(2);
  const apply = args.includes('--apply');
  const input = args.find(x => x !== '--apply');
  if (!input) throw Error('Usage: node scripts/adb/register-products.mjs PRODUCTS_JSON [--apply]');
  const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
  const env = Object.fromEntries(fs.readFileSync(path.join(repo, 'frontend/.env.local'), 'utf8')
    .split(/\r?\n/).map(l => l.match(/^([A-Z_]+)=(.*)$/)).filter(Boolean)
    .map(m => [m[1], m[2].replace(/^['"]|['"]$/g, '')]));
  const base = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
  if (new URL(base).hostname !== 'jeqvxzkvumkiraclauvo.supabase.co') throw Error('Unexpected database');
  const headers = { apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: 'Bearer ' + env.SUPABASE_SERVICE_ROLE_KEY, 'Content-Type': 'application/json' };
  async function request(route, method = 'GET', payload) {
    const response = await fetch(base + '/rest/v1/' + route, { method,
      headers: { ...headers, Prefer: 'return=representation' },
      body: payload ? JSON.stringify(payload) : undefined, signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw Error('Database HTTP ' + response.status);
    return response.json();
  }
  const products = JSON.parse(fs.readFileSync(input, 'utf8'));
  const read = () => request('liquor?select=id,product_name,normalized_name,volume_ml&limit=10000');
  const before = await read();
  const plan = registrationPlan(products, before);
  const dir = path.dirname(path.resolve(input));
  const report = { started_at: new Date().toISOString(), apply, before_count: before.length, plan, inserted: [] };
  const receipt = path.join(dir, 'registration-' + Date.now() + '.json');
  const save = () => fs.writeFileSync(receipt, JSON.stringify(report, null, 2));
  save();
  if (apply) {
    for (const item of plan.filter(p => p.action === 'insert')) {
      // Recheck immediately before insertion, including a previous interrupted run.
      const fresh = await read();
      if (fresh.some(r => identityName(r.product_name || '') + '|' + r.volume_ml === item.identity)) continue;
      const rows = await request('liquor', 'POST', item.payload);
      if (rows.length !== 1) throw Error('Unexpected insert result');
      report.inserted.push({ id: rows[0].id, name: rows[0].product_name, volume_ml: rows[0].volume_ml });
      save();
    }
    const after = await read();
    report.urls = [];
    for (const product of products) {
      const [item] = registrationPlan([product], after);
      if (item.action !== 'existing') continue;
      const source = product.source === 'TRADERS' ? 'EMART_TRADERS' : product.source;
      const existing = await request(`liquor_url?liquor_id=eq.${item.liquor_id}&source=eq.${source}&select=id,product_url`);
      if (!existing.length) {
        const rows = await request('liquor_url', 'POST', { liquor_id: item.liquor_id, source, product_url: product.product_url });
        report.urls.push({ id: rows[0].id, liquor_id: item.liquor_id, source, action: 'inserted' });
      } else report.urls.push({ liquor_id: item.liquor_id, source, action: existing.some(r => r.product_url === product.product_url) ? 'existing' : 'review_conflicting_url' });
      save();
    }
    report.after_count = after.length;
    report.unresolved = registrationPlan(products, after).filter(p => !['existing'].includes(p.action));
    report.verified = report.unresolved.length === 0;
    save();
  }
  console.log(JSON.stringify({ actions: plan.reduce((s, p) => ({ ...s, [p.action]: (s[p.action] || 0) + 1 }), {}),
    inserted: report.inserted.length, urls_inserted: report.urls?.filter(r => r.action === 'inserted').length, verified: report.verified, receipt }));
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
