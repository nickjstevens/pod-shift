import { describe, expect, it } from "vitest";

import { ApiError } from "../../../../server/utils/api-error";
import { classifyFailure } from "../../../../server/services/feedback/classify-failure";
import {
  clearPersistedFeedbackEvents,
  listPersistedFeedbackEvents
} from "../../../../server/services/feedback/feedback-repository";
import { logFailureFeedback } from "../../../../server/services/feedback/log-feedback";

describe("failure classification and feedback redaction", () => {
  it("classifies low-confidence failures distinctly", () => {
    const classified = classifyFailure(
      new ApiError(422, "low_confidence_match", "No confident podcast match was found.")
    );

    expect(classified.failureClass).toBe("low_confidence_match");
    expect(classified.confidenceBucket).toBe("low");
    expect(classified.retryable).toBe(false);
  });

  it("logs only redacted feedback details", async () => {
    clearPersistedFeedbackEvents();

    await logFailureFeedback({
      error: new ApiError(422, "unsupported_source", "Unsupported source."),
      inputUrl: "https://www.youtube.com/watch?v=yt-episode-unknown-999&si=tracking-token",
      targetProviderId: "pocket_casts"
    });

    const [feedbackEvent] = listPersistedFeedbackEvents();
    expect(feedbackEvent.sourceProviderId).toBe("youtube");
    expect(feedbackEvent.targetProviderId).toBe("pocket_casts");
    expect(feedbackEvent.strippedTrackingKeys).toEqual(["si"]);
    expect(feedbackEvent.normalizedIdentityHash).toHaveLength(64);
    expect(Object.prototype.hasOwnProperty.call(feedbackEvent, "inputUrl")).toBe(false);
  });
});
