import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { activeScreen, extractProducts, visible, parseNodes } from './winegrab-parser.mjs';

const options = {};
for (let i = 2; i < process.argv.length; i++) {
  const key = process.argv[i];
  if (!['--adb', '--serial', '--sources', '--max-pages', '--out', '--resume', '--sort', '--review-name', '--help'].includes(key))
    throw new Error(`알 수 없는 옵션: ${key}`);
  options[key.slice(2)] = ['--resume', '--help'].includes(key) ? true : process.argv[++i];
}
if (options.help) {
  console.log('node scripts/adb/collect.mjs [--adb PATH] [--serial SERIAL] [--sources EMART,TRADERS] [--max-pages 200] [--out DIRECTORY] [--resume] [--sort newest|sales] [--review-name NAME]');
  process.exit(0);
}
const sources = (options.sources ?? 'EMART,TRADERS').split(',');
if (!sources.length || sources.some(s => !['EMART', 'TRADERS'].includes(s))) throw new Error('지원 판매처: EMART,TRADERS');
if (options.sort && !['newest', 'sales'].includes(options.sort)) throw new Error('sort: newest 또는 sales');
const maxPages = Number(options['max-pages'] ?? 200);
if (!Number.isInteger(maxPages) || maxPages < 1 || maxPages > 2000) throw new Error('max-pages: 1~2000');
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const out = path.resolve(options.out ?? path.join(repo, 'artifacts/adb', new Date().toISOString().replace(/[:.]/g, '-')));
fs.mkdirSync(out, { recursive: true });
if (!options.resume && fs.existsSync(path.join(out, 'checkpoint.json'))) throw new Error('기존 출력: --resume 또는 새 --out을 사용하세요.');
const candidates = [options.adb, process.env.ADB_PATH,
  process.env.ANDROID_HOME && path.join(process.env.ANDROID_HOME, 'platform-tools/adb.exe'),
  path.join(os.homedir(), 'android-sdk/platform-tools/adb.exe'),
  path.join(os.homedir(), 'AppData/Local/Android/Sdk/platform-tools/adb.exe')].filter(Boolean);
const adb = candidates.find(p => fs.existsSync(p)) ?? 'adb';
const exec = args => execFileSync(adb, args, { timeout: 25000, maxBuffer: 24 * 1024 * 1024, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
const devices = exec(['devices']).split(/\r?\n/).map(s => s.match(/^(\S+)\s+device$/)?.[1]).filter(Boolean);
const serial = options.serial ?? (devices.length === 1 ? devices[0] : null);
if (!serial || !devices.includes(serial)) throw new Error('USB 디버깅 승인된 기기 1대를 연결하거나 --serial을 지정하세요.');
const run = args => exec(['-s', serial, ...args]);
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const lockPath = path.join(os.tmpdir(), `winegrab-${createHash('sha256').update(serial).digest('hex').slice(0, 16)}.lock`);
let lock;
try { lock = fs.openSync(lockPath, 'wx'); }
catch { throw new Error(`이 기기의 수집이 실행 중이거나 이전 잠금이 남았습니다: ${lockPath}`); }
fs.writeFileSync(lock, String(process.pid));
const release = () => { if (lock !== undefined) { fs.closeSync(lock); fs.unlinkSync(lockPath); lock = undefined; } };
process.on('exit', release);
let stopping = false;
process.on('SIGINT', () => { stopping = true; console.log('현재 화면 저장 후 중단합니다.'); });
process.on('SIGTERM', () => { stopping = true; });
const checkpoint = path.join(out, 'checkpoint.json');
const state = options.resume && fs.existsSync(checkpoint)
  ? JSON.parse(fs.readFileSync(checkpoint, 'utf8'))
  : { schema_version: 1, started_at: new Date().toISOString(), products: {}, runs: [] };
if (state.schema_version !== 1 || !state.products || !Array.isArray(state.runs)) throw new Error('호환되지 않는 체크포인트');
function save() {
  state.updated_at = new Date().toISOString();
  fs.writeFileSync(`${checkpoint}.tmp`, JSON.stringify(state, null, 2));
  fs.renameSync(`${checkpoint}.tmp`, checkpoint);
  fs.writeFileSync(path.join(out, 'products.json'), JSON.stringify(Object.values(state.products), null, 2));
}
async function capture() {
  let error;
  for (let attempt = 0; attempt < 3; attempt++) {
    const remote = `/sdcard/winegrab-${process.pid}-${Date.now()}.xml`;
    try {
      run(['shell', 'input', 'keyevent', '224']);
      const activity = run(['shell', 'dumpsys', 'activity', 'activities']);
      if (!activity.split(/\r?\n/).some(line => /(?:ResumedActivity|topResumedActivity)/.test(line) && line.includes('com.emart.today/')))
        throw new Error('이마트 앱이 전면에 없습니다. 앱을 열고 다시 실행하세요.');
      const result = run(['shell', 'uiautomator', 'dump', remote]);
      if (!result.includes('dumped')) throw new Error('UI dump 실패');
      const xml = run(['shell', 'cat', remote]);
      parseNodes(xml);
      return xml;
    } catch (e) { error = e; await sleep(500 * (attempt + 1)); }
    finally { try { run(['shell', 'rm', '-f', remote]); } catch { /* disconnected */ } }
  }
  throw error;
}
async function tap(node) {
  if (!node || !visible(node)) throw new Error('필요한 메뉴를 찾지 못했습니다. 와인그랩 홈 또는 위스키 목록을 열어주세요.');
  const [x1, y1, x2, y2] = node.box;
  run(['shell', 'input', 'tap', String(Math.round((x1 + x2) / 2)), String(Math.round((y1 + y2) / 2))]);
  await sleep(650);
}
async function openSource(source) {
  let xml = await capture();
  let { nodes, root } = activeScreen(xml);
  const top = nodes.find(n => n['content-desc'] === 'TOP' && visible(n));
  if (top) {
    await tap(top);
    xml = await capture();
    ({ nodes, root } = activeScreen(xml));
  }
  if (nodes.some(n => n.text === '카테고리')) {
    await tap(nodes.find(n => n['content-desc'] === '홈' && visible(n) && n.box[1] > root.box[3] * .7));
    xml = await capture();
    nodes = activeScreen(xml).nodes;
  }
  await tap(nodes.find(n => n['content-desc'] === '위스키' && visible(n)));
  xml = await capture();
  nodes = activeScreen(xml).nodes;
  const label = source === 'EMART' ? '이마트' : '트레이더스';
  await tap(nodes.find(n => n.text === label && n.class === 'android.widget.ToggleButton' && visible(n)));
  xml = await capture();
  if (options.sort === 'sales') {
    nodes = activeScreen(xml).nodes;
    const sort = nodes.find(n => ['신상품순', '판매량순', '낮은가격순', '높은가격순'].includes(n.text) && visible(n));
    if (sort?.text !== '판매량순') {
      await tap(sort);
      const menu = parseNodes(await capture());
      await tap(menu.find(n => n.text === '판매량순' && n.clickable === 'true' && visible(n)));
      xml = await capture();
    }
  }
  return xml;
}

try {
  console.log(`수집 시작 | ${sources.join(', ')} | 판매처당 최대 ${maxPages}화면 | ${out}`);
  for (const source of sources) {
    if (stopping) break;
    const report = { source, started_at: new Date().toISOString(), pages: 0, added: 0, status: 'running' };
    state.runs.push(report);
    save();
    try {
      let xml = await openSource(source);
      let lastSignature = '';
      let repeated = 0;
      for (let page = 0; page < maxPages && !stopping; page++) {
        const products = extractProducts(xml);
        if (!products.length) throw new Error('읽을 수 있는 상품이 없습니다. 인증/로딩/필터/앱 화면 변경을 확인하세요.');
        if (products.some(p => p.source !== source)) throw new Error('판매처 필터와 상품 배지가 다릅니다. 저장하지 않고 중단합니다.');
        const signature = products.map(p => `${p.key}:${p.displayed_price}`).join('|');
        repeated = signature === lastSignature ? repeated + 1 : 0;
        lastSignature = signature;
        for (const product of products) {
          if (!state.products[product.key]) report.added++;
          state.products[product.key] = product;
        }
        report.pages++;
        save();
        console.log(`${source} | 화면 ${report.pages} | 신규 ${report.added} | 누적 ${Object.keys(state.products).length}`);
        const review = products.find(p => p.name === options['review-name']);
        if (review) {
          const shot = () => execFileSync(adb, ['-s', serial, 'exec-out', 'screencap', '-p'], {timeout:25000,maxBuffer:24*1024*1024});
          fs.writeFileSync(path.join(out, 'review-list.png'), shot());
          fs.writeFileSync(path.join(out, 'review-observation.json'), JSON.stringify(review,null,2));
          const productNode = activeScreen(xml).nodes.find(n => n['content-desc'] === review.raw_text && visible(n));
          await tap(productNode);
          const detail = await capture();
          fs.writeFileSync(path.join(out, 'review-detail.xml'), detail);
          fs.writeFileSync(path.join(out, 'review-detail.png'), shot());
          report.status = 'detail_review';
          stopping = true;
          break;
        }
        if (repeated >= 3) { report.status = 'stalled_or_end'; break; }
        if (page + 1 >= maxPages) { report.status = 'page_limit'; break; }
        const { root } = activeScreen(xml);
        const [x1, y1, x2, y2] = root.box;
        const x = Math.round(x1 + (x2 - x1) * .55);
        // Overlap enough to re-read rows clipped by the sticky header/footer.
        run(['shell', 'input', 'swipe', String(x), String(Math.round(y1 + (y2 - y1) * .78)),
          String(x), String(Math.round(y1 + (y2 - y1) * .55)), '350']);
        await sleep(500);
        xml = await capture();
      }
      if (stopping && report.status !== 'detail_review') report.status = 'interrupted';
    } catch (error) { report.status = 'failed'; report.error = error.message; throw error; }
    finally { report.finished_at = new Date().toISOString(); save(); }
  }
  console.log(`저장 완료: ${Object.keys(state.products).length}개 → ${path.join(out, 'products.json')}`);
  if (stopping && state.runs.at(-1)?.status !== 'detail_review') process.exitCode = 130;
} catch (error) {
  console.error(`수집 중단: ${error.message}\n이미 수집한 결과는 저장됨. 같은 --out에 --resume으로 재실행하세요.`);
  process.exitCode = 1;
} finally { release(); }
