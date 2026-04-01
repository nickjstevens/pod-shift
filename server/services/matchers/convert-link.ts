import type { ConvertSuccessResponse } from "../../../shared/types/conversion";
import type { ProviderId } from "../../../shared/types/provider";
import { getProviderDefinition } from "../adapters/provider-registry";
import { getLinkAdapter } from "../adapters/link-adapter-registry";
import { normalizeInput } from "../normalizers/normalize-input";
import { meetsConfidenceThreshold } from "./score-match";
import { resolveCatalogMatch } from "../resolvers/catalog-resolver";
import { resolveYoutubeBestEffort } from "../resolvers/youtube-matcher";
import { ApiError } from "../../utils/api-error";

type ConvertLinkInput = {
  inputUrl: string;
  targetProvider: ProviderId;
  preferTimestamp: boolean;
};

function buildMessage(status: ConvertSuccessResponse["status"], targetDisplayName: string) {
  switch (status) {
    case "matched_episode":
      return `Episode match ready for ${targetDisplayName}.`;
    case "matched_show":
      return `Show match ready for ${targetDisplayName}.`;
    case "fallback_episode_no_timestamp":
      return `Episode match ready for ${targetDisplayName}, but playback starts from the episode beginning.`;
    case "same_app_normalized":
      return `${targetDisplayName} already uses a supported public link, so no conversion was needed.`;
  }
}

export async function convertLink(input: ConvertLinkInput): Promise<ConvertSuccessResponse> {
  const targetProviderDefinition = getProviderDefinition(input.targetProvider);
  if (!targetProviderDefinition?.supportsOutput) {
    throw new ApiError(422, "unsupported_target", "The selected destination app is not currently supported.");
  }

  let normalized;
  try {
    normalized = normalizeInput(input.inputUrl);
  } catch (error) {
    if (error instanceof TypeError) {
      throw new ApiError(400, "malformed_link", "Paste a full public podcast URL to convert.");
    }

    throw new ApiError(422, "unsupported_source", "This link is not from a supported podcast source.");
  }

  if (normalized.sourceProviderId === input.targetProvider) {
    return {
      status: "same_app_normalized",
      sourceProvider: normalized.sourceProviderId,
      targetProvider: input.targetProvider,
      contentKind: normalized.contentKind === "show" ? "show" : "episode",
      targetUrl: normalized.normalizedUrl,
      timestampApplied: false,
      artworkUrl: null,
      warnings: [],
      message: buildMessage("same_app_normalized", targetProviderDefinition.displayName)
    };
  }

  const targetAdapter = getLinkAdapter(input.targetProvider);
  if (!targetAdapter) {
    throw new ApiError(422, "unsupported_target", "This destination app is not available for direct conversion yet.");
  }

  let resolvedMatch = await resolveCatalogMatch(normalized);

  if (!resolvedMatch && (normalized.sourceProviderId === "youtube" || normalized.sourceProviderId === "youtube_music")) {
    const bestEffort = await resolveYoutubeBestEffort(normalized);
    if (!bestEffort.show || !meetsConfidenceThreshold(bestEffort.confidenceScore)) {
      throw new ApiError(422, "low_confidence_match", "No confident podcast match was found.");
    }

    resolvedMatch = bestEffort;
  }

  if (!resolvedMatch) {
    throw new ApiError(422, "unresolved_content", "The app could not match this podcast link to a supported catalog entry.");
  }

  const showUrl = targetAdapter.buildShowUrl(resolvedMatch.show);
  const episodeUrl =
    normalized.contentKind === "episode" && resolvedMatch.episode
      ? targetAdapter.buildEpisodeUrl(resolvedMatch.show, resolvedMatch.episode)
      : null;

  if (normalized.contentKind === "episode" && resolvedMatch.episode && episodeUrl) {
    let targetUrl = episodeUrl;
    let status: ConvertSuccessResponse["status"] = "matched_episode";
    const warnings: string[] = [];
    let timestampApplied = false;

    if (input.preferTimestamp && normalized.timestampSeconds != null) {
      if (targetAdapter.supportsNativeTimestamp) {
        targetUrl = targetAdapter.applyTimestamp(targetUrl, normalized.timestampSeconds);
        timestampApplied = true;
      } else {
        status = "fallback_episode_no_timestamp";
        warnings.push(`${targetProviderDefinition.displayName} does not support timestamped podcast links yet.`);
      }
    }

    return {
      status,
      sourceProvider: normalized.sourceProviderId,
      targetProvider: input.targetProvider,
      contentKind: "episode",
      targetUrl,
      timestampApplied,
      artworkUrl: resolvedMatch.episode.artworkUrl ?? resolvedMatch.show.artworkUrl ?? null,
      warnings,
      message: buildMessage(status, targetProviderDefinition.displayName)
    };
  }

  if (showUrl && normalized.contentKind === "show") {
    return {
      status: "matched_show",
      sourceProvider: normalized.sourceProviderId,
      targetProvider: input.targetProvider,
      contentKind: "show",
      targetUrl: showUrl,
      timestampApplied: false,
      artworkUrl: resolvedMatch.show.artworkUrl ?? null,
      warnings: [],
      message: buildMessage("matched_show", targetProviderDefinition.displayName)
    };
  }

  throw new ApiError(422, "unresolved_content", "The selected app does not expose a stable link for this content.");
}
