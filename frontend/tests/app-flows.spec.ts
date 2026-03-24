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
}

async function mockLiquorApis(
  page: Page,
  catalogItems = baseLiquorList,
  options?: MockLiquorApiOptions
) {
  await page.route("**/api/liquors/search**", async (route) => {
    const url = new URL(route.request().url());
    const keyword = url.searchParams.get("q") ?? "";
    const pageParam = Number(url.searchParams.get("page") ?? "0");
    const sizeParam = Number(url.searchParams.get("size") ?? "24");
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

  await expect(page.getByRole("heading", { name: "Whisky Catalog" })).toBeVisible();
  await expect(page.getByText("Talisker 10")).toBeVisible();

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

  await expect(page.getByText(/^Bottle 1$/).first()).toBeVisible();
  await expect(page.getByText("Bottle 30")).toHaveCount(0);

  const nextPageResponse = page.waitForResponse((response) => response.url().includes("/api/liquors?page=1&size=24"));

  await page.evaluate(() => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: "auto" });
  });

  await nextPageResponse;
  await expect(page.getByText("Bottle 30")).toBeVisible();
  expect(requestedCatalogPages).toContain(0);
  expect(requestedCatalogPages).toContain(1);
});
