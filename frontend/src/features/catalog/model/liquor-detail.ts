import type { CatalogCardItem, CatalogCardVendor } from "./catalog";
import { categoryLabel } from "./catalog-filters";
import { STALE_PRICE_DAYS } from "./price-freshness";

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

export interface PriceSummary {
  /** 머리에 크게 보일 가격 — 최근 30일 가격이 있으면 그중 최저, 없으면 전체 최저. */
  hero: CatalogCardVendor | null;
  /** hero 가 최근 30일 기준인가. */
  recent: boolean;
  /** hero 보다 싼 오래된 가격(있으면 따로 알린다). */
  olderCheaper: CatalogCardVendor | null;
  /** 구매 버튼이 갈 곳 — 링크 있는 판매처 중 최근 가격 우선 최저. */
  buy: CatalogCardVendor | null;
  /** 판매처 목록 차액의 기준(전체 최저가). */
  lowestPrice: number;
}

/** 상세 최저가 요약. 오래된 가격이 최신 가격처럼 머리에 오르지 않게 한다. */
export function priceSummary(vendors: readonly CatalogCardVendor[] | null | undefined, now = Date.now()): PriceSummary {
  const ranked = rankedVendors(vendors);
  const fresh = ranked.filter((v) => !isStalePrice(v.crawled_at, now));
  const hero = fresh[0] ?? ranked[0] ?? null;
  const olderCheaper = hero && ranked[0] && ranked[0] !== hero ? ranked[0] : null;
  const linked = (v: CatalogCardVendor) => !isCostcoVendor(v.source) && !!v.product_url;
  const buy = fresh.find(linked) ?? ranked.find(linked) ?? null;
  return { hero, recent: fresh.length > 0, olderCheaper, buy, lowestPrice: ranked[0]?.current_price ?? 0 };
}

const TASTE_LABELS: Record<string, string> = { sweet: "단맛", smoky: "스모키", fruity: "과일", spicy: "스파이시", woody: "우디", body: "바디" };

/** 맛 점수에서 도드라지는 축으로 한 줄 요약(3.5점 이상). 값이 없거나 두드러진 축이 없으면 null. */
export function tasteSummary(values: Partial<Record<keyof typeof TASTE_LABELS, number | null>>) {
  const scored = Object.entries(values)
    .filter((entry): entry is [string, number] => typeof entry[1] === "number" && Number.isFinite(entry[1]))
    .filter(([, v]) => v >= 3.5)
    .sort((a, b) => b[1] - a[1]);
  if (scored.length === 0) return null;
  const body = scored.find(([k]) => k === "body");
  const notes = scored.filter(([k]) => k !== "body").slice(0, 2).map(([k]) => TASTE_LABELS[k]);
  if (body && notes.length) return `바디감이 묵직하고, ${notes.join("·")} 향이 도드라져요`;
  if (body) return "바디감이 묵직해요";
  return `${notes.join("·")} 향이 도드라져요`;
}
