import { beforeEach, describe, expect, mock, test } from "bun:test";
import { act, fireEvent, render, screen } from "@testing-library/react";

const SAMPLE_ADDRESS = "rEb8TK3gBgk5auZkwc6sHnwrGVJH8DuaLh";

describe("WalletReady", () => {
  let writeTextMock: ReturnType<typeof mock>;

  beforeEach(() => {
    writeTextMock = mock(() => Promise.resolve());
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: writeTextMock },
      configurable: true,
      writable: true,
    });
  });

  test("renders Wallet Ready heading", async () => {
    const { WalletReady } = await import("./WalletReady");
    render(<WalletReady xrplAddress={SAMPLE_ADDRESS} onContinue={() => {}} />);
    expect(screen.getByRole("heading", { name: "Wallet Ready" })).toBeDefined();
  });

  test("displays truncated address with full address in title attribute", async () => {
    const { WalletReady } = await import("./WalletReady");
    render(<WalletReady xrplAddress={SAMPLE_ADDRESS} onContinue={() => {}} />);
    const truncated = `${SAMPLE_ADDRESS.slice(0, 8)}...${SAMPLE_ADDRESS.slice(-6)}`;
    const el = screen.getByText(truncated);
    expect(el).toBeDefined();
    expect(el.getAttribute("title")).toBe(SAMPLE_ADDRESS);
  });

  test("calls clipboard.writeText with the full address on copy", async () => {
    const { WalletReady } = await import("./WalletReady");
    render(<WalletReady xrplAddress={SAMPLE_ADDRESS} onContinue={() => {}} />);
    const button = screen.getByRole("button", { name: "Copy address" });
    await act(async () => {
      fireEvent.click(button);
    });
    expect(writeTextMock).toHaveBeenCalledTimes(1);
    expect(writeTextMock.mock.calls[0]?.[0]).toBe(SAMPLE_ADDRESS);
  });

  test("transitions copy button label from 'Copy address' to 'Copied!' after click", async () => {
    const { WalletReady } = await import("./WalletReady");
    render(<WalletReady xrplAddress={SAMPLE_ADDRESS} onContinue={() => {}} />);
    expect(screen.getByRole("button", { name: "Copy address" })).toBeDefined();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Copy address" }));
    });
    expect(screen.getByRole("button", { name: "Copied!" })).toBeDefined();
  });

  test("calls onContinue when the continue button is clicked", async () => {
    const { WalletReady } = await import("./WalletReady");
    const onContinue = mock(() => {});
    render(
      <WalletReady xrplAddress={SAMPLE_ADDRESS} onContinue={onContinue} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  test("applies monospace address styling class to the address element", async () => {
    const { WalletReady } = await import("./WalletReady");
    render(<WalletReady xrplAddress={SAMPLE_ADDRESS} onContinue={() => {}} />);
    const truncated = `${SAMPLE_ADDRESS.slice(0, 8)}...${SAMPLE_ADDRESS.slice(-6)}`;
    const el = screen.getByText(truncated);
    // The CSS Modules stub returns the class name as a string, so the class
    // attribute should include the token "addressText".
    expect(el.className).toContain("addressText");
  });
});
