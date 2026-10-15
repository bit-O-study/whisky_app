import type { CatalogCardItem } from "./catalog";
export const SOURCE_LABELS: Record<string, string> = { EMART: "이마트", LOTTEON: "롯데온", EMART_TRADERS: "트레이더스", COSTCO: "코스트코" };
export const sourceLabel = (source: string) => SOURCE_LABELS[source] ?? source;
const CATEGORY_LABELS: Record<string, string> = {
  singlemalt: "싱글몰트", blended: "블렌디드", blendedmalt: "블렌디드 몰트",
  singlegrain: "싱글그레인", bourbon: "버번", rye: "라이 위스키",
  whisky: "위스키", whiskey: "위스키", vodka: "보드카", gin: "진",
  rum: "럼", brandy: "브랜디", cognac: "코냑", sake: "사케",
  tequila: "테킬라", liqueur: "리큐르", wine: "와인", beer: "맥주",
};
export function categoryLabel(category: string) {
  const value = category.trim();
  const normalized = value.toLowerCase().replace(/[\s_-]+/g, "");
  if (!normalized || normalized === "unknown") return "";
  return CATEGORY_LABELS[normalized] ?? Object.values(CATEGORY_LABELS).find(label => label.replace(/\s+/g, "") === normalized) ?? value;
}
function itemCategory(item: CatalogCardItem) {
  return categoryLabel(item.sub_category || "") || categoryLabel(item.category);
}
export interface CatalogFilters { category: string; volume: string; source: string }
export const EMPTY_FILTERS: CatalogFilters = { category: "", volume: "", source: "" };
export function filterCatalog(items: CatalogCardItem[], filters: CatalogFilters) {
  return items.filter(item => (!filters.category || itemCategory(item) === categoryLabel(filters.category)) &&
    (!filters.volume || String(item.volume) === filters.volume) &&
    (!filters.source || item.vendors.some(vendor => vendor.source === filters.source)));
}
export function catalogFilterOptions(items: CatalogCardItem[]) {
  return {
    categories: [...new Set(items.map(itemCategory).filter(Boolean))].sort((a, b) => a.localeCompare(b, "ko")),
    volumes: [...new Set(items.map(item => item.volume).filter(value => value > 0))].sort((a, b) => a - b),
    sources: [...new Set(items.flatMap(item => item.vendors.map(vendor => vendor.source)))].sort(),
  };
}
export function checkedAt(value?: string) {
  if (!value || !Number.isFinite(Date.parse(value))) return "확인 시각 미제공";
  return new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(value));
}
