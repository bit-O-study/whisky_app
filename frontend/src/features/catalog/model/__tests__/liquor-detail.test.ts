import { describe, expect, it } from "vitest";
import type { CatalogCardVendor } from "../catalog";
import {
  detailBrand,
  detailMetaLine,
  detailName,
  isStalePrice,
  onlineBestVendor,
  parseLiquorId,
  priceSummary,
  rankedVendors,
  tasteSummary,
} from "../liquor-detail";

const vendor = (source: string, current_price: number, product_url = `https://shop/${source}`) =>
  ({ source, current_price, product_url, original_price: 0, discount_percent: 0, crawled_at: "" }) as CatalogCardVendor;

describe("liquor detail display", () => {
  it("joins only collected metadata and hides Unknown placeholders", () => {
    expect(detailMetaLine({ category: "Whisky", sub_category: "", country: "" })).toBe("위스키");
    expect(detailMetaLine({ category: "Whisky", sub_category: "Single Malt", country: "스코틀랜드" })).toBe("싱글몰트 · 스코틀랜드");
    expect(detailMetaLine({ category: "Unknown", sub_category: "", country: "Unknown" })).toBe("");
    expect(detailBrand("Unknown")).toBe("");
    expect(detailBrand(" 조니워커 ")).toBe("조니워커");
  });

  it("drops a trailing volume only when it repeats the volume chip", () => {
    expect(detailName("조니워커 블루라벨 750ml", 750)).toBe("조니워커 블루라벨");
    expect(detailName("조니워커 블론드 (700ML)", 700)).toBe("조니워커 블론드");
    expect(detailName("발렌타인 17년 1L", 1000)).toBe("발렌타인 17년");
    // 이름과 DB 용량이 다르면 그 차이가 보이도록 그대로 둔다
    expect(detailName("벤치마크 1,750ml", 750)).toBe("벤치마크 1,750ml");
    expect(detailName("하이랜드 파크 17년 비트윈 유앤아이 2 700ml", 700)).toBe("하이랜드 파크 17년 비트윈 유앤아이 2");
    expect(detailName("700ml", 700)).toBe("700ml");
  });

  it("ranks only priced vendors and finds an online alternative to Costco", () => {
    const ranked = rankedVendors([vendor("EMART", 308000), vendor("LOTTEON", 0), vendor("COSTCO", 228790, ""), vendor("EMART_TRADERS", 259800)]);
    expect(ranked.map(v => v.source)).toEqual(["COSTCO", "EMART_TRADERS", "EMART"]);
    expect(onlineBestVendor(ranked)?.source).toBe("EMART_TRADERS");
    expect(onlineBestVendor([vendor("COSTCO", 1000)])).toBeNull();
    expect(rankedVendors(undefined)).toEqual([]);
  });

  it("marks prices older than 30 days as stale", () => {
    const now = Date.parse("2026-10-20T00:00:00Z");
    expect(isStalePrice("2026-10-15T00:00:00Z", now)).toBe(false);
    expect(isStalePrice("2026-05-20T00:00:00Z", now)).toBe(true);
    expect(isStalePrice("bad", now)).toBe(false);
    expect(isStalePrice(null, now)).toBe(false);
  });

  it("accepts only positive integer ids from the URL", () => {
    expect(parseLiquorId("863")).toBe(863);
    expect(["abc", "0", "-1", "1.5", "12abc", ""].map(parseLiquorId)).toEqual([null, null, null, null, null, null]);
  });
});

describe("price summary", () => {
  const now = Date.parse("2026-10-20T12:00:00Z");
  const at = (source: string, price: number, crawled_at: string, product_url = `https://shop/${source}`) =>
    ({ source, current_price: price, product_url, original_price: 0, discount_percent: 0, crawled_at }) as CatalogCardVendor;
  const blueLabel = [
    at("COSTCO", 228790, "2026-05-10T19:30:00Z", ""),
    at("EMART_TRADERS", 259800, "2026-10-14T22:47:00Z"),
    at("EMART", 308000, "2026-04-30T07:14:00Z"),
    at("LOTTEON", 328000, "2026-09-03T04:54:00Z"),
  ];

  it("heads with the cheapest price checked in the last 30 days and keeps the older cheaper one aside", () => {
    const s = priceSummary(blueLabel, now);
    expect(s.hero?.source).toBe("EMART_TRADERS");
    expect(s.recent).toBe(true);
    expect(s.olderCheaper?.source).toBe("COSTCO");
    expect(s.buy?.source).toBe("EMART_TRADERS");
    expect(s.lowestPrice).toBe(228790);
  });

  it("falls back to the overall lowest when every price is old", () => {
    const s = priceSummary([at("LOTTEON", 39800, "2026-09-03T00:00:00Z"), at("EMART", 54800, "2026-04-30T00:00:00Z")], now);
    expect(s).toMatchObject({ recent: false, olderCheaper: null });
    expect(s.hero?.source).toBe("LOTTEON");
    expect(priceSummary([], now)).toMatchObject({ hero: null, buy: null, lowestPrice: 0 });
  });

  it("summarises standout taste notes", () => {
    expect(tasteSummary({ sweet: 3, smoky: 2, fruity: 3.5, spicy: 2.5, woody: 3.5, body: 4 })).toBe("바디감이 묵직하고, 과일·우디 향이 도드라져요");
    expect(tasteSummary({ smoky: 4.5, sweet: 1 })).toBe("스모키 향이 도드라져요");
    expect(tasteSummary({ sweet: 2, body: null })).toBeNull();
  });
});
