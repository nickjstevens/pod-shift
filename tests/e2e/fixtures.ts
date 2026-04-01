import type { Page } from "@playwright/test";

export const demoLinks = {
  appleEpisode:
    "https://podcasts.apple.com/us/podcast/the-daily/id1200361736?i=1000654321001&utm_source=newsletter",
  appleShow:
    "https://podcasts.apple.com/us/podcast/the-daily/id1200361736",
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
