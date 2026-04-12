import { describe, expect, mock, test } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";
import type { Notification } from "@/lib/models/notification";

function makeNotification(overrides: Partial<Notification> = {}): Notification {
  return {
    id: "n1",
    type: "transaction_confirmed",
    title: "Payment confirmed",
    body: "You sent 20 RLUSD",
    tier: 1,
    read: false,
    createdAt: new Date(Date.now() - 60_000 * 5).toISOString(),
    payload: {},
    ...overrides,
  };
}

describe("NotificationItem", () => {
  test("renders title and body", async () => {
    const { NotificationItem } = await import("./NotificationItem");
    render(
      <NotificationItem
        notification={makeNotification()}
        onMarkRead={mock(() => undefined)}
      />,
    );
    expect(screen.getByText("Payment confirmed")).toBeTruthy();
    expect(screen.getByText("You sent 20 RLUSD")).toBeTruthy();
  });

  test("renders checkmark for transaction_confirmed", async () => {
    const { NotificationItem } = await import("./NotificationItem");
    render(
      <NotificationItem
        notification={makeNotification({ type: "transaction_confirmed" })}
        onMarkRead={mock(() => undefined)}
      />,
    );
    expect(screen.getByText("✅")).toBeTruthy();
  });

  test("renders warning icon for credential_expiring", async () => {
    const { NotificationItem } = await import("./NotificationItem");
    render(
      <NotificationItem
        notification={makeNotification({ type: "credential_expiring" })}
        onMarkRead={mock(() => undefined)}
      />,
    );
    expect(screen.getByText("⚠️")).toBeTruthy();
  });

  test("renders shield icon for access_alert", async () => {
    const { NotificationItem } = await import("./NotificationItem");
    render(
      <NotificationItem
        notification={makeNotification({ type: "access_alert" })}
        onMarkRead={mock(() => undefined)}
      />,
    );
    expect(screen.getByText("🛡️")).toBeTruthy();
  });

  test("calls onMarkRead on click when unread", async () => {
    const onMarkRead = mock((_id: string) => undefined);
    const { NotificationItem } = await import("./NotificationItem");
    render(
      <NotificationItem
        notification={makeNotification()}
        onMarkRead={onMarkRead}
      />,
    );
    fireEvent.click(screen.getByRole("button"));
    expect(onMarkRead).toHaveBeenCalledWith("n1");
  });

  test("does NOT call onMarkRead when already read", async () => {
    const onMarkRead = mock((_id: string) => undefined);
    const { NotificationItem } = await import("./NotificationItem");
    render(
      <NotificationItem
        notification={makeNotification({ read: true })}
        onMarkRead={onMarkRead}
      />,
    );
    fireEvent.click(screen.getByRole("button"));
    expect(onMarkRead).not.toHaveBeenCalled();
  });

  test("has aria-label combining type, title, and relative time", async () => {
    const { NotificationItem } = await import("./NotificationItem");
    render(
      <NotificationItem
        notification={makeNotification()}
        onMarkRead={mock(() => undefined)}
      />,
    );
    const btn = screen.getByRole("button");
    const label = btn.getAttribute("aria-label") ?? "";
    expect(label).toContain("transaction_confirmed");
    expect(label).toContain("Payment confirmed");
  });
});
