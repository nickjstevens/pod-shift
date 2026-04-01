import { expect, test } from "@playwright/test";

import { demoLinks, pasteLink } from "./fixtures";

test("removes the old helper sentence while preserving same-app normalization", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByText("Supported input providers are also exposed as output options.")
  ).toHaveCount(0);
  await expect(page.getByText("No account required.")).toBeVisible();

  await pasteLink(page, demoLinks.appleEpisode);
  await page.getByLabel("Destination podcast app").selectOption("apple_podcasts");
  await page.getByRole("button", { name: "Convert link" }).click();

  await expect(page.getByText("Already in selected app")).toBeVisible();
});
