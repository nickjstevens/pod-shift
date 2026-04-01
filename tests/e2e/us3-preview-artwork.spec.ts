import { expect, test } from "@playwright/test";

import { blurLinkInput, demoLinks, pasteLink } from "./fixtures";

test("shows artwork preview and a loading state while matching", async ({ page }) => {
  await page.goto("/");
  await pasteLink(page, demoLinks.appleEpisode);
  await blurLinkInput(page);

  await expect(page.getByRole("heading", { name: "Podcast preview" })).toBeVisible();
  await expect(page.getByAltText("Podcast artwork")).toBeVisible();

  await page.getByLabel("Destination podcast app").selectOption("pocket_casts");
  await page.getByRole("button", { name: "Convert link" }).click();

  await expect(page.getByRole("heading", { name: "Matching link..." })).toBeVisible();
  await expect(page.getByText("Resolving the closest show or episode match.")).toBeVisible();
});

test("keeps the loading state visually complete when artwork is unavailable", async ({ page }) => {
  await page.goto("/");
  await pasteLink(page, demoLinks.unknownYoutubeEpisode);
  await blurLinkInput(page);

  await expect(page.getByRole("heading", { name: "Podcast preview" })).toBeVisible();
  await expect(page.locator(".preview-card__placeholder", { hasText: "Artwork preview is not available yet." })).toBeVisible();
});
