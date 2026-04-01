import type { PreviewResponse } from "../../../shared/types/conversion";
import { listEnabledOutputProviders } from "../adapters/provider-registry";
import { normalizeInput } from "../normalizers/normalize-input";
import { resolveCatalogMatch } from "../resolvers/catalog-resolver";
import { resolveYoutubeBestEffort } from "../resolvers/youtube-matcher";
import { ApiError } from "../../utils/api-error";

type BuildPreviewInput = {
  inputUrl: string;
};

export async function buildPreview(input: BuildPreviewInput): Promise<PreviewResponse> {
  let normalized;

  try {
    normalized = normalizeInput(input.inputUrl);
  } catch (error) {
    if (error instanceof TypeError) {
      throw new ApiError(400, "malformed_link", "Paste a full public podcast URL to preview.");
    }

    throw new ApiError(422, "unsupported_source", "This link is not from a supported podcast source.");
  }

  let resolved = await resolveCatalogMatch(normalized);
  if (!resolved && (normalized.sourceProviderId === "youtube" || normalized.sourceProviderId === "youtube_music")) {
    resolved = await resolveYoutubeBestEffort(normalized);
  }

  const artworkUrl = resolved?.episode?.artworkUrl ?? resolved?.show?.artworkUrl ?? null;
  const warnings = artworkUrl ? [] : ["Artwork preview is not available yet."];

  return {
    requestId: normalized.requestId,
    normalizedUrl: normalized.normalizedUrl,
    sourceProvider: normalized.sourceProviderId,
    contentKind: normalized.contentKind,
    timestampSeconds: normalized.timestampSeconds,
    artworkUrl,
    availableTargets: listEnabledOutputProviders().map((provider) => provider.id),
    warnings
  };
}
