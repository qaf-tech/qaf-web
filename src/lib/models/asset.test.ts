import { describe, expect, test } from "bun:test";
import type { Asset, Category } from "./asset";

describe("Asset model", () => {
  test("accepts a valid asset with all fields", () => {
    const asset: Asset = {
      id: "asset-1",
      title: "PBW Concert Ticket",
      issuer: "LiveNation",
      category: "tickets",
      description: "Front-row seat to the PBW 2026 closing concert",
      expiresAt: "2027-01-15T20:00:00Z",
      issuedAt: "2026-04-01T10:00:00Z",
      tokenId: "00080000D5F7...",
      metadata: { seat: "A12", section: "Front" },
      iconUrl: "/icons/ticket.svg",
    };
    expect(asset.title).toBe("PBW Concert Ticket");
  });

  test("accepts expiresAt as null", () => {
    const asset: Asset = {
      id: "asset-2",
      title: "RLUSD Balance",
      issuer: "Ripple",
      category: "money_rwa",
      description: "Ripple USD stablecoin",
      expiresAt: null,
      issuedAt: "2026-04-01T10:00:00Z",
      tokenId: "trust-line-RLUSD",
      metadata: {},
      iconUrl: "/icons/coin.svg",
    };
    expect(asset.expiresAt).toBeNull();
  });

  test("accepts empty metadata record", () => {
    const asset: Asset = {
      id: "asset-3",
      title: "eSIM",
      issuer: "Airalo",
      category: "esims",
      description: "Global data plan",
      expiresAt: "2026-06-01T00:00:00Z",
      issuedAt: "2026-04-01T10:00:00Z",
      tokenId: "000800...",
      metadata: {},
      iconUrl: "/icons/sim.svg",
    };
    expect(Object.keys(asset.metadata)).toHaveLength(0);
  });

  test("Category union accepts all valid values", () => {
    const values: Category[] = ["tickets", "insurance", "money_rwa", "esims"];
    expect(values).toHaveLength(4);
  });
});
