import type { PreviewResponse } from "../../../shared/types/conversion";
import { listEnabledOutputProviders } from "../adapters/provider-registry";
import { normalizeInput } from "../normalizers/normalize-input";
import { resolveCatalogMatch } from "../resolvers/catalog-resolver";
import { enrichSourceLink } from "../resolvers/provider-enrichment";
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

  const resolved = await resolveCatalogMatch(normalized);

  const canUseResolvedPreviewWithoutEnrichment =
    resolved?.matchedBy === "provider_id" &&
    Boolean(resolved.show?.title) &&
    Boolean(resolved.show?.author) &&
    Boolean(resolved.show?.artworkUrl || resolved.episode?.artworkUrl) &&
    (normalized.contentKind !== "episode" || Boolean(resolved.episode?.title));

  const needsEnrichment = !canUseResolvedPreviewWithoutEnrichment;

  const enrichment =
    (resolved && "enrichment" in resolved ? resolved.enrichment : null) ??
    (needsEnrichment ? await enrichSourceLink(normalized) : null);
  const showTitle = resolved?.show?.title ?? enrichment?.showTitle ?? null;
  const episodeTitle = resolved?.episode?.title ?? enrichment?.episodeTitle ?? null;
  const author = resolved?.show?.author ?? enrichment?.author ?? null;
  const artworkUrl =
    resolved?.episode?.artworkUrl ??
    resolved?.show?.artworkUrl ??
    enrichment?.artworkUrl ??
    null;
  const previewLevel = episodeTitle ? "episode" : showTitle ? "show" : "unresolved";
  const warnings = [...(enrichment?.warnings ?? [])];

  if (!artworkUrl) {
    warnings.push("Artwork preview is not available yet.");
  }

  return {
    requestId: normalized.requestId,
    normalizedUrl: normalized.normalizedUrl,
    sourceProvider: normalized.sourceProviderId,
    contentKind: normalized.contentKind,
    previewLevel,
    showTitle,
    episodeTitle,
    author,
    timestampSeconds: normalized.timestampSeconds,
    artworkUrl,
    availableTargets: listEnabledOutputProviders().map((provider) => provider.id),
    warnings
  };
}
