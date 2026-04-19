import { expect, test } from "@playwright/test";

import { demoLinks, getConversionOutput, pasteLink } from "./fixtures";

test("hides unsupported apps from the destination picker", async ({ page }) => {
  await page.goto("/");

  const options = page.locator("#target-provider option");
  await expect(options).toHaveText([
    "Choose an app",
    "Apple Podcasts",
    "Pocket Casts",
    "Fountain",
    "Castro",
    "AntennaPod"
  ]);
});

test("explains when an unsupported source app link is pasted", async ({ page }) => {
  await page.goto("/");
  await pasteLink(page, demoLinks.unsupportedYoutubeEpisode);
  await page.getByLabel("Destination podcast app").selectOption("pocket_casts");
  await page.getByRole("button", { name: "Convert link" }).click();

  await expect(page.getByRole("heading", { name: "Conversion Output" })).toBeVisible();
  await expect(getConversionOutput(page).getByText("This link is not from a supported podcast source.")).toBeVisible();
});
