import { describe, expect, mock, test } from "bun:test";
import { render, screen } from "@testing-library/react";
import type { Asset, Category } from "@/lib/models/asset";

const groupCalls: {
  category: Category;
  label: string;
  count: number;
  ids: string[];
}[] = [];

mock.module("@/components/wallet/CategoryGroup", () => ({
  CategoryGroup: ({
    category,
    label,
    count,
    assets,
  }: {
    category: Category;
    label: string;
    count: number;
    assets: Asset[];
  }) => {
    groupCalls.push({
      category,
      label,
      count,
      ids: assets.map((a) => a.id),
    });
    return (
      <div data-testid={`group-${category}`}>
        {label}:{count}
      </div>
    );
  },
}));

function makeAsset(id: string, category: Category): Asset {
  return {
    id,
    title: id,
    issuer: "x",
    category,
    description: "",
    expiresAt: null,
    issuedAt: "2026-04-01T00:00:00Z",
    tokenId: id,
    metadata: {},
    iconUrl: "",
  };
}

describe("AssetGrid", () => {
  test("renders CategoryGroup per non-empty category", async () => {
    groupCalls.length = 0;
    const { AssetGrid } = await import("./AssetGrid");
    render(
      <AssetGrid
        assets={[makeAsset("a1", "tickets"), makeAsset("a2", "money_rwa")]}
      />,
    );
    expect(screen.getByTestId("group-tickets")).toBeTruthy();
    expect(screen.getByTestId("group-money_rwa")).toBeTruthy();
    expect(screen.queryByTestId("group-insurance")).toBeNull();
  });

  test("renders categories in fixed order", async () => {
    groupCalls.length = 0;
    const { AssetGrid } = await import("./AssetGrid");
    render(
      <AssetGrid
        assets={[
          makeAsset("e1", "esims"),
          makeAsset("i1", "insurance"),
          makeAsset("t1", "tickets"),
          makeAsset("m1", "money_rwa"),
        ]}
      />,
    );
    const order = groupCalls.map((c) => c.category);
    expect(order).toEqual(["tickets", "insurance", "money_rwa", "esims"]);
  });

  test("skips empty categories", async () => {
    groupCalls.length = 0;
    const { AssetGrid } = await import("./AssetGrid");
    render(<AssetGrid assets={[makeAsset("t1", "tickets")]} />);
    expect(groupCalls).toHaveLength(1);
    expect(groupCalls[0]?.category).toBe("tickets");
  });

  test("passes correct assets and count to each group", async () => {
    groupCalls.length = 0;
    const { AssetGrid } = await import("./AssetGrid");
    render(
      <AssetGrid
        assets={[
          makeAsset("t1", "tickets"),
          makeAsset("t2", "tickets"),
          makeAsset("m1", "money_rwa"),
        ]}
      />,
    );
    const tickets = groupCalls.find((c) => c.category === "tickets");
    expect(tickets?.count).toBe(2);
    expect(tickets?.ids).toEqual(["t1", "t2"]);
  });
});
