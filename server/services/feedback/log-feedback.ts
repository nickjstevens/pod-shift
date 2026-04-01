import { randomUUID } from "node:crypto";

import type { FeedbackProviderId, NormalizedSourceLink } from "../../../shared/types/conversion";
import { classifyFailure } from "./classify-failure";
import { persistFeedbackEvent } from "./feedback-repository";
import { hashNormalizedIdentity, normalizeInput } from "../normalizers/normalize-input";

type LogFailureFeedbackInput = {
  error: unknown;
  inputUrl: string;
  targetProviderId: FeedbackProviderId;
  normalized?: NormalizedSourceLink | null;
};

export async function logFailureFeedback(input: LogFailureFeedbackInput) {
  const classification = classifyFailure(input.error);

  let normalized = input.normalized ?? null;
  if (!normalized) {
    try {
      normalized = normalizeInput(input.inputUrl);
    } catch {
      normalized = null;
    }
  }

  return persistFeedbackEvent({
    attemptId: randomUUID(),
    sourceProviderId: normalized?.sourceProviderId ?? "unknown",
    targetProviderId: input.targetProviderId,
    failureClass: classification.failureClass,
    normalizedIdentityHash: hashNormalizedIdentity(normalized?.normalizedUrl ?? input.inputUrl.trim()),
    confidenceBucket: classification.confidenceBucket,
    strippedTrackingKeys: normalized?.strippedTrackingKeys ?? []
  });
}
