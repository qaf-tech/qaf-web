import { describe, expect, mock, test } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";
import type { Notification } from "@/lib/models/notification";

function makeNotification(
  tier: 0 | 1 | 2 | 3,
  overrides: Partial<Notification> = {},
): Notification {
  return {
    id: "n1",
    type: "transaction_confirmed",
    title: "Payment confirmed",
    body: "You sent 20 RLUSD",
    tier,
    read: false,
    createdAt: "2026-04-12T10:00:00Z",
    payload: {},
    ...overrides,
  };
}

describe("NotificationToast", () => {
  test("renders title and body", async () => {
    const { NotificationToast } = await import("./NotificationToast");
    render(
      <NotificationToast
        notification={makeNotification(1)}
        onDismiss={mock(() => undefined)}
        index={0}
      />,
    );
    expect(screen.getByText("Payment confirmed")).toBeTruthy();
    expect(screen.getByText("You sent 20 RLUSD")).toBeTruthy();
  });

  test("dismiss button has aria-label='Dismiss notification'", async () => {
    const { NotificationToast } = await import("./NotificationToast");
    render(
      <NotificationToast
        notification={makeNotification(1)}
        onDismiss={mock(() => undefined)}
        index={0}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Dismiss notification" }),
    ).toBeTruthy();
  });

  test("calls onDismiss when dismiss button is clicked", async () => {
    const onDismiss = mock(() => undefined);
    const { NotificationToast } = await import("./NotificationToast");
    render(
      <NotificationToast
        notification={makeNotification(1)}
        onDismiss={onDismiss}
        index={0}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Dismiss notification" }),
    );
    expect(onDismiss).toHaveBeenCalled();
  });

  test("renders 24h Delay badge for tier 3", async () => {
    const { NotificationToast } = await import("./NotificationToast");
    render(
      <NotificationToast
        notification={makeNotification(3)}
        onDismiss={mock(() => undefined)}
        index={0}
      />,
    );
    expect(screen.getByText("24h Delay")).toBeTruthy();
  });

  test("does NOT render 24h Delay badge for tier 1", async () => {
    const { NotificationToast } = await import("./NotificationToast");
    render(
      <NotificationToast
        notification={makeNotification(1)}
        onDismiss={mock(() => undefined)}
        index={0}
      />,
    );
    expect(screen.queryByText("24h Delay")).toBeNull();
  });

  test("container has role='alert' and aria-live='assertive'", async () => {
    const { NotificationToast } = await import("./NotificationToast");
    render(
      <NotificationToast
        notification={makeNotification(1)}
        onDismiss={mock(() => undefined)}
        index={0}
      />,
    );
    const alert = screen.getByRole("alert");
    expect(alert.getAttribute("aria-live")).toBe("assertive");
  });

  test("does not dismiss synchronously for tier 1", async () => {
    const onDismiss = mock(() => undefined);
    const { NotificationToast } = await import("./NotificationToast");
    render(
      <NotificationToast
        notification={makeNotification(1)}
        onDismiss={onDismiss}
        index={0}
      />,
    );
    expect(onDismiss).not.toHaveBeenCalled();
  });
});
