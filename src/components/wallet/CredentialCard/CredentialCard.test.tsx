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

const assetWithExpiry: Asset = {
  id: "a1",
  title: "Concert Ticket",
  issuer: "LiveNation",
  category: "tickets",
  description: "",
  expiresAt: "2027-01-15T20:00:00Z",
  issuedAt: "2026-04-01T00:00:00Z",
  tokenId: "tok1",
  metadata: {},
  iconUrl: "",
};

const assetNoExpiry: Asset = { ...assetWithExpiry, id: "a2", expiresAt: null };

describe("CredentialCard", () => {
  test("renders title and issuer", async () => {
    const { CredentialCard } = await import("./CredentialCard");
    render(<CredentialCard asset={assetWithExpiry} />);
    expect(screen.getByText("Concert Ticket")).toBeTruthy();
    expect(screen.getByText("LiveNation")).toBeTruthy();
  });

  test("renders formatted expiry when expiresAt is set", async () => {
    const { CredentialCard } = await import("./CredentialCard");
    render(<CredentialCard asset={assetWithExpiry} />);
    expect(screen.getByText(/Expires Jan 15, 2027/)).toBeTruthy();
  });

  test("omits expiry when expiresAt is null", async () => {
    const { CredentialCard } = await import("./CredentialCard");
    render(<CredentialCard asset={assetNoExpiry} />);
    expect(screen.queryByText(/Expires/)).toBeNull();
  });

  test("Link points to /asset/{id}", async () => {
    const { CredentialCard } = await import("./CredentialCard");
    render(<CredentialCard asset={assetWithExpiry} />);
    const link = screen.getByRole("article");
    expect(link.getAttribute("href")).toBe("/asset/a1");
  });

  test("has role=article and descriptive aria-label", async () => {
    const { CredentialCard } = await import("./CredentialCard");
    render(<CredentialCard asset={assetWithExpiry} />);
    const link = screen.getByRole("article");
    expect(link.getAttribute("aria-label")).toContain("Concert Ticket");
    expect(link.getAttribute("aria-label")).toContain("LiveNation");
  });

  test("renders category badge", async () => {
    const { CredentialCard } = await import("./CredentialCard");
    render(<CredentialCard asset={assetWithExpiry} />);
    expect(screen.getByText("Ticket")).toBeTruthy();
  });
});
