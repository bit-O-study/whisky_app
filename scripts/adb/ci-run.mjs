import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { database } from './database.mjs';
import { captureEncryptedScreen } from './screen-evidence.mjs';
import { prepareLogin } from './login-prepare.mjs';
const mode = process.env.PRICE_MODE;
if (!['inspect', 'collect', 'apply', 'screen', 'login_prepare'].includes(mode)) throw Error('invalid_price_mode');
const root = path.resolve('artifacts/adb/automation');
fs.mkdirSync(root, { recursive: true });
if (mode === 'login_prepare') { await prepareLogin(root); process.exit(0); }
if (mode === 'screen') {
  captureEncryptedScreen(path.join(root, 'evidence.enc.json'));
  console.log('Encrypted screen evidence captured; no screen content is logged.');
  process.exit(0);
}
const result = spawnSync(process.execPath, ['scripts/adb/automate.mjs', ...(mode === 'inspect' ? ['--check'] : mode === 'apply' ? ['--apply'] : [])],
  { stdio: 'inherit', windowsHide: true, timeout: 110 * 60000 });
let summary;
try { summary = JSON.parse(fs.readFileSync(path.join(root, 'latest.json'), 'utf8')); }
catch { summary = { status: 'failed', error: 'missing_execution_summary' }; }
delete summary.device;
delete summary.run_directory;
summary.mode = mode;
summary.child_exit_code = result.status;
try {
  const prices = await database().request('liquor_price?select=id,liquor_id,source,current_price,crawled_at&source=in.(EMART,EMART_TRADERS)&order=crawled_at.desc&limit=500');
  summary.database_readback = prices.map(row => ({ id: row.id, liquor_id: row.liquor_id, source: row.source, price: row.current_price, observed_at: row.crawled_at }));
} catch (error) { summary.database_readback_error = error.message; }
fs.writeFileSync(path.join(root, 'ci-summary.json'), JSON.stringify(summary, null, 2));
console.log('WHISKY_SUMMARY_START');
console.log(JSON.stringify(summary, null, 2));
console.log('WHISKY_SUMMARY_END');
process.exitCode = result.status ?? 1;
