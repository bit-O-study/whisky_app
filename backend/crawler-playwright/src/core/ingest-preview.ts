import { fetchSupabaseRows } from './supabase-rest.js';

export interface PreviewCandidateInput {
  source: string;
  name: string;
  brand: string;
  category: string;
  clazz: string;
  volumeMl: number;
  alcoholPercent: number;
  currentPrice: number;
  originalPrice: number;
  imageUrl: string;
  productUrl: string;
  productCode: string;
}

interface LiquorInfoRow {
  id: number;
  brand: string | null;
  category: string | null;
  alcohol_percent: number | null;
  volume_ml: number | null;
  clazz: string | null;
}

interface LiquorRow {
  id: number;
  brand: string | null;
  category: string | null;
  volume_ml: number | null;
  class: string | null;
  product_name: string | null;
  product_code: string | null;
}

interface LiquorPriceRow {
  id: number;
  liquor_id: number;
  source: string | null;
  current_price: number | null;
  original_price: number | null;
  crawled_at: string | null;
}

interface LiquorUrlRow {
  id: number;
  liquor_id: number;
  source: string | null;
  product_url: string | null;
  image_url: string | null;
}

export interface IngestPreview {
  source: string;
  scrapedName: string;
  normalizedCandidate: {
    brand: string;
    category: string;
    clazz: string;
    volumeMl: number;
    alcoholPercent: number;
    normalizedName: string;
    currentPrice: number | null;
    originalPrice: number | null;
    productCode: string;
  } | null;
  matchedLiquorInfoId: number | null;
  matchedLiquorId: number | null;
  liquorAction: 'reuse' | 'insert' | 'skip';
  priceAction: 'insert' | 'update' | 'skip';
  urlAction: 'insert' | 'update' | 'skip';
  liquorCandidates: Array<{
    id: number;
    clazz: string;
    productName: string;
  }>;
  skip: boolean;
  reason: string | null;
}

export async function previewIngest(candidate: PreviewCandidateInput): Promise<IngestPreview> {
  const normalized = normalizeCandidate(candidate);
  const matchedLiquorInfo = await findLiquorInfo(normalized);

  if (!matchedLiquorInfo) {
    return {
      source: normalized.source,
      scrapedName: normalized.name,
      normalizedCandidate: buildNormalizedSnapshot(normalized),
      matchedLiquorInfoId: null,
      matchedLiquorId: null,
      liquorAction: 'skip',
      priceAction: 'skip',
      urlAction: 'skip',
      liquorCandidates: [],
      skip: true,
      reason: 'liquor_info match failed',
    };
  }

  if ((!normalized.clazz || normalized.clazz === 'None') && matchedLiquorInfo.clazz?.trim()) {
    normalized.clazz = normalizeClazz(matchedLiquorInfo.clazz);
  }

  const matchedLiquor = await findLiquor(normalized);
  const nearbyLiquors = await findLiquorCandidates(normalized);
  if (!matchedLiquor) {
    return {
      source: normalized.source,
      scrapedName: normalized.name,
      normalizedCandidate: buildNormalizedSnapshot(normalized),
      matchedLiquorInfoId: matchedLiquorInfo.id,
      matchedLiquorId: null,
      liquorAction: 'insert',
      priceAction: 'insert',
      urlAction: normalized.productUrl ? 'insert' : 'skip',
      liquorCandidates: nearbyLiquors.map((row) => ({
        id: row.id,
        clazz: normalizeText(row.class),
        productName: normalizeText(row.product_name),
      })),
      skip: false,
      reason: nearbyLiquors.length > 0
        ? 'same brand/volume liquor exists, but clazz did not match'
        : 'no existing liquor found for brand + volume',
    };
  }

  const [priceRows, urlRows] = await Promise.all([
    fetchSupabaseRows<LiquorPriceRow>('liquor_price', {
      select: 'id,liquor_id,source,current_price,original_price,crawled_at',
      filters: { liquor_id: matchedLiquor.id, source: normalized.source },
      order: { column: 'crawled_at', ascending: false },
      limit: 1,
    }),
    fetchSupabaseRows<LiquorUrlRow>('liquor_url', {
      select: 'id,liquor_id,source,product_url,image_url',
      filters: { liquor_id: matchedLiquor.id, source: normalized.source },
      limit: 1,
    }),
  ]);

  return {
    source: normalized.source,
    scrapedName: normalized.name,
    normalizedCandidate: buildNormalizedSnapshot(normalized),
    matchedLiquorInfoId: matchedLiquorInfo.id,
    matchedLiquorId: matchedLiquor.id,
    liquorAction: 'reuse',
    priceAction: priceRows.length > 0 ? 'update' : 'insert',
    urlAction: normalized.productUrl ? (urlRows.length > 0 ? 'update' : 'insert') : 'skip',
    liquorCandidates: nearbyLiquors.map((row) => ({
      id: row.id,
      clazz: normalizeText(row.class),
      productName: normalizeText(row.product_name),
    })),
    skip: false,
    reason: null,
  };
}

function buildNormalizedSnapshot(candidate: NormalizedCandidate) {
  return {
    brand: candidate.brand,
    category: candidate.category,
    clazz: candidate.clazz,
    volumeMl: candidate.volumeMl,
    alcoholPercent: candidate.alcoholPercent,
    normalizedName: candidate.normalizedName,
    currentPrice: candidate.currentPrice,
    originalPrice: candidate.originalPrice,
    productCode: candidate.productCode,
  };
}

interface NormalizedCandidate extends Omit<PreviewCandidateInput, 'currentPrice' | 'originalPrice'> {
  normalizedName: string;
  currentPrice: number | null;
  originalPrice: number | null;
}

function normalizeCandidate(candidate: PreviewCandidateInput): NormalizedCandidate {
  const currentPrice = candidate.currentPrice > 0 ? candidate.currentPrice : null;
  const originalPriceRaw = candidate.originalPrice > 0 ? candidate.originalPrice : null;
  const originalPrice = currentPrice && originalPriceRaw && originalPriceRaw < currentPrice
    ? currentPrice
    : (originalPriceRaw ?? currentPrice);

  return {
    ...candidate,
    source: candidate.source.toUpperCase(),
    brand: normalizeText(candidate.brand),
    category: normalizeText(candidate.category),
    clazz: normalizeClazz(candidate.clazz),
    volumeMl: candidate.volumeMl ?? 0,
    alcoholPercent: candidate.alcoholPercent ?? 0,
    normalizedName: buildNormalizedName(candidate.name),
    currentPrice,
    originalPrice,
  };
}

async function findLiquorInfo(candidate: NormalizedCandidate): Promise<LiquorInfoRow | null> {
  if (!candidate.brand || !candidate.category || !candidate.volumeMl) {
    return null;
  }

  const candidates = await fetchSupabaseRows<LiquorInfoRow>('liquor_info', {
    select: 'id,brand,category,alcohol_percent,volume_ml,clazz',
    filters: { category: candidate.category, volume_ml: candidate.volumeMl },
    limit: 100,
  });

  const scrapedBrand = compress(candidate.brand);
  const scrapedClazz = compress(candidate.clazz);
  const scrapedName = compress(candidate.name);

  for (const row of candidates) {
    const dbBrand = compress(row.brand);
    if (!dbBrand || dbBrand !== scrapedBrand) {
      continue;
    }

    const dbClazz = compress(row.clazz);
    if (!dbClazz || dbClazz === 'none') {
      return row;
    }

    if (dbClazz.includes(scrapedClazz) || scrapedClazz.includes(dbClazz)) {
      return row;
    }

    if (scrapedName.includes(dbClazz)) {
      return row;
    }
  }

  return null;
}

async function findLiquor(candidate: NormalizedCandidate): Promise<LiquorRow | null> {
  const liquors = await findLiquorCandidates(candidate);
  const normalizedClazz = normalizeClazz(candidate.clazz);
  return liquors.find((row) => normalizeClazz(row.class) === normalizedClazz) ?? null;
}

async function findLiquorCandidates(candidate: NormalizedCandidate): Promise<LiquorRow[]> {
  if (!candidate.brand || !candidate.volumeMl) {
    return [];
  }

  const liquors = await fetchSupabaseRows<LiquorRow>('liquor', {
    select: 'id,brand,category,volume_ml,class,product_name,product_code',
    filters: { brand: candidate.brand, volume_ml: candidate.volumeMl },
    limit: 100,
  });
  return liquors;
}

function buildNormalizedName(name: string): string {
  return normalizeText(name)
    .toLowerCase()
    .replace(/\[.*?\]/g, ' ')
    .replace(/\d+\s*(ml|mL|ML|l|L|리터)/g, ' ')
    .replace(/[^0-9a-z가-힣]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeClazz(value: string | null | undefined): string {
  const normalized = normalizeText(value)
    .replace(/\[.*?\]/g, '')
    .replace(/\([^)]*\)/g, '')
    .replace(/\s+/g, '')
    .trim();

  return normalized
    .replace(/^블랙$/, '블랙라벨')
    .replace(/^골드$/, '골드라벨')
    .replace(/^레드$/, '레드라벨')
    .replace(/^그린$/, '그린라벨')
    .replace(/^블루$/, '블루라벨')
    .replace(/^화이트$/, '화이트라벨');
}

function normalizeText(value: string | null | undefined): string {
  return value?.trim() ?? '';
}

function compress(value: string | null | undefined): string {
  return normalizeText(value).replace(/\s+/g, '').toLowerCase();
}
