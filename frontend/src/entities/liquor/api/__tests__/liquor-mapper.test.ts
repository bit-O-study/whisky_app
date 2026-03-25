import { describe, expect, it } from "vitest";
import { mapLiquorDtoToEntity } from "../liquor-mapper";

describe("mapLiquorDtoToEntity", () => {
  it("maps mixed camelCase and snake_case fields into the liquor entity", () => {
    const entity = mapLiquorDtoToEntity({
      id: 7,
      product_code: "SKU-7",
      name: "Talisker 10",
      brand: "Talisker",
      category: "Single Malt",
      volume: 700,
      alcoholPercent: 45.8,
      country: "Scotland",
      current_price: 72000,
      originalPrice: 79000,
      imageUrl: "https://example.com/talisker.jpg",
      product_url: "https://example.com/talisker",
      source: "LOTTEON",
    });

    expect(entity).toEqual({
      id: 7,
      product_code: "SKU-7",
      name: "Talisker 10",
      brand: "Talisker",
      category: "Single Malt",
      volume: 700,
      alcohol_percent: 45.8,
      country: "Scotland",
      current_price: 72000,
      original_price: 79000,
      image_url: "https://example.com/talisker.jpg",
      product_url: "https://example.com/talisker",
      source: "LOTTEON",
    });
  });

  it("fills stable fallback values when the response is incomplete", () => {
    const entity = mapLiquorDtoToEntity({
      id: 0,
      name: "",
      brand: "",
      category: "",
      volume: Number.NaN,
      country: "",
      source: "",
    });

    expect(entity).toEqual({
      id: 0,
      product_code: "",
      name: "Unknown",
      brand: "Unknown",
      category: "Whisky",
      volume: 700,
      alcohol_percent: 0,
      country: "Unknown",
      current_price: 0,
      original_price: 0,
      image_url: "",
      product_url: "",
      source: "WHISKY_DB",
    });
  });
});
