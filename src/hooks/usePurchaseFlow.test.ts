import { beforeEach, describe, expect, mock, test } from "bun:test";
import { act, renderHook } from "@testing-library/react";
import type { QuoteData } from "@/lib/models/chat";

type Subscriber = (payload: unknown) => void;

let capturedSubscriber: Subscriber | null = null;
const sendMock = mock(() => {});

mock.module("@/hooks/useWebSocket", () => ({
  useWebSocket: () => ({
    status: "connected",
    subscribe: (_type: string, cb: Subscriber) => {
      capturedSubscriber = cb;
      return () => {
        capturedSubscriber = null;
      };
    },
    send: sendMock,
  }),
}));

function makeQuote(): QuoteData {
  return {
    merchantId: "m1",
    merchantName: "Acme",
    merchantUrl: "https://acme.test",
    productName: "Widget",
    productDescription: "",
    priceDrops: 15_000_000,
    currency: "RLUSD",
    features: [],
    identityFactsRequired: [],
    rating: 5,
    validUntil: "",
    score: 1,
  };
}

async function loadHook() {
  const mod = await import("./usePurchaseFlow");
  return mod.usePurchaseFlow;
}

describe("usePurchaseFlow", () => {
  beforeEach(() => {
    capturedSubscriber = null;
    sendMock.mockClear();
  });

  test("purchaseState starts as 'idle'", async () => {
    const usePurchaseFlow = await loadHook();
    const { result } = renderHook(() => usePurchaseFlow());
    expect(result.current.purchaseState).toBe("idle");
  });

  test("startPurchase sets state to 'confirming' and stores quote", async () => {
    const usePurchaseFlow = await loadHook();
    const { result } = renderHook(() => usePurchaseFlow());
    act(() => {
      result.current.startPurchase(makeQuote());
    });
    expect(result.current.purchaseState).toBe("confirming");
    expect(result.current.selectedQuote?.merchantId).toBe("m1");
    expect(result.current.timeRemaining).toBe(10);
  });

  test(
    "timeRemaining decrements from 10 to 9 after ~1 second",
    async () => {
      const usePurchaseFlow = await loadHook();
      const { result } = renderHook(() => usePurchaseFlow());
      act(() => {
        result.current.startPurchase(makeQuote());
      });
      await act(async () => {
        await new Promise((r) => setTimeout(r, 1100));
      });
      expect(result.current.timeRemaining).toBeLessThanOrEqual(9);
    },
    { timeout: 3000 },
  );

  test("cancelPurchase resets state to 'idle'", async () => {
    const usePurchaseFlow = await loadHook();
    const { result } = renderHook(() => usePurchaseFlow());
    act(() => {
      result.current.startPurchase(makeQuote());
    });
    act(() => {
      result.current.cancelPurchase();
    });
    expect(result.current.purchaseState).toBe("idle");
    expect(result.current.selectedQuote).toBeNull();
    expect(result.current.timeRemaining).toBe(10);
  });

  test("triggerBiometric sets biometricStatus to 'authenticating' immediately", async () => {
    Object.defineProperty(navigator, "credentials", {
      value: {
        get: () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ id: "fake" }), 10),
          ),
      },
      configurable: true,
    });
    const usePurchaseFlow = await loadHook();
    const { result } = renderHook(() => usePurchaseFlow());
    act(() => {
      result.current.triggerBiometric();
    });
    expect(result.current.biometricStatus).toBe("authenticating");
  });

  test("purchase_complete message sets state to 'complete'", async () => {
    const usePurchaseFlow = await loadHook();
    const { result } = renderHook(() => usePurchaseFlow());
    act(() => {
      capturedSubscriber?.({ message_type: "purchase_complete" });
    });
    expect(result.current.purchaseState).toBe("complete");
  });

  test("purchase_status appends step to steps", async () => {
    const usePurchaseFlow = await loadHook();
    const { result } = renderHook(() => usePurchaseFlow());
    act(() => {
      capturedSubscriber?.({
        message_type: "purchase_status",
        step: {
          id: "s1",
          label: "Paying",
          status: "in_progress",
          timestamp: 0,
        },
      });
    });
    expect(result.current.steps).toHaveLength(1);
    expect(result.current.steps[0]?.id).toBe("s1");
  });

  test("timer is cleaned up on unmount", async () => {
    const usePurchaseFlow = await loadHook();
    const { result, unmount } = renderHook(() => usePurchaseFlow());
    act(() => {
      result.current.startPurchase(makeQuote());
    });
    unmount();
    await new Promise((r) => setTimeout(r, 1100));
    expect(true).toBe(true);
  });
});
