import { loadRuntimeEnv } from './env.js';

function getSupabaseConfig() {
  loadRuntimeEnv();
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY;

  if (!url || !key) {
    throw new Error('preview 실행에는 SUPABASE_URL(또는 NEXT_PUBLIC_SUPABASE_URL) + SUPABASE_SERVICE_ROLE_KEY(또는 SUPABASE_SERVICE_KEY)가 필요합니다.');
  }

  return {
    restUrl: `${url.replace(/\/$/, '')}/rest/v1`,
    key,
  };
}

function buildHeaders(key: string) {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  };
}

export async function fetchSupabaseRows<T extends object>(
  table: string,
  options: {
    select: string;
    filters?: Record<string, string | number>;
    order?: { column: string; ascending: boolean };
    limit?: number;
  },
): Promise<T[]> {
  const { restUrl, key } = getSupabaseConfig();
  const params = new URLSearchParams();
  params.set('select', options.select);

  for (const [column, value] of Object.entries(options.filters ?? {})) {
    params.set(column, `eq.${value}`);
  }

  if (options.order) {
    params.set('order', `${options.order.column}.${options.order.ascending ? 'asc' : 'desc'}`);
  }

  if (options.limit && options.limit > 0) {
    params.set('limit', String(options.limit));
  }

  const response = await fetch(`${restUrl}/${table}?${params.toString()}`, {
    headers: {
      ...buildHeaders(key),
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Supabase REST query failed (${table} ${response.status}): ${body}`);
  }

  return (await response.json()) as T[];
}

export async function insertSupabaseRow<T extends object>(
  table: string,
  payload: Record<string, unknown>,
): Promise<T> {
  const { restUrl, key } = getSupabaseConfig();
  const response = await fetch(`${restUrl}/${table}`, {
    method: 'POST',
    headers: {
      ...buildHeaders(key),
      Prefer: 'return=representation',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Supabase REST insert failed (${table} ${response.status}): ${body}`);
  }

  const rows = (await response.json()) as T[];
  return rows[0] as T;
}

export async function updateSupabaseRows<T extends object>(
  table: string,
  payload: Record<string, unknown>,
  filters: Record<string, string | number>,
): Promise<T[]> {
  const { restUrl, key } = getSupabaseConfig();
  const params = new URLSearchParams();
  for (const [column, value] of Object.entries(filters)) {
    params.set(column, `eq.${value}`);
  }

  const response = await fetch(`${restUrl}/${table}?${params.toString()}`, {
    method: 'PATCH',
    headers: {
      ...buildHeaders(key),
      Prefer: 'return=representation',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Supabase REST update failed (${table} ${response.status}): ${body}`);
  }

  return (await response.json()) as T[];
}
