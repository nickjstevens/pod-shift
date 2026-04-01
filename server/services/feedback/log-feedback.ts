import { randomUUID } from "node:crypto";

import type { DiagnosticProviderId, NormalizedSourceLink } from "../../../shared/types/conversion";
import { classifyFailure } from "./classify-failure";
import { emitRuntimeDiagnosticSignal } from "./feedback-repository";
import { hashNormalizedIdentity, normalizeInput } from "../normalizers/normalize-input";

type LogFailureFeedbackInput = {
  error: unknown;
  inputUrl: string;
  targetProviderId: DiagnosticProviderId;
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

  try {
    return await emitRuntimeDiagnosticSignal({
      attemptId: randomUUID(),
      sourceProviderId: normalized?.sourceProviderId ?? "unknown",
      targetProviderId: input.targetProviderId,
      failureClass: classification.failureClass,
      normalizedIdentityHash: hashNormalizedIdentity(normalized?.normalizedUrl ?? input.inputUrl.trim()),
      confidenceBucket: classification.confidenceBucket,
      strippedTrackingKeys: normalized?.strippedTrackingKeys ?? [],
      sink: classification.sink
    });
  } catch (error) {
    console.warn("[pod-shift] runtime-diagnostic-failed", error);
    return null;
  }
}
