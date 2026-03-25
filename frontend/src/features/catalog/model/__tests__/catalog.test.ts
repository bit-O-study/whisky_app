import { describe, expect, it } from "vitest";
import type { Liquor } from "../../../../entities/liquor/model/liquor";
import {
  getCatalogLoadErrorMessage,
  groupCatalogLiquors,
  mergeCatalogPageItems,
  shouldSkipInitialCatalogRequest,
  type CatalogPage,
} from "../catalog";

const macallanLotte = {
  id: 1,
  product_code: "MAC-12-LOTTEON",
  name: "Macallan 12",
  brand: "Macallan",
  category: "Single Malt",
  volume: 700,
  alcohol_percent: 40,
  country: "Scotland",
  current_price: 98000,
  original_price: 110000,
  image_url: "https://example.com/macallan.jpg",
  product_url: "https://example.com/macallan-lotteon",
  source: "LOTTEON",
} satisfies Liquor;

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
      items: [{ ...macallanLotte, id: 2, name: "Talisker 10" }],
      page: 1,
      size: 24,
      hasNext: false,
    } satisfies CatalogPage;

    expect(mergeCatalogPageItems([macallanLotte], { ...nextPage, page: 0 }, 0)).toEqual(nextPage.items);
    expect(mergeCatalogPageItems([macallanLotte], nextPage, 1)).toEqual([macallanLotte, ...nextPage.items]);
  });

  it("returns page-sensitive error messages", () => {
    expect(getCatalogLoadErrorMessage(0)).toBe("데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
    expect(getCatalogLoadErrorMessage(1)).toBe("추가 목록을 불러오지 못했습니다. 다시 시도해주세요.");
  });

  it("groups liquors by label and tracks the lowest vendor price", () => {
    const grouped = groupCatalogLiquors([
      macallanLotte,
      {
        ...macallanLotte,
        id: 2,
        source: "EMART",
        current_price: 94000,
        original_price: 109000,
        product_url: "https://example.com/macallan-emart",
      },
      {
        ...macallanLotte,
        id: 3,
        name: "Lagavulin 16",
        source: "LOTTEON",
      },
    ]);

    expect(grouped).toHaveLength(2);
    expect(grouped[0]).toMatchObject({
      name: "Macallan 12",
      lowest_price: 94000,
    });
    expect(grouped[0]?.vendors).toHaveLength(2);
  });
});
