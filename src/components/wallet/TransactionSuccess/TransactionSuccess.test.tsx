import { describe, expect, mock, test } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";

const pushMock = mock((_path: string) => undefined);

mock.module("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

describe("TransactionSuccess", () => {
  test("renders 'Sold in X.Xs' for sell type", async () => {
    const { TransactionSuccess } = await import("./TransactionSuccess");
    render(
      <TransactionSuccess
        type="sell"
        amount={96}
        duration={3.4}
        txHash="HASH1"
        explorerBaseUrl="https://testnet.xrpl.org"
      />,
    );
    expect(screen.getByText(/Sold in 3\.4s/)).toBeTruthy();
  });

  test("renders RLUSD amount for sell type", async () => {
    const { TransactionSuccess } = await import("./TransactionSuccess");
    render(
      <TransactionSuccess
        type="sell"
        amount={96}
        duration={3.4}
        txHash="HASH1"
        explorerBaseUrl="https://testnet.xrpl.org"
      />,
    );
    expect(screen.getByText(/RLUSD/)).toBeTruthy();
  });

  test("renders truncated recipient address for transfer type", async () => {
    const { TransactionSuccess } = await import("./TransactionSuccess");
    render(
      <TransactionSuccess
        type="transfer"
        recipientAddress="rFriend1234567890xYz4"
        txHash="HASH1"
        explorerBaseUrl="https://testnet.xrpl.org"
      />,
    );
    expect(screen.getByText(/Sent to rFrien\.\.\.xYz4/)).toBeTruthy();
  });

  test("renders Back to Wallet button and navigates to /", async () => {
    pushMock.mockClear();
    const { TransactionSuccess } = await import("./TransactionSuccess");
    render(
      <TransactionSuccess
        type="sell"
        amount={96}
        duration={3.4}
        txHash="HASH1"
        explorerBaseUrl="https://testnet.xrpl.org"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Back to Wallet" }));
    expect(pushMock).toHaveBeenCalledWith("/");
  });

  test("renders View on Ledger link with correct href, target, rel, aria-label", async () => {
    const { TransactionSuccess } = await import("./TransactionSuccess");
    render(
      <TransactionSuccess
        type="sell"
        amount={96}
        duration={3.4}
        txHash="HASH1"
        explorerBaseUrl="https://testnet.xrpl.org"
      />,
    );
    const link = screen.getByRole("link", {
      name: "View transaction on XRPL ledger explorer",
    });
    expect(link.getAttribute("href")).toBe("https://testnet.xrpl.org/HASH1");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
  });

  test("container has role='status' and aria-live='polite'", async () => {
    const { TransactionSuccess } = await import("./TransactionSuccess");
    render(
      <TransactionSuccess
        type="sell"
        amount={96}
        duration={3.4}
        txHash="HASH1"
        explorerBaseUrl="https://testnet.xrpl.org"
      />,
    );
    const el = screen.getByRole("status");
    expect(el.getAttribute("aria-live")).toBe("polite");
  });
});
