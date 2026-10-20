import { describe, expect, it } from "vitest";
import type { CatalogCardVendor } from "../catalog";
import {
  detailBrand,
  detailMetaLine,
  detailName,
  isStalePrice,
  onlineBestVendor,
  parseLiquorId,
  rankedVendors,
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
