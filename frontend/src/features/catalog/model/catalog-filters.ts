import type { CatalogCardItem } from "./catalog";
export const SOURCE_LABELS: Record<string, string> = { EMART: "이마트", LOTTEON: "롯데온", EMART_TRADERS: "트레이더스", COSTCO: "코스트코" };
export const sourceLabel = (source: string) => SOURCE_LABELS[source] ?? source;
const CATEGORY_LABELS: Record<string, string> = { "Single Malt": "싱글몰트", "Blended": "블렌디드", "Bourbon": "버번" };
export const categoryLabel = (category: string) => CATEGORY_LABELS[category] ?? category;
export interface CatalogFilters { category: string; volume: string; source: string }
export const EMPTY_FILTERS: CatalogFilters = { category: "", volume: "", source: "" };
export function filterCatalog(items: CatalogCardItem[], filters: CatalogFilters) {
  return items.filter(item => (!filters.category || (item.sub_category || item.category) === filters.category) &&
    (!filters.volume || String(item.volume) === filters.volume) &&
    (!filters.source || item.vendors.some(vendor => vendor.source === filters.source)));
}
export function catalogFilterOptions(items: CatalogCardItem[]) {
  return {
    categories: [...new Set(items.map(item => item.sub_category || item.category).filter(value => value && value !== "Unknown"))].sort(),
    volumes: [...new Set(items.map(item => item.volume).filter(value => value > 0))].sort((a, b) => a - b),
    sources: [...new Set(items.flatMap(item => item.vendors.map(vendor => vendor.source)))].sort(),
  };
}
export function checkedAt(value?: string) {
  if (!value || !Number.isFinite(Date.parse(value))) return "확인 시각 미제공";
  return new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(value));
}
