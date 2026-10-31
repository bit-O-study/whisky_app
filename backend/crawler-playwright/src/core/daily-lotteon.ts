export const CATALOG_URL = 'https://whisky.helthssu.co.kr/api/liquors';
export const INGEST_URL = 'https://whisky.helthssu.co.kr/api/internal/lotteon-ingest';
// A token audience is an identity contract, not a network destination. Preserve
// the audience accepted by the deployed verifier while moving both HTTP routes.
export const OIDC_AUDIENCE = 'https://whisky-app-vert.vercel.app/api/internal/lotteon-ingest';
export function parseProductIds(raw: string): Set<number> | null {
  if (!raw) return null;
  if (!/^[1-9]\d*(,[1-9]\d*)*$/.test(raw)) throw new Error('Invalid product IDs');
  const ids = raw.split(',').map(Number);
  if (ids.some(id => !Number.isSafeInteger(id))) throw new Error('Invalid product IDs');
  return new Set(ids);
}
export function lotteonCode(raw: string): string | null {
  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:' || !['www.lotteon.com', 'lotteon.com'].includes(url.hostname)) return null;
    return url.pathname.match(/^\/p\/product\/([a-z0-9]+)\/?$/i)?.[1].toUpperCase() ?? null;
  } catch { return null; }
}
export async function sendObservations(observations: unknown[], transport: typeof fetch = fetch): Promise<number> {
  const requestUrl = process.env.ACTIONS_ID_TOKEN_REQUEST_URL;
  const requestToken = process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN;
  if (!requestUrl || !requestToken) throw new Error('GitHub Actions OIDC permission is required');
  const url = new URL(requestUrl);
  url.searchParams.set('audience', OIDC_AUDIENCE);
  const identity = await transport(url, { headers: { Authorization: `Bearer ${requestToken}` }, redirect: 'error', signal: AbortSignal.timeout(30000) });
  if (!identity.ok) throw new Error(`OIDC request failed: ${identity.status}`);
  const token = await identity.json() as { value?: string };
  if (!token.value) throw new Error('OIDC token missing');
  const saved = await transport(INGEST_URL, { method: 'POST', redirect: 'error', signal: AbortSignal.timeout(90000),
    headers: { Authorization: `Bearer ${token.value}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ observations }) });
  if (!saved.ok) throw new Error(`Price save failed: ${saved.status}`);
  const result = await saved.json() as { updated?: number };
  if (result.updated !== observations.length) throw new Error('Saved count does not match observations');
  return result.updated;
}
