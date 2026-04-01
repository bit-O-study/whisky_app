import { describe, expect, it } from "vitest";
import {
  getCatalogLoadErrorMessage,
  getLiquorDetailHref,
  mergeCatalogPageItems,
  shouldSkipInitialCatalogRequest,
  type CatalogCardItem,
  type CatalogPage,
} from "../catalog";

const macallanCard = {
  id: 1,
  product_code: "MAC-12",
  name: "Macallan 12",
  brand: "Macallan",
  category: "Single Malt",
  volume: 700,
  alcohol_percent: 40,
  country: "Scotland",
  image_url: "https://example.com/macallan.jpg",
  lowest_price: 94000,
  vendors: [
    {
      source: "LOTTEON",
      current_price: 98000,
      original_price: 110000,
      product_url: "https://example.com/macallan-lotteon",
    },
    {
      source: "EMART",
      current_price: 94000,
      original_price: 109000,
      product_url: "https://example.com/macallan-emart",
    },
  ],
} satisfies CatalogCardItem;

describe("catalog model", () => {
  it("skips the first client fetch only when SSR data is still valid", () => {
    expect(
      shouldSkipInitialCatalogRequest({
        hasInitialItems: true,
        hasInitialError: false,
        query: "",
        page: 0,
        initialPage: 0,
        reloadToken: 0,
      }),
    ).toBe(true);

    expect(
      shouldSkipInitialCatalogRequest({
        hasInitialItems: true,
        hasInitialError: false,
        query: "Macallan",
        page: 0,
        initialPage: 0,
        reloadToken: 0,
      }),
    ).toBe(false);
  });

  it("replaces first-page items and appends next-page items", () => {
    const nextPage = {
      items: [{ ...macallanCard, id: 2, product_code: "TAL-10", name: "Talisker 10" }],
      page: 1,
      size: 24,
      hasNext: false,
    } satisfies CatalogPage;

    expect(mergeCatalogPageItems([macallanCard], { ...nextPage, page: 0 }, 0)).toEqual(nextPage.items);
    expect(mergeCatalogPageItems([macallanCard], nextPage, 1)).toEqual([macallanCard, ...nextPage.items]);
  });

  it("returns page-sensitive error messages", () => {
    expect(getCatalogLoadErrorMessage(0)).toBe("데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
    expect(getCatalogLoadErrorMessage(1)).toBe("추가 목록을 불러오지 못했습니다. 다시 시도해주세요.");
  });

  it("builds liquor detail hrefs with the liquor id", () => {
    expect(getLiquorDetailHref(123)).toBe("/liquors/123");
  });
});
