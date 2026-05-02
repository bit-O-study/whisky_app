import { expect, test } from "@playwright/test";

test("homepage renders core UI", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/위스키다모아/);
  await expect(page.getByRole("button", { name: "위스키다모아" })).toBeVisible();
  await expect(page.getByPlaceholder("위스키 · 브랜드 검색")).toBeVisible();
});
