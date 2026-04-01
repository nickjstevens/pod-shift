import { expect, test } from "@playwright/test";

import { demoLinks, pasteLinkAndBlur } from "./fixtures";

test("converts the named Apple Podcasts regression link into Pocket Casts", async ({ page }) => {
  await page.goto("/");
  await pasteLinkAndBlur(page, demoLinks.regressionAppleEpisode);
  await page.getByLabel("Destination podcast app").selectOption("pocket_casts");

  await expect(page.locator(".preview-card__title", { hasText: "Ungovernable Misfits" })).toBeVisible();
  await expect(page.getByText("Privacy, BTC and XMR with Riccardo Spagni")).toBeVisible();

  await page.getByRole("button", { name: "Convert link" }).click();

  await expect(page.getByRole("heading", { name: "Converted link" })).toBeVisible({ timeout: 15000 });
  await expect(page.getByRole("link", { name: "Open in Pocket Casts" })).toHaveAttribute(
    "href",
    /pocketcasts\.com\/podcast\/ungovernable-misfits\/.+\/privacy-btc-and-xmr-with-riccardo-spagni/
  );
});

test("converts the named Pocket Casts regression link into Fountain", async ({ page }) => {
  await page.goto("/");
  await pasteLinkAndBlur(page, demoLinks.regressionPocketCastsEpisode);
  await page.getByLabel("Destination podcast app").selectOption("fountain");

  await expect(page.getByText("The Peter McCormack Show")).toBeVisible();
  await expect(page.getByText("Lyn Alden")).toBeVisible();

  await page.getByRole("button", { name: "Convert link" }).click();

  await expect(page.getByRole("heading", { name: "Converted link" })).toBeVisible({ timeout: 15000 });
  await expect(page.getByRole("link", { name: "Open in Fountain" })).toHaveAttribute(
    "href",
    /https:\/\/fountain\.fm\/episode\/[A-Za-z0-9]+/
  );
});
