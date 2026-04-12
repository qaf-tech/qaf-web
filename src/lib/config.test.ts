import { afterEach, beforeEach, describe, expect, test } from "bun:test";

describe("config", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.NEXT_PUBLIC_WS_URL = "ws://test-host/ws";
    process.env.NEXT_PUBLIC_API_URL = "http://test-host/api";
    process.env.NEXT_PUBLIC_APP_NAME = "Test App";
    process.env.NEXT_PUBLIC_APP_VERSION = "9.9.9";
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  test("reads all config values from NEXT_PUBLIC_ env vars", async () => {
    const { config } = await import(`./config.ts?t=${Date.now()}`);
    expect(config.wsUrl).toBe("ws://test-host/ws");
    expect(config.apiUrl).toBe("http://test-host/api");
    expect(config.appName).toBe("Test App");
    expect(config.appVersion).toBe("9.9.9");
  });

  test("config properties are defined", async () => {
    const { config } = await import(`./config.ts?t=${Date.now()}`);
    expect(config.wsUrl).toBeDefined();
    expect(config.apiUrl).toBeDefined();
    expect(config.appName).toBeDefined();
    expect(config.appVersion).toBeDefined();
  });
});
