import type { LiquorPage } from "../api/liquorApi";
import type { Liquor } from "../types/liquor";
import { getSupabaseClient } from "./supabase";

interface FetchLiquorPageParams {
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

function clampPage(value: number) {
  return Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;
}

function clampSize(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return 24;
  }
  return Math.min(Math.floor(value), 100);
}

function normalizeText(value: string | null | undefined, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function mapLiquorRow(row: LiquorRow, price: LiquorPriceRow | null): Liquor {
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

export async function fetchLiquorPage({ keyword, page, size }: FetchLiquorPageParams): Promise<LiquorPage> {
  const safePage = clampPage(page);
  const safeSize = clampSize(size);
  const from = safePage * safeSize;
  const to = from + safeSize - 1;

  const supabase = getSupabaseClient();
  let query = supabase
    .from("liquor")
    .select(
      "id, normalized_name, brand, category, volume_ml, alcohol_percent, country, product_code, product_name, product_url, image_url, updated_at",
      { count: "exact" },
    )
    .order("updated_at", { ascending: false })
    .range(from, to);

  const trimmedKeyword = keyword?.trim();
  if (trimmedKeyword) {
    const escaped = trimmedKeyword.replace(/[%_,]/g, "\\$&");
    query = query.or(
      `product_name.ilike.%${escaped}%,normalized_name.ilike.%${escaped}%,brand.ilike.%${escaped}%`,
    );
  }

  const {
    data: liquors,
    error: liquorError,
    count,
    status: liquorStatus,
  } = await query;

  if (liquorStatus === 416) {
    return {
      items: [],
      page: safePage,
      size: safeSize,
      hasNext: false,
    };
  }

  if (liquorError) {
    throw liquorError;
  }

  const liquorRows = (liquors ?? []) as LiquorRow[];
  const ids = liquorRows.map((item) => item.id);
  let prices: LiquorPriceRow[] = [];

  if (ids.length > 0) {
    const { data: priceRows, error: priceError } = await supabase
      .from("liquor_price")
      .select("liquor_id, source, current_price, original_price, crawled_at")
      .in("liquor_id", ids)
      .order("crawled_at", { ascending: false });

    if (priceError) {
      throw priceError;
    }

    prices = (priceRows ?? []) as LiquorPriceRow[];
  }

  const priceLookup = buildPriceLookup(prices);
  const items = liquorRows.map((row) => mapLiquorRow(row, priceLookup.get(row.id) ?? null));
  const totalCount = typeof count === "number" ? count : items.length;

  return {
    items,
    page: safePage,
    size: safeSize,
    hasNext: from + items.length < totalCount,
  };
}
