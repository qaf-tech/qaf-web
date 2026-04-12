import { describe, expect, test } from "bun:test";
import { decodeHandoffQr, encodeHandoffQr, isExpired } from "@qaf/shared/handoff";

describe("handoff integration via @qaf/shared", () => {
  test("round-trips through the workspace package", () => {
    const env = {
      sessionToken: "tok",
      origin: "web" as const,
      targetRoute: "/wallet",
      createdAt: "2026-04-12T12:00:00.000Z",
      expiresAt: "2026-04-12T12:02:00.000Z",
      signature: "sig",
    };
    expect(decodeHandoffQr(encodeHandoffQr(env))).toEqual(env);
  });

  test("isExpired is reachable", () => {
    expect(
      isExpired(
        {
          sessionToken: "t",
          origin: "web",
          targetRoute: "/",
          createdAt: "2026-04-12T12:00:00.000Z",
          expiresAt: "2026-04-12T12:01:00.000Z",
          signature: "s",
        },
        "2026-04-12T12:05:00.000Z",
      ),
    ).toBe(true);
  });
});
