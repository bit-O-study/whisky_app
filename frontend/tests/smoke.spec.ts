import { expect, test } from "@playwright/test";

test("homepage renders core UI", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/Jururuk/);
  await expect(page.getByRole("button", { name: "나의 위스키 취향 찾기" })).toBeVisible();
});
