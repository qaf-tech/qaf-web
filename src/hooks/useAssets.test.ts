import { beforeEach, describe, expect, mock, test } from "bun:test";
import { act, renderHook } from "@testing-library/react";
import type { Asset } from "@/lib/models/asset";

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

const sampleAsset: Asset = {
  id: "a1",
  title: "Ticket",
  issuer: "LiveNation",
  category: "tickets",
  description: "Concert",
  expiresAt: null,
  issuedAt: "2026-04-01T00:00:00Z",
  tokenId: "tok1",
  metadata: {},
  iconUrl: "",
};

describe("useAssets", () => {
  beforeEach(() => {
    resetMocks();
  });

  test("returns isLoading: true initially", async () => {
    const { useAssets } = await import("./useAssets");
    const { result } = renderHook(() => useAssets());
    expect(result.current.isLoading).toBe(true);
    expect(result.current.assets).toHaveLength(0);
  });

  test("sends wallet.list_assets on mount", async () => {
    const { useAssets } = await import("./useAssets");
    renderHook(() => useAssets());
    expect(sent.some((s) => s.type === "wallet.list_assets")).toBe(true);
  });

  test("sets assets on successful response", async () => {
    const { useAssets } = await import("./useAssets");
    const { result } = renderHook(() => useAssets());
    fireEvent("wallet.list_assets:response", {
      status: "ok",
      assets: [sampleAsset],
    });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.assets).toHaveLength(1);
    expect(result.current.assets[0]?.id).toBe("a1");
  });

  test("sets error on error response", async () => {
    const { useAssets } = await import("./useAssets");
    const { result } = renderHook(() => useAssets());
    fireEvent("wallet.list_assets:response", {
      status: "error",
      error: "Boom",
    });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe("Boom");
  });

  test("prepends asset on wallet:transaction event", async () => {
    const { useAssets } = await import("./useAssets");
    const { result } = renderHook(() => useAssets());
    fireEvent("wallet.list_assets:response", {
      status: "ok",
      assets: [sampleAsset],
    });
    const newAsset: Asset = { ...sampleAsset, id: "a2", title: "New" };
    fireEvent("wallet:transaction", { asset: newAsset });
    expect(result.current.assets[0]?.id).toBe("a2");
  });

  test("refetch resets loading and re-sends request", async () => {
    const { useAssets } = await import("./useAssets");
    const { result } = renderHook(() => useAssets());
    fireEvent("wallet.list_assets:response", {
      status: "ok",
      assets: [sampleAsset],
    });
    act(() => {
      result.current.refetch();
    });
    expect(result.current.isLoading).toBe(true);
    const count = sent.filter((s) => s.type === "wallet.list_assets").length;
    expect(count).toBeGreaterThanOrEqual(2);
  });
});
