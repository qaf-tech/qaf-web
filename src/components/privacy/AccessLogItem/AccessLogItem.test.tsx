import { describe, expect, mock, test } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";
import type { AccessLogEntry } from "@/lib/models/accessLog";

const entry: AccessLogEntry = {
  id: "al1",
  accessorName: "Airline",
  credentialName: "Passport",
  factDisclosed: "passport number",
  accessedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  expiresAt: null,
  revoked: false,
};

describe("AccessLogItem", () => {
  test("renders accessor, credential, and fact disclosed", async () => {
    const { AccessLogItem } = await import("./AccessLogItem");
    render(
      <AccessLogItem
        entry={entry}
        onRevoke={mock(() => Promise.resolve())}
        isRevoking={false}
      />,
    );
    expect(screen.getByText("Airline")).toBeTruthy();
    expect(screen.getByText("Passport")).toBeTruthy();
    expect(screen.getByText("passport number")).toBeTruthy();
  });

  test("renders Revoke button when not revoked", async () => {
    const { AccessLogItem } = await import("./AccessLogItem");
    render(
      <AccessLogItem
        entry={entry}
        onRevoke={mock(() => Promise.resolve())}
        isRevoking={false}
      />,
    );
    expect(
      screen.getByRole("button", { name: /Revoke access for Airline/ }),
    ).toBeTruthy();
  });

  test("renders Revoked badge when revoked is true", async () => {
    const { AccessLogItem } = await import("./AccessLogItem");
    render(
      <AccessLogItem
        entry={{ ...entry, revoked: true }}
        onRevoke={mock(() => Promise.resolve())}
        isRevoking={false}
      />,
    );
    expect(screen.getByText("Revoked")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Revoke/ })).toBeNull();
  });

  test("clicking Revoke calls onRevoke with entry id", async () => {
    const onRevoke = mock((_id: string) => Promise.resolve());
    const { AccessLogItem } = await import("./AccessLogItem");
    render(
      <AccessLogItem entry={entry} onRevoke={onRevoke} isRevoking={false} />,
    );
    fireEvent.click(screen.getByRole("button"));
    expect(onRevoke).toHaveBeenCalledWith("al1");
  });

  test("button is disabled when isRevoking is true", async () => {
    const { AccessLogItem } = await import("./AccessLogItem");
    render(
      <AccessLogItem
        entry={entry}
        onRevoke={mock(() => Promise.resolve())}
        isRevoking={true}
      />,
    );
    const btn = screen.getByRole("button");
    expect((btn as HTMLButtonElement).disabled).toBe(true);
  });

  test("revoke button has aria-label with accessor name and fact", async () => {
    const { AccessLogItem } = await import("./AccessLogItem");
    render(
      <AccessLogItem
        entry={entry}
        onRevoke={mock(() => Promise.resolve())}
        isRevoking={false}
      />,
    );
    const btn = screen.getByRole("button");
    const label = btn.getAttribute("aria-label") ?? "";
    expect(label).toContain("Airline");
    expect(label).toContain("passport number");
  });
});
