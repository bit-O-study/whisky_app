import { expect, test, type Page } from "@playwright/test";

const baseLiquorList = [
  {
    id: 1,
    productCode: "MAC-12-LOTTEON",
    name: "Macallan 12",
    brand: "Macallan",
    category: "Single Malt",
    volume: 700,
    alcoholPercent: 40,
    country: "Scotland",
    currentPrice: 98000,
    originalPrice: 110000,
    imageUrl: "https://example.com/macallan-12.jpg",
    productUrl: "https://example.com/macallan-12-lotteon",
    source: "LOTTEON",
  },
  {
    id: 2,
    productCode: "MAC-12-EMART",
    name: "Macallan 12",
    brand: "Macallan",
    category: "Single Malt",
    volume: 700,
    alcoholPercent: 40,
    country: "Scotland",
    currentPrice: 94000,
    originalPrice: 109000,
    imageUrl: "https://example.com/macallan-12.jpg",
    productUrl: "https://example.com/macallan-12-emart",
    source: "EMART",
  },
  {
    id: 3,
    productCode: "TAL-10-LOTTEON",
    name: "Talisker 10",
    brand: "Talisker",
    category: "Single Malt",
    volume: 700,
    alcoholPercent: 45.8,
    country: "Scotland",
    currentPrice: 72000,
    originalPrice: 79000,
    imageUrl: "https://example.com/talisker-10.jpg",
    productUrl: "https://example.com/talisker-10-lotteon",
    source: "LOTTEON",
  },
];

function buildCatalogItems(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    productCode: `WHISKY-${index + 1}`,
    name: `Bottle ${index + 1}`,
    brand: `Brand ${Math.floor(index / 5) + 1}`,
    category: "Single Malt",
    volume: 700,
    alcoholPercent: 40,
    country: "Scotland",
    currentPrice: 50000 + index * 1000,
    originalPrice: 60000 + index * 1000,
    imageUrl: "https://example.com/whisky.jpg",
    productUrl: `https://example.com/whisky-${index + 1}`,
    source: "LOTTEON",
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

    if (shouldFail) {
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

    if (shouldFail) {
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

  await expect(page.getByRole("button", { name: "Jururuk" })).toBeVisible();

  const searchBox = page.getByPlaceholder("위스키 이름, 브랜드로 검색...");
  await searchBox.fill("Macallan");

  await expect(page.getByText('"Macallan" 검색 결과:')).toBeVisible();
  await expect(page.getByText("Macallan 12")).toBeVisible();
  await expect(page.getByText("Talisker 10")).toHaveCount(0);
});

test("catalog loads next page on scroll", async ({ page }) => {
  const largeCatalog = buildCatalogItems(30);
  const requestedCatalogPages: number[] = [];

  await mockLiquorApis(page, largeCatalog, {
    onCatalogPageRequested: (catalogPage) => requestedCatalogPages.push(catalogPage),
  });
  await page.goto("/");

  const searchBox = page.getByPlaceholder("위스키 이름, 브랜드로 검색...");
  await searchBox.fill("Bottle");
  await expect(page.getByText(/^Bottle 1$/).first()).toBeVisible();
  await expect(page.getByText("Bottle 30")).toHaveCount(0);

  const nextPageResponse = page.waitForResponse((response) =>
    response.url().includes("/api/liquors/search?q=Bottle&page=1&size=24"),
  );

  await page.evaluate(() => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: "auto" });
  });

  await nextPageResponse;
  await expect(page.getByText("Bottle 30")).toBeVisible();
  expect(requestedCatalogPages).not.toContain(1);
});

test("catalog shows empty search result state", async ({ page }) => {
  await mockLiquorApis(page);
  await page.goto("/");

  const searchBox = page.getByPlaceholder("위스키 이름, 브랜드로 검색...");
  await searchBox.fill("Lagavulin");

  await expect(page.getByText('"Lagavulin"에 대한 검색 결과가 없습니다')).toBeVisible();
  await expect(page.getByText("다른 검색어로 시도해보세요")).toBeVisible();
});

test("catalog keeps current items when loading the next page fails and recovers on retry", async ({ page }) => {
  const largeCatalog = buildCatalogItems(30);

  await mockLiquorApis(page, largeCatalog, {
    failSearchPages: [1],
  });
  await page.goto("/");

  const searchBox = page.getByPlaceholder("위스키 이름, 브랜드로 검색...");
  await searchBox.fill("Bottle");
  await expect(page.getByText(/^Bottle 1$/).first()).toBeVisible();

  const failedPageResponse = page.waitForResponse((response) =>
    response.url().includes("/api/liquors/search?q=Bottle&page=1&size=24"),
  );
  await page.evaluate(() => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: "auto" });
  });
  await failedPageResponse;

  await expect(page.getByText("추가 목록을 불러오지 못했습니다. 다시 시도해주세요.")).toBeVisible();
  await expect(page.getByText("Bottle 24")).toBeVisible();
  await expect(page.getByText("Bottle 25")).toHaveCount(0);

  const retriedPageResponse = page.waitForResponse((response) =>
    response.url().includes("/api/liquors/search?q=Bottle&page=1&size=24") && response.status() === 200,
  );
  await page.getByRole("button", { name: "다시 시도" }).click();
  await retriedPageResponse;

  await expect(page.getByText("Bottle 30")).toBeVisible();
});
