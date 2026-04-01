import { describe, expect, it } from "vitest";

import { listProvidersHandler } from "../../../server/api/providers.get";

describe("/api/providers", () => {
  it("returns the supported provider matrix used by the UI", () => {
    const response = listProvidersHandler();

    expect(response.statusCode).toBe(200);
    expect(response.body.providers).toHaveLength(8);
    expect(response.body.providers.every((provider) => provider.supportsOutput)).toBe(true);
  });
});
