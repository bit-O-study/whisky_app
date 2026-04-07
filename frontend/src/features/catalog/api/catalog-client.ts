import type { CatalogPage } from "../model/catalog";

interface FetchCatalogPageParams {
  searchQuery?: string;
  page?: number;
  size?: number;
  signal?: AbortSignal;
}

export async function fetchCatalogPage({
  searchQuery,
  page = 0,
  size = 24,
  signal,
}: FetchCatalogPageParams = {}): Promise<CatalogPage> {
  const trimmed = searchQuery?.trim() ?? "";
  const pagingQuery = `page=${page}&size=${size}`;
  const endpoint = trimmed
    ? `/api/liquors/search?q=${encodeURIComponent(trimmed)}&${pagingQuery}`
    : `/api/liquors?${pagingQuery}`;

  const response = await fetch(endpoint, { signal });
  if (!response.ok) {
    throw new Error(`주류 목록 조회 실패: ${response.status}`);
  }

  const data = (await response.json()) as CatalogPage;

  return {
    items: Array.isArray(data.items) ? data.items : [],
    page: typeof data.page === "number" ? data.page : page,
    size: typeof data.size === "number" ? data.size : size,
    hasNext: Boolean(data.hasNext),
  };
}
