import { getSupabaseClient } from "../../../lib/supabase";
import {
  FLAVOR_AXES,
  type CatalogCardItem,
  type CatalogCardVendor,
  type CatalogPage,
  type FlavorAxis,
} from "../model/catalog";

export { FLAVOR_AXES, FLAVOR_AXIS_LABELS } from "../model/catalog";
export type { FlavorAxis } from "../model/catalog";

interface FetchCatalogPageFromServerParams {
  keyword?: string;
  page: number;
  size: number;
}

interface LiquorRow {
  id: number;
  normalized_name: string | null;
  brand: string | null;
  category: string | null;
  liquor_info?: {
    sub_category?: string | null;
    volume_ml?: number | null;
    alcohol_percent?: number | null;
  } | null;
  volume_ml: number | null;
  alcohol_percent: number | null;
  country: string | null;
  product_code: string | null;
  product_name: string | null;
  product_url: string | null;
  image_url: string | null;
  updated_at: string | null;
  view_count?: number | null;
  liquor_url?: LiquorUrlRow[] | null;
  sweet?: number | null;
  smoky?: number | null;
  fruity?: number | null;
  spicy?: number | null;
  woody?: number | null;
  body?: number | null;
}

interface LiquorPriceRow {
  liquor_id: number;
  source: string | null;
  current_price: number | null;
  original_price: number | null;
  crawled_at: string | null;
}

interface LiquorUrlRow {
  source: string | null;
  product_url: string | null;
}

type CatalogSearchMode = "none" | "short" | "trigram";

interface CatalogSearchPlan {
  keyword: string;
  mode: CatalogSearchMode;
  page: number;
  size: number;
  from: number;
  to: number;
  fetchSize: number;
  usesExactCount: boolean;
}

interface QueryError {
  code?: string;
  message?: string;
}

interface QueryResponse<T> {
  data: T[] | null;
  error: QueryError | null;
  count?: number | null;
  status?: number;
}

interface AwaitableQuery<T> extends PromiseLike<QueryResponse<T>> {
  select(columns: string, options?: { count?: "exact" | "planned" | "estimated" }): AwaitableQuery<T>;
  order(column: string, options: { ascending: boolean }): AwaitableQuery<T>;
  range(from: number, to: number): AwaitableQuery<T>;
  or(filter: string): AwaitableQuery<T>;
  in(column: string, values: number[]): AwaitableQuery<T>;
  eq(column: string, value: string | number): AwaitableQuery<T>;
  limit(count: number): AwaitableQuery<T>;
}

interface CatalogSupabaseClient {
  from(table: "liquor" | "liquor_price"): AwaitableQuery<LiquorRow> | AwaitableQuery<LiquorPriceRow>;
}

const MIN_TRIGRAM_KEYWORD_LENGTH = 3;

function clampPage(value: number) {
  return Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;
}

function clampSize(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return 24;
  }
  return Math.min(Math.floor(value), 100);
}

export function normalizeCatalogSearchKeyword(keyword?: string) {
  const value = keyword?.trim() ?? "";

  if (!value) {
    return { value, mode: "none" as const };
  }

  if (value.length < MIN_TRIGRAM_KEYWORD_LENGTH) {
    return { value, mode: "short" as const };
  }

  return { value, mode: "trigram" as const };
}

function escapeCatalogSearchKeyword(keyword: string) {
  return keyword.replace(/[%_,]/g, "\\$&");
}

export function buildCatalogSearchFilter(keyword: string) {
  const escaped = escapeCatalogSearchKeyword(keyword);
  return `product_name.ilike.%${escaped}%,normalized_name.ilike.%${escaped}%,brand.ilike.%${escaped}%`;
}

export function buildCatalogSearchPlan({
                                         keyword,
                                         page,
                                         size,
                                       }: FetchCatalogPageFromServerParams): CatalogSearchPlan {
  const normalizedKeyword = normalizeCatalogSearchKeyword(keyword);
  const safePage = clampPage(page);
  const safeSize = clampSize(size);
  const from = safePage * safeSize;

  return {
    keyword: normalizedKeyword.value,
    mode: normalizedKeyword.mode,
    page: safePage,
    size: safeSize,
    from,
    to: from + safeSize,
    fetchSize: safeSize + 1,
    usesExactCount: false,
  };
}

function normalizeText(value: string | null | undefined, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function normalizePrice(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : 0;
}

function calculateDiscountPercent(currentPrice: number, originalPrice: number) {
  if (currentPrice <= 0 || originalPrice <= currentPrice) {
    return 0;
  }

  return Math.round((1 - currentPrice / originalPrice) * 100);
}

function buildVendorLookup(rows: LiquorPriceRow[], liquorRows: LiquorRow[]) {
  // 1. 기존: liquor_id -> URL 매핑
  // 변경: liquor_id + source -> URL 매핑 (예: "864:LOTTEON" -> "롯데온 URL")
  const urlLookupByLiquorAndSource = new Map<string, string>();
  const fallbackUrlByLiquor = new Map<number, string>();

  for (const liquor of liquorRows) {
    // liquor.liquor_url 배열을 순회하면서 source별로 URL을 맵에 저장합니다.
    if (Array.isArray(liquor.liquor_url)) {
      for (const urlData of liquor.liquor_url) {
        const source = normalizeText(urlData.source, "UNKNOWN").toUpperCase();
        const key = `${liquor.id}:${source}`;
        urlLookupByLiquorAndSource.set(key, normalizeText(urlData.product_url));
      }
    } else if (liquor.product_url) {
      fallbackUrlByLiquor.set(liquor.id, normalizeText(liquor.product_url));
    }
  }

  const latestByLiquorAndSource = new Map<string, LiquorPriceRow>();

  // 가격 최신화 로직 (기존과 동일)
  for (const row of rows) {
    const source = normalizeText(row.source, "UNKNOWN").toUpperCase();
    const key = `${row.liquor_id}:${source}`;
    const existing = latestByLiquorAndSource.get(key);

    if (!existing) {
      latestByLiquorAndSource.set(key, row);
      continue;
    }

    const existingTime = existing.crawled_at ? new Date(existing.crawled_at).getTime() : 0;
    const candidateTime = row.crawled_at ? new Date(row.crawled_at).getTime() : 0;
    if (candidateTime >= existingTime) {
      latestByLiquorAndSource.set(key, row);
    }
  }

  const vendorLookup = new Map<number, CatalogCardVendor[]>();

  // ⭐️ 2. Vendor 배열을 만들 때 해당 source에 맞는 URL을 꺼내옵니다.
  for (const row of latestByLiquorAndSource.values()) {
    const vendors = vendorLookup.get(row.liquor_id) ?? [];

    const source = normalizeText(row.source, "UNKNOWN");
    const searchKey = `${row.liquor_id}:${source.toUpperCase()}`; // URL 맵에서 찾을 키 생성
    const fallbackSearchKey = `${row.liquor_id}:UNKNOWN`;

    const currentPrice = normalizePrice(row.current_price);
    const originalPrice = normalizePrice(row.original_price);

    vendors.push({
      source: source,
      current_price: currentPrice,
      original_price: originalPrice,
      // 방금 만든 복합 키로 각 벤더의 고유 URL을 찾아 주입!
      product_url:
        urlLookupByLiquorAndSource.get(searchKey) ??
        urlLookupByLiquorAndSource.get(fallbackSearchKey) ??
        fallbackUrlByLiquor.get(row.liquor_id) ??
        "",
      discount_percent: calculateDiscountPercent(currentPrice, originalPrice),
      crawled_at: normalizeText(row.crawled_at),
    });
    vendorLookup.set(row.liquor_id, vendors);
  }

  for (const vendors of vendorLookup.values()) {
    vendors.sort((a, b) => a.current_price - b.current_price);
  }

  return vendorLookup;
}

function mapLiquorRowToCatalogItem(row: LiquorRow, vendors: CatalogCardVendor[]): CatalogCardItem {
  const lowestPrice = vendors.reduce((lowest, vendor) => {
    return vendor.current_price > 0 && vendor.current_price < lowest ? vendor.current_price : lowest;
  }, Number.POSITIVE_INFINITY);

  return {
    id: row.id,
    product_code: normalizeText(row.product_code),
    name: normalizeText(row.product_name) || normalizeText(row.normalized_name, "Unknown"),
    brand: normalizeText(row.brand, "Unknown"),
    category: normalizeText(row.category, "Unknown"),
    sub_category: normalizeText(row.liquor_info?.sub_category),
    volume: typeof row.volume_ml === "number" ? row.volume_ml : 700,
    alcohol_percent: typeof row.alcohol_percent === "number" ? row.alcohol_percent : 0,
    country: normalizeText(row.country),
    image_url: normalizeText(row.image_url),
    vendors,
    lowest_price: Number.isFinite(lowestPrice) ? lowestPrice : 0,
    view_count: typeof row.view_count === "number" ? row.view_count : 0,
    sweet: typeof row.sweet === "number" && Number.isFinite(row.sweet) ? row.sweet : null,
    smoky: typeof row.smoky === "number" && Number.isFinite(row.smoky) ? row.smoky : null,
    fruity: typeof row.fruity === "number" && Number.isFinite(row.fruity) ? row.fruity : null,
    spicy: typeof row.spicy === "number" && Number.isFinite(row.spicy) ? row.spicy : null,
    woody: typeof row.woody === "number" && Number.isFinite(row.woody) ? row.woody : null,
    body: typeof row.body === "number" && Number.isFinite(row.body) ? row.body : null,
  };
}

export async function fetchCatalogPageFromServerWithClient(
    supabase: CatalogSupabaseClient,
    params: FetchCatalogPageFromServerParams,
): Promise<CatalogPage> {
  const plan = buildCatalogSearchPlan(params);
  let query = supabase
      .from("liquor")
      .select(
          "id, normalized_name, brand, category, volume_ml, alcohol_percent, country, product_code, product_name, product_url, image_url, updated_at, view_count, sweet, smoky, fruity, spicy, woody, body, liquor_info!fk_liquor_info (sub_category), liquor_url!fk_liquor_url_liquor (source, product_url)",
      )
      .order("id", { ascending: true })
      .range(plan.from, plan.to) as AwaitableQuery<LiquorRow>;

  if (plan.mode !== "none") {
    query = query.or(buildCatalogSearchFilter(plan.keyword));
  }

  const {
    data: liquors,
    error: liquorError,
    status: liquorStatus,
  } = await query;

  if (liquorStatus === 416) {
    return {
      items: [],
      page: plan.page,
      size: plan.size,
      hasNext: false,
    };
  }

  if (liquorError) {
    throw liquorError;
  }

  const liquorRows = ((liquors ?? []) as LiquorRow[]).slice(0, plan.size);
  const hasNext = ((liquors ?? []) as LiquorRow[]).length > plan.size;
  const ids = liquorRows.map((item) => item.id);
  let prices: LiquorPriceRow[] = [];

  if (ids.length > 0) {
    const { data: priceRows, error: priceError } = await supabase
        .from("liquor_price")
        .select("liquor_id, source, current_price, original_price, crawled_at")
        .in("liquor_id", ids)
        .order("crawled_at", { ascending: false }) as QueryResponse<LiquorPriceRow>;

    if (priceError) {
      throw priceError;
    }

    prices = (priceRows ?? []) as LiquorPriceRow[];
  }

  const vendorLookup = buildVendorLookup(prices, liquorRows);
  const items = liquorRows.map((row) => mapLiquorRowToCatalogItem(row, vendorLookup.get(row.id) ?? []));

  return {
    items,
    page: plan.page,
    size: plan.size,
    hasNext,
  };
}

export async function fetchCatalogPageFromServer(
    params: FetchCatalogPageFromServerParams,
): Promise<CatalogPage> {
  return fetchCatalogPageFromServerWithClient(
      getSupabaseClient() as unknown as CatalogSupabaseClient,
      params,
  );
}

export async function fetchLiquorDetailFromServer(id: string): Promise<CatalogCardItem> {
  const supabase = getSupabaseClient() as unknown as CatalogSupabaseClient;
  const liquorId = parseInt(id, 10);

  // ... (id 유효성 검사 등 생략) ...

  const { data: liquors, error: liquorError } = await supabase
      .from("liquor")
      .select(`
        id,
        normalized_name,
        brand,
        category,
        country,
        volume_ml,
        alcohol_percent,
        product_code,
        product_name,
        product_url,
        image_url,
        updated_at,
        view_count,
        sweet,
        smoky,
        fruity,
        spicy,
        woody,
        body,
        liquor_info!fk_liquor_info (volume_ml, alcohol_percent, sub_category),
        liquor_url!fk_liquor_url_liquor (source, product_url)
      `)
      .in("id", [liquorId]) as QueryResponse<LiquorRow>;

  if (liquorError || !liquors?.[0]) throw liquorError || new Error("Not Found");

  const rawLiquor = liquors[0];

  const { data: priceRows, error: priceError } = await supabase
      .from("liquor_price")
      .select("liquor_id, source, current_price, original_price, crawled_at")
      .in("liquor_id", [liquorId])
      .order("crawled_at", { ascending: false }) as QueryResponse<LiquorPriceRow>;

  if (priceError) throw priceError;

  const liquorRow: LiquorRow = {
    ...rawLiquor,
    volume_ml: rawLiquor.liquor_info?.volume_ml ?? rawLiquor.volume_ml,
    alcohol_percent: rawLiquor.liquor_info?.alcohol_percent ?? rawLiquor.alcohol_percent,
  };

  // 4. 조립 및 반환
  const vendorLookup = buildVendorLookup(priceRows ?? [], [liquorRow]);
  const mappedItem = mapLiquorRowToCatalogItem(liquorRow, vendorLookup.get(liquorRow.id) ?? []);

  return mappedItem;
}

export interface TodaysRecommendation {
  liquor: CatalogCardItem;
  /** 역대 최저가 (= 현재가) */
  allTimeLow: number;
  /** 7일 전 평균가 */
  sevenDayAvg: number;
  /** 절대 하락폭 (7d_avg - current) */
  dropAmount: number;
  /** 하락 비율 (0~1) */
  dropRatio: number;
}

interface RecommendationHistoryRow {
  liquor_id: number;
  source: string | null;
  current_price: number | null;
  crawled_at: string | null;
}

/**
 * 오늘의 추천 = "역대 최저가에 해당하면서 최근 7일 평균보다 떨어진 상품" top N.
 * - 후보 풀: 최근 90일 history.
 * - 현재가는 각 liquor의 가장 최근 source별 가격 중 최저값(= 카탈로그 카드의 lowest_price 와 동일 의미).
 * - ATL 비교는 history 전체 기간(있는 만큼)의 최소 current_price.
 * - 하락 신호는 [현재로부터 8~1일 전] 윈도우의 평균 가격을 기준선으로 사용 (오늘 데이터 노이즈 피하려고 어제까지로 컷).
 */
export async function fetchTodaysRecommendationsFromServer(limit = 3): Promise<TodaysRecommendation[]> {
  const supabase = getSupabaseClient() as unknown as {
    from(table: "liquor_price_history" | "liquor"): {
      select(columns: string): {
        gte(column: string, value: string): {
          order(column: string, opts: { ascending: boolean }): Promise<{ data: RecommendationHistoryRow[] | null; error: { message?: string } | null }>;
        };
        in(column: string, values: number[]): Promise<{ data: LiquorRow[] | null; error: { message?: string } | null }>;
      };
    };
  };

  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setUTCDate(ninetyDaysAgo.getUTCDate() - 90);

  const { data: rawHistory, error: historyError } = await supabase
    .from("liquor_price_history")
    .select("liquor_id, source, current_price, crawled_at")
    .gte("crawled_at", ninetyDaysAgo.toISOString())
    .order("crawled_at", { ascending: true });

  if (historyError) {
    console.error("recommendation history fetch error", historyError);
    return [];
  }

  const rows = (rawHistory ?? []).filter(
    (row): row is { liquor_id: number; source: string | null; current_price: number; crawled_at: string } =>
      typeof row.current_price === "number" &&
      row.current_price > 0 &&
      typeof row.crawled_at === "string" &&
      typeof row.liquor_id === "number",
  );
  if (rows.length === 0) return [];

  // 시간순 정렬 보장 후 source별 마지막 가격을 가져와 그 중 최저값을 "현재가"로 친다.
  rows.sort((a, b) => new Date(a.crawled_at).getTime() - new Date(b.crawled_at).getTime());

  const eightDaysAgo = Date.now() - 8 * 86_400_000;
  const oneDayAgo = Date.now() - 86_400_000;

  interface Aggregated {
    liquorId: number;
    allTimeLow: number;
    currentBySource: Map<string, { price: number; ts: number }>;
    baselineSamples: number[];
  }

  const aggMap = new Map<number, Aggregated>();
  for (const row of rows) {
    const ts = new Date(row.crawled_at).getTime();
    const source = (row.source ?? "UNKNOWN").toUpperCase();
    let agg = aggMap.get(row.liquor_id);
    if (!agg) {
      agg = {
        liquorId: row.liquor_id,
        allTimeLow: row.current_price,
        currentBySource: new Map(),
        baselineSamples: [],
      };
      aggMap.set(row.liquor_id, agg);
    }
    if (row.current_price < agg.allTimeLow) agg.allTimeLow = row.current_price;
    const existing = agg.currentBySource.get(source);
    if (!existing || ts >= existing.ts) {
      agg.currentBySource.set(source, { price: row.current_price, ts });
    }
    if (ts >= eightDaysAgo && ts < oneDayAgo) {
      agg.baselineSamples.push(row.current_price);
    }
  }

  interface Candidate {
    liquorId: number;
    currentPrice: number;
    allTimeLow: number;
    sevenDayAvg: number;
    dropAmount: number;
    dropRatio: number;
  }

  const candidates: Candidate[] = [];
  for (const agg of aggMap.values()) {
    if (agg.currentBySource.size === 0 || agg.baselineSamples.length === 0) continue;
    let currentPrice = Number.POSITIVE_INFINITY;
    for (const value of agg.currentBySource.values()) {
      if (value.price < currentPrice) currentPrice = value.price;
    }
    if (!Number.isFinite(currentPrice)) continue;
    if (currentPrice > agg.allTimeLow) continue; // 역대 최저가가 아니면 제외
    const sevenDayAvg = agg.baselineSamples.reduce((s, v) => s + v, 0) / agg.baselineSamples.length;
    if (currentPrice >= sevenDayAvg) continue; // 최근 평균보다 떨어졌어야 함
    const dropAmount = sevenDayAvg - currentPrice;
    candidates.push({
      liquorId: agg.liquorId,
      currentPrice,
      allTimeLow: agg.allTimeLow,
      sevenDayAvg,
      dropAmount,
      dropRatio: dropAmount / sevenDayAvg,
    });
  }

  if (candidates.length === 0) return [];

  candidates.sort((a, b) => b.dropAmount - a.dropAmount);
  const topIds = candidates.slice(0, Math.max(1, limit)).map((c) => c.liquorId);

  // 카드에 필요한 메타데이터를 한 번에 채우기: liquor + 같은 mapping 재사용.
  const { data: liquorRowsRaw, error: liquorError } = await supabase
    .from("liquor")
    .select(
      "id, normalized_name, brand, category, volume_ml, alcohol_percent, country, product_code, product_name, product_url, image_url, updated_at, view_count, liquor_info!fk_liquor_info (sub_category), liquor_url!fk_liquor_url_liquor (source, product_url)",
    )
    .in("id", topIds);

  if (liquorError) {
    console.error("recommendation liquor fetch error", liquorError);
    return [];
  }

  const liquorRows = (liquorRowsRaw ?? []) as LiquorRow[];
  const supabaseForPrices = getSupabaseClient() as unknown as CatalogSupabaseClient;
  const { data: priceRowsRaw, error: priceError } = await supabaseForPrices
    .from("liquor_price")
    .select("liquor_id, source, current_price, original_price, crawled_at")
    .in("liquor_id", topIds)
    .order("crawled_at", { ascending: false });

  if (priceError) {
    console.error("recommendation price fetch error", priceError);
    return [];
  }

  const priceRows = (priceRowsRaw ?? []) as LiquorPriceRow[];
  const vendorLookup = buildVendorLookup(priceRows, liquorRows);
  const itemsById = new Map<number, CatalogCardItem>();
  for (const row of liquorRows) {
    itemsById.set(row.id, mapLiquorRowToCatalogItem(row, vendorLookup.get(row.id) ?? []));
  }

  const result: TodaysRecommendation[] = [];
  for (const candidate of candidates) {
    const liquor = itemsById.get(candidate.liquorId);
    if (!liquor) continue;
    result.push({
      liquor,
      allTimeLow: candidate.allTimeLow,
      sevenDayAvg: Math.round(candidate.sevenDayAvg),
      dropAmount: Math.round(candidate.dropAmount),
      dropRatio: candidate.dropRatio,
    });
    if (result.length >= limit) break;
  }
  return result;
}

export async function fetchFlavorRecommendationsFromServer(
  perAxis: number = 4,
): Promise<Record<FlavorAxis, CatalogCardItem[]>> {
  const supabase = getSupabaseClient() as unknown as CatalogSupabaseClient;
  const result = {} as Record<FlavorAxis, CatalogCardItem[]>;

  for (const axis of FLAVOR_AXES) {
    try {
      const { data: rows } = (await supabase
        .from("liquor")
        .select(
          "id, normalized_name, brand, category, volume_ml, alcohol_percent, country, product_code, product_name, product_url, image_url, updated_at, view_count, sweet, smoky, fruity, spicy, woody, body, liquor_info!fk_liquor_info (sub_category), liquor_url!fk_liquor_url_liquor (source, product_url)",
        )
        .order(axis, { ascending: false })
        .limit(perAxis * 2)) as QueryResponse<LiquorRow>;

      const liquorRows = ((rows ?? []) as LiquorRow[]).filter((r) => {
        const v = (r as unknown as Record<string, unknown>)[axis];
        return typeof v === "number" && Number.isFinite(v) && v > 0;
      });
      const top = liquorRows.slice(0, perAxis);
      const ids = top.map((r) => r.id);
      if (ids.length === 0) {
        result[axis] = [];
        continue;
      }

      const { data: priceRows } = (await supabase
        .from("liquor_price")
        .select("liquor_id, source, current_price, original_price, crawled_at")
        .in("liquor_id", ids)
        .order("crawled_at", { ascending: false })) as QueryResponse<LiquorPriceRow>;

      const vendorLookup = buildVendorLookup(priceRows ?? [], top);
      result[axis] = top.map((row) => mapLiquorRowToCatalogItem(row, vendorLookup.get(row.id) ?? []));
    } catch (err) {
      console.error(`fetchFlavorRecommendations ${axis} failed`, err);
      result[axis] = [];
    }
  }
  return result;
}

export interface SourceRecommendation {
  source: string;
  liquor: CatalogCardItem;
}

const SOURCE_KEYS = ["LOTTEON", "EMART", "EMART_TRADERS", "COSTCO"] as const;
export type SourceKey = (typeof SOURCE_KEYS)[number];

export async function fetchSourceRecommendationsFromServer(
  perSource: number = 6,
): Promise<Record<SourceKey, CatalogCardItem[]>> {
  const supabase = getSupabaseClient() as unknown as CatalogSupabaseClient;
  const result = {} as Record<SourceKey, CatalogCardItem[]>;

  for (const source of SOURCE_KEYS) {
    try {
      const { data: priceRows } = (await supabase
        .from("liquor_price")
        .select("liquor_id, source, current_price, original_price, crawled_at")
        .eq("source", source)
        .order("crawled_at", { ascending: false })
        .limit(perSource * 4)) as QueryResponse<LiquorPriceRow>;

      const seen = new Set<number>();
      const ids: number[] = [];
      for (const r of priceRows ?? []) {
        if (seen.has(r.liquor_id)) continue;
        if (typeof r.current_price !== "number" || r.current_price <= 0) continue;
        seen.add(r.liquor_id);
        ids.push(r.liquor_id);
        if (ids.length >= perSource) break;
      }

      if (ids.length === 0) {
        result[source] = [];
        continue;
      }

      const { data: liquorRows } = (await supabase
        .from("liquor")
        .select(
          "id, normalized_name, brand, category, volume_ml, alcohol_percent, country, product_code, product_name, product_url, image_url, updated_at, view_count, sweet, smoky, fruity, spicy, woody, body, liquor_info!fk_liquor_info (sub_category), liquor_url!fk_liquor_url_liquor (source, product_url)",
        )
        .in("id", ids)) as QueryResponse<LiquorRow>;

      const vendorLookup = buildVendorLookup(priceRows ?? [], (liquorRows ?? []) as LiquorRow[]);
      const items = ((liquorRows ?? []) as LiquorRow[])
        .map((row) => mapLiquorRowToCatalogItem(row, vendorLookup.get(row.id) ?? []))
        .sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
      result[source] = items;
    } catch (err) {
      console.error(`fetchSourceRecommendations ${source} failed`, err);
      result[source] = [];
    }
  }

  return result;
}

export interface PriceHistoryPoint {
  /** ISO date (YYYY-MM-DD) */
  date: string;
  /** lowest current_price across all sources for that day */
  lowest: number;
}

interface RawHistoryRow {
  source: string | null;
  current_price: number | null;
  crawled_at: string | null;
}

interface PriceHistoryQuery<T> extends PromiseLike<QueryResponse<T>> {
  select(columns: string): PriceHistoryQuery<T>;
  eq(column: string, value: number): PriceHistoryQuery<T>;
  gte(column: string, value: string): PriceHistoryQuery<T>;
  order(column: string, options: { ascending: boolean }): PriceHistoryQuery<T>;
}

interface PriceHistorySupabaseClient {
  from(table: "liquor_price_history"): PriceHistoryQuery<RawHistoryRow>;
}

/**
 * 특정 liquor의 가격 히스토리를 일자별로 집계해 반환.
 * 각 날짜의 모든 소스의 current_price 중 MIN을 사용해 "그 날의 최저가"를 만든다.
 */
export async function fetchLiquorPriceHistoryFromServer(
    id: string,
    days: number = 90,
): Promise<PriceHistoryPoint[]> {
  const supabase = getSupabaseClient() as unknown as PriceHistorySupabaseClient;
  const liquorId = parseInt(id, 10);
  if (!Number.isFinite(liquorId)) return [];

  const since = new Date();
  since.setUTCDate(since.getUTCDate() - days);

  const { data, error } = await supabase
      .from("liquor_price_history")
      .select("source, current_price, crawled_at")
      .eq("liquor_id", liquorId)
      .gte("crawled_at", since.toISOString())
      .order("crawled_at", { ascending: true });

  if (error) {
    console.error("history fetch error", error);
    return [];
  }

  // 1) 유효한 행만 골라서 시간순 정렬
  const rows = ((data ?? []) as RawHistoryRow[])
      .filter((r) => typeof r.current_price === "number" && r.current_price > 0 && !!r.crawled_at)
      .map((r) => ({
        source: (r.source ?? "UNKNOWN").toUpperCase(),
        price: r.current_price as number,
        ts: new Date(r.crawled_at as string),
      }))
      .filter((r) => !Number.isNaN(r.ts.getTime()))
      .sort((a, b) => a.ts.getTime() - b.ts.getTime());

  if (rows.length === 0) return [];

  // 2) 일자별로 그룹
  const byDay = new Map<string, typeof rows>();
  for (const r of rows) {
    const day = r.ts.toISOString().slice(0, 10);
    const bucket = byDay.get(day);
    if (bucket) bucket.push(r);
    else byDay.set(day, [r]);
  }

  // 3) forward-fill: 각 source의 마지막 알려진 가격을 carry-forward.
  //    그날의 최저가 = 그 시점에 알려진 모든 source 가격 중 MIN.
  //    한 source가 다른 날 안 크롤되어도 직전 알려진 값을 살려서 비교.
  const sortedDays = Array.from(byDay.keys()).sort();
  const sourceLatest = new Map<string, number>();
  const points: PriceHistoryPoint[] = [];
  for (const day of sortedDays) {
    for (const r of byDay.get(day)!) {
      sourceLatest.set(r.source, r.price);
    }
    if (sourceLatest.size === 0) continue;
    const lowest = Math.min(...sourceLatest.values());
    points.push({ date: day, lowest });
  }

  return points;
}
