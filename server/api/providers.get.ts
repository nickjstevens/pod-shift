import { defineEventHandler } from "h3";

import type { ProvidersResponse } from "../../shared/types/conversion";
import { listProviderCapabilities } from "../services/adapters/provider-registry";
import { ok, sendResult } from "../utils/api-response";

export function listProvidersHandler() {
  return ok<ProvidersResponse>({
    providers: listProviderCapabilities()
  });
}

export default defineEventHandler((event) => sendResult(event, listProvidersHandler()));
