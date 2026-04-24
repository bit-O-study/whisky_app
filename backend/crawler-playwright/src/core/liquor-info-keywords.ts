import { fetchSupabaseRows } from './supabase-rest.js';

interface LiquorInfoKeywordRow {
  brand: string | null;
  clazz: string | null;
  volume_ml: number | null;
}

export async function fetchLiquorInfoKeywords(limit?: number): Promise<string[]> {
  const rows = await fetchSupabaseRows<LiquorInfoKeywordRow>('liquor_info', {
    select: 'brand,clazz,volume_ml',
    order: { column: 'id', ascending: true },
    limit: limit && limit > 0 ? Math.max(limit * 2, limit) : 5000,
  });

  const keywords: string[] = [];
  for (const row of rows) {
    const parts: string[] = [];
    const brand = normalize(row.brand);
    const clazz = normalize(row.clazz);
    const volumeMl = row.volume_ml;

    if (brand) parts.push(brand);
    if (clazz && clazz.toLowerCase() !== 'none') parts.push(clazz);
    if (typeof volumeMl === 'number' && Number.isFinite(volumeMl) && volumeMl > 0) {
      parts.push(`${volumeMl}ml`);
    }

    const keyword = parts.join(' ').replace(/\s+/g, ' ').trim();
    if (keyword) keywords.push(keyword);
  }

  const uniqueKeywords = [...new Set(keywords)];
  return typeof limit === 'number' && limit > 0 ? uniqueKeywords.slice(0, limit) : uniqueKeywords;
}

function normalize(value: string | null): string {
  return value?.trim() ?? '';
}
