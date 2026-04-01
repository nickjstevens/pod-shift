import { expect, test } from "@playwright/test";

import { blurLinkInput, demoLinks, pasteLink } from "./fixtures";

test("recovers Apple-origin links into a confident cross-app episode match when available", async ({ page }) => {
  await page.goto("/");
  await pasteLink(page, demoLinks.regressionAppleEpisode);
  await blurLinkInput(page);

  await expect(page.locator(".preview-card__title", { hasText: "Ungovernable Misfits" })).toBeVisible();
  await expect(page.getByText("Privacy, BTC and XMR with Riccardo Spagni")).toBeVisible();

  await page.getByLabel("Destination podcast app").selectOption("pocket_casts");
  await page.getByRole("button", { name: "Convert link" }).click();

  await expect(page.getByRole("heading", { name: "Converted link" })).toBeVisible({ timeout: 15000 });
  await expect(page.getByRole("link", { name: "Open in Pocket Casts" })).toHaveAttribute(
    "href",
    /pocketcasts\.com\/podcast\/ungovernable-misfits\/.+\/privacy-btc-and-xmr-with-riccardo-spagni/
  );
});

test("shows an explicit non-success message without stale success carryover", async ({ page }) => {
  await page.route("**/api/preview", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        requestId: "00000000-0000-0000-0000-000000000001",
        normalizedUrl: "https://podcasts.apple.com/gb/podcast/recovery-test-show/id1999999999?i=1000999999999",
        sourceProvider: "apple_podcasts",
        contentKind: "episode",
        previewLevel: "episode",
        showTitle: "Recovery Test Show",
        episodeTitle: "Recovery Test Episode",
        author: "Recovery Test Publisher",
        timestampSeconds: null,
        artworkUrl: null,
        availableTargets: ["pocket_casts", "fountain"],
        warnings: []
      })
    });
  });

  await page.route("**/api/convert", async (route) => {
    await route.fulfill({
      status: 422,
      contentType: "application/json",
      body: JSON.stringify({
        errorCode: "unresolved_content",
        message: "The selected app does not expose a stable link for this content.",
        retryable: false
      })
    });
  });

  await page.goto("/");
  await pasteLink(page, "https://podcasts.apple.com/gb/podcast/recovery-test-show/id1999999999?i=1000999999999");
  await blurLinkInput(page);

  await expect(page.locator(".preview-card__title", { hasText: "Recovery Test Show" })).toBeVisible();
  await page.getByLabel("Destination podcast app").selectOption("pocket_casts");
  await page.getByRole("button", { name: "Convert link" }).click();

  await expect(page.getByText("The selected app does not expose a stable link for this content.")).toBeVisible();
  await expect(
    page.getByText("The source show or episode was identified, but the selected app did not expose a stable public link for it.")
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Converted link" })).toHaveCount(0);
});
