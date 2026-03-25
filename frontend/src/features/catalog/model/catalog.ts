import type { Liquor } from "../../../entities/liquor/model/liquor";

export interface CatalogPage {
  items: Liquor[];
  page: number;
  size: number;
  hasNext: boolean;
}

export interface CatalogCardVendor {
  source: string;
  current_price: number;
  original_price: number;
  product_url: string;
}

export interface CatalogCardItem {
  name: string;
  brand: string;
  category: string;
  country: string;
  alcohol_percent: number;
  volume: number;
  image_url: string;
  vendors: CatalogCardVendor[];
  lowest_price: number;
}

interface CatalogRequestSkipParams {
  hasInitialItems: boolean;
  hasInitialError: boolean;
  query: string;
  page: number;
  initialPage: number;
  reloadToken: number;
}

function normalizePrice(value: number) {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

export function shouldSkipInitialCatalogRequest(params: CatalogRequestSkipParams) {
  return (
    params.hasInitialItems &&
    !params.hasInitialError &&
    params.query === "" &&
    params.page === params.initialPage &&
    params.reloadToken === 0
  );
}

export function mergeCatalogPageItems(previousItems: Liquor[], nextPage: CatalogPage, page: number) {
  return page === 0 ? nextPage.items : [...previousItems, ...nextPage.items];
}

export function getCatalogLoadErrorMessage(page: number) {
  return page === 0
    ? "데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요."
    : "추가 목록을 불러오지 못했습니다. 다시 시도해주세요.";
}

export function groupCatalogLiquors(liquors: Liquor[]): CatalogCardItem[] {
  const groups = new Map<string, CatalogCardItem>();

  for (const liquor of liquors) {
    if (!groups.has(liquor.name)) {
      groups.set(liquor.name, {
        name: liquor.name,
        brand: liquor.brand,
        category: liquor.category,
        country: liquor.country,
        alcohol_percent: liquor.alcohol_percent,
        volume: liquor.volume,
        image_url: liquor.image_url,
        vendors: [],
        lowest_price: Infinity,
      });
    }

    const group = groups.get(liquor.name);
    if (!group) {
      continue;
    }

    const currentPrice = normalizePrice(liquor.current_price);
    const originalPrice = normalizePrice(liquor.original_price);

    group.vendors.push({
      source: liquor.source,
      current_price: currentPrice,
      original_price: originalPrice,
      product_url: liquor.product_url,
    });

    if (currentPrice < group.lowest_price) {
      group.lowest_price = currentPrice;
    }
  }

  return Array.from(groups.values());
}
