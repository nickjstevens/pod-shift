import { beforeEach, describe, expect, it } from "vitest";

import { listProvidersHandler } from "../../../server/api/providers.get";

describe("/api/providers", () => {
  beforeEach(() => {
    process.env.POD_SHIFT_USE_MOCK_CATALOG = "false";
  });

  it("returns the supported provider matrix used by the UI", () => {
    const response = listProvidersHandler();

    expect(response.statusCode).toBe(200);
    expect(response.body.providers).toHaveLength(6);
    expect(response.body.providers.every((provider) => provider.supportsOutput)).toBe(true);
  });

  it("keeps each enabled input provider selectable as an output provider under live defaults", () => {
    const response = listProvidersHandler();

    for (const provider of response.body.providers.filter((entry) => entry.supportsInput)) {
      expect(provider.supportsOutput).toBe(true);
    }
  });
});
