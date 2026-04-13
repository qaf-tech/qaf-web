import { beforeEach, describe, expect, mock, test } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";
import type { Asset } from "@/lib/models/asset";
import type { TransferStep } from "@/lib/models/dex";

type HookReturn = {
  step: TransferStep;
  recipientAddress: string | null;
  txHash: string | null;
  error: string | null;
  setRecipient: (address: string) => void;
  confirmTransfer: () => Promise<void>;
  cancelTransfer: () => void;
  goBack: () => void;
};

let hookState: HookReturn;

function defaultHook(): HookReturn {
  return {
    step: "recipient",
    recipientAddress: null,
    txHash: null,
    error: null,
    setRecipient: () => undefined,
    confirmTransfer: () => Promise.resolve(),
    cancelTransfer: () => undefined,
    goBack: () => undefined,
  };
}

mock.module("@/hooks/useTransfer", () => ({
  useTransfer: () => hookState,
}));

mock.module("@/hooks/useWebSocket", () => ({
  useWebSocket: () => ({
    status: "connected",
    subscribe: () => () => undefined,
    send: () => undefined,
  }),
}));

mock.module("next/navigation", () => ({
  useRouter: () => ({ push: () => undefined }),
}));

mock.module("@/lib/config", () => ({
  config: { xrplExplorerUrl: "https://testnet.xrpl.org" },
}));

const asset: Asset = {
  id: "a1",
  title: "Ticket",
  issuer: "LiveNation",
  category: "tickets",
  description: "",
  expiresAt: null,
  issuedAt: "2026-04-01T00:00:00Z",
  tokenId: "tok1",
  metadata: {},
  iconUrl: "",
};

describe("TransferFlow", () => {
  beforeEach(() => {
    hookState = defaultHook();
    Object.defineProperty(navigator, "mediaDevices", {
      value: { getUserMedia: () => Promise.reject(new Error("blocked")) },
      writable: true,
      configurable: true,
    });
  });

  test("renders step indicator with role=progressbar and aria-valuemax=4", async () => {
    const { TransferFlow } = await import("./TransferFlow");
    render(<TransferFlow asset={asset} onClose={() => undefined} />);
    const pb = screen.getByRole("progressbar");
    expect(pb.getAttribute("aria-valuemax")).toBe("4");
    expect(pb.getAttribute("aria-valuenow")).toBe("1");
  });

  test("close button calls onClose and has aria-label='Close'", async () => {
    const onClose = mock(() => undefined);
    const { TransferFlow } = await import("./TransferFlow");
    render(<TransferFlow asset={asset} onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalled();
  });

  test("renders RecipientInput when step is recipient", async () => {
    const { TransferFlow } = await import("./TransferFlow");
    render(<TransferFlow asset={asset} onClose={() => undefined} />);
    expect(screen.getByRole("tablist")).toBeTruthy();
  });

  test("renders submitting message with re-encryption subtext", async () => {
    hookState = { ...defaultHook(), step: "submitting" };
    const { TransferFlow } = await import("./TransferFlow");
    render(<TransferFlow asset={asset} onClose={() => undefined} />);
    expect(screen.getByText(/Transferring on XRPL/)).toBeTruthy();
    expect(screen.getByText(/Re-encrypting credential/)).toBeTruthy();
  });

  test("renders TransactionSuccess when step is success", async () => {
    hookState = {
      ...defaultHook(),
      step: "success",
      recipientAddress: "rFriend1234567890",
      txHash: "HASH1",
    };
    const { TransferFlow } = await import("./TransferFlow");
    render(<TransferFlow asset={asset} onClose={() => undefined} />);
    expect(screen.getByText(/Sent to rFrien/)).toBeTruthy();
  });

  test("renders error card with retry", async () => {
    hookState = { ...defaultHook(), step: "error", error: "nope" };
    const { TransferFlow } = await import("./TransferFlow");
    render(<TransferFlow asset={asset} onClose={() => undefined} />);
    expect(screen.getByText("nope")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Try Again" })).toBeTruthy();
  });
});
