import { describe, expect, mock, test } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";
import type { Asset } from "@/lib/models/asset";
import { SellConfirmation } from "./SellConfirmation";

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

describe("SellConfirmation", () => {
  test("renders formatted price ($96.00)", () => {
    render(
      <SellConfirmation
        asset={asset}
        estimatedPrice={96}
        onConfirm={() => undefined}
        onCancel={() => undefined}
      />,
    );
    expect(screen.getByText("$96.00")).toBeTruthy();
  });

  test("renders ~80% label", () => {
    render(
      <SellConfirmation
        asset={asset}
        estimatedPrice={96}
        onConfirm={() => undefined}
        onCancel={() => undefined}
      />,
    );
    expect(
      screen.getByText(/80% of purchase price/),
    ).toBeTruthy();
  });

  test("renders asset title, issuer, and badge", () => {
    render(
      <SellConfirmation
        asset={asset}
        estimatedPrice={96}
        onConfirm={() => undefined}
        onCancel={() => undefined}
      />,
    );
    expect(screen.getByText("Concert Ticket")).toBeTruthy();
    expect(screen.getByText("LiveNation")).toBeTruthy();
    expect(screen.getByText("Ticket")).toBeTruthy();
  });

  test("Confirm Sell button calls onConfirm", () => {
    const onConfirm = mock(() => undefined);
    render(
      <SellConfirmation
        asset={asset}
        estimatedPrice={96}
        onConfirm={onConfirm}
        onCancel={() => undefined}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Confirm sell for/ }));
    expect(onConfirm).toHaveBeenCalled();
  });

  test("Cancel button calls onCancel", () => {
    const onCancel = mock(() => undefined);
    render(
      <SellConfirmation
        asset={asset}
        estimatedPrice={96}
        onConfirm={() => undefined}
        onCancel={onCancel}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalled();
  });

  test("price element has aria-label", () => {
    render(
      <SellConfirmation
        asset={asset}
        estimatedPrice={96}
        onConfirm={() => undefined}
        onCancel={() => undefined}
      />,
    );
    expect(
      screen.getByLabelText("Estimated sell price: $96.00 RLUSD"),
    ).toBeTruthy();
  });

  test("Confirm Sell button has aria-label with price", () => {
    render(
      <SellConfirmation
        asset={asset}
        estimatedPrice={96}
        onConfirm={() => undefined}
        onCancel={() => undefined}
      />,
    );
    expect(
      screen.getByRole("button", {
        name: "Confirm sell for $96.00 RLUSD",
      }),
    ).toBeTruthy();
  });
});
