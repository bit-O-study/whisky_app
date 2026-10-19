import { expect, test } from "@playwright/test";

for (const width of [390, 1280]) {
  test(`loading resolves to empty/error/retry at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    let finishRequest: (() => void) | undefined;
    let gate = new Promise<void>((resolve) => { finishRequest = resolve; });
    let fail = false;
    await page.route(/\/api\/liquors(\?|$)/, async (route) => {
      await gate;
      await route.fulfill({ status: fail ? 500 : 200, contentType: "application/json", body: JSON.stringify(fail ? { message: "failed" } : { items: [], page: 0, size: 500, hasNext: false }) });
    });
    await page.goto("/");
    const status = page.getByRole("status").filter({ hasText: "상품과 가격을 불러오고 있어요" });
    await expect(status).toBeVisible();
    await expect(status.locator(".app-loading-content")).toHaveCSS("opacity", "1");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `test-results/loading-${width}.png`, fullPage: true });
    finishRequest?.();
    await expect(status).toHaveCount(0);
    await expect(page.getByText("표시할 데이터가 없습니다")).toBeVisible();

    fail = true;
    gate = Promise.resolve();
    const failedRequest = page.waitForResponse(response => /\/api\/liquors(\?|$)/.test(response.url()) && response.status() === 500);
    await page.reload();
    await failedRequest;
    await expect(status).toHaveCount(0);
    await expect(page.getByRole("button", { name: "다시 시도", exact: true })).toBeVisible();
    fail = false;
    gate = new Promise<void>((resolve) => { finishRequest = resolve; });
    await page.getByRole("button", { name: "다시 시도", exact: true }).click();
    await expect(status).toBeVisible();
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(status.locator(".app-loading-spinner")).toHaveCSS("animation-name", "none");
    finishRequest?.();
    await expect(status).toHaveCount(0);
    await expect(page.getByText("표시할 데이터가 없습니다")).toBeVisible();
  });
}
