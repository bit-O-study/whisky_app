import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { database } from './database.mjs';
import { device } from './device.mjs';

export function makeQueue(rows) {
  const seen = new Set();
  return rows.filter(row => {
    if (!['EMART', 'EMART_TRADERS'].includes(row.source)) return false;
    try { const url = new URL(row.product_url); if (url.protocol !== 'https:' || !['emart.kr', 'eapp.emart.com'].includes(url.hostname)) return false; }
    catch { return false; }
    const key = `${row.liquor_id}|${row.source}|${row.product_url}`;
    if (seen.has(key)) return false;
    seen.add(key); return true;
  });
}
async function main() {
  const args = process.argv.slice(2);
  if (args.some(a => !['--apply', '--check'].includes(a))) throw Error('Usage: automate.mjs [--apply] [--check]');
  if (args.includes('--apply') && args.includes('--check')) throw Error('check_cannot_apply');
  const repo = fileURLToPath(new URL('../../', import.meta.url));
  const root = path.join(repo, 'artifacts/adb/automation');
  fs.mkdirSync(root, { recursive: true });
  const lockPath = path.join(root, 'run.lock');
  let lock;
  try { lock = fs.openSync(lockPath, 'wx'); } catch { throw Error('automation_already_running_or_stale_lock'); }
  fs.writeFileSync(lock, JSON.stringify({ pid: process.pid, started_at: new Date().toISOString() }));
  const runDir = path.join(root, new Date().toISOString().replace(/[:.]/g, '-'));
  fs.mkdirSync(runDir);
  const report = { started_at: new Date().toISOString(), apply: args.includes('--apply'), status: 'running', queued: 0, observed: 0, updated: 0 };
  const save = () => {
    fs.writeFileSync(path.join(runDir, 'status.json'), JSON.stringify(report, null, 2));
    fs.writeFileSync(path.join(root, 'latest.json.tmp'), JSON.stringify({ ...report, run_directory: runDir }, null, 2));
    fs.renameSync(path.join(root, 'latest.json.tmp'), path.join(root, 'latest.json'));
  };
  try {
    save();
    const { serial, run } = device();
    report.device = serial;
    if (!run(['shell', 'pm', 'path', 'com.emart.today']).includes('package:')) throw Error('emart_app_not_installed');
    const db = database();
    const [links, liquor] = await Promise.all([db.all('liquor_url'), db.all('liquor')]);
    const queue = makeQueue(links);
    report.queued = queue.length;
    report.unsupported_or_duplicate_links = links.length - queue.length;
    if (!queue.length) throw Error('no_registered_app_links');
    if (args.includes('--check')) { report.status = 'ready_for_collection'; return; }
    fs.writeFileSync(path.join(runDir, 'queue.json'), JSON.stringify(queue));
    fs.writeFileSync(path.join(runDir, 'catalog.json'), JSON.stringify({ liquor }));
    const observations = path.join(runDir, 'observations.json');
    const child = (script, scriptArgs, maxMinutes) => {
      const log = fs.openSync(path.join(runDir, `${script}.log`), 'a');
      try {
        const result = spawnSync(process.execPath, [path.join(repo, `scripts/adb/${script}.mjs`), ...scriptArgs],
          { cwd: repo, env: { ...process.env, ADB_SERIAL: serial }, stdio: ['ignore', log, log], timeout: maxMinutes * 60000, windowsHide: true });
        if (result.error) throw Error(`${script}_timeout_or_spawn_failure`);
        return result.status;
      } finally { fs.closeSync(log); }
    };
    const collectStatus = child('refresh-links', [path.join(runDir, 'queue.json'), path.join(runDir, 'catalog.json'), observations], 90);
    if (![0, 2].includes(collectStatus)) throw Error('collection_failed');
    const rows = JSON.parse(fs.readFileSync(observations, 'utf8'));
    report.observed = rows.filter(r => r.status === 'observed').length;
    report.collection_failures = rows.filter(r => r.status !== 'observed').map(r => ({ queue_id: r.queue_id, reason: r.reason }));
    const applyStatus = child('apply-link-prices', [observations, '--strict-identity', ...(report.apply ? ['--apply'] : [])], 20);
    if (applyStatus !== 0) throw Error('price_apply_failed_see_receipt');
    const receiptFile = fs.readdirSync(runDir).filter(f => /^price-apply-\d+\.json$/.test(f)).sort().at(-1);
    const receipt = JSON.parse(fs.readFileSync(path.join(runDir, receiptFile), 'utf8'));
    report.updated = receipt.updated.length;
    report.eligible = receipt.reviewed.filter(r => !r.reasons.length).length;
    report.review = receipt.reviewed.filter(r => r.reasons.length).map(r => ({ id: r.id, source: r.source, reasons: r.reasons }));
    report.status = collectStatus === 2 || report.review.length ? 'partial' : report.apply ? 'success' : 'validated';
    if (report.status === 'partial') process.exitCode = 2;
  } catch (error) {
    report.status = 'failed'; report.error = error.message;
    process.exitCode = 1;
  } finally {
    report.finished_at = new Date().toISOString(); save();
    fs.closeSync(lock); fs.unlinkSync(lockPath);
    console.log(JSON.stringify(report));
  }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
