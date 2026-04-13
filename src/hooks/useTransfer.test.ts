import { beforeEach, describe, expect, mock, test } from "bun:test";
import { act, renderHook } from "@testing-library/react";
import type { Asset } from "@/lib/models/asset";

type Cb = (payload: unknown) => void;
const subs: Record<string, Cb[]> = {};
const sent: { type: string; payload: unknown }[] = [];
let tierResult: "ok" | "cancel" = "ok";

function resetMocks(): void {
  for (const k of Object.keys(subs)) delete subs[k];
  sent.length = 0;
  tierResult = "ok";
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

mock.module("@/hooks/useSecurityTier", () => ({
  useSecurityTier: () => ({
    requireTier: (_t: number) =>
      tierResult === "ok"
        ? Promise.resolve()
        : Promise.reject(new Error("cancelled")),
  }),
}));

function fire(type: string, payload: unknown): void {
  act(() => {
    for (const cb of subs[type] ?? []) cb(payload);
  });
}

const VALID_ADDR = "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh";
const asset: Asset = {
  id: "a1",
  title: "Concert Ticket",
  issuer: "LiveNation",
  category: "tickets",
  description: "",
  expiresAt: null,
  issuedAt: "2026-04-01T00:00:00Z",
  tokenId: "tok1",
  metadata: {},
  iconUrl: "",
};

describe("useTransfer", () => {
  beforeEach(() => {
    resetMocks();
  });

  test("initial step is recipient with null address", async () => {
    const { useTransfer } = await import("./useTransfer");
    const { result } = renderHook(() => useTransfer({ asset }));
    expect(result.current.step).toBe("recipient");
    expect(result.current.recipientAddress).toBeNull();
  });

  test("setRecipient accepts valid XRPL address", async () => {
    const { useTransfer } = await import("./useTransfer");
    const { result } = renderHook(() => useTransfer({ asset }));
    act(() => {
      result.current.setRecipient(VALID_ADDR);
    });
    expect(result.current.recipientAddress).toBe(VALID_ADDR);
    expect(result.current.error).toBeNull();
  });

  test("setRecipient rejects address missing r prefix", async () => {
    const { useTransfer } = await import("./useTransfer");
    const { result } = renderHook(() => useTransfer({ asset }));
    act(() => {
      result.current.setRecipient("xHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh");
    });
    expect(result.current.recipientAddress).toBeNull();
    expect(result.current.error).toContain("Invalid");
  });

  test("setRecipient rejects too-short address", async () => {
    const { useTransfer } = await import("./useTransfer");
    const { result } = renderHook(() => useTransfer({ asset }));
    act(() => {
      result.current.setRecipient("rABC");
    });
    expect(result.current.recipientAddress).toBeNull();
    expect(result.current.error).toContain("Invalid");
  });

  test("setRecipient rejects forbidden chars (0, O, I, l)", async () => {
    const { useTransfer } = await import("./useTransfer");
    const { result } = renderHook(() => useTransfer({ asset }));
    act(() => {
      result.current.setRecipient("rHb9CJAWyB4rj0OIl96DkukG4bwdtyTh");
    });
    expect(result.current.recipientAddress).toBeNull();
    expect(result.current.error).toContain("Invalid");
  });

  test("confirmTransfer rejects when recipient is null", async () => {
    const { useTransfer } = await import("./useTransfer");
    const { result } = renderHook(() => useTransfer({ asset }));
    await act(async () => {
      await result.current.confirmTransfer();
    });
    expect(result.current.error).toContain("Recipient");
  });

  test("confirmTransfer transitions to authenticate then submitting", async () => {
    const { useTransfer } = await import("./useTransfer");
    const { result } = renderHook(() => useTransfer({ asset }));
    act(() => {
      result.current.setRecipient(VALID_ADDR);
    });
    await act(async () => {
      await result.current.confirmTransfer();
    });
    expect(result.current.step).toBe("submitting");
    expect(sent.some((s) => s.type === "dex.transfer_asset")).toBe(true);
  });

  test("confirmTransfer returns to recipient on auth cancel", async () => {
    tierResult = "cancel";
    const { useTransfer } = await import("./useTransfer");
    const { result } = renderHook(() => useTransfer({ asset }));
    act(() => {
      result.current.setRecipient(VALID_ADDR);
    });
    await act(async () => {
      await result.current.confirmTransfer();
    });
    expect(result.current.step).toBe("recipient");
  });

  test("transitions to success on successful transfer response", async () => {
    const { useTransfer } = await import("./useTransfer");
    const { result } = renderHook(() => useTransfer({ asset }));
    act(() => {
      result.current.setRecipient(VALID_ADDR);
    });
    await act(async () => {
      await result.current.confirmTransfer();
    });
    fire("dex.transfer_asset:response", {
      status: "ok",
      tx_hash: "HASH-OK",
    });
    expect(result.current.step).toBe("success");
    expect(result.current.txHash).toBe("HASH-OK");
  });

  test("transitions to error on transfer failure", async () => {
    const { useTransfer } = await import("./useTransfer");
    const { result } = renderHook(() => useTransfer({ asset }));
    act(() => {
      result.current.setRecipient(VALID_ADDR);
    });
    await act(async () => {
      await result.current.confirmTransfer();
    });
    fire("dex.transfer_asset:response", {
      status: "error",
      error: "Boom",
    });
    expect(result.current.step).toBe("error");
    expect(result.current.error).toBe("Boom");
  });

  test("cancelTransfer resets all state", async () => {
    const { useTransfer } = await import("./useTransfer");
    const { result } = renderHook(() => useTransfer({ asset }));
    act(() => {
      result.current.setRecipient(VALID_ADDR);
    });
    act(() => {
      result.current.cancelTransfer();
    });
    expect(result.current.recipientAddress).toBeNull();
    expect(result.current.step).toBe("recipient");
  });

  test("goBack transitions authenticate to recipient", async () => {
    tierResult = "cancel";
    const { useTransfer } = await import("./useTransfer");
    const { result } = renderHook(() => useTransfer({ asset }));
    act(() => {
      result.current.setRecipient(VALID_ADDR);
    });
    await act(async () => {
      await result.current.confirmTransfer();
    });
    act(() => {
      result.current.goBack();
    });
    expect(result.current.step).toBe("recipient");
  });

  test("goBack is no-op during submitting/success", async () => {
    const { useTransfer } = await import("./useTransfer");
    const { result } = renderHook(() => useTransfer({ asset }));
    act(() => {
      result.current.setRecipient(VALID_ADDR);
    });
    await act(async () => {
      await result.current.confirmTransfer();
    });
    expect(result.current.step).toBe("submitting");
    act(() => {
      result.current.goBack();
    });
    expect(result.current.step).toBe("submitting");
  });
});
