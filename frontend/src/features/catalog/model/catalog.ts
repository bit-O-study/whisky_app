export interface CatalogCardVendor {
  source: string;
  current_price: number;
  original_price: number;
  product_url: string;
}

export interface CatalogCardItem {
  id: number;
  product_code: string;
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

export interface CatalogPage {
  items: CatalogCardItem[];
  page: number;
  size: number;
  hasNext: boolean;
}

interface CatalogRequestSkipParams {
  hasInitialItems: boolean;
  hasInitialError: boolean;
  query: string;
  page: number;
  initialPage: number;
  reloadToken: number;
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

export function mergeCatalogPageItems(previousItems: CatalogCardItem[], nextPage: CatalogPage, page: number) {
  return page === 0 ? nextPage.items : [...previousItems, ...nextPage.items];
}

export function getCatalogLoadErrorMessage(page: number) {
  return page === 0
    ? "데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요."
    : "추가 목록을 불러오지 못했습니다. 다시 시도해주세요.";
}
