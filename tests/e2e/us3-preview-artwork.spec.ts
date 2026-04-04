import { expect, test } from "@playwright/test";

import { blurLinkInput, demoLinks, getSearchIndicator, pasteLink } from "./fixtures";

test("shows artwork preview and a loading state while matching", async ({ page }) => {
  await page.goto("/");
  await pasteLink(page, demoLinks.appleEpisode);
  await blurLinkInput(page);

  await expect(page.getByRole("heading", { name: "Podcast preview" })).toBeVisible();
  await expect(page.getByAltText("Podcast artwork")).toBeVisible();

  await page.getByLabel("Destination podcast app").selectOption("pocket_casts");
  await page.getByRole("button", { name: "Convert link" }).click();

  await expect(getSearchIndicator(page)).toBeVisible();
  await expect(getSearchIndicator(page)).toContainText("Searching");
  await expect(page.getByRole("heading", { name: "Matching link..." })).toHaveCount(0);
});

test("keeps the loading state visually complete when artwork is unavailable", async ({ page }) => {
  await page.goto("/");
  await pasteLink(page, demoLinks.unknownYoutubeEpisode);
  await blurLinkInput(page);

  await expect(page.getByRole("heading", { name: "Podcast preview" })).toBeVisible();
  await expect(page.locator(".preview-card__placeholder", { hasText: "Artwork preview is not available yet." })).toBeVisible();
});
