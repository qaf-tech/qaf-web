import { beforeEach, describe, expect, mock, test } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";
import type { Asset } from "@/lib/models/asset";
import type { SellStep } from "@/lib/models/dex";

type HookReturn = {
  step: SellStep;
  estimatedPrice: number;
  elapsedTime: number;
  rlusdReceived: number;
  txHash: string | null;
  error: string | null;
  confirmSell: () => Promise<void>;
  cancelSell: () => void;
  cancelOffer: () => void;
  goBack: () => void;
};

let hookState: HookReturn;

function defaultHook(): HookReturn {
  return {
    step: "estimate",
    estimatedPrice: 96,
    elapsedTime: 0,
    rlusdReceived: 0,
    txHash: null,
    error: null,
    confirmSell: () => Promise.resolve(),
    cancelSell: () => undefined,
    cancelOffer: () => undefined,
    goBack: () => undefined,
  };
}

mock.module("@/hooks/useSellBack", () => ({
  useSellBack: () => hookState,
}));

mock.module("next/navigation", () => ({
  useRouter: () => ({ push: () => undefined }),
}));

mock.module("@/lib/config", () => ({
  config: { xrplExplorerUrl: "https://testnet.xrpl.org" },
}));

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

describe("SellBackFlow", () => {
  beforeEach(() => {
    hookState = defaultHook();
  });

  test("renders step indicator with role=progressbar and aria-valuemax=5", async () => {
    const { SellBackFlow } = await import("./SellBackFlow");
    render(<SellBackFlow asset={asset} onClose={() => undefined} />);
    const pb = screen.getByRole("progressbar");
    expect(pb.getAttribute("aria-valuemax")).toBe("5");
    expect(pb.getAttribute("aria-valuenow")).toBe("1");
  });

  test("close button calls onClose and has aria-label='Close'", async () => {
    const onClose = mock(() => undefined);
    const { SellBackFlow } = await import("./SellBackFlow");
    render(<SellBackFlow asset={asset} onClose={onClose} />);
    const btn = screen.getByRole("button", { name: "Close" });
    fireEvent.click(btn);
    expect(onClose).toHaveBeenCalled();
  });

  test("renders SellConfirmation when step is estimate", async () => {
    const { SellBackFlow } = await import("./SellBackFlow");
    render(<SellBackFlow asset={asset} onClose={() => undefined} />);
    expect(screen.getByText("$96.00")).toBeTruthy();
  });

  test("renders waiting message and elapsed timer when step is waiting", async () => {
    hookState = {
      ...defaultHook(),
      step: "waiting",
      elapsedTime: 2.3,
    };
    const { SellBackFlow } = await import("./SellBackFlow");
    render(<SellBackFlow asset={asset} onClose={() => undefined} />);
    expect(screen.getByText(/Waiting for a buyer/)).toBeTruthy();
    expect(screen.getByText("2.3s")).toBeTruthy();
  });

  test("renders TransactionSuccess when step is success", async () => {
    hookState = {
      ...defaultHook(),
      step: "success",
      rlusdReceived: 96,
      txHash: "HASH1",
      elapsedTime: 3,
    };
    const { SellBackFlow } = await import("./SellBackFlow");
    render(<SellBackFlow asset={asset} onClose={() => undefined} />);
    expect(screen.getByText(/Sold in 3\.0s/)).toBeTruthy();
  });

  test("renders error card with retry when step is error", async () => {
    hookState = {
      ...defaultHook(),
      step: "error",
      error: "boom",
    };
    const { SellBackFlow } = await import("./SellBackFlow");
    render(<SellBackFlow asset={asset} onClose={() => undefined} />);
    expect(screen.getByText("boom")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Try Again" })).toBeTruthy();
  });
});
