import { expect, test } from "@playwright/test";

import { demoLinks, getConversionOutput, pasteLink } from "./fixtures";

test("converts a supported YouTube podcast link into another supported output", async ({ page }) => {
  await page.goto("/");
  await pasteLink(page, demoLinks.youtubeEpisode);
  await page.getByLabel("Destination podcast app").selectOption("spotify");
  await page.getByRole("button", { name: "Convert link" }).click();

  await expect(page.getByRole("heading", { name: "Conversion Output" })).toBeVisible({ timeout: 10000 });
  await expect(getConversionOutput(page).getByRole("link", { name: "Open in Spotify" })).toBeVisible({ timeout: 10000 });
});

test("explains when a YouTube link cannot be matched confidently", async ({ page }) => {
  await page.goto("/");
  await pasteLink(page, demoLinks.unknownYoutubeEpisode);
  await page.getByLabel("Destination podcast app").selectOption("pocket_casts");
  await page.getByRole("button", { name: "Convert link" }).click();

  await expect(page.getByRole("heading", { name: "Conversion Output" })).toBeVisible();
  await expect(
    getConversionOutput(page).getByText("No confident podcast match was found.")
  ).toBeVisible();
});
