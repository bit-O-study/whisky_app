import { expect, test, type Page } from "@playwright/test";

const SEARCH_PLACEHOLDER = "위스키 · 브랜드 검색";

test("completed first page does not request another page after the search debounce", async ({ page }) => {
  const requests: number[] = [];
  await page.setViewportSize({ width: 1440, height: 1200 });
  await mockLiquorApis(page, baseLiquorList, { onCatalogPageRequested: value => requests.push(value) });
  await page.goto("/");
  await expect(page.locator(".compare-row")).toHaveCount(2);
  // Let the 250 ms search debounce elapse; a completed page must stay complete.
  await page.waitForTimeout(500);
  expect(requests).toEqual([0]);
  await expect(page.locator(".compare-row")).toHaveCount(2);
});

test("C comparison supports mobile filters, vendor prices and memo web link", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockLiquorApis(page, [baseLiquorList[0], { ...baseLiquorList[1], volume: 1000 }]);
  await page.goto("/");
  await expect(page.getByText("Macallan 12", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "프로젝트 메모" })).toHaveAttribute("href", "https://meeting-minutes-orcin.vercel.app");
  await page.getByLabel("정렬", { exact: true }).selectOption("lowest");
  await expect(page.locator(".compare-row").first()).toContainText("Talisker 10");
  // 휴대폰 필터는 한 줄 선택 상자(종류 · 용량 · 판매처)
  await page.getByRole("combobox", { name: "용량", exact: true }).selectOption({ label: "700ml" });
  await expect(page.locator(".compare-row")).toHaveCount(1);
  await page.getByRole("combobox", { name: "판매처", exact: true }).selectOption({ label: "이마트" });
  await page.locator("summary", { hasText: "가격 비교" }).click();
  const table = page.getByRole("table", { name: "Macallan 12 판매처별 가격" });
  await expect(table).toBeVisible();
  await expect(table.getByText("롯데온", { exact: true })).toBeVisible();
  await expect(table.getByRole("link", { name: /이마트에서/ })).toHaveAttribute("target", "_blank");
  await expect(table.getByRole("link", { name: /이마트에서/ })).toHaveAttribute("href", "https://example.com/macallan-12-emart");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole("button", { name: "초기화", exact: true }).click();
  await expect(page.locator(".compare-row")).toHaveCount(2);
});

test("vendor table shows dated prices with freshness and no fake link for store-only vendors", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  const now = Date.now();
  await mockLiquorApis(page, [{
    ...baseLiquorList[0],
    vendors: [
      { source: "COSTCO", current_price: 90000, original_price: 0, product_url: "", crawled_at: new Date(now - 150 * 86_400_000).toISOString() },
      { source: "EMART", current_price: 94000, original_price: 0, product_url: "https://example.com/macallan-12-emart", crawled_at: new Date(now - 2 * 86_400_000).toISOString() },
    ],
  }] as unknown as typeof baseLiquorList);
  await page.goto("/");
  await page.locator("summary", { hasText: "가격 비교" }).click();
  const table = page.getByRole("table", { name: "Macallan 12 판매처별 가격" });
  const costco = table.getByRole("row", { name: /코스트코/ });
  await expect(costco).toContainText("매장에서 확인");
  await expect(costco.getByRole("link")).toHaveCount(0);
  await expect(costco.locator('[data-tone="stale"]')).toHaveText("5개월 전");
  await expect(costco).toContainText(/20\d\d\.\d\d\.\d\d/);
  await expect(table.getByRole("row", { name: /이마트/ }).locator('[data-tone="new"]')).toHaveText("2일 전");
  // 최저가는 상세와 같은 기준: 최근 30일 가격(이마트 94,000원)이 5개월 전 코스트코 90,000원보다 앞선다
  await expect(page.locator(".compare-price strong")).toHaveText("94,000원");
  await expect(page.locator(".compare-price strong.is-stale")).toHaveCount(0);
});

const baseLiquorList = [
  {
    id: 1,
    product_code: "MAC-12",
    name: "Macallan 12",
    brand: "Macallan",
    category: "Single Malt",
    volume: 700,
    alcohol_percent: 40,
    country: "Scotland",
    image_url: "https://example.com/macallan-12.jpg",
    lowest_price: 94000,
    vendors: [
      {
        source: "EMART",
        current_price: 94000,
        original_price: 109000,
        product_url: "https://example.com/macallan-12-emart",
      },
      {
        source: "LOTTEON",
        current_price: 98000,
        original_price: 110000,
        product_url: "https://example.com/macallan-12-lotteon",
      },
    ],
  },
  {
    id: 2,
    product_code: "TAL-10",
    name: "Talisker 10",
    brand: "Talisker",
    category: "Single Malt",
    volume: 700,
    alcohol_percent: 45.8,
    country: "Scotland",
    image_url: "https://example.com/talisker-10.jpg",
    lowest_price: 72000,
    vendors: [
      {
        source: "LOTTEON",
        current_price: 72000,
        original_price: 79000,
        product_url: "https://example.com/talisker-10-lotteon",
      },
    ],
  },
];

function buildCatalogItems(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    product_code: `WHISKY-${index + 1}`,
    name: `Bottle ${index + 1}`,
    brand: `Brand ${Math.floor(index / 5) + 1}`,
    category: "Single Malt",
    volume: 700,
    alcohol_percent: 40,
    country: "Scotland",
    image_url: "https://example.com/whisky.jpg",
    lowest_price: 50000 + index * 1000,
    vendors: [
      {
        source: "LOTTEON",
        current_price: 50000 + index * 1000,
        original_price: 60000 + index * 1000,
        product_url: `https://example.com/whisky-${index + 1}`,
      },
    ],
  }));
}

interface MockLiquorApiOptions {
  onCatalogPageRequested?: (page: number) => void;
  failCatalogPages?: number[];
  failSearchPages?: number[];
}

async function mockLiquorApis(
  page: Page,
  catalogItems = baseLiquorList,
  options?: MockLiquorApiOptions,
) {
  await page.route("**/api/liquors/search**", async (route) => {
    const url = new URL(route.request().url());
    const keyword = url.searchParams.get("q") ?? "";
    const pageParam = Number(url.searchParams.get("page") ?? "0");
    const sizeParam = Number(url.searchParams.get("size") ?? "24");
    const shouldFail = options?.failSearchPages?.includes(pageParam);

    if (shouldFail && options) {
      options.failSearchPages = options.failSearchPages?.filter((candidate) => candidate !== pageParam);
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ message: "주류 검색 실패" }),
      });
      return;
    }

    const filtered = catalogItems.filter((item) => item.name.toLowerCase().includes(keyword.toLowerCase()));
    const start = pageParam * sizeParam;
    const end = start + sizeParam;
    const paged = filtered.slice(start, end);

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        items: paged,
        page: pageParam,
        size: sizeParam,
        hasNext: end < filtered.length,
      }),
    });
  });

  await page.route(/\/api\/liquors(\?.*)?$/, async (route) => {
    const url = new URL(route.request().url());
    const pageParam = Number(url.searchParams.get("page") ?? "0");
    const sizeParam = Number(url.searchParams.get("size") ?? "24");
    const shouldFail = options?.failCatalogPages?.includes(pageParam);

    if (shouldFail && options) {
      options.failCatalogPages = options.failCatalogPages?.filter((candidate) => candidate !== pageParam);
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ message: "주류 목록 조회 실패" }),
      });
      return;
    }

    const start = pageParam * sizeParam;
    const end = start + sizeParam;
    const paged = catalogItems.slice(start, end);

    options?.onCatalogPageRequested?.(pageParam);

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        items: paged,
        page: pageParam,
        size: sizeParam,
        hasNext: end < catalogItems.length,
      }),
    });
  });
}

test("catalog search shows filtered result count", async ({ page }) => {
  await mockLiquorApis(page);
  await page.goto("/");

  await expect(page.getByRole("link", { name: "위스키다모아" })).toHaveAttribute("href", "/");

  const searchBox = page.getByPlaceholder(SEARCH_PLACEHOLDER);
  const searchResponse = page.waitForResponse(response => response.url().includes("/api/liquors/search?q=Macallan") && response.ok());
  await searchBox.fill("Macallan");
  await searchResponse;

  await expect(page.getByText('"Macallan" 검색')).toBeVisible();
  await expect(page.getByRole("link", { name: "Macallan 12", exact: true })).toBeVisible();
  await expect(page.getByText("Talisker 10")).toHaveCount(0);
  await expect(page.getByText("상세 보기")).toHaveCount(0);
});

test("catalog loads next page on scroll", async ({ page }) => {
  const largeCatalog = buildCatalogItems(30);
  const requestedCatalogPages: number[] = [];

  await mockLiquorApis(page, largeCatalog, {
    onCatalogPageRequested: (catalogPage) => requestedCatalogPages.push(catalogPage),
  });
  await page.goto("/");

  const searchBox = page.getByPlaceholder(SEARCH_PLACEHOLDER);
  const firstSearchResponse = page.waitForResponse((response) =>
    response.url().includes("/api/liquors/search?q=Bottle&page=0&size=24") && response.ok(),
  );
  await searchBox.fill("Bottle");
  await firstSearchResponse;
  await expect(page.getByText('"Bottle" 검색')).toBeVisible();
  await expect(page.getByText(/^Bottle 1$/).first()).toBeVisible();
  await expect(page.getByText("Bottle 30")).toHaveCount(0);

  const nextPageResponse = page.waitForResponse((response) =>
    response.url().includes("/api/liquors/search?q=Bottle&page=1&size=24"),
  );

  await page.evaluate(() => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: "auto" });
  });

  await nextPageResponse;
  await expect(page.getByRole("link", { name: "Bottle 30", exact: true })).toBeVisible();
  expect(requestedCatalogPages).not.toContain(1);
});

test("catalog shows empty search result state", async ({ page }) => {
  await mockLiquorApis(page);
  await page.goto("/");

  const searchBox = page.getByPlaceholder(SEARCH_PLACEHOLDER);
  const searchResponse = page.waitForResponse(response => response.url().includes("/api/liquors/search?q=Lagavulin") && response.ok());
  await searchBox.fill("Lagavulin");
  await searchResponse;

  await expect(page.getByText('"Lagavulin" 결과가 없습니다')).toBeVisible();
  await expect(page.getByText("다른 검색어를 시도해보세요")).toBeVisible();
});

test("catalog keeps current items when loading the next page fails and recovers on retry", async ({ page }) => {
  const largeCatalog = buildCatalogItems(30);

  await mockLiquorApis(page, largeCatalog, {
    failSearchPages: [1],
  });
  await page.goto("/");

  const searchBox = page.getByPlaceholder(SEARCH_PLACEHOLDER);
  const firstSearchResponse = page.waitForResponse((response) =>
    response.url().includes("/api/liquors/search?q=Bottle&page=0&size=24") && response.ok(),
  );
  await searchBox.fill("Bottle");
  await firstSearchResponse;
  await expect(page.getByText('"Bottle" 검색')).toBeVisible();
  await expect(page.getByText(/^Bottle 1$/).first()).toBeVisible();

  const failedPageResponse = page.waitForResponse((response) =>
    response.url().includes("/api/liquors/search?q=Bottle&page=1&size=24"),
  );
  await page.evaluate(() => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: "auto" });
  });
  await failedPageResponse;

  await expect(page.getByText("추가 목록을 불러오지 못했습니다. 다시 시도해주세요.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Bottle 24", exact: true })).toBeVisible();
  await expect(page.getByText("Bottle 25")).toHaveCount(0);

  const retriedPageResponse = page.waitForResponse((response) =>
    response.url().includes("/api/liquors/search?q=Bottle&page=1&size=24") && response.status() === 200,
  );
  await page.getByRole("button", { name: "다시 시도" }).click();
  await retriedPageResponse;

  await expect(page.getByRole("link", { name: "Bottle 30", exact: true })).toBeVisible();
});
