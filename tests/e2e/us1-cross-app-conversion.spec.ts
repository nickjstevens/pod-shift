import { expect, test } from "@playwright/test";

import { demoLinks, pasteLink } from "./fixtures";

test("converts a pasted Apple Podcasts link into a selected podcast app", async ({ page }) => {
  await page.goto("/");
  await pasteLink(page, demoLinks.appleEpisode);
  await page.getByLabel("Destination podcast app").selectOption("pocket_casts");
  await page.getByRole("button", { name: "Convert link" }).click();

  await expect(page.getByRole("heading", { name: "Converted link" })).toBeVisible();
  await expect(page.getByText("Episode match", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open in Pocket Casts" })).toHaveAttribute(
    "href",
    "https://pca.st/episode/daily-pocketcasts-episode-001"
  );
});
