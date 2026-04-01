import { expect, test } from "@playwright/test";

import { demoLinks, pasteLink } from "./fixtures";

test("converts a supported YouTube podcast link into another supported output", async ({ page }) => {
  await page.goto("/");
  await pasteLink(page, demoLinks.youtubeEpisode);
  await page.getByLabel("Destination podcast app").selectOption("spotify");
  await page.getByRole("button", { name: "Convert link" }).click();

  await expect(page.getByRole("heading", { name: "Converted link" })).toBeVisible({ timeout: 10000 });
  await expect(page.getByRole("link", { name: "Open in Spotify" })).toBeVisible({ timeout: 10000 });
});

test("explains when a YouTube link cannot be matched confidently", async ({ page }) => {
  await page.goto("/");
  await pasteLink(page, demoLinks.unknownYoutubeEpisode);
  await page.getByLabel("Destination podcast app").selectOption("pocket_casts");
  await page.getByRole("button", { name: "Convert link" }).click();

  await expect(page.getByText("No confident podcast match was found.")).toBeVisible();
});
