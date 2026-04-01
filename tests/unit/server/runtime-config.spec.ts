import { afterEach, describe, expect, it } from "vitest";

import { readRuntimeConfig } from "../../../server/utils/runtime-config";

const originalUseMockCatalog = process.env.POD_SHIFT_USE_MOCK_CATALOG;
const originalTimeout = process.env.POD_SHIFT_REQUEST_TIMEOUT_MS;

describe("runtime config", () => {
  afterEach(() => {
    if (originalUseMockCatalog === undefined) {
      delete process.env.POD_SHIFT_USE_MOCK_CATALOG;
    } else {
      process.env.POD_SHIFT_USE_MOCK_CATALOG = originalUseMockCatalog;
    }

    if (originalTimeout === undefined) {
      delete process.env.POD_SHIFT_REQUEST_TIMEOUT_MS;
    } else {
      process.env.POD_SHIFT_REQUEST_TIMEOUT_MS = originalTimeout;
    }
  });

  it("defaults to live catalog mode and exposes no database settings", () => {
    delete process.env.POD_SHIFT_USE_MOCK_CATALOG;

    const config = readRuntimeConfig();

    expect(config.useMockCatalog).toBe(false);
    expect("databaseUrl" in config).toBe(false);
    expect("feedbackStore" in config).toBe(false);
  });

  it("respects an explicit mock catalog override", () => {
    process.env.POD_SHIFT_USE_MOCK_CATALOG = "true";

    expect(readRuntimeConfig().useMockCatalog).toBe(true);
  });

  it("keeps the timeout configurable without changing the live default", () => {
    process.env.POD_SHIFT_USE_MOCK_CATALOG = "false";
    process.env.POD_SHIFT_REQUEST_TIMEOUT_MS = "12000";

    const config = readRuntimeConfig();

    expect(config.useMockCatalog).toBe(false);
    expect(config.requestTimeoutMs).toBe(12000);
  });
});
