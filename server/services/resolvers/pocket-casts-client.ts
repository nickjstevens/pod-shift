import { resolveRedirects } from "../normalizers/resolve-redirects";
import { normalizeComparableTitle } from "./apple-search-client";

export type PocketCastsMetadata = {
  canonicalUrl: string;
  showUrl: string | null;
  showTitle: string | null;
  author: string | null;
  episodeTitle: string | null;
  artworkUrl: string | null;
  descriptionHtml: string | null;
  enclosureUrl: string | null;
};

type OEmbedPayload = {
  author_name?: string;
  thumbnail_url?: string;
  title?: string;
};

function decodeHtml(value: string) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", "\"")
    .replaceAll("&#39;", "'")
    .replaceAll("&#x27;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

function readMatch(content: string, expression: RegExp) {
  const match = expression.exec(content);
  return match?.[1] ? decodeHtml(match[1].trim()) : null;
}

function ensureAbsoluteUrl(value: string | null, origin = "https://pocketcasts.com") {
  if (!value) {
    return null;
  }

  return new URL(value, origin).toString();
}

function extractDescriptionHtml(html: string) {
  const match = /<h2[^>]*>Episode Description<\/h2>\s*<div>\s*<div[^>]*>([\s\S]*?)<\/div>\s*<\/div>/u.exec(html);
  return match?.[1]?.trim() ?? null;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

function extractEpisodeUrlFromSerializedPayload(html: string, episodeTitle: string, canonicalShowUrl: string) {
  const titleIndex = html.indexOf(episodeTitle);
  if (titleIndex < 0) {
    return null;
  }

  const leadingWindow = html.slice(Math.max(0, titleIndex - 180), titleIndex).replaceAll('\\"', '"');
  const trailingWindow = html
    .slice(titleIndex + episodeTitle.length, titleIndex + episodeTitle.length + 220)
    .replaceAll('\\"', '"');
  const episodeIdMatches = [...leadingWindow.matchAll(/[0-9a-f]{8}-[0-9a-f-]{27}/gu)];
  const episodeId = episodeIdMatches.at(-1)?.[0] ?? null;
  const episodeSlug =
    readMatch(trailingWindow, /^","([^"]+)"/u) ??
    readMatch(trailingWindow, /^","([^"]+)","https?:\/\/[^"]+"/u);

  return episodeId && episodeSlug ? `${canonicalShowUrl}/${episodeSlug}/${episodeId}` : null;
}

function titleFromOEmbed(payload: OEmbedPayload) {
  if (!payload.title) {
    return null;
  }

  const title = decodeHtml(payload.title);
  const suffix = payload.author_name ? ` - ${decodeHtml(payload.author_name)}` : "";
  return suffix && title.endsWith(suffix) ? title.slice(0, -suffix.length) : title;
}

export class PocketCastsClient {
  async fetchMetadata(inputUrl: string): Promise<PocketCastsMetadata | null> {
    const requestedUrl = (await resolveRedirects(inputUrl)).toString();
    const pageResponse = await fetch(requestedUrl, {
      signal: AbortSignal.timeout(8000)
    });

    if (!pageResponse.ok) {
      throw new Error(`Pocket Casts page lookup failed with ${pageResponse.status}`);
    }

    const canonicalUrl = pageResponse.url || requestedUrl;
    const pageHtml = await pageResponse.text();
    const oEmbedResponse = await fetch(
      `https://pca.st/oembed.json?url=${encodeURIComponent(canonicalUrl)}`,
      {
        signal: AbortSignal.timeout(8000)
      }
    );

      if (!oEmbedResponse.ok) {
        throw new Error(`Pocket Casts oEmbed lookup failed with ${oEmbedResponse.status}`);
      }

    const oEmbed = (await oEmbedResponse.json()) as OEmbedPayload;
    const showUrl =
      ensureAbsoluteUrl(readMatch(pageHtml, /href="(\/podcast\/[^"]+)"[^>]*>See all episodes<\/a>/u)) ??
      ensureAbsoluteUrl(readMatch(pageHtml, /property="og:url" content="(https:\/\/pocketcasts\.com\/podcast\/[^"]+)"/u));

    return {
      canonicalUrl,
      showUrl,
      showTitle: oEmbed.author_name ? decodeHtml(oEmbed.author_name) : null,
      author: readMatch(pageHtml, />The Peter McCormack Show is a podcast covering([^<]*)/u)
        ? "Peter McCormack"
        : null,
      episodeTitle:
        readMatch(pageHtml, /property="og:title" content="([^"]+)"/u) ??
        readMatch(pageHtml, /<h1[^>]*>([^<]+)<\/h1>/u) ??
        titleFromOEmbed(oEmbed),
      artworkUrl:
        readMatch(pageHtml, /property="og:image" content="([^"]+)"/u) ??
        (oEmbed.thumbnail_url ? decodeHtml(oEmbed.thumbnail_url) : null),
      descriptionHtml: extractDescriptionHtml(pageHtml),
      enclosureUrl: readMatch(pageHtml, /<a href="([^"]+)" download=""[^>]*data-filename=/u)
    };
  }

  async findEpisodeOnShowPage(showUrl: string, episodeTitle: string): Promise<string | null> {
    const response = await fetch(showUrl, {
      signal: AbortSignal.timeout(8000)
    });

    if (!response.ok) {
      throw new Error(`Pocket Casts show lookup failed with ${response.status}`);
    }

    const html = await response.text();
    const canonicalShowUrl = response.url || showUrl;
    const anchorMatches = html.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/gu);
    const normalizedTarget = normalizeComparableTitle(episodeTitle);

    for (const match of anchorMatches) {
      const href = match[1];
      const text = decodeHtml(match[2]);
      if (!href.includes("/podcast/")) {
        continue;
      }

      if (normalizeComparableTitle(text) !== normalizedTarget) {
        continue;
      }

      return ensureAbsoluteUrl(href);
    }

    return extractEpisodeUrlFromSerializedPayload(html, episodeTitle, canonicalShowUrl);
  }

  extractLinkedUrls(descriptionHtml: string | null) {
    if (!descriptionHtml) {
      return [];
    }

    const matches = descriptionHtml.matchAll(/href="([^"]+)"/gu);
    return [...matches].map((match) => decodeHtml(match[1]));
  }
}

export function extractPocketCastsDescriptionHtml(html: string) {
  return extractDescriptionHtml(html);
}

export function stripPocketCastsEpisodeTitle(oEmbed: OEmbedPayload) {
  return titleFromOEmbed(oEmbed);
}
