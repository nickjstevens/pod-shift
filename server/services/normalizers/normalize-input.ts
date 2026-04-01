import { createHash, randomUUID } from "node:crypto";

import type { NormalizedSourceLink } from "../../../shared/types/conversion";
import { detectSource } from "./detect-source";
import { stripTrackingParameters } from "./strip-tracking";

function hashValue(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function normalizeInput(inputUrl: string): NormalizedSourceLink {
  let url: URL;

  try {
    url = new URL(inputUrl);
  } catch {
    throw new TypeError("The pasted value is not a valid URL.");
  }

  const { normalizedUrl, strippedTrackingKeys } = stripTrackingParameters(url);
  const detectedSource = detectSource(new URL(normalizedUrl));

  if (!detectedSource) {
    throw new Error("The pasted link is not from a supported source.");
  }

  return {
    requestId: randomUUID(),
    sourceProviderId: detectedSource.sourceProviderId,
    originalUrlHash: hashValue(inputUrl),
    normalizedUrl,
    contentKind: detectedSource.contentKind,
    timestampSeconds: detectedSource.timestampSeconds,
    providerEntityId: detectedSource.providerEntityId,
    strippedTrackingKeys,
    resolutionHints: detectedSource.resolutionHints
  };
}

export function hashNormalizedIdentity(value: string) {
  return hashValue(value);
}
