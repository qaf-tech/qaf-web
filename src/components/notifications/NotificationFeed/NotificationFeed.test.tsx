import { describe, expect, mock, test } from "bun:test";
import { render, screen } from "@testing-library/react";
import type { Notification } from "@/lib/models/notification";

const calls: { id: string }[] = [];

mock.module("@/components/notifications/NotificationItem", () => ({
  NotificationItem: ({ notification }: { notification: Notification }) => {
    calls.push({ id: notification.id });
    return (
      <div data-testid={`ni-${notification.id}`}>{notification.title}</div>
    );
  },
}));

const ns: Notification[] = [
  {
    id: "n1",
    type: "transaction_confirmed",
    title: "A",
    body: "",
    tier: 1,
    read: false,
    createdAt: "2026-04-12T10:00:00Z",
    payload: {},
  },
  {
    id: "n2",
    type: "access_alert",
    title: "B",
    body: "",
    tier: 2,
    read: true,
    createdAt: "2026-04-11T10:00:00Z",
    payload: {},
  },
];

describe("NotificationFeed", () => {
  test("renders all notifications", async () => {
    calls.length = 0;
    const { NotificationFeed } = await import("./NotificationFeed");
    render(
      <NotificationFeed
        notifications={ns}
        onMarkRead={mock(() => undefined)}
      />,
    );
    expect(screen.getByTestId("ni-n1")).toBeTruthy();
    expect(screen.getByTestId("ni-n2")).toBeTruthy();
  });

  test("root is role=list and children are role=listitem", async () => {
    calls.length = 0;
    const { NotificationFeed } = await import("./NotificationFeed");
    render(
      <NotificationFeed
        notifications={ns}
        onMarkRead={mock(() => undefined)}
      />,
    );
    expect(screen.getByRole("list")).toBeTruthy();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  test("passes notifications to each NotificationItem", async () => {
    calls.length = 0;
    const { NotificationFeed } = await import("./NotificationFeed");
    render(
      <NotificationFeed
        notifications={ns}
        onMarkRead={mock(() => undefined)}
      />,
    );
    expect(calls.map((c) => c.id)).toEqual(["n1", "n2"]);
  });
});
