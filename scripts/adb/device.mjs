import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

export function selectDevice(output, preferred) {
  const devices = output.split(/\r?\n/).map(line => line.match(/^(\S+)\s+device(?:\s|$)/)?.[1]).filter(Boolean);
  if (preferred && devices.includes(preferred)) return preferred;
  if (!preferred && devices.length === 1) return devices[0];
  const states = output.split(/\r?\n/).map(line => line.match(/^(\S+)\s+(unauthorized|offline)(?:\s|$)/)).filter(Boolean);
  const unavailable = preferred ? states.find(row => row[1] === preferred) : states.length === 1 ? states[0] : null;
  if (unavailable) throw Error(unavailable[2] === 'unauthorized' ? 'usb_debugging_authorization_required' : 'device_offline');
  throw Error(preferred ? 'configured_device_not_ready' : devices.length ? 'multiple_devices_select_serial' : 'no_authorized_device');
}
export function device() {
  const candidates = [process.env.ADB_PATH, process.env.ANDROID_HOME && path.join(process.env.ANDROID_HOME, 'platform-tools/adb.exe'),
    path.join(os.homedir(), 'android-sdk/platform-tools/adb.exe'), path.join(os.homedir(), 'AppData/Local/Android/Sdk/platform-tools/adb.exe')].filter(Boolean);
  const adb = candidates.find(p => fs.existsSync(p)) || 'adb';
  const exec = args => execFileSync(adb, args, { encoding: 'utf8', timeout: 25000, maxBuffer: 24 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] });
  const serial = selectDevice(exec(['devices', '-l']), process.env.ADB_SERIAL);
  return { adb, serial, run: args => exec(['-s', serial, ...args]) };
}
