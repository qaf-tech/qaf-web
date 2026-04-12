import { describe, expect, mock, test } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";
import type { BiometricStatus, QuoteData } from "@/lib/models/chat";
import { PurchaseConfirmation } from "./PurchaseConfirmation";

function makeQuote(overrides: Partial<QuoteData> = {}): QuoteData {
  return {
    merchantId: "m-acme",
    merchantName: "Acme",
    merchantUrl: "https://acme.test",
    productName: "Premium Widget",
    productDescription: "A premium widget.",
    priceDrops: 15_000_000,
    currency: "RLUSD",
    features: ["Fast"],
    identityFactsRequired: ["age_over_18", "country_us"],
    rating: 4.6,
    validUntil: "2026-04-13T00:00:00Z",
    score: 0.92,
    ...overrides,
  };
}

function renderWith(
  biometricStatus: BiometricStatus = "idle",
  timeRemaining = 10,
  handlers: Partial<{
    onCancel: () => void;
    onConfirm: () => void;
    onBiometricAuth: () => void;
  }> = {},
) {
  const onCancel = handlers.onCancel ?? mock(() => {});
  const onConfirm = handlers.onConfirm ?? mock(() => {});
  const onBiometricAuth = handlers.onBiometricAuth ?? mock(() => {});
  const result = render(
    <PurchaseConfirmation
      quote={makeQuote()}
      timeRemaining={timeRemaining}
      biometricStatus={biometricStatus}
      onCancel={onCancel}
      onConfirm={onConfirm}
      onBiometricAuth={onBiometricAuth}
    />,
  );
  return { ...result, onCancel, onConfirm, onBiometricAuth };
}

describe("PurchaseConfirmation", () => {
  test("renders merchant and product", () => {
    renderWith();
    expect(screen.getByText("Acme")).toBeDefined();
    expect(screen.getByText("Premium Widget")).toBeDefined();
  });

  test("renders price converted from drops to RLUSD", () => {
    renderWith();
    expect(screen.getByText("15.00 RLUSD")).toBeDefined();
  });

  test("renders timer with current time remaining", () => {
    renderWith("idle", 7);
    expect(screen.getByText("7")).toBeDefined();
  });

  test("cancel button width grows as time decreases", () => {
    const { unmount } = renderWith("idle", 10);
    const wideAtTen = (
      screen.getByRole("button", {
        name: "Cancel purchase",
      }) as HTMLElement
    ).style.width;
    unmount();
    renderWith("idle", 5);
    const wideAtFive = (
      screen.getByRole("button", {
        name: "Cancel purchase",
      }) as HTMLElement
    ).style.width;
    expect(parseFloat(wideAtFive)).toBeGreaterThan(parseFloat(wideAtTen));
  });

  test("cancel button calls onCancel when clicked", () => {
    const onCancel = mock(() => {});
    renderWith("idle", 10, { onCancel });
    fireEvent.click(screen.getByRole("button", { name: "Cancel purchase" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  test("Escape key calls onCancel", () => {
    const onCancel = mock(() => {});
    renderWith("idle", 10, { onCancel });
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  test("biometric button calls onBiometricAuth when clicked", () => {
    const onBiometricAuth = mock(() => {});
    renderWith("idle", 10, { onBiometricAuth });
    fireEvent.click(
      screen.getByRole("button", { name: "Authenticate with biometrics" }),
    );
    expect(onBiometricAuth).toHaveBeenCalledTimes(1);
  });

  test("biometric button is non-interactive when authenticating", () => {
    const { container } = renderWith("authenticating");
    const faceBtn = container.querySelector(
      "button[class*='faceIdAuthenticating']",
    );
    expect(faceBtn).not.toBeNull();
  });

  test("has role='dialog' and aria-modal='true'", () => {
    renderWith();
    const dialog = screen.getByRole("dialog");
    expect(dialog.getAttribute("aria-modal")).toBe("true");
  });

  test("renders identity facts required as a list", () => {
    renderWith();
    expect(screen.getByText("age_over_18")).toBeDefined();
    expect(screen.getByText("country_us")).toBeDefined();
  });

  test("shows 'Try Again' text when biometricStatus is failed", () => {
    renderWith("failed");
    expect(screen.getByText("Try Again")).toBeDefined();
  });
});
