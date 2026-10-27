import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { privateDecrypt, constants } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { device } from './device.mjs';
import { activeScreen, visible } from './winegrab-parser.mjs';
import { validateLoginPayload, fieldCommands, tapCommand } from './login-input.mjs';

const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
export async function submitLogin() {
  const keyId = process.env.LOGIN_KEY_ID || '';
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(keyId)) throw Error('invalid_one_time_key');
  const directory = path.join(process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData/Local'), 'Bit-O/whisky-login', keyId);
  const keyFile = path.join(directory, 'key.json');
  const cleanup = () => { try { fs.unlinkSync(keyFile); } catch {} try { fs.rmdirSync(directory); } catch {} };
  let credentials, stdinScript, clearForm, touched = false;
  try {
    const saved = JSON.parse(fs.readFileSync(keyFile, 'utf8'));
    if (saved.key_id !== keyId || saved.expires_at <= Date.now() || saved.created_at > Date.now() + 60000 || saved.expires_at - saved.created_at > 15 * 60000) throw Error('expired_one_time_key');
    const decrypted = privateDecrypt({ key: saved.private_key, padding: constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' }, Buffer.from(process.env.LOGIN_CIPHERTEXT || '', 'base64'));
    try { credentials = validateLoginPayload(JSON.parse(decrypted.toString('utf8')), keyId); } finally { decrypted.fill(0); }
    delete process.env.LOGIN_CIPHERTEXT;
    const { adb, serial, run } = device();
    const ui = () => {
      // Stream XML into process memory: no credential-bearing XML/screenshot file.
      const xml = run(['exec-out', 'uiautomator', 'dump', '/dev/tty']);
      if (!xml.includes('</hierarchy>')) throw Error('streamed_ui_unavailable');
      return activeScreen(xml).nodes.filter(n => visible(n));
    };
    const activity = run(['shell', 'dumpsys', 'activity', 'activities']);
    const resumed = activity.split(/\r?\n/).filter(line => /(?:ResumedActivity|topResumedActivity)/.test(line));
    const nodes = ui();
    const trustedApp = resumed.some(line => line.includes('com.emart.today/.presentation.activity.main.MainActivity'));
    if (!trustedApp || !nodes.some(n => n.text === '이마트앱 로그인 중')) throw Error('unverified_naver_login_origin');
    const id = nodes.find(n => n['resource-id'] === 'id' && n.class === 'android.widget.EditText');
    const password = nodes.find(n => n['resource-id'] === 'pw' && n.password === 'true');
    const button = nodes.find(n => n['resource-id'] === 'loginBtn_column' && n.text === '로그인' && n.clickable === 'true');
    if (!id || !password || !button) throw Error('naver_login_form_not_ready');
    if (nodes.some(n => /자동입력|보안문자|2단계 인증|인증번호/.test(n.text || ''))) throw Error('additional_verification_required');
    const sendStdin = commands => {
      const input = commands.join('\n') + '\nexit\n';
      const child = spawnSync(adb, ['-s', serial, 'shell', '-T'], { input, encoding: 'utf8', timeout: 90000, windowsHide: true, stdio: ['pipe', 'ignore', 'ignore'] });
      if (child.status !== 0 || child.error) throw Error('secure_input_failed');
    };
    const hideKeyboard = async () => {
      if (/mInputShown=true|isInputViewShown=true/.test(run(['shell', 'dumpsys', 'input_method']))) { run(['shell', 'input', 'keyevent', '4']); await pause(500); }
    };
    clearForm = async () => {
      for (const fieldId of ['id', 'pw']) {
        await hideKeyboard();
        const field = ui().find(n => n['resource-id'] === fieldId && n.class === 'android.widget.EditText');
        if (field) sendStdin(fieldCommands(field, ''));
      }
      await hideKeyboard();
    };
    touched = true;
    sendStdin(fieldCommands(id, credentials.username));
    await hideKeyboard();
    const currentPassword = ui().find(n => n['resource-id'] === 'pw' && n.password === 'true');
    if (!currentPassword) throw Error('naver_login_form_not_ready');
    sendStdin(fieldCommands(currentPassword, credentials.password));
    stdinScript = null; credentials = null;
    await hideKeyboard();
    const currentButton = ui().find(n => n['resource-id'] === 'loginBtn_column' && n.clickable === 'true');
    if (!currentButton) throw Error('naver_login_form_not_ready');
    // Exactly one submission; no retries and no automatic additional-verification steps.
    sendStdin([tapCommand(currentButton)]);
    await pause(3500);
    const after = ui();
    const labels = after.map(n => n.text || n['content-desc'] || '');
    let stage = 'submitted_result_unverified';
    if (labels.some(text => /자동입력|보안문자|2단계|인증번호|본인인증|새로운 기기/.test(text))) stage = 'additional_verification_required';
    else if (after.some(n => n['resource-id'] === 'pw' && n.password === 'true')) stage = 'login_rejected_or_pending';
    else if (labels.some(text => /동의하기|동의하고|제공.*동의/.test(text))) stage = 'oauth_consent_required';
    else if (labels.some(text => /로그인 후 이용/.test(text))) stage = 'emart_login_required';
    else if (run(['shell', 'dumpsys', 'activity', 'activities']).split(/\r?\n/).some(line => /(?:ResumedActivity|topResumedActivity)/.test(line) && line.includes('com.emart.today/') && !line.includes('OAuthLoginActivity'))) stage = 'returned_to_emart';
    // Clear rejected/pending form fields before any later screen diagnostic.
    const remainingId = after.find(n => n['resource-id'] === 'id' && n.class === 'android.widget.EditText');
    const remainingPassword = after.find(n => n['resource-id'] === 'pw' && n.password === 'true');
    if (remainingId || remainingPassword) await clearForm();
    touched = false;
    console.log(JSON.stringify({ stage, submitted_once: true, origin_verified: true, credential_capture: false }));
  } catch (error) {
    if (touched && clearForm) { try { await clearForm(); } catch { console.error('credential_form_cleanup_failed_no_screen_capture_permitted'); } }
    const allowed = ['expired_one_time_key', 'unsupported_login_characters', 'invalid_login_payload', 'streamed_ui_unavailable', 'unverified_naver_login_origin', 'naver_login_form_not_ready', 'additional_verification_required', 'secure_input_failed'];
    console.error(JSON.stringify({ stage: allowed.includes(error.message) ? error.message : 'secure_login_failed', credential_capture: false }));
    process.exitCode = 1;
  } finally { credentials = null; stdinScript = null; cleanup(); }
}
