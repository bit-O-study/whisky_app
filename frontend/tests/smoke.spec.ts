import { expect, test } from "@playwright/test";

test("homepage renders core UI", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/Jururuk/);
  await expect(page.getByRole("button", { name: "Jururuk" })).toBeVisible();
  await expect(page.getByPlaceholder("위스키 이름, 브랜드로 검색...")).toBeVisible();
});
