import { beforeEach, describe, expect, mock, test } from "bun:test";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { AccessLogEntry } from "@/lib/models/accessLog";

type Cb = (payload: unknown) => void;
const subs: Record<string, Cb[]> = {};
const sent: { type: string; payload: unknown }[] = [];

function resetMocks(): void {
  for (const k of Object.keys(subs)) delete subs[k];
  sent.length = 0;
}

mock.module("@/hooks/useWebSocket", () => ({
  useWebSocket: () => ({
    status: "connected",
    subscribe: (type: string, cb: Cb) => {
      subs[type] = subs[type] ?? [];
      subs[type].push(cb);
      return () => {
        subs[type] = (subs[type] ?? []).filter((c) => c !== cb);
      };
    },
    send: (type: string, payload: unknown) => {
      sent.push({ type, payload });
    },
  }),
}));

function fireEvent(type: string, payload: unknown): void {
  act(() => {
    for (const cb of subs[type] ?? []) cb(payload);
  });
}

const entry: AccessLogEntry = {
  id: "al1",
  accessorName: "Airline",
  credentialName: "Passport",
  factDisclosed: "passport number",
  accessedAt: "2026-04-12T10:00:00Z",
  expiresAt: null,
  revoked: false,
};

describe("useAccessLog", () => {
  beforeEach(() => {
    resetMocks();
  });

  test("returns isLoading: true initially", async () => {
    const { useAccessLog } = await import("./useAccessLog");
    const { result } = renderHook(() => useAccessLog());
    expect(result.current.isLoading).toBe(true);
  });

  test("sets entries on successful response", async () => {
    const { useAccessLog } = await import("./useAccessLog");
    const { result } = renderHook(() => useAccessLog());
    fireEvent("wallet.list_access_log:response", {
      status: "ok",
      entries: [entry],
    });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.entries).toHaveLength(1);
  });

  test("revokeAccess adds to revokingIds then flips revoked on success", async () => {
    const { useAccessLog } = await import("./useAccessLog");
    const { result } = renderHook(() => useAccessLog());
    fireEvent("wallet.list_access_log:response", {
      status: "ok",
      entries: [entry],
    });
    let promise: Promise<void> | null = null;
    act(() => {
      promise = result.current.revokeAccess("al1");
    });
    expect(result.current.revokingIds.has("al1")).toBe(true);
    fireEvent("wallet.revoke_access:response", {
      status: "ok",
      access_id: "al1",
    });
    await waitFor(() => {
      expect(result.current.revokingIds.has("al1")).toBe(false);
    });
    expect(result.current.entries[0]?.revoked).toBe(true);
    await promise;
  });

  test("revokeAccess removes from revokingIds on error and rejects", async () => {
    const { useAccessLog } = await import("./useAccessLog");
    const { result } = renderHook(() => useAccessLog());
    fireEvent("wallet.list_access_log:response", {
      status: "ok",
      entries: [entry],
    });
    let caught: Error | null = null;
    act(() => {
      result.current.revokeAccess("al1").catch((err: Error) => {
        caught = err;
      });
    });
    fireEvent("wallet.revoke_access:response", {
      status: "error",
      access_id: "al1",
      error: "Nope",
    });
    await waitFor(() => {
      expect(result.current.revokingIds.has("al1")).toBe(false);
    });
    expect(caught).not.toBeNull();
    expect((caught as unknown as Error).message).toBe("Nope");
  });
});
