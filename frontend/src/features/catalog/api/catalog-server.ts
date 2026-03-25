import type { Liquor } from "../../../entities/liquor/model/liquor";
import { getSupabaseClient } from "../../../lib/supabase";
import type { CatalogPage } from "../model/catalog";

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

interface LiquorCatalogLatestPriceRow extends LiquorRow {
  source: string | null;
  current_price: number | null;
  original_price: number | null;
  crawled_at: string | null;
}

interface LiquorPriceLike {
  source: string | null;
  current_price: number | null;
  original_price: number | null;
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
  from(table: "liquor" | "liquor_price" | "liquor_catalog_latest_price"):
    | AwaitableQuery<LiquorRow>
    | AwaitableQuery<LiquorPriceRow>
    | AwaitableQuery<LiquorCatalogLatestPriceRow>;
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

function mapLiquorRow(row: LiquorRow, price: LiquorPriceLike | null): Liquor {
  return {
    id: row.id,
    product_code: normalizeText(row.product_code),
    name: normalizeText(row.product_name) || normalizeText(row.normalized_name, "Unknown"),
    brand: normalizeText(row.brand, "Unknown"),
    category: normalizeText(row.category, "Unknown"),
    volume: typeof row.volume_ml === "number" ? row.volume_ml : 700,
    alcohol_percent: typeof row.alcohol_percent === "number" ? row.alcohol_percent : 0,
    country: normalizeText(row.country, "Unknown"),
    current_price: typeof price?.current_price === "number" ? price.current_price : 0,
    original_price: typeof price?.original_price === "number" ? price.original_price : 0,
    image_url: normalizeText(row.image_url),
    product_url: normalizeText(row.product_url),
    source: normalizeText(price?.source, "LIQUOR_DB"),
  };
}

function buildPriceLookup(prices: LiquorPriceRow[]) {
  const lookup = new Map<number, LiquorPriceRow>();

  for (const price of prices) {
    const existing = lookup.get(price.liquor_id);
    if (!existing) {
      lookup.set(price.liquor_id, price);
      continue;
    }

    const existingTime = existing.crawled_at ? new Date(existing.crawled_at).getTime() : 0;
    const candidateTime = price.crawled_at ? new Date(price.crawled_at).getTime() : 0;
    if (candidateTime >= existingTime) {
      lookup.set(price.liquor_id, price);
    }
  }

  return lookup;
}

function isMissingLatestPriceViewError(error: QueryError | null) {
  if (!error) {
    return false;
  }

  return error.code === "42P01" || error.message?.includes("liquor_catalog_latest_price") === true;
}

function buildCatalogPageFromLatestPriceRows(
  rows: LiquorCatalogLatestPriceRow[],
  plan: CatalogSearchPlan,
): CatalogPage {
  return {
    items: rows.slice(0, plan.size).map((row) => mapLiquorRow(row, row)),
    page: plan.page,
    size: plan.size,
    hasNext: rows.length > plan.size,
  };
}

async function fetchCatalogPageFromLatestPriceView(
  supabase: CatalogSupabaseClient,
  plan: CatalogSearchPlan,
): Promise<CatalogPage | null> {
  let query = supabase
    .from("liquor_catalog_latest_price")
    .select(
      "id, normalized_name, brand, category, volume_ml, alcohol_percent, country, product_code, product_name, product_url, image_url, updated_at, source, current_price, original_price, crawled_at",
    )
    .order("updated_at", { ascending: false })
    .range(plan.from, plan.to) as AwaitableQuery<LiquorCatalogLatestPriceRow>;

  if (plan.mode !== "none") {
    query = query.or(buildCatalogSearchFilter(plan.keyword));
  }

  const { data, error, status } = await query;

  if (status === 416) {
    return {
      items: [],
      page: plan.page,
      size: plan.size,
      hasNext: false,
    };
  }

  if (isMissingLatestPriceViewError(error)) {
    return null;
  }

  if (error) {
    throw error;
  }

  return buildCatalogPageFromLatestPriceRows((data ?? []) as LiquorCatalogLatestPriceRow[], plan);
}

async function fetchCatalogPageWithPriceLookup(
  supabase: CatalogSupabaseClient,
  plan: CatalogSearchPlan,
): Promise<CatalogPage> {
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

  const priceLookup = buildPriceLookup(prices);
  const items = liquorRows.map((row) => mapLiquorRow(row, priceLookup.get(row.id) ?? null));

  return {
    items,
    page: plan.page,
    size: plan.size,
    hasNext,
  };
}

export async function fetchCatalogPageFromServerWithClient(
  supabase: CatalogSupabaseClient,
  params: FetchCatalogPageFromServerParams,
): Promise<CatalogPage> {
  const plan = buildCatalogSearchPlan(params);
  const latestPricePage = await fetchCatalogPageFromLatestPriceView(supabase, plan);

  if (latestPricePage) {
    return latestPricePage;
  }

  return fetchCatalogPageWithPriceLookup(supabase, plan);
}

export async function fetchCatalogPageFromServer(
  params: FetchCatalogPageFromServerParams,
): Promise<CatalogPage> {
  return fetchCatalogPageFromServerWithClient(
    getSupabaseClient() as unknown as CatalogSupabaseClient,
    params,
  );
}
