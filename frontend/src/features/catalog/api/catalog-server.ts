import { getSupabaseClient } from "../../../lib/supabase";
import type { CatalogCardItem, CatalogCardVendor, CatalogPage } from "../model/catalog";

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
  liquor_url?: LiquorUrlRow[] | null;
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

  for (const liquor of liquorRows) {
    // liquor.liquor_url 배열을 순회하면서 source별로 URL을 맵에 저장합니다.
    if (Array.isArray(liquor.liquor_url)) {
      for (const urlData of liquor.liquor_url) {
        const source = normalizeText(urlData.source, "UNKNOWN").toUpperCase();
        const key = `${liquor.id}:${source}`;
        urlLookupByLiquorAndSource.set(key, normalizeText(urlData.product_url));
      }
    } else if (liquor.product_url) {
      // 만약 조인이 안된 단일 객체 구조가 섞여 들어올 경우를 대비한 방어 코드
      const key = `${liquor.id}:UNKNOWN`;
      urlLookupByLiquorAndSource.set(key, normalizeText(liquor.product_url));
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
      product_url: urlLookupByLiquorAndSource.get(searchKey) ?? urlLookupByLiquorAndSource.get(fallbackSearchKey) ?? "",
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
          "id, normalized_name, brand, category, volume_ml, alcohol_percent, country, product_code, product_name, product_url, image_url, updated_at, liquor_info!fk_liquor_info (sub_category), liquor_url!fk_liquor_url_liquor (source, product_url)",
      )
      .order("updated_at", { ascending: false })
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
        image_url,
        updated_at,
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

  // const pricesWithUrl = (priceRows ?? []).map((p: any) => {
  //   const safeSearchKey = String(p.source).trim().toUpperCase();
  //   const matchedUrl = urlMap.get(safeSearchKey) || "";
  //   return {
  //     ...p,
  //     product_url: matchedUrl
  //   };
  // });

  const liquorRow: LiquorRow = {
    ...rawLiquor,
    volume_ml: rawLiquor.liquor_info?.volume_ml ?? null,
    alcohol_percent: rawLiquor.liquor_info?.alcohol_percent ?? null,
  };

  // 4. 조립 및 반환
  const vendorLookup = buildVendorLookup(priceRows ?? [], [liquorRow]);
  const mappedItem = mapLiquorRowToCatalogItem(liquorRow, vendorLookup.get(liquorRow.id) ?? []);

  return mappedItem;
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

/**
 * 특정 liquor의 가격 히스토리를 일자별로 집계해 반환.
 * 각 날짜의 모든 소스의 current_price 중 MIN을 사용해 "그 날의 최저가"를 만든다.
 */
export async function fetchLiquorPriceHistoryFromServer(
    id: string,
    days: number = 90,
): Promise<PriceHistoryPoint[]> {
  const supabase = getSupabaseClient() as any;
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