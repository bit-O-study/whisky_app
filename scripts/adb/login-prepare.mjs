import fs from 'node:fs';
import path from 'node:path';
import { randomUUID, generateKeyPairSync } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { device } from './device.mjs';
import { parseNodes, visible } from './winegrab-parser.mjs';
import { captureEncryptedScreen } from './screen-evidence.mjs';

const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
export async function prepareLogin(root) {
  const { run } = device();
  const capture = () => {
    const remote = `/sdcard/whisky-login-${process.pid}.xml`;
    try { run(['shell', 'uiautomator', 'dump', remote]); return run(['shell', 'cat', remote]); }
    finally { run(['shell', 'rm', '-f', remote]); }
  };
  const tap = node => {
    const [x1, y1, x2, y2] = node.box;
    run(['shell', 'input', 'tap', String(Math.round((x1 + x2) / 2)), String(Math.round((y1 + y2) / 2))]);
  };
  run(['shell', 'input', 'keyevent', '224']);
  let nodes = parseNodes(capture()).filter(n => visible(n));
  const appLogin = nodes.find(n => n.text === '로그인하기' && n.clickable === 'true');
  if (appLogin) { tap(appLogin); await pause(1800); nodes = parseNodes(capture()).filter(n => visible(n)); }
  const naver = nodes.find(n => ['네이버', '네이버 로그인', '네이버로 로그인', '네이버로 시작하기'].includes(n.text || n['content-desc'] || ''));
  if (naver) { tap(naver); await pause(2200); nodes = parseNodes(capture()).filter(n => visible(n)); }
  await captureEncryptedScreen(path.join(root, 'evidence.enc.json'), true);
  const ids = nodes.filter(n => n.class === 'android.widget.EditText').map(n => ({ id: n['resource-id'] || '', password: n.password === 'true' }));
  console.log(JSON.stringify({ stage: 'naver_login_screen_prepared', input_fields: ids }));
  // Require the Naver page's stable field IDs before creating an input capability.
  if (!nodes.some(n => n['resource-id'] === 'id' && n.class === 'android.widget.EditText') || !nodes.some(n => n['resource-id'] === 'pw' && n.password === 'true')) {
    console.log('Login fields are not ready; inspect encrypted evidence. No credentials requested.');
    return;
  }
  const keyId = randomUUID();
  const directory = path.join(process.env.RUNNER_TEMP, 'whisky-login-' + keyId);
  fs.mkdirSync(directory);
  const owner = execFileSync('whoami', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  execFileSync('icacls', [directory, '/inheritance:r', '/grant:r', `${owner}:(OI)(CI)F`, '*S-1-5-18:(OI)(CI)F', '*S-1-5-32-544:(OI)(CI)F'], { stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
  const keys = generateKeyPairSync('rsa', { modulusLength: 3072 });
  const created = Date.now(), expires = created + 15 * 60000;
  fs.writeFileSync(path.join(directory, 'key.json'), JSON.stringify({ key_id: keyId, created_at: created, expires_at: expires, private_key: keys.privateKey.export({ type: 'pkcs8', format: 'pem' }) }));
  fs.writeFileSync(path.join(root, 'login-public-key.json'), JSON.stringify({ key_id: keyId, expires_at: new Date(expires).toISOString(), public_key: keys.publicKey.export({ type: 'spki', format: 'pem' }), payload_fields: ['key_id', 'username', 'password'] }, null, 2));
  console.log(JSON.stringify({ stage: 'one_time_public_key_ready', key_id: keyId, expires_at: new Date(expires).toISOString() }));
}
