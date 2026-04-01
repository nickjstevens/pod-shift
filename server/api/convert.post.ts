import { defineEventHandler, readBody } from "h3";

import type { ConvertSuccessResponse, ErrorResponse } from "../../shared/types/conversion";
import { convertRequestSchema } from "../../shared/schemas/api";
import { logFailureFeedback } from "../services/feedback/log-feedback";
import { convertLink } from "../services/matchers/convert-link";
import { ApiError, toErrorResponse } from "../utils/api-error";
import { ok, sendResult } from "../utils/api-response";

type ConvertApiBody = {
  inputUrl: string;
  targetProvider: Parameters<typeof convertLink>[0]["targetProvider"];
  preferTimestamp?: boolean;
};

export async function handleConvertRequest(body: ConvertApiBody) {
  const parsed = convertRequestSchema.safeParse(body);
  if (!parsed.success) {
    const response = toErrorResponse(
      new ApiError(400, "malformed_link", "Paste a full public podcast URL to convert.")
    );
    await logFailureFeedback({
      error: new ApiError(400, "malformed_link", "Paste a full public podcast URL to convert."),
      inputUrl: body.inputUrl ?? "",
      targetProviderId: body.targetProvider ?? "unknown"
    });
    response.body.feedbackLogged = true;
    return response;
  }

  try {
    const result = await convertLink(parsed.data);
    return ok<ConvertSuccessResponse>(result);
  } catch (error) {
    const response = toErrorResponse(error) as { statusCode: number; body: ErrorResponse };
    await logFailureFeedback({
      error,
      inputUrl: parsed.data.inputUrl,
      targetProviderId: parsed.data.targetProvider
    });
    response.body.feedbackLogged = true;
    return response;
  }
}

export default defineEventHandler(async (event) => {
  const body = (await readBody(event)) as ConvertApiBody;
  return sendResult(event, await handleConvertRequest(body));
});
