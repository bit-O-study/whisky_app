import { describe, expect, it } from "vitest";
import {
  buildAdminLiquorInfoUpdatePatch,
  buildAdminLiquorImageStoragePath,
  buildAdminLiquorSearchFilter,
  fetchAdminLiquorInfoPageFromServerWithClient,
  mapAdminLiquorInfoRow,
  validateAdminLiquorImageFile,
  type AdminLiquorInfoUpdateInput,
} from "../admin-liquor-info-server";

interface RecordedCall {
  method: string;
  args: unknown[];
}

interface FakeError {
  code?: string;
  message?: string;
}

interface FakeRow {
  id: number;
  product_code: string | null;
  product_name: string | null;
  normalized_name: string | null;
  brand: string | null;
  category: string | null;
  class: string | null;
  country: string | null;
  volume_ml: number | null;
  alcohol_percent: number | null;
  image_url: string | null;
  updated_at: string | null;
  sweet: number | null;
  smoky: number | null;
  fruity: number | null;
  spicy: number | null;
  woody: number | null;
  body: number | null;
}

class FakeListQuery<T> {
  readonly calls: RecordedCall[] = [];

  constructor(private readonly result: { data: T[] | null; error: FakeError | null; status?: number }) {}

  select(columns: string) {
    this.calls.push({ method: "select", args: [columns] });
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

  then<TResult1 = { data: T[] | null; error: FakeError | null; status?: number }, TResult2 = never>(
    onfulfilled?: ((value: { data: T[] | null; error: FakeError | null; status?: number }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ) {
    return Promise.resolve(this.result).then(onfulfilled, onrejected);
  }
}

class FakeSupabaseClient {
  constructor(readonly liquorQuery: FakeListQuery<FakeRow>) {}

  from(table: "liquor") {
    if (table !== "liquor") {
      throw new Error(`Unexpected table: ${table}`);
    }

    return this.liquorQuery;
  }
}

const baseRows: FakeRow[] = [
  {
    id: 1,
    product_code: "MAC-12",
    product_name: "Macallan 12",
    normalized_name: "macallan 12",
    brand: "Macallan",
    category: "Single Malt",
    class: "스페이사이드 싱글몰트",
    country: "Scotland",
    volume_ml: 700,
    alcohol_percent: 40,
    image_url: "https://example.com/macallan.jpg",
    updated_at: "2026-05-01T00:00:00.000Z",
    sweet: null,
    smoky: null,
    fruity: null,
    spicy: null,
    woody: null,
    body: null,
  },
  {
    id: 2,
    product_code: "JW-BLACK",
    product_name: "Johnnie Walker Black",
    normalized_name: "johnnie walker black",
    brand: "Johnnie Walker",
    category: "Blended",
    class: "블렌디드 스카치",
    country: "Scotland",
    volume_ml: 700,
    alcohol_percent: 40,
    image_url: null,
    updated_at: "2026-04-30T00:00:00.000Z",
    sweet: null,
    smoky: null,
    fruity: null,
    spicy: null,
    woody: null,
    body: null,
  },
  {
    id: 3,
    product_code: "BT",
    product_name: "Buffalo Trace",
    normalized_name: "buffalo trace",
    brand: "Buffalo Trace",
    category: "Bourbon",
    class: "버번",
    country: "USA",
    volume_ml: 750,
    alcohol_percent: 45,
    image_url: null,
    updated_at: "2026-04-29T00:00:00.000Z",
    sweet: null,
    smoky: null,
    fruity: null,
    spicy: null,
    woody: null,
    body: null,
  },
];

describe("admin liquor info server helpers", () => {
  it("escapes admin search wildcards across non-price fields", () => {
    expect(buildAdminLiquorSearchFilter("ma%_")).toBe(
      "product_name.ilike.%ma\\%\\_%,normalized_name.ilike.%ma\\%\\_%,brand.ilike.%ma\\%\\_%,product_code.ilike.%ma\\%\\_%",
    );
  });

  it("maps class into the editor-facing whisky type field", () => {
    expect(mapAdminLiquorInfoRow(baseRows[0])).toMatchObject({
      id: 1,
      clazz: "스페이사이드 싱글몰트",
      image_url: "https://example.com/macallan.jpg",
    });
  });

  it("builds a whitelist update patch and ignores price-shaped input", () => {
    const patch = buildAdminLiquorInfoUpdatePatch({
      product_name: " 맥캘란 12 ",
      normalized_name: " macallan 12 ",
      brand: "THE MACALLAN",
      category: "Single Malt",
      clazz: "스페이사이드 싱글몰트",
      country: "Scotland",
      volume_ml: "700",
      alcohol_percent: "40",
      image_url: "https://example.com/macallan.webp",
      current_price: 1000,
    } as AdminLiquorInfoUpdateInput & { current_price: number });

    expect(patch).toEqual({
      product_name: "맥캘란 12",
      normalized_name: "macallan 12",
      brand: "THE MACALLAN",
      category: "Single Malt",
      "class": "스페이사이드 싱글몰트",
      country: "Scotland",
      volume_ml: 700,
      alcohol_percent: 40,
      image_url: "https://example.com/macallan.webp",
      sweet: null,
      smoky: null,
      fruity: null,
      spicy: null,
      woody: null,
      body: null,
    });
    expect(patch).not.toHaveProperty("current_price");
  });

  it("rejects non-http image URLs", () => {
    expect(() =>
      buildAdminLiquorInfoUpdatePatch({
        product_name: "Macallan 12",
        normalized_name: "macallan 12",
        image_url: "ftp://example.com/macallan.webp",
      }),
    ).toThrow("이미지 URL은 http 또는 https URL이어야 합니다.");
  });

  it("builds stable storage paths from safe file names and image content types", () => {
    expect(
      buildAdminLiquorImageStoragePath({
        liquorId: 12.8,
        fileName: "Macallan 12 Bottle.png",
        contentType: "image/png",
        timestamp: 1710000000000,
      }),
    ).toBe("admin-liquor-images/12/1710000000000-macallan-12-bottle.png");
  });

  it("validates supported image upload constraints", () => {
    expect(
      validateAdminLiquorImageFile({
        name: "bottle.webp",
        type: "image/webp",
        size: 1024,
        arrayBuffer: async () => new ArrayBuffer(0),
      }),
    ).toEqual({
      contentType: "image/webp",
      extension: "webp",
    });

    expect(() =>
      validateAdminLiquorImageFile({
        name: "bottle.svg",
        type: "image/svg+xml",
        size: 1024,
        arrayBuffer: async () => new ArrayBuffer(0),
      }),
    ).toThrow("jpg, png, webp, avif, gif 이미지만 업로드할 수 있습니다.");

    expect(() =>
      validateAdminLiquorImageFile({
        name: "large.jpg",
        type: "image/jpeg",
        size: 7 * 1024 * 1024,
        arrayBuffer: async () => new ArrayBuffer(0),
      }),
    ).toThrow("이미지는 6MB 이하만 업로드할 수 있습니다.");
  });
});

describe("fetchAdminLiquorInfoPageFromServerWithClient", () => {
  it("loads liquor rows without querying price data", async () => {
    const liquorQuery = new FakeListQuery({
      data: baseRows,
      error: null,
    });

    const page = await fetchAdminLiquorInfoPageFromServerWithClient(
      new FakeSupabaseClient(liquorQuery),
      { keyword: "mac", page: 0, size: 2 },
    );

    expect(page).toMatchObject({
      page: 0,
      size: 2,
      hasNext: true,
    });
    expect(page.items).toHaveLength(2);
    expect(liquorQuery.calls).toContainEqual({
      method: "range",
      args: [0, 2],
    });
    expect(liquorQuery.calls.some((call) => call.method === "or")).toBe(true);
  });
});
