import { describe, expect, it } from "vitest";
import {
  buildCatalogSearchFilter,
  buildCatalogSearchPlan,
  fetchCatalogPageFromServerWithClient,
  normalizeCatalogSearchKeyword,
} from "../catalog-server";

interface RecordedCall {
  method: string;
  args: unknown[];
}

interface FakeError {
  code?: string;
  message?: string;
}

class FakeQuery<T extends { id?: number; liquor_id?: number }> {
  readonly calls: RecordedCall[] = [];

  constructor(private readonly result: { data: T[] | null; error: FakeError | null; status?: number }) {}

  select(columns: string, options?: { count?: "exact" | "planned" | "estimated" }) {
    this.calls.push({ method: "select", args: [columns, options] });
    return this;
  }

  order(column: string, options: { ascending: boolean }) {
    this.calls.push({ method: "order", args: [column, options] });
    return this;
  }

  range(from: number, to: number) {
    this.calls.push({ method: "range", args: [from, to] });
    return this;
  }

  or(filter: string) {
    this.calls.push({ method: "or", args: [filter] });
    return this;
  }

  in(column: string, values: number[]) {
    this.calls.push({ method: "in", args: [column, values] });
    return this;
  }

  then<TResult1 = { data: T[] | null; error: FakeError | null; status?: number }, TResult2 = never>(
    onfulfilled?: ((value: { data: T[] | null; error: FakeError | null; status?: number }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ) {
    return Promise.resolve(this.result).then(onfulfilled, onrejected);
  }
}

class FakeSupabaseClient {
  constructor(
    readonly latestPriceQuery: FakeQuery<{
      id: number;
      normalized_name: string | null;
      brand: string | null;
      category: string | null;
      volume_ml: number | null;
      alcohol_percent: number | null;
      country: string | null;
      product_code: string | null;
      product_name: string | null;
      product_url: string | null;
      image_url: string | null;
      updated_at: string | null;
      source: string | null;
      current_price: number | null;
      original_price: number | null;
      crawled_at: string | null;
    }>,
    readonly liquorQuery: FakeQuery<{
      id: number;
      normalized_name: string | null;
      brand: string | null;
      category: string | null;
      volume_ml: number | null;
      alcohol_percent: number | null;
      country: string | null;
      product_code: string | null;
      product_name: string | null;
      product_url: string | null;
      image_url: string | null;
      updated_at: string | null;
    }>,
    readonly priceQuery: FakeQuery<{
      liquor_id: number;
      source: string | null;
      current_price: number | null;
      original_price: number | null;
      crawled_at: string | null;
    }>,
  ) {}

  from(table: "liquor" | "liquor_price" | "liquor_catalog_latest_price") {
    if (table === "liquor_catalog_latest_price") {
      return this.latestPriceQuery;
    }
    if (table === "liquor") {
      return this.liquorQuery;
    }
    return this.priceQuery;
  }
}

describe("catalog server search plan", () => {
  it("keeps 1-2 character searches allowed but marks them as short-query mode", () => {
    expect(normalizeCatalogSearchKeyword(" M ")).toEqual({ value: "M", mode: "short" });
    expect(normalizeCatalogSearchKeyword("Ma")).toEqual({ value: "Ma", mode: "short" });
    expect(normalizeCatalogSearchKeyword("Mac")).toEqual({ value: "Mac", mode: "trigram" });
  });

  it("uses size+1 pagination and disables exact count for hot-path searches", () => {
    const plan = buildCatalogSearchPlan({
      keyword: "Ma",
      page: 1,
      size: 24,
    });

    expect(plan).toMatchObject({
      keyword: "Ma",
      mode: "short",
      page: 1,
      size: 24,
      from: 24,
      to: 48,
      fetchSize: 25,
      usesExactCount: false,
    });
  });

  it("escapes wildcard characters in the ilike filter", () => {
    expect(buildCatalogSearchFilter("ma%_")).toBe(
      "product_name.ilike.%ma\\%\\_%,normalized_name.ilike.%ma\\%\\_%,brand.ilike.%ma\\%\\_%",
    );
  });
});

describe("fetchCatalogPageFromServerWithClient", () => {
  it("uses the latest-price view when it exists and skips the price lookup query", async () => {
    const latestPriceQuery = new FakeQuery({
      data: [
        {
          id: 1,
          normalized_name: "macallan 12",
          brand: "Macallan",
          category: "Single Malt",
          volume_ml: 700,
          alcohol_percent: 40,
          country: "Scotland",
          product_code: "MAC-12",
          product_name: "Macallan 12",
          product_url: "https://example.com/mac-12",
          image_url: "https://example.com/mac-12.jpg",
          updated_at: "2026-03-25T10:00:00.000Z",
          source: "LOTTEON",
          current_price: 101000,
          original_price: 125000,
          crawled_at: "2026-03-25T11:00:00.000Z",
        },
        {
          id: 2,
          normalized_name: "macallan rare",
          brand: "Macallan",
          category: "Single Malt",
          volume_ml: 700,
          alcohol_percent: 43,
          country: "Scotland",
          product_code: "MAC-RARE",
          product_name: "Macallan Rare",
          product_url: "https://example.com/mac-rare",
          image_url: "https://example.com/mac-rare.jpg",
          updated_at: "2026-03-25T09:00:00.000Z",
          source: "EMART",
          current_price: 98000,
          original_price: 115000,
          crawled_at: "2026-03-25T09:30:00.000Z",
        },
        {
          id: 3,
          normalized_name: "macallan cask",
          brand: "Macallan",
          category: "Single Malt",
          volume_ml: 700,
          alcohol_percent: 46,
          country: "Scotland",
          product_code: "MAC-CASK",
          product_name: "Macallan Cask",
          product_url: "https://example.com/mac-cask",
          image_url: "https://example.com/mac-cask.jpg",
          updated_at: "2026-03-25T08:00:00.000Z",
          source: "LOTTEON",
          current_price: 112000,
          original_price: 135000,
          crawled_at: "2026-03-25T08:30:00.000Z",
        },
      ],
      error: null,
    });
    const liquorQuery = new FakeQuery({
      data: [],
      error: null,
    });
    const priceQuery = new FakeQuery({
      data: [],
      error: null,
    });

    const page = await fetchCatalogPageFromServerWithClient(
      new FakeSupabaseClient(latestPriceQuery, liquorQuery, priceQuery),
      { keyword: "Mac", page: 0, size: 2 },
    );

    expect(page).toMatchObject({
      page: 0,
      size: 2,
      hasNext: true,
    });
    expect(page.items[0]).toMatchObject({
      id: 1,
      current_price: 101000,
      source: "LOTTEON",
    });
    expect(liquorQuery.calls).toHaveLength(0);
    expect(priceQuery.calls).toHaveLength(0);
  });

  it("falls back to the price lookup query when the latest-price view does not exist", async () => {
    const latestPriceQuery = new FakeQuery({
      data: null,
      error: {
        code: "42P01",
        message: "relation \"liquor_catalog_latest_price\" does not exist",
      },
    });
    const liquorQuery = new FakeQuery({
      data: [
        {
          id: 1,
          normalized_name: "macallan 12",
          brand: "Macallan",
          category: "Single Malt",
          volume_ml: 700,
          alcohol_percent: 40,
          country: "Scotland",
          product_code: "MAC-12",
          product_name: "Macallan 12",
          product_url: "https://example.com/mac-12",
          image_url: "https://example.com/mac-12.jpg",
          updated_at: "2026-03-25T10:00:00.000Z",
        },
        {
          id: 2,
          normalized_name: "macallan rare",
          brand: "Macallan",
          category: "Single Malt",
          volume_ml: 700,
          alcohol_percent: 43,
          country: "Scotland",
          product_code: "MAC-RARE",
          product_name: "Macallan Rare",
          product_url: "https://example.com/mac-rare",
          image_url: "https://example.com/mac-rare.jpg",
          updated_at: "2026-03-25T09:00:00.000Z",
        },
        {
          id: 3,
          normalized_name: "macallan cask",
          brand: "Macallan",
          category: "Single Malt",
          volume_ml: 700,
          alcohol_percent: 46,
          country: "Scotland",
          product_code: "MAC-CASK",
          product_name: "Macallan Cask",
          product_url: "https://example.com/mac-cask",
          image_url: "https://example.com/mac-cask.jpg",
          updated_at: "2026-03-25T08:00:00.000Z",
        },
      ],
      error: null,
    });
    const priceQuery = new FakeQuery({
      data: [
        {
          liquor_id: 1,
          source: "LOTTEON",
          current_price: 110000,
          original_price: 125000,
          crawled_at: "2026-03-25T08:00:00.000Z",
        },
        {
          liquor_id: 1,
          source: "LOTTEON",
          current_price: 105000,
          original_price: 125000,
          crawled_at: "2026-03-25T11:00:00.000Z",
        },
        {
          liquor_id: 2,
          source: "EMART",
          current_price: 98000,
          original_price: 115000,
          crawled_at: "2026-03-25T09:30:00.000Z",
        },
      ],
      error: null,
    });

    const page = await fetchCatalogPageFromServerWithClient(
      new FakeSupabaseClient(latestPriceQuery, liquorQuery, priceQuery),
      { keyword: "Ma", page: 0, size: 2 },
    );

    expect(page).toMatchObject({
      page: 0,
      size: 2,
      hasNext: true,
    });
    expect(page.items[0]).toMatchObject({
      id: 1,
      current_price: 105000,
      original_price: 125000,
    });
    expect(liquorQuery.calls).toContainEqual({
      method: "range",
      args: [0, 2],
    });
    expect(priceQuery.calls).toContainEqual({
      method: "in",
      args: ["liquor_id", [1, 2]],
    });
  });

  it("returns an empty page on 416 without loading prices", async () => {
    const latestPriceQuery = new FakeQuery({
      data: null,
      error: {
        code: "42P01",
        message: "relation \"liquor_catalog_latest_price\" does not exist",
      },
    });
    const liquorQuery = new FakeQuery({
      data: null,
      error: null,
      status: 416,
    });
    const priceQuery = new FakeQuery({
      data: [],
      error: null,
    });

    const page = await fetchCatalogPageFromServerWithClient(
      new FakeSupabaseClient(latestPriceQuery, liquorQuery, priceQuery),
      { keyword: "Mac", page: 9, size: 24 },
    );

    expect(page).toEqual({
      items: [],
      page: 9,
      size: 24,
      hasNext: false,
    });
    expect(priceQuery.calls).toHaveLength(0);
  });
});
