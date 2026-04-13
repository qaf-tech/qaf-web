import { describe, expect, mock, test } from "bun:test";
import { render, screen } from "@testing-library/react";
import type { Asset } from "@/lib/models/asset";

mock.module("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    [k: string]: unknown;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const asset: Asset = {
  id: "a1",
  title: "Concert Ticket",
  issuer: "LiveNation",
  category: "tickets",
  description: "Front-row seat",
  expiresAt: "2027-01-15T20:00:00Z",
  issuedAt: "2026-04-01T10:00:00Z",
  tokenId: "tok-abc-123",
  metadata: { seat: "A12", section: "Front" },
  iconUrl: "",
};

describe("AssetDetail", () => {
  test("renders title as h1", async () => {
    const { AssetDetail } = await import("./AssetDetail");
    render(<AssetDetail asset={asset} />);
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1.textContent).toBe("Concert Ticket");
  });

  test("renders issuer, description, and token ID", async () => {
    const { AssetDetail } = await import("./AssetDetail");
    render(<AssetDetail asset={asset} />);
    expect(screen.getByText("LiveNation")).toBeTruthy();
    expect(screen.getByText("Front-row seat")).toBeTruthy();
    expect(screen.getByText(/tok-abc-123/)).toBeTruthy();
  });

  test("renders expiry when expiresAt is set", async () => {
    const { AssetDetail } = await import("./AssetDetail");
    render(<AssetDetail asset={asset} />);
    expect(screen.getByText(/Expires Jan 15, 2027/)).toBeTruthy();
  });

  test("omits expiry when expiresAt is null", async () => {
    const { AssetDetail } = await import("./AssetDetail");
    render(<AssetDetail asset={{ ...asset, expiresAt: null }} />);
    expect(screen.queryByText(/Expires/)).toBeNull();
  });

  test("renders metadata key-value pairs", async () => {
    const { AssetDetail } = await import("./AssetDetail");
    render(<AssetDetail asset={asset} />);
    expect(screen.getByText("seat")).toBeTruthy();
    expect(screen.getByText("A12")).toBeTruthy();
    expect(screen.getByText("section")).toBeTruthy();
    expect(screen.getByText("Front")).toBeTruthy();
  });

  test("renders Use button linking to /use/{id}", async () => {
    const { AssetDetail } = await import("./AssetDetail");
    render(<AssetDetail asset={asset} />);
    const useLink = screen.getByRole("link", { name: /Use Concert Ticket/ });
    expect(useLink.getAttribute("href")).toBe("/use/a1");
  });

  test("renders Share and Revoke buttons with aria-label", async () => {
    const { AssetDetail } = await import("./AssetDetail");
    render(<AssetDetail asset={asset} />);
    expect(
      screen.getByRole("button", { name: /Share Concert Ticket/ }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: /Revoke Concert Ticket/ }),
    ).toBeTruthy();
  });

  test("renders Sell button with aria-label='Sell this asset' when onSell provided", async () => {
    const onSell = mock(() => undefined);
    const { AssetDetail } = await import("./AssetDetail");
    render(<AssetDetail asset={asset} onSell={onSell} />);
    const btn = screen.getByRole("button", { name: "Sell this asset" });
    expect(btn).toBeTruthy();
  });

  test("Sell button calls onSell when clicked", async () => {
    const onSell = mock(() => undefined);
    const { AssetDetail } = await import("./AssetDetail");
    render(<AssetDetail asset={asset} onSell={onSell} />);
    (screen.getByRole("button", { name: "Sell this asset" }) as HTMLElement).click();
    expect(onSell).toHaveBeenCalled();
  });

  test("renders Send to friend button with aria-label when onTransfer provided", async () => {
    const { AssetDetail } = await import("./AssetDetail");
    render(<AssetDetail asset={asset} onTransfer={() => undefined} />);
    expect(
      screen.getByRole("button", { name: "Send this asset to a friend" }),
    ).toBeTruthy();
  });

  test("Send to friend button calls onTransfer when clicked", async () => {
    const onTransfer = mock(() => undefined);
    const { AssetDetail } = await import("./AssetDetail");
    render(<AssetDetail asset={asset} onTransfer={onTransfer} />);
    (screen.getByRole("button", {
      name: "Send this asset to a friend",
    }) as HTMLElement).click();
    expect(onTransfer).toHaveBeenCalled();
  });

  test("does not render Sell/Send buttons when callbacks not provided", async () => {
    const { AssetDetail } = await import("./AssetDetail");
    render(<AssetDetail asset={asset} />);
    expect(screen.queryByRole("button", { name: "Sell this asset" })).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Send this asset to a friend" }),
    ).toBeNull();
  });
});
