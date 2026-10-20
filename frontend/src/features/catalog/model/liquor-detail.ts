import type { CatalogCardItem, CatalogCardVendor } from "./catalog";
import { categoryLabel } from "./catalog-filters";

/** 이 기간보다 오래 갱신되지 않은 판매처 가격은 "오래된 가격"으로 표시한다. */
export const STALE_PRICE_DAYS = 30;

const isBlank = (value?: string | null) => {
  const text = (value ?? "").trim();
  return !text || text.toLowerCase() === "unknown";
};

/** 브랜드가 비었거나 Unknown 이면 빈 문자열. */
export function detailBrand(brand?: string | null) {
  return isBlank(brand) ? "" : (brand ?? "").trim();
}

/** "싱글몰트 · 스코틀랜드"처럼 있는 값만 이어 붙인다. 비면 빈 문자열. */
export function detailMetaLine(liquor: Pick<CatalogCardItem, "category" | "sub_category" | "country">) {
  const category = categoryLabel(liquor.sub_category || "") || categoryLabel(liquor.category || "");
  const country = isBlank(liquor.country) ? "" : liquor.country.trim();
  return [category, country].filter(Boolean).join(" · ");
}

const TRAILING_VOLUME = /\s*[([]?\s*(\d+(?:[.,]\d+)?)\s*(ml|l)\s*[)\]]?\s*$/i;

/** 이름 끝의 용량 표기("750ml", "(700ML)")가 용량 칩과 같으면 화면에서만 뺀다. 다르면 그대로 둔다. */
export function detailName(name: string, volume: number) {
  const match = name.match(TRAILING_VOLUME);
  if (!match || !(volume > 0)) return name;
  const amount = Number(match[1].replace(",", "."));
  const ml = match[2].toLowerCase() === "l" ? amount * 1000 : amount;
  const rest = name.slice(0, match.index).trim();
  return Math.round(ml) === Math.round(volume) && rest ? rest : name;
}

/** 가격이 있는 판매처만 싼 순서로. 0원·잘못된 가격은 비교에서 뺀다. */
export function rankedVendors(vendors: readonly CatalogCardVendor[] | null | undefined) {
  return (vendors ?? [])
    .filter((vendor) => Number.isFinite(vendor.current_price) && vendor.current_price > 0)
    .slice()
    .sort((a, b) => a.current_price - b.current_price);
}

export function isCostcoVendor(source: string) {
  return source.trim().toUpperCase() === "COSTCO";
}

/** 코스트코(매장 전용)가 최저가일 때 대신 안내할 온라인 최저가 판매처. */
export function onlineBestVendor(ranked: readonly CatalogCardVendor[]) {
  return ranked.find((vendor) => !isCostcoVendor(vendor.source) && !!vendor.product_url) ?? null;
}

export function isStalePrice(crawledAt: string | null | undefined, now = Date.now(), days = STALE_PRICE_DAYS) {
  if (!crawledAt) return false;
  const ts = new Date(crawledAt).getTime();
  return Number.isFinite(ts) && now - ts > days * 86_400_000;
}

/** 주소의 상품 번호. 양의 정수만 받는다. */
export function parseLiquorId(id: string) {
  return /^\d{1,10}$/.test(id) && Number(id) > 0 ? Number(id) : null;
}
