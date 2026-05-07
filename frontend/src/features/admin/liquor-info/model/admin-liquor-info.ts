export interface AdminLiquorInfoItem {
  id: number;
  product_code: string;
  product_name: string;
  normalized_name: string;
  brand: string;
  category: string;
  clazz: string;
  country: string;
  volume_ml: number | null;
  alcohol_percent: number | null;
  image_url: string;
  updated_at: string;
  sweet: number | null;
  smoky: number | null;
  fruity: number | null;
  spicy: number | null;
  woody: number | null;
  body: number | null;
}

export interface AdminLiquorInfoPage {
  items: AdminLiquorInfoItem[];
  page: number;
  size: number;
  hasNext: boolean;
}

export interface AdminLiquorInfoFormState {
  product_name: string;
  normalized_name: string;
  brand: string;
  category: string;
  clazz: string;
  country: string;
  volume_ml: string;
  alcohol_percent: string;
  image_url: string;
  sweet: string;
  smoky: string;
  fruity: string;
  spicy: string;
  woody: string;
  body: string;
}

export const EMPTY_ADMIN_LIQUOR_INFO_FORM: AdminLiquorInfoFormState = {
  product_name: "",
  normalized_name: "",
  brand: "",
  category: "",
  clazz: "",
  country: "",
  volume_ml: "",
  alcohol_percent: "",
  image_url: "",
  sweet: "",
  smoky: "",
  fruity: "",
  spicy: "",
  woody: "",
  body: "",
};

export const FLAVOR_AXIS_KEYS = ["sweet", "smoky", "fruity", "spicy", "woody", "body"] as const;
export type FlavorAxisKey = (typeof FLAVOR_AXIS_KEYS)[number];

export const FLAVOR_AXIS_LABELS: Record<FlavorAxisKey, string> = {
  sweet: "단맛",
  smoky: "스모키",
  fruity: "과일",
  spicy: "스파이시",
  woody: "우디",
  body: "바디",
};

export const COMMON_WHISKY_TYPES = [
  "싱글몰트",
  "블렌디드",
  "블렌디드 스카치",
  "스페이사이드 싱글몰트",
  "하이랜드 싱글몰트",
  "아일라 싱글몰트",
  "버번",
  "재패니즈 블렌디드",
  "아이리시 블렌디드",
];

function formatNumberInput(value: number | null) {
  return typeof value === "number" && Number.isFinite(value) ? String(value) : "";
}

export function buildAdminLiquorInfoFormState(item: AdminLiquorInfoItem): AdminLiquorInfoFormState {
  return {
    product_name: item.product_name,
    normalized_name: item.normalized_name,
    brand: item.brand,
    category: item.category,
    clazz: item.clazz,
    country: item.country,
    volume_ml: formatNumberInput(item.volume_ml),
    alcohol_percent: formatNumberInput(item.alcohol_percent),
    image_url: item.image_url,
    sweet: formatNumberInput(item.sweet),
    smoky: formatNumberInput(item.smoky),
    fruity: formatNumberInput(item.fruity),
    spicy: formatNumberInput(item.spicy),
    woody: formatNumberInput(item.woody),
    body: formatNumberInput(item.body),
  };
}

export function formatAdminLiquorSummary(item: AdminLiquorInfoItem) {
  return [item.brand, item.category || item.clazz, item.country].filter(Boolean).join(" · ");
}
