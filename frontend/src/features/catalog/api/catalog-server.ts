import { getSupabaseClient } from "../../../lib/supabase";
import type { CatalogCardItem, CatalogCardVendor, CatalogPage, LiquorDetail } from "../model/catalog";

interface FetchCatalogPageFromServerParams {
  keyword?: string;
  page: number;
  size: number;
}

interface FetchLiquorDetailFromServerParams {
  id: number;
}

interface LiquorRow {
  id: number;
  normalized_name: string | null;
  brand: string | null;
  category: string | null;
  volume_ml: number | null;
  alcohol_percent: number | null;
  country: string | null;
  product_code: string | null;
  product_name: string | null;
  product_url: string | null;
  image_url: string | null;
  updated_at: string | null;
}

interface LiquorPriceRow {
  liquor_id: number;
  source: string | null;
  current_price: number | null;
  original_price: number | null;
  crawled_at: string | null;
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

function buildVendorLookup(rows: LiquorPriceRow[], liquorRows: LiquorRow[]) {
  const productUrlByLiquorId = new Map<number, string>();
  for (const liquor of liquorRows) {
    productUrlByLiquorId.set(liquor.id, normalizeText(liquor.product_url));
  }

  const latestByLiquorAndSource = new Map<string, LiquorPriceRow>();

  for (const row of rows) {
    const source = normalizeText(row.source, "UNKNOWN");
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

  for (const row of latestByLiquorAndSource.values()) {
    const vendors = vendorLookup.get(row.liquor_id) ?? [];
    vendors.push({
      source: normalizeText(row.source, "UNKNOWN"),
      current_price: normalizePrice(row.current_price),
      original_price: normalizePrice(row.original_price),
      product_url: productUrlByLiquorId.get(row.liquor_id) ?? "",
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
    volume: typeof row.volume_ml === "number" ? row.volume_ml : 700,
    alcohol_percent: typeof row.alcohol_percent === "number" ? row.alcohol_percent : 0,
    country: normalizeText(row.country, "Unknown"),
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
      "id, normalized_name, brand, category, volume_ml, alcohol_percent, country, product_code, product_name, product_url, image_url, updated_at",
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

export async function fetchLiquorDetailFromServerWithClient(
  supabase: CatalogSupabaseClient,
  params: FetchLiquorDetailFromServerParams,
): Promise<LiquorDetail | null> {
  const safeId = Number.isFinite(params.id) ? Math.floor(params.id) : 0;
  if (safeId <= 0) {
    return null;
  }

  const liquorQuery = supabase
    .from("liquor") as AwaitableQuery<LiquorRow>;

  const { data: liquorRows, error: liquorError } = await (liquorQuery
    .select(
      "id, normalized_name, brand, category, volume_ml, alcohol_percent, country, product_code, product_name, product_url, image_url, updated_at",
    )
    .in("id", [safeId])
    .range(0, 0) as unknown as QueryResponse<LiquorRow>);

  if (liquorError) {
    throw liquorError;
  }

  const liquor = (liquorRows ?? [])[0];
  if (!liquor) {
    return null;
  }

  const priceQuery = supabase
    .from("liquor_price") as AwaitableQuery<LiquorPriceRow>;

  const { data: priceRows, error: priceError } = await (priceQuery
    .select("liquor_id, source, current_price, original_price, crawled_at")
    .in("liquor_id", [liquor.id])
    .order("crawled_at", { ascending: false }) as unknown as QueryResponse<LiquorPriceRow>);

  if (priceError) {
    throw priceError;
  }

  const vendorLookup = buildVendorLookup((priceRows ?? []) as LiquorPriceRow[], [liquor]);

  return {
    item: mapLiquorRowToCatalogItem(liquor, vendorLookup.get(liquor.id) ?? []),
  };
}

export async function fetchLiquorDetailFromServer(
  params: FetchLiquorDetailFromServerParams,
): Promise<LiquorDetail | null> {
  return fetchLiquorDetailFromServerWithClient(
    getSupabaseClient() as unknown as CatalogSupabaseClient,
    params,
  );
}
