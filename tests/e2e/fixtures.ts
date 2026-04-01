import type { Page } from "@playwright/test";

export const demoLinks = {
  appleEpisode:
    "https://podcasts.apple.com/us/podcast/the-daily/id1200361736?i=1000654321001&utm_source=newsletter",
  appleShow:
    "https://podcasts.apple.com/us/podcast/the-daily/id1200361736",
  regressionAppleEpisode:
    "https://podcasts.apple.com/gb/podcast/ungovernable-misfits/id1491067458?i=1000745595285",
  regressionPocketCastsEpisode:
    "https://pca.st/episode/fcfc426a-a7ce-4374-9a9c-d51451bb06ab",
  spotifyEpisode:
    "https://open.spotify.com/episode/dailyspotifyepisode001?si=tracking-token&t=95",
  youtubeEpisode:
    "https://www.youtube.com/watch?v=yt-episode-daily-001&si=tracking-token&t=95",
  unknownYoutubeEpisode:
    "https://www.youtube.com/watch?v=yt-episode-unknown-999&si=tracking-token&t=95"
} as const;

export async function pasteLink(page: Page, value: string) {
  await page.getByLabel("Podcast link").fill(value);
}

export async function blurLinkInput(page: Page) {
  await page.getByLabel("Podcast link").press("Tab");
}

export async function pasteLinkAndBlur(page: Page, value: string) {
  await pasteLink(page, value);
  await blurLinkInput(page);
}
