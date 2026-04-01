const CONFIDENCE_THRESHOLD = 0.8;

export function meetsConfidenceThreshold(score: number) {
  return score >= CONFIDENCE_THRESHOLD;
}

export function scoreBestEffortMatch(score: number) {
  return Math.max(0, Math.min(1, score));
}
