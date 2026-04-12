import { beforeEach, describe, expect, mock, test } from "bun:test";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { Asset, Category } from "@/lib/models/asset";

let requireTierMock = mock(async (_tier: number) => {});

mock.module("@/hooks/useSecurityTier", () => ({
  useSecurityTier: () => ({
    pinConfigured: true,
    setupPin: async () => {},
    verifyPin: async () => true,
    requireTier: requireTierMock,
  }),
}));

// Leaf-level mocks: keep our own token.ts and qr.ts modules intact so their
// test files (token.test.ts, qr.test.ts) aren't polluted by global mock state.
const signAsyncMock = mock(
  async (_msg: Uint8Array, _key: Uint8Array) => new Uint8Array(64),
);
mock.module("@noble/ed25519", () => ({
  signAsync: signAsyncMock,
}));

const toDataURLMock = mock(async (_data: string) => "data:image/png;base64,AA");
mock.module("qrcode", () => ({
  default: { toDataURL: toDataURLMock },
}));

function makeAsset(
  overrides: Partial<Asset> = {},
  category: Category = "tickets",
): Asset {
  return {
    id: "asset-1",
    title: "Concert ticket",
    issuer: "Ticketer",
    category,
    description: "",
    expiresAt: null,
    issuedAt: "2026-01-01T00:00:00Z",
    tokenId: "t1",
    metadata: {},
    iconUrl: "",
    ...overrides,
  };
}

async function loadHook() {
  const mod = await import("./usePresentation");
  return mod;
}

beforeEach(() => {
  requireTierMock = mock(async (_tier: number) => {});
  signAsyncMock.mockClear();
  signAsyncMock.mockImplementation(async () => new Uint8Array(64));
  toDataURLMock.mockClear();
  toDataURLMock.mockImplementation(async () => "data:image/png;base64,AA");
  mock.module("@/hooks/useSecurityTier", () => ({
    useSecurityTier: () => ({
      pinConfigured: true,
      setupPin: async () => {},
      verifyPin: async () => true,
      requireTier: requireTierMock,
    }),
  }));
});

describe("determineTier", () => {
  test("returns 1 when value_eur is missing", async () => {
    const { determineTier } = await loadHook();
    expect(determineTier(makeAsset())).toBe(1);
  });

  test("returns 1 for value_eur below 50", async () => {
    const { determineTier } = await loadHook();
    expect(determineTier(makeAsset({ metadata: { value_eur: "30" } }))).toBe(1);
  });

  test("returns 2 for value_eur at exactly 50", async () => {
    const { determineTier } = await loadHook();
    expect(determineTier(makeAsset({ metadata: { value_eur: "50" } }))).toBe(2);
  });

  test("returns 2 for value_eur above 50", async () => {
    const { determineTier } = await loadHook();
    expect(determineTier(makeAsset({ metadata: { value_eur: "100" } }))).toBe(
      2,
    );
  });
});

describe("usePresentation", () => {
  test("initial state is idle when asset is null", async () => {
    const { usePresentation } = await loadHook();
    const { result } = renderHook(() => usePresentation(null));
    expect(result.current.state).toBe("idle");
    expect(result.current.qrDataUrl).toBeNull();
    expect(result.current.token).toBeNull();
  });

  test("auto-starts and transitions through states to presenting", async () => {
    const { usePresentation } = await loadHook();
    const { result } = renderHook(() => usePresentation(makeAsset()));
    await waitFor(() => {
      expect(result.current.state).toBe("presenting");
    });
    expect(result.current.qrDataUrl).toBe("data:image/png;base64,AA");
    expect(result.current.token?.credential_id).toBe("asset-1");
  });

  test("transitions to error when requireTier rejects with auth_cancelled", async () => {
    requireTierMock = mock(async (_tier: number) => {
      throw Object.assign(new Error("cancelled"), { code: "auth_cancelled" });
    });
    mock.module("@/hooks/useSecurityTier", () => ({
      useSecurityTier: () => ({
        pinConfigured: true,
        setupPin: async () => {},
        verifyPin: async () => true,
        requireTier: requireTierMock,
      }),
    }));
    const { usePresentation } = await loadHook();
    const { result } = renderHook(() => usePresentation(makeAsset()));
    await waitFor(() => {
      expect(result.current.state).toBe("error");
    });
    expect(result.current.error).toBe(
      "Authentication required to present credential",
    );
  });

  test("transitions to error when token generation throws", async () => {
    signAsyncMock.mockImplementation(async () => {
      throw new Error("signing failed");
    });
    const { usePresentation } = await loadHook();
    const { result } = renderHook(() => usePresentation(makeAsset()));
    await waitFor(() => {
      expect(result.current.state).toBe("error");
    });
    expect(result.current.error).toContain("signing failed");
  });

  test("reset returns to idle and clears token/qr/error", async () => {
    const { usePresentation } = await loadHook();
    const { result } = renderHook(() => usePresentation(makeAsset()));
    await waitFor(() => {
      expect(result.current.state).toBe("presenting");
    });
    act(() => {
      result.current.reset();
    });
    expect(result.current.state).toBe("idle");
    expect(result.current.token).toBeNull();
    expect(result.current.qrDataUrl).toBeNull();
    expect(result.current.error).toBeNull();
  });
});
