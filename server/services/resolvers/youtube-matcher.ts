import type { NormalizedSourceLink } from "../../../shared/types/conversion";
import { readRuntimeConfig } from "../../utils/runtime-config";
import { scoreBestEffortMatch } from "../matchers/score-match";
import { resolveFromSampleCatalog } from "./sample-catalog";

const CACHE_TTL_MS = 5 * 60 * 1000;

const cache = new Map<
  string,
  {
    expiresAt: number;
    value: Promise<Awaited<ReturnType<typeof resolveYoutubeBestEffortUncached>>>;
  }
>();

function buildCacheKey(source: NormalizedSourceLink) {
  return `${source.sourceProviderId}:${source.providerEntityId ?? source.normalizedUrl}`;
}

async function withTimeout<T>(promise: Promise<T>) {
  const { requestTimeoutMs } = readRuntimeConfig();

  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => {
        reject(new Error("YouTube matching timed out."));
      }, requestTimeoutMs);
    })
  ]);
}

async function resolveYoutubeBestEffortUncached(source: NormalizedSourceLink) {
  const directMatch = resolveFromSampleCatalog(source);
  if (directMatch) {
    return directMatch;
  }

  const score = source.resolutionHints.titleHint ? 0.72 : 0.48;
  return {
    show: null,
    episode: null,
    matchedBy: "metadata" as const,
    confidenceScore: scoreBestEffortMatch(score)
  };
}

export async function resolveYoutubeBestEffort(source: NormalizedSourceLink) {
  const cacheKey = buildCacheKey(source);
  const existing = cache.get(cacheKey);
  if (existing && existing.expiresAt > Date.now()) {
    return existing.value;
  }

  const pending = withTimeout(resolveYoutubeBestEffortUncached(source));
  cache.set(cacheKey, {
    expiresAt: Date.now() + CACHE_TTL_MS,
    value: pending
  });

  return pending;
}
