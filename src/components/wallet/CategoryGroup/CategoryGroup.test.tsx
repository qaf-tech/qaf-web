import { describe, expect, mock, test } from "bun:test";
import { render, screen } from "@testing-library/react";
import type { Asset } from "@/lib/models/asset";

mock.module("@/components/wallet/CredentialCard", () => ({
  CredentialCard: ({ asset }: { asset: Asset }) => (
    <div data-testid={`card-${asset.id}`}>{asset.title}</div>
  ),
}));

const asset: Asset = {
  id: "a1",
  title: "Ticket A",
  issuer: "Issuer",
  category: "tickets",
  description: "",
  expiresAt: null,
  issuedAt: "2026-04-01T00:00:00Z",
  tokenId: "t1",
  metadata: {},
  iconUrl: "",
};

describe("CategoryGroup", () => {
  test("renders label, icon, and count", async () => {
    const { CategoryGroup } = await import("./CategoryGroup");
    render(
      <CategoryGroup
        category="tickets"
        label="Tickets"
        icon={<span>🎫</span>}
        assets={[asset]}
        count={1}
      />,
    );
    expect(screen.getByText("Tickets")).toBeTruthy();
    expect(screen.getByText("1")).toBeTruthy();
    expect(screen.getByText("🎫")).toBeTruthy();
  });

  test("renders one CredentialCard per asset", async () => {
    const { CategoryGroup } = await import("./CategoryGroup");
    const a2 = { ...asset, id: "a2", title: "Ticket B" };
    render(
      <CategoryGroup
        category="tickets"
        label="Tickets"
        icon={<span />}
        assets={[asset, a2]}
        count={2}
      />,
    );
    expect(screen.getByTestId("card-a1")).toBeTruthy();
    expect(screen.getByTestId("card-a2")).toBeTruthy();
  });

  test("returns null when assets array is empty", async () => {
    const { CategoryGroup } = await import("./CategoryGroup");
    const { container } = render(
      <CategoryGroup
        category="tickets"
        label="Tickets"
        icon={<span />}
        assets={[]}
        count={0}
      />,
    );
    expect(container.firstChild).toBeNull();
  });
});
