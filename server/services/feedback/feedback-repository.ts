import type { FeedbackEvent, FeedbackProviderId } from "../../../shared/types/conversion";
import { getFeedbackEvents, insertFeedbackEvent, resetFeedbackEvents } from "../../utils/db";

export async function persistFeedbackEvent(event: {
  attemptId: string;
  sourceProviderId: FeedbackProviderId;
  targetProviderId: FeedbackProviderId;
  failureClass: FeedbackEvent["failureClass"];
  normalizedIdentityHash: string;
  confidenceBucket: FeedbackEvent["confidenceBucket"];
  strippedTrackingKeys: string[];
}) {
  return insertFeedbackEvent(event);
}

export function listPersistedFeedbackEvents() {
  return getFeedbackEvents();
}

export function clearPersistedFeedbackEvents() {
  resetFeedbackEvents();
}
