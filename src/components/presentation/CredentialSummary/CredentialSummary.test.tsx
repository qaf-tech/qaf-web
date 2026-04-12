import { describe, expect, test } from "bun:test";
import { render, screen } from "@testing-library/react";
import type { Asset } from "@/lib/models/asset";
import { CredentialSummary } from "./CredentialSummary";

function makeAsset(overrides: Partial<Asset> = {}): Asset {
  return {
    id: "a-1",
    title: "VIP Ticket",
    issuer: "Ticketer Inc.",
    category: "tickets",
    description: "",
    expiresAt: null,
    issuedAt: "2026-01-01T00:00:00Z",
    tokenId: "t-1",
    metadata: {},
    iconUrl: "",
    ...overrides,
  };
}

describe("CredentialSummary", () => {
  test("renders credential title", () => {
    render(<CredentialSummary asset={makeAsset()} balance={null} />);
    expect(screen.getByText("VIP Ticket")).toBeDefined();
  });

  test("renders issuer name", () => {
    render(<CredentialSummary asset={makeAsset()} balance={null} />);
    expect(screen.getByText("Ticketer Inc.")).toBeDefined();
  });

  test("renders formatted expiry when expiresAt is set", () => {
    render(
      <CredentialSummary
        asset={makeAsset({ expiresAt: "2026-06-15T00:00:00Z" })}
        balance={null}
      />,
    );
    expect(screen.getByText(/Expires Jun 1[45], 2026/)).toBeDefined();
  });

  test("omits expiry when expiresAt is null", () => {
    render(<CredentialSummary asset={makeAsset()} balance={null} />);
    expect(screen.queryByText(/Expires/)).toBeNull();
  });

  test("renders balance when balance prop is provided", () => {
    render(<CredentialSummary asset={makeAsset()} balance="250 USD" />);
    expect(screen.getByText("250 USD")).toBeDefined();
  });

  test("omits balance when balance prop is null", () => {
    const { container } = render(
      <CredentialSummary asset={makeAsset()} balance={null} />,
    );
    expect(container.querySelector("[class*='balance']")).toBeNull();
  });

  test("container has role='banner'", () => {
    render(<CredentialSummary asset={makeAsset()} balance={null} />);
    expect(screen.getByRole("banner")).toBeDefined();
  });

  test("container has correct aria-label", () => {
    render(<CredentialSummary asset={makeAsset()} balance={null} />);
    const banner = screen.getByRole("banner");
    expect(banner.getAttribute("aria-label")).toBe(
      "Presenting VIP Ticket issued by Ticketer Inc.",
    );
  });

  test("applies glass surface class", () => {
    render(<CredentialSummary asset={makeAsset()} balance={null} />);
    const banner = screen.getByRole("banner");
    expect(banner.getAttribute("class")).toContain("surface");
  });
});
