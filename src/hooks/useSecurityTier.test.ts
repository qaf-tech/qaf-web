import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { act, renderHook } from "@testing-library/react";

import { SecurityTierError, useSecurityTier } from "./useSecurityTier";

type CredentialsLike = {
  create?: (options: unknown) => Promise<unknown>;
  get?: (options: unknown) => Promise<unknown>;
};

type MutableNavigator = Navigator & { credentials?: CredentialsLike };

const navRef = (): MutableNavigator => navigator as MutableNavigator;

function setCredentials(value: CredentialsLike | undefined): void {
  Object.defineProperty(navigator, "credentials", {
    value,
    configurable: true,
    writable: true,
  });
}

const sendMock = mock((_type: string, _payload: unknown) => {});

mock.module("@/hooks/useWebSocket", () => ({
  useWebSocket: () => ({
    status: "connected" as const,
    subscribe: () => () => undefined,
    send: sendMock,
  }),
}));

function fakeAssertion(): unknown {
  return {
    rawId: new Uint8Array([1, 2, 3, 4]).buffer,
    getClientExtensionResults: () => ({
      prf: { results: { first: new Uint8Array(32).fill(7).buffer } },
    }),
    response: { authenticatorData: new Uint8Array(0).buffer },
  };
}

let originalCredentials: CredentialsLike | undefined;

beforeEach(() => {
  originalCredentials = navRef().credentials;
  localStorage.clear();
  sendMock.mockClear();
  setCredentials({
    get: () => Promise.resolve(fakeAssertion()),
  });
});

afterEach(() => {
  setCredentials(originalCredentials);
  localStorage.clear();
});

describe("useSecurityTier", () => {
  test("requireTier(0) resolves immediately without calling getPasskey", async () => {
    let getCalled = false;
    setCredentials({
      get: () => {
        getCalled = true;
        return Promise.resolve(fakeAssertion());
      },
    });
    const { result } = renderHook(() => useSecurityTier());
    await result.current.requireTier(0);
    expect(getCalled).toBe(false);
  });

  test("requireTier(1) calls getPasskey and resolves on success", async () => {
    let getCalled = false;
    setCredentials({
      get: () => {
        getCalled = true;
        return Promise.resolve(fakeAssertion());
      },
    });
    const { result } = renderHook(() => useSecurityTier());
    await result.current.requireTier(1);
    expect(getCalled).toBe(true);
  });

  test("requireTier(1) rejects with auth_cancelled when user cancels biometric", async () => {
    setCredentials({
      get: () =>
        Promise.reject(
          Object.assign(new Error("cancel"), { name: "NotAllowedError" }),
        ),
    });
    const { result } = renderHook(() => useSecurityTier());
    await expect(result.current.requireTier(1)).rejects.toMatchObject({
      name: "SecurityTierError",
      code: "auth_cancelled",
    });
  });

  test("requireTier(2) rejects with pin_not_configured when no PIN is stored", async () => {
    const { result } = renderHook(() => useSecurityTier());
    await expect(
      result.current.requireTier(2, { pin: "0000" }),
    ).rejects.toMatchObject({ code: "pin_not_configured" });
  });

  test("requireTier(2) succeeds after setupPin and correct pin verification", async () => {
    const { result } = renderHook(() => useSecurityTier());
    await act(async () => {
      await result.current.setupPin("123456");
    });
    await result.current.requireTier(2, { pin: "123456" });
  });

  test("requireTier(2) rejects with pin_invalid on wrong pin", async () => {
    const { result } = renderHook(() => useSecurityTier());
    await act(async () => {
      await result.current.setupPin("123456");
    });
    await expect(
      result.current.requireTier(2, { pin: "999999" }),
    ).rejects.toMatchObject({ code: "pin_invalid" });
  });

  test("pinConfigured is false before setupPin and true after (new hook instance)", async () => {
    const { result } = renderHook(() => useSecurityTier());
    expect(result.current.pinConfigured).toBe(false);
    await act(async () => {
      await result.current.setupPin("123456");
    });
    const { result: result2 } = renderHook(() => useSecurityTier());
    expect(result2.current.pinConfigured).toBe(true);
  });

  test("requireTier(3) sends security.request_tier3 and rejects with cooldown_active", async () => {
    const { result } = renderHook(() => useSecurityTier());
    await act(async () => {
      await result.current.setupPin("123456");
    });
    await expect(
      result.current.requireTier(3, {
        pin: "123456",
        actionType: "drain_wallet",
      }),
    ).rejects.toMatchObject({ code: "cooldown_active" });
    expect(sendMock).toHaveBeenCalledTimes(1);
    const firstCall = sendMock.mock.calls[0];
    expect(firstCall[0]).toBe("security.request_tier3");
  });

  test("SecurityTierError preserves code and name", () => {
    const err = new SecurityTierError("auth_cancelled", "x");
    expect(err.name).toBe("SecurityTierError");
    expect(err.code).toBe("auth_cancelled");
  });
});
