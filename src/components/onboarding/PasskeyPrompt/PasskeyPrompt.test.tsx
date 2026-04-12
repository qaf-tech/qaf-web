import { describe, expect, mock, test } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";

describe("PasskeyPrompt", () => {
  test("renders creating_passkey status text", async () => {
    const { PasskeyPrompt } = await import("./PasskeyPrompt");
    render(<PasskeyPrompt status="creating_passkey" />);
    expect(screen.getByText("Creating your passkey...")).toBeDefined();
  });

  test("renders deriving_wallet status text", async () => {
    const { PasskeyPrompt } = await import("./PasskeyPrompt");
    render(<PasskeyPrompt status="deriving_wallet" />);
    expect(screen.getByText("Deriving your wallet...")).toBeDefined();
  });

  test("renders funding status text", async () => {
    const { PasskeyPrompt } = await import("./PasskeyPrompt");
    render(<PasskeyPrompt status="funding" />);
    expect(screen.getByText("Funding your wallet on testnet...")).toBeDefined();
  });

  test("renders error status text and message", async () => {
    const { PasskeyPrompt } = await import("./PasskeyPrompt");
    render(
      <PasskeyPrompt status="error" message="Passkey creation was cancelled" />,
    );
    expect(screen.getByText("Something went wrong")).toBeDefined();
    expect(screen.getByText("Passkey creation was cancelled")).toBeDefined();
  });

  test("shows retry button only in error status", async () => {
    const { PasskeyPrompt } = await import("./PasskeyPrompt");
    const { rerender } = render(
      <PasskeyPrompt status="creating_passkey" onRetry={() => {}} />,
    );
    expect(screen.queryByRole("button", { name: "Try again" })).toBeNull();

    rerender(<PasskeyPrompt status="error" onRetry={() => {}} />);
    expect(screen.getByRole("button", { name: "Try again" })).toBeDefined();
  });

  test("calls onRetry when retry button is clicked", async () => {
    const { PasskeyPrompt } = await import("./PasskeyPrompt");
    const onRetry = mock(() => {});
    render(<PasskeyPrompt status="error" onRetry={onRetry} />);
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  test("does not render retry button when onRetry is not provided", async () => {
    const { PasskeyPrompt } = await import("./PasskeyPrompt");
    render(<PasskeyPrompt status="error" message="boom" />);
    expect(screen.queryByRole("button", { name: "Try again" })).toBeNull();
  });
});
