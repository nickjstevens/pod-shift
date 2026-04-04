import { expect, test } from "@playwright/test";

import { blurLinkInput, demoLinks, pasteLink } from "./fixtures";

test("shows preview details only after the listener leaves the input field", async ({ page }) => {
  await page.goto("/");
  await pasteLink(page, demoLinks.appleEpisode);

  await expect(page.getByRole("heading", { name: "Podcast preview" })).toHaveCount(0);

  await blurLinkInput(page);

  await expect(page.getByRole("heading", { name: "Podcast preview" })).toBeVisible({ timeout: 15000 });
  await expect(page.getByText("The Daily")).toBeVisible({ timeout: 15000 });
  await expect(page.getByText("Inside the Election Endgame")).toBeVisible({ timeout: 15000 });
  await expect(page.getByText("The New York Times")).toBeVisible({ timeout: 15000 });
});

test("replaces stale episode details when a new link is pasted and blurred", async ({ page }) => {
  await page.goto("/");

  await pasteLink(page, demoLinks.appleEpisode);
  await blurLinkInput(page);
  await expect(page.getByText("Inside the Election Endgame")).toBeVisible({ timeout: 15000 });

  await pasteLink(page, demoLinks.appleShow);
  await blurLinkInput(page);

  await expect(page.getByText("Inside the Election Endgame")).toHaveCount(0, { timeout: 15000 });
  await expect(page.getByText("Show-level match detected.")).toBeVisible({ timeout: 15000 });
});
