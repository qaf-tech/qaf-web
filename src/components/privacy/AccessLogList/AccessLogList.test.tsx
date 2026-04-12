import { describe, expect, mock, test } from "bun:test";
import { render, screen } from "@testing-library/react";
import type { AccessLogEntry } from "@/lib/models/accessLog";

mock.module("@/components/privacy/AccessLogItem", () => ({
  AccessLogItem: ({
    entry,
    isRevoking,
  }: {
    entry: AccessLogEntry;
    isRevoking: boolean;
  }) => (
    <div data-testid={`item-${entry.id}`} data-revoking={String(isRevoking)}>
      {entry.accessorName}
    </div>
  ),
}));

const entries: AccessLogEntry[] = [
  {
    id: "al1",
    accessorName: "Airline",
    credentialName: "Passport",
    factDisclosed: "passport number",
    accessedAt: "2026-04-12T10:00:00Z",
    expiresAt: null,
    revoked: false,
  },
  {
    id: "al2",
    accessorName: "Bank",
    credentialName: "KYC",
    factDisclosed: "full name",
    accessedAt: "2026-04-11T10:00:00Z",
    expiresAt: null,
    revoked: false,
  },
];

describe("AccessLogList", () => {
  test("renders all entries", async () => {
    const { AccessLogList } = await import("./AccessLogList");
    render(
      <AccessLogList
        entries={entries}
        onRevoke={mock(() => Promise.resolve())}
        revokingIds={new Set()}
      />,
    );
    expect(screen.getByTestId("item-al1")).toBeTruthy();
    expect(screen.getByTestId("item-al2")).toBeTruthy();
  });

  test("root has role=list and children have role=listitem", async () => {
    const { AccessLogList } = await import("./AccessLogList");
    render(
      <AccessLogList
        entries={entries}
        onRevoke={mock(() => Promise.resolve())}
        revokingIds={new Set()}
      />,
    );
    expect(screen.getByRole("list")).toBeTruthy();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  test("passes isRevoking based on revokingIds", async () => {
    const { AccessLogList } = await import("./AccessLogList");
    render(
      <AccessLogList
        entries={entries}
        onRevoke={mock(() => Promise.resolve())}
        revokingIds={new Set(["al1"])}
      />,
    );
    expect(screen.getByTestId("item-al1").getAttribute("data-revoking")).toBe(
      "true",
    );
    expect(screen.getByTestId("item-al2").getAttribute("data-revoking")).toBe(
      "false",
    );
  });
});
