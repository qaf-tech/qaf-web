import { beforeEach, describe, expect, mock, test } from "bun:test";
import { act, renderHook, waitFor } from "@testing-library/react";
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

const asset: Asset = {
  id: "a1",
  title: "Concert Ticket",
  issuer: "LiveNation",
  category: "tickets",
  description: "",
  expiresAt: null,
  issuedAt: "2026-04-01T00:00:00Z",
  tokenId: "tok1",
  metadata: { purchasePrice: "120" },
  iconUrl: "",
};

describe("useSellBack", () => {
  beforeEach(() => {
    resetMocks();
  });

  test("initial step is estimate with 80% of purchase price", async () => {
    const { useSellBack } = await import("./useSellBack");
    const { result } = renderHook(() => useSellBack({ asset }));
    expect(result.current.step).toBe("estimate");
    expect(result.current.estimatedPrice).toBeCloseTo(96, 5);
  });

  test("sends dex.estimate_price when purchasePrice metadata is missing", async () => {
    const { useSellBack } = await import("./useSellBack");
    renderHook(() =>
      useSellBack({ asset: { ...asset, metadata: {} } }),
    );
    expect(sent.some((s) => s.type === "dex.estimate_price")).toBe(true);
  });

  test("confirmSell transitions to authenticate then submitting on auth success", async () => {
    const { useSellBack } = await import("./useSellBack");
    const { result } = renderHook(() => useSellBack({ asset }));
    await act(async () => {
      await result.current.confirmSell();
    });
    expect(result.current.step).toBe("submitting");
    expect(sent.some((s) => s.type === "dex.create_sell_offer")).toBe(true);
  });

  test("confirmSell transitions back to estimate on auth cancel", async () => {
    tierResult = "cancel";
    const { useSellBack } = await import("./useSellBack");
    const { result } = renderHook(() => useSellBack({ asset }));
    await act(async () => {
      await result.current.confirmSell();
    });
    expect(result.current.step).toBe("estimate");
  });

  test("transitions to waiting on successful offer creation", async () => {
    const { useSellBack } = await import("./useSellBack");
    const { result } = renderHook(() => useSellBack({ asset }));
    await act(async () => {
      await result.current.confirmSell();
    });
    fire("dex.create_sell_offer:response", {
      status: "ok",
      offer_index: "OI1",
      tx_hash: "HASH1",
    });
    expect(result.current.step).toBe("waiting");
  });

  test("transitions to success on dex:offer_accepted event", async () => {
    const { useSellBack } = await import("./useSellBack");
    const { result } = renderHook(() => useSellBack({ asset }));
    await act(async () => {
      await result.current.confirmSell();
    });
    fire("dex.create_sell_offer:response", {
      status: "ok",
      offer_index: "OI1",
      tx_hash: "HASH1",
    });
    fire("dex:offer_accepted", {
      offer_index: "OI1",
      amount_rlusd: 96,
      tx_hash: "HASH2",
    });
    await waitFor(() => expect(result.current.step).toBe("success"));
    expect(result.current.rlusdReceived).toBe(96);
  });

  test("transitions to error on offer creation failure", async () => {
    const { useSellBack } = await import("./useSellBack");
    const { result } = renderHook(() => useSellBack({ asset }));
    await act(async () => {
      await result.current.confirmSell();
    });
    fire("dex.create_sell_offer:response", {
      status: "error",
      error: "Network",
    });
    expect(result.current.step).toBe("error");
    expect(result.current.error).toBe("Network");
  });

  test("cancelOffer sends cancel message with pending offer index", async () => {
    const { useSellBack } = await import("./useSellBack");
    const { result } = renderHook(() => useSellBack({ asset }));
    await act(async () => {
      await result.current.confirmSell();
    });
    fire("dex.create_sell_offer:response", {
      status: "ok",
      offer_index: "OI1",
      tx_hash: "HASH1",
    });
    act(() => {
      result.current.cancelOffer();
    });
    expect(
      sent.some(
        (s) =>
          s.type === "dex.cancel_offer" &&
          (s.payload as { offer_index: string }).offer_index === "OI1",
      ),
    ).toBe(true);
  });

  test("goBack transitions authenticate to estimate", async () => {
    tierResult = "cancel";
    const { useSellBack } = await import("./useSellBack");
    const { result } = renderHook(() => useSellBack({ asset }));
    await act(async () => {
      await result.current.confirmSell();
    });
    act(() => {
      result.current.goBack();
    });
    expect(result.current.step).toBe("estimate");
  });

  test("goBack is no-op in submitting/waiting/success", async () => {
    const { useSellBack } = await import("./useSellBack");
    const { result } = renderHook(() => useSellBack({ asset }));
    await act(async () => {
      await result.current.confirmSell();
    });
    expect(result.current.step).toBe("submitting");
    act(() => {
      result.current.goBack();
    });
    expect(result.current.step).toBe("submitting");
  });
});
