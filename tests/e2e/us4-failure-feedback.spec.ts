import { expect, test } from "@playwright/test";

import { demoLinks, pasteLink } from "./fixtures";

test("explains malformed links without producing a misleading result", async ({ page }) => {
  await page.goto("/");
  await pasteLink(page, "not-a-url");
  await page.getByLabel("Destination podcast app").selectOption("pocket_casts");
  await page.getByRole("button", { name: "Convert link" }).click();

  await expect(page.getByText("Paste a full public podcast URL to convert.")).toBeVisible();
});

test("explains low-confidence matches clearly", async ({ page }) => {
  await page.goto("/");
  await pasteLink(page, demoLinks.unknownYoutubeEpisode);
  await page.getByLabel("Destination podcast app").selectOption("pocket_casts");
  await page.getByRole("button", { name: "Convert link" }).click();

  await expect(page.getByText("No confident podcast match was found.")).toBeVisible();
});
