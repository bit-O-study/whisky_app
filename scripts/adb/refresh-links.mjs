import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createHash } from 'node:crypto';
import { device } from './device.mjs';
import { detailAccessIssue, recoverExistingSession } from './detail-access.mjs';
import { activeScreen, visible } from './winegrab-parser.mjs';
import { identityName, volumeFromName } from './validate.mjs';
import { listedPrice, pickupState } from './price-details.mjs';

const [queueFile, catalogFile, outFile] = process.argv.slice(2);
if (!outFile) throw Error('Usage: refresh-links.mjs QUEUE_JSON DB_SNAPSHOT OUTPUT_JSON');
const queue = JSON.parse(fs.readFileSync(queueFile, 'utf8'));
const snapshot = JSON.parse(fs.readFileSync(catalogFile, 'utf8'));
const catalog = snapshot.liquor;
const { serial, run } = device();
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
    if (url.protocol !== 'https:' || url.username || url.password || url.port) throw Error('Unsafe product URL');
    if (url.hostname === 'eapp.emart.com') {
      if (url.pathname === '/app/appLink.do') url = new URL(url.searchParams.get('link'), url.origin);
      if (url.origin !== 'https://eapp.emart.com' || !/^\/webapp\/wine\/view\/\d+$/.test(url.pathname)) throw Error('Not a product link');
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
    const activity = run(['shell', 'dumpsys', 'activity', 'activities']);
    if (!activity.split(/\r?\n/).some(line => /(?:ResumedActivity|topResumedActivity)/.test(line) && line.includes('com.emart.today/')))
      throw Error('emart_not_foreground');
    return run(['exec-out', 'uiautomator', 'dump', '/dev/tty']);
}
const tap = node => {const [a,b,c,d]=node.box;run(['shell','input','tap',String(Math.round((a+c)/2)),String(Math.round((b+d)/2))]);};
async function readProduct(uri, source) {
  const open = async () => {
    run(['shell','input','keyevent','224']);
    run(['shell','am','start','-a','android.intent.action.VIEW','-d',"'"+uri+"'",'-p','com.emart.today']);
    await sleep(2200);
  };
  const screen = async () => activeScreen(await capture()).nodes.filter(n=>visible(n));
  await open();
  let last;
  for(let attempt=0;attempt<3;attempt++) {
    try {
      let nodes=await screen();
      nodes=await recoverExistingSession(nodes,{tap:async n=>{tap(n);await sleep(3500);},capture:screen,reopen:open});
      const texts=nodes.filter(n=>n.text).map(n=>n.text);
      if(detailAccessIssue(texts))throw Error('emart_login_required');
      if(!texts.includes('상품 정보'))throw Error('Product detail not opened');
      const retailer=texts.indexOf(source==='EMART'?'이마트':'트레이더스');
      if(retailer<0)throw Error('Missing retailer badge');
      const name=texts.slice(retailer+1).find(t=>volumeFromName(t));
      if(!name)throw Error('Missing product/price');
      if(texts.includes('온라인 품절')&&!texts.includes('판매가'))return {name,volume_ml:volumeFromName(name),
        availability:'unavailable',detail_text:texts,observed_at:new Date().toISOString(),status:'unpriced',reason:'online_sold_out'};
      let discount_text;
      if(texts.includes('최대할인가')) {
        const button=nodes.find(n=>n.text==='할인내역정보 열기'&&n.clickable==='true');
        if(!button)throw Error('discount_breakdown_missing');
        tap(button);await sleep(700);
        const dialog=await screen();discount_text=dialog.filter(n=>n.text).map(n=>n.text);
        const close=dialog.find(n=>n.text==='닫기'&&n.clickable==='true');
        if(!discount_text.includes('할인내역정보')||!close)throw Error('discount_dialog_unverified');
        tap(close);await sleep(400);
      }
      const pricing=listedPrice(texts,discount_text);
      return {name,volume_ml:volumeFromName(name),...pricing,discount_text,detail_text:texts,
        availability:pickupState(texts),conditions:pricing.deductions?.filter(d=>d.label!=='가격할인')||[],
        observed_at:new Date().toISOString(),status:'observed'};
    }catch(error){last=error;if(error.message==='emart_login_required')throw error;if(attempt<2){await sleep(1000);await open();}}
  }
  throw last;
}
for (const item of queue) {
  if (output.some(r => r.queue_id === item.id && r.status === 'observed')) continue;
  const expected = catalog.find(r => r.id === item.liquor_id);
  const result = { queue_id: item.id, liquor_id: item.liquor_id, source: item.source, product_url: item.product_url,
    expected_name: expected?.product_name, status: 'pending' };
  try {
    if (!['EMART', 'EMART_TRADERS'].includes(item.source)) throw Error('Unsupported retailer');
    const url = await resolveLink(item.product_url);
    const storeType = url.searchParams.get('storeType');
    if (storeType !== (item.source === 'EMART' ? 'E' : 'T')) throw Error('Retailer mismatch in URL');
    result.resolved_url = url.href;
    result.product_id = url.pathname.split('/').at(-1);
    const safeUrl = `https://eapp.emart.com/webapp/wine/view/${result.product_id}?storeType=${storeType}`;
    const uri = 'emart-today://open_main_webpage/?link=' + safeUrl;
    Object.assign(result,await readProduct(uri,item.source));
    result.identity_matches = !!expected && identityName(result.name) === identityName(expected.product_name || '')
      && result.volume_ml === expected.volume_ml;
    const old=snapshot.liquor_price?.find(p=>p.liquor_id===item.liquor_id&&p.source===item.source);
    if(result.status==='observed'&&(!old||old.current_price>0&&Math.abs(result.displayed_price/old.current_price-1)>.4)) {
      result.confirmation={...await readProduct(uri,item.source),product_id:result.product_id,source:item.source,resolved_url:result.resolved_url};
      if(result.confirmation.name!==result.name||result.confirmation.displayed_price!==result.displayed_price)throw Error('reopened_product_or_price_changed');
    }
    result.review_required = true;
  } catch (error) { result.status = 'review'; result.reason = error.message; }
  output.push(result);
  save();
  console.log(JSON.stringify({ index: output.length, total: queue.length, name: result.name || result.expected_name,
    status: result.status, price: result.displayed_price, identity: result.identity_matches, reason: result.reason }));
  if (result.reason === 'emart_login_required') break;
}
if (output.some(row => !['observed','unpriced'].includes(row.status))) process.exitCode = 2;
