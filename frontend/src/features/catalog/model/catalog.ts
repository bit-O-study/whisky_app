export interface CatalogCardVendor {
  source: string;
  current_price: number;
  original_price: number;
  product_url: string;
  discount_percent: number;
  crawled_at: string;
}

export interface CatalogCardItem {
  id: number;
  product_code: string;
  name: string;
  brand: string;
  category: string;
  sub_category: string;
  country: string;
  alcohol_percent: number;
  volume: number;
  image_url: string;
  vendors: CatalogCardVendor[];
  lowest_price: number;
  view_count: number;
  sweet: number | null;
  smoky: number | null;
  fruity: number | null;
  spicy: number | null;
  woody: number | null;
  body: number | null;
}

export const FLAVOR_AXES = ["sweet", "smoky", "fruity", "body"] as const;
export type FlavorAxis = (typeof FLAVOR_AXES)[number];

export const FLAVOR_AXIS_LABELS: Record<FlavorAxis, { label: string; tagline: string }> = {
  sweet: { label: "달콤한 한 잔", tagline: "달콤함이 풍부한 양주" },
  smoky: { label: "스모키한 한 잔", tagline: "피트와 스모크가 강한 양주" },
  fruity: { label: "과일향 풍부한 한 잔", tagline: "신선한 과일 노트가 가득한 양주" },
  body: { label: "묵직한 한 잔", tagline: "바디감이 묵직한 양주" },
};

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
