import { describe, expect, it } from "vitest";
import { catalogFilterOptions, categoryLabel, checkedAt, EMPTY_FILTERS, filterCatalog } from "../catalog-filters";
import type { CatalogCardItem } from "../catalog";
const items = [
  { id: 1, category: "Single Malt", sub_category: "", volume: 700, vendors: [{ source: "EMART" }, { source: "LOTTEON" }] },
  { id: 2, category: "Whisky", sub_category: "Bourbon", volume: 1000, vendors: [{ source: "LOTTEON" }] },
  { id: 3, category: "Unknown", volume: 0, vendors: [] },
] as CatalogCardItem[];
describe("catalog filters", () => {
  it("combines filters and uses subcategory without changing vendor comparisons", () => {
    expect(filterCatalog(items, EMPTY_FILTERS)).toHaveLength(3);
    const result = filterCatalog(items, { category: "Single Malt", volume: "700", source: "EMART" });
    expect(result.map(item => item.id)).toEqual([1]);
    expect(result[0].vendors).toHaveLength(2);
    expect(filterCatalog(items, { category: "Bourbon", volume: "700", source: "" })).toEqual([]);
    expect(filterCatalog(items, { category: "Bourbon", volume: "1000", source: "LOTTEON" }).map(item => item.id)).toEqual([2]);
  });
  it("only offers collected, unique metadata and does not invent timestamps", () => {
    expect(catalogFilterOptions(items)).toEqual({ categories: ["버번", "싱글몰트"], volumes: [700, 1000], sources: ["EMART", "LOTTEON"] });
    expect(checkedAt("bad")).toBe("확인 시각 미제공");
    expect(checkedAt()).toBe("확인 시각 미제공");
    expect(checkedAt("2026-10-15T00:30:00Z")).toContain("09:30");
  });
  it("groups Korean and English aliases and matches every item in the group", () => {
    const mixed = ["Single Malt", "싱글몰트", " single_malt ", "싱글 몰트"].map((category, id) => ({ ...items[0], id, category }));
    expect(catalogFilterOptions(mixed).categories).toEqual(["싱글몰트"]);
    expect(filterCatalog(mixed, { ...EMPTY_FILTERS, category: "싱글몰트" })).toHaveLength(4);
    expect(["Whisky", "Whiskey", "Vodka", "Gin", "Rum", "Brandy", "Sake"].map(categoryLabel)).toEqual(["위스키", "위스키", "보드카", "진", "럼", "브랜디", "사케"]);
    expect(catalogFilterOptions([{ ...items[0], category: "Whisky", sub_category: "Unknown" }]).categories).toEqual(["위스키"]);
  });
});
