import { defineEventHandler, readBody } from "h3";

import type { ErrorResponse, PreviewResponse } from "../../shared/types/conversion";
import { previewRequestSchema } from "../../shared/schemas/api";
import { logFailureFeedback } from "../services/feedback/log-feedback";
import { buildPreview } from "../services/matchers/build-preview";
import { ApiError, toErrorResponse } from "../utils/api-error";
import { ok, sendResult } from "../utils/api-response";

type PreviewApiBody = {
  inputUrl: string;
};

export async function handlePreviewRequest(body: PreviewApiBody) {
  const parsed = previewRequestSchema.safeParse(body);
  if (!parsed.success) {
    const response = toErrorResponse(
      new ApiError(400, "malformed_link", "Paste a full public podcast URL to preview.")
    );
    await logFailureFeedback({
      error: new ApiError(400, "malformed_link", "Paste a full public podcast URL to preview."),
      inputUrl: body.inputUrl ?? "",
      targetProviderId: "unknown"
    });
    response.body.feedbackLogged = true;
    return response;
  }

  try {
    const preview = await buildPreview(parsed.data);
    return ok<PreviewResponse>(preview);
  } catch (error) {
    const response = toErrorResponse(error) as { statusCode: number; body: ErrorResponse };
    await logFailureFeedback({
      error,
      inputUrl: parsed.data.inputUrl,
      targetProviderId: "unknown"
    });
    response.body.feedbackLogged = true;
    return response;
  }
}

export default defineEventHandler(async (event) => {
  const body = (await readBody(event)) as PreviewApiBody;
  return sendResult(event, await handlePreviewRequest(body));
});
