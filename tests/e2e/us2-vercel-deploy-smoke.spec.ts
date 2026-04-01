import { expect, test } from "@playwright/test";

import { demoLinks, pasteLink } from "./fixtures";

test("loads the app and completes a live-default conversion smoke flow", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      name: "Paste the link you got. Open it in the podcast app you actually use."
    })
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Available destinations" })).toBeVisible();

  await pasteLink(page, demoLinks.appleShow);
  await page.getByLabel("Destination podcast app").selectOption("fountain");
  await page.getByRole("button", { name: "Convert link" }).click();

  await expect(page.getByText("Show match", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open in Fountain" })).toHaveAttribute(
    "href",
    "https://fountain.fm/show/daily-fountain-001"
  );
});
