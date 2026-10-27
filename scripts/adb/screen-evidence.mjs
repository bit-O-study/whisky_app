import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createPublicKey, publicEncrypt, randomBytes, createCipheriv, constants } from 'node:crypto';
import { device } from './device.mjs';

export function captureEncryptedScreen(file, loginFlow = false) {
  const publicKey = createPublicKey(process.env.EVIDENCE_PUBLIC_KEY || '');
  if (publicKey.asymmetricKeyType !== 'rsa' || publicKey.asymmetricKeyDetails.modulusLength < 2048) throw Error('RSA evidence public key required');
  const { adb, serial, run } = device();
  const activity = run(['shell', 'dumpsys', 'activity', 'activities']);
  const packages = loginFlow ? ['com.emart.today/', 'com.android.chrome/', 'com.nhn.android.search/'] : ['com.emart.today/'];
  if (!activity.split(/\r?\n/).some(line => /(?:ResumedActivity|topResumedActivity)/.test(line) && packages.some(pkg => line.includes(pkg))))
    throw Error('Refusing to capture a different foreground app');
  const remote = `/sdcard/whisky-evidence-${process.pid}.xml`;
  let xml;
  try { run(['shell', 'uiautomator', 'dump', remote]); xml = run(['shell', 'cat', remote]); }
  finally { run(['shell', 'rm', '-f', remote]); }
  const screenshot = execFileSync(adb, ['-s', serial, 'exec-out', 'screencap', '-p'], { timeout: 25000, maxBuffer: 24 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] });
  const version = run(['shell', 'dumpsys', 'package', 'com.emart.today']).match(/versionName=([^\s]+)/)?.[1];
  const payload = Buffer.from(JSON.stringify({ captured_at: new Date().toISOString(), version, xml, screenshot: screenshot.toString('base64') }));
  const key = randomBytes(32), iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(payload), cipher.final()]);
  const wrapped = publicEncrypt({ key: publicKey, padding: constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' }, key);
  fs.writeFileSync(file, JSON.stringify({ version: 1, wrapped_key: wrapped.toString('base64'), iv: iv.toString('base64'), tag: cipher.getAuthTag().toString('base64'), data: encrypted.toString('base64') }));
}
