import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

export function databaseBase(value) {
  let url;
  try { url = new URL(value); } catch { throw Error('wrong_database'); }
  const base = url.origin + url.pathname.replace(/\/+$/, '');
  if (url.username || url.password || url.search || url.hash ||
      !['https://api.helthssu.co.kr/whisky', 'http://127.0.0.1:4200/whisky'].includes(base)) throw Error('wrong_database');
  return base;
}

export function database() {
  const file = process.env.WHISKY_ENV_FILE || fileURLToPath(new URL('../../frontend/.env.local', import.meta.url));
  const env = { ...(fs.existsSync(file) ? Object.fromEntries(fs.readFileSync(file, 'utf8').split(/\r?\n/)
    .map(l => l.match(/^([A-Z_]+)=(.*)$/)).filter(Boolean).map(m => [m[1], m[2].replace(/^['"]|['"]$/g, '')])) : {}), ...process.env };
  const base = databaseBase(env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL);
  const key = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_KEY;
  if (!key) throw Error('missing_database_credentials');
  async function request(route, method = 'GET', payload) {
    const r = await fetch(base + '/rest/v1/' + route, { method, signal: AbortSignal.timeout(20000),
      headers: { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json', Prefer: 'return=representation' },
      body: payload === undefined ? undefined : JSON.stringify(payload) });
    if (!r.ok) throw Error('database_http_' + r.status);
    return r.json();
  }
  async function all(table, select = '*') {
    const rows = [];
    for (let offset = 0; ; offset += 500) {
      const page = await request(`${table}?select=${select}&order=id.asc&limit=500&offset=${offset}`);
      rows.push(...page);
      if (page.length < 500) return rows;
    }
  }
  return { request, all };
}
