import type { Liquor } from "../types/liquor";

interface LiquorApiResponse {
  id: number;
  productCode: string;
  name: string;
  brand: string;
  category: string;
  volume: number;
  alcoholPercent: number;
  country: string;
  currentPrice: number;
  originalPrice: number;
  imageUrl: string;
  productUrl: string;
  source: string;
}

interface LiquorPageApiResponse {
  items: LiquorApiResponse[];
  page: number;
  size: number;
  hasNext: boolean;
}

type LiquorListApiResponse = LiquorApiResponse[];

export interface LiquorPage {
  items: Liquor[];
  page: number;
  size: number;
  hasNext: boolean;
}

function toFrontendLiquor(item: LiquorApiResponse): Liquor {
  const currentPrice = typeof item.currentPrice === "number" ? item.currentPrice : 0;
  const originalPrice = typeof item.originalPrice === "number" ? item.originalPrice : currentPrice;

  return {
    id: typeof item.id === "number" ? item.id : 0,
    product_code: item.productCode ?? "",
    name: item.name ?? "Unknown",
    brand: item.brand ?? "Unknown",
    category: item.category ?? "Whisky",
    volume: typeof item.volume === "number" ? item.volume : 700,
    alcohol_percent: typeof item.alcoholPercent === "number" ? item.alcoholPercent : 0,
    country: item.country ?? "Unknown",
    current_price: currentPrice,
    original_price: originalPrice,
    image_url: item.imageUrl ?? "",
    product_url: item.productUrl ?? "",
    source: item.source ?? "WHISKY_DB",
  };
}

interface FetchLiquorsParams {
  searchQuery?: string;
  page?: number;
  size?: number;
  signal?: AbortSignal;
}

export async function fetchLiquors({ searchQuery, page = 0, size = 24, signal }: FetchLiquorsParams = {}): Promise<LiquorPage> {
  const trimmed = searchQuery?.trim() ?? "";
  const pagingQuery = `page=${page}&size=${size}`;
  const endpoint = trimmed
    ? `/api/liquors/search?q=${encodeURIComponent(trimmed)}&${pagingQuery}`
    : `/api/liquors?${pagingQuery}`;

  const response = await fetch(endpoint, { signal });
  if (!response.ok) {
    throw new Error(`주류 목록 조회 실패: ${response.status}`);
  }

  const data = (await response.json()) as LiquorPageApiResponse | LiquorListApiResponse;

  if (Array.isArray(data)) {
    return {
      items: data.map(toFrontendLiquor),
      page,
      size: data.length,
      hasNext: false,
    };
  }

  return {
    items: Array.isArray(data.items) ? data.items.map(toFrontendLiquor) : [],
    page: typeof data.page === "number" ? data.page : page,
    size: typeof data.size === "number" ? data.size : size,
    hasNext: Boolean(data.hasNext),
  };
}
