import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { activeScreen, visible } from './winegrab-parser.mjs';
import { identityName, volumeFromName } from './validate.mjs';

const [queueFile, catalogFile, outFile] = process.argv.slice(2);
if (!outFile) throw Error('Usage: refresh-links.mjs QUEUE_JSON DB_SNAPSHOT OUTPUT_JSON');
const queue = JSON.parse(fs.readFileSync(queueFile, 'utf8'));
const catalog = JSON.parse(fs.readFileSync(catalogFile, 'utf8')).liquor;
const adb = process.env.ADB_PATH || path.join(os.homedir(), 'android-sdk/platform-tools/adb.exe');
const serial = 'R3CW3046ETL';
const run = args => execFileSync(adb, ['-s', serial, ...args], { encoding: 'utf8', timeout: 25000, maxBuffer: 24 * 1024 * 1024 });
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const lockPath = path.join(os.tmpdir(), `winegrab-${createHash('sha256').update(serial).digest('hex').slice(0, 16)}.lock`);
const lock = fs.openSync(lockPath, 'wx');
fs.writeFileSync(lock, String(process.pid));
process.on('exit', () => { fs.closeSync(lock); fs.unlinkSync(lockPath); });
const output = fs.existsSync(outFile) ? JSON.parse(fs.readFileSync(outFile, 'utf8')) : [];
const save = () => { fs.writeFileSync(outFile + '.tmp', JSON.stringify(output, null, 2)); fs.renameSync(outFile + '.tmp', outFile); };

async function resolveLink(value) {
  let url = new URL(value);
  for (let i = 0; i < 5; i++) {
    if (!['emart.kr', 'eapp.emart.com'].includes(url.hostname)) throw Error('Separate web channel: ' + url.hostname);
    if (url.hostname === 'eapp.emart.com') {
      if (url.pathname === '/app/appLink.do') url = new URL(url.searchParams.get('link'), url.origin);
      if (!/^\/webapp\/wine\/view\/\d+$/.test(url.pathname)) throw Error('Not a product link');
      return url;
    }
    const response = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(15000) });
    const location = response.headers.get('location');
    await response.body?.cancel();
    if (!location) throw Error('Missing short-link destination');
    url = new URL(location, url);
  }
  throw Error('Too many redirects');
}
async function capture() {
  const remote = `/sdcard/winegrab-refresh-${process.pid}.xml`;
  try {
    run(['shell', 'uiautomator', 'dump', remote]);
    return run(['shell', 'cat', remote]);
  } finally { run(['shell', 'rm', '-f', remote]); }
}
for (const item of queue) {
  if (output.some(r => r.queue_id === item.id && r.status === 'observed')) continue;
  const expected = catalog.find(r => r.id === item.liquor_id);
  const result = { queue_id: item.id, liquor_id: item.liquor_id, source: item.source, product_url: item.product_url,
    expected_name: expected?.product_name, status: 'pending' };
  try {
    const url = await resolveLink(item.product_url);
    const storeType = url.searchParams.get('storeType');
    if (storeType !== (item.source === 'EMART' ? 'E' : 'T')) throw Error('Retailer mismatch in URL');
    result.resolved_url = url.href;
    result.product_id = url.pathname.split('/').at(-1);
    const uri = 'emart-today://open_main_webpage/?link=' + url.href;
    if (uri.includes("'")) throw Error('Unsafe link');
    run(['shell', 'input', 'keyevent', '224']);
    run(['shell', 'am', 'start', '-a', 'android.intent.action.VIEW', '-d', "'" + uri + "'", '-p', 'com.emart.today']);
    await sleep(1700);
    const nodes = activeScreen(await capture()).nodes.filter(n => visible(n));
    const texts = nodes.filter(n => n.text).map(n => n.text);
    if (!texts.includes('상품 정보')) throw Error('Product detail not opened');
    const retailer = texts.indexOf(item.source === 'EMART' ? '이마트' : '트레이더스');
    if (retailer < 0) throw Error('Missing retailer badge');
    const name = texts.slice(retailer + 1).find(t => volumeFromName(t));
    const sale = texts.indexOf('판매가');
    const price = sale >= 0 ? Number(texts[sale + 1]?.replaceAll(',', '')) : NaN;
    if (!name || !Number.isSafeInteger(price) || price <= 0) throw Error('Missing product/price');
    result.name = name;
    result.volume_ml = volumeFromName(name);
    result.displayed_price = price;
    result.conditions = texts.filter(t => /최대할인가|카드할인|쿠폰|회원가/.test(t));
    result.identity_matches = !!expected && identityName(name) === identityName(expected.product_name)
      && result.volume_ml === expected.volume_ml;
    result.observed_at = new Date().toISOString();
    result.status = 'observed';
    result.detail_text = texts;
    result.review_required = true;
  } catch (error) { result.status = 'review'; result.reason = error.message; }
  output.push(result);
  save();
  console.log(JSON.stringify({ index: output.length, total: queue.length, name: result.name || result.expected_name,
    status: result.status, price: result.displayed_price, identity: result.identity_matches, reason: result.reason }));
}
