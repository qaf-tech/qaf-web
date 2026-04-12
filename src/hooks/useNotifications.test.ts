import { beforeEach, describe, expect, mock, test } from "bun:test";
import { act, renderHook } from "@testing-library/react";
import type { Notification } from "@/lib/models/notification";

type Cb = (payload: unknown) => void;
const subs: Record<string, Cb[]> = {};
const sent: { type: string; payload: unknown }[] = [];

function resetMocks(): void {
  for (const k of Object.keys(subs)) delete subs[k];
  sent.length = 0;
}

mock.module("@/hooks/useWebSocket", () => ({
  useWebSocket: () => ({
    status: "connected",
    subscribe: (type: string, cb: Cb) => {
      subs[type] = subs[type] ?? [];
      subs[type].push(cb);
      return () => {
        subs[type] = (subs[type] ?? []).filter((c) => c !== cb);
      };
    },
    send: (type: string, payload: unknown) => {
      sent.push({ type, payload });
    },
  }),
}));

function fireEvent(type: string, payload: unknown): void {
  act(() => {
    for (const cb of subs[type] ?? []) cb(payload);
  });
}

function make(id: string, tier: 0 | 1 | 2 | 3, read = false): Notification {
  return {
    id,
    type: "transaction_confirmed",
    title: "T",
    body: "B",
    tier,
    read,
    createdAt: `2026-04-12T10:0${id.length}:00Z`,
    payload: {},
  };
}

describe("useNotifications", () => {
  beforeEach(() => {
    resetMocks();
  });

  test("returns isLoading: true initially", async () => {
    const { useNotifications } = await import("./useNotifications");
    const { result } = renderHook(() => useNotifications());
    expect(result.current.isLoading).toBe(true);
  });

  test("sets notifications on successful response", async () => {
    const { useNotifications } = await import("./useNotifications");
    const { result } = renderHook(() => useNotifications());
    fireEvent("wallet.list_notifications:response", {
      status: "ok",
      notifications: [make("n1", 1), make("n2", 2, true)],
    });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.notifications).toHaveLength(2);
  });

  test("computes correct unreadCount", async () => {
    const { useNotifications } = await import("./useNotifications");
    const { result } = renderHook(() => useNotifications());
    fireEvent("wallet.list_notifications:response", {
      status: "ok",
      notifications: [make("n1", 1), make("n2", 2, true), make("n3", 0)],
    });
    expect(result.current.unreadCount).toBe(2);
  });

  test("prepends notification on notification.new event", async () => {
    const { useNotifications } = await import("./useNotifications");
    const { result } = renderHook(() => useNotifications());
    fireEvent("wallet.list_notifications:response", {
      status: "ok",
      notifications: [make("n1", 1)],
    });
    fireEvent("notification.new", make("n2", 2));
    expect(result.current.notifications[0]?.id).toBe("n2");
  });

  test("sets latestToast for tier >= 1 notification", async () => {
    const { useNotifications } = await import("./useNotifications");
    const { result } = renderHook(() => useNotifications());
    fireEvent("notification.new", make("n1", 1));
    expect(result.current.latestToast?.id).toBe("n1");
  });

  test("does NOT set latestToast for tier 0 notification", async () => {
    const { useNotifications } = await import("./useNotifications");
    const { result } = renderHook(() => useNotifications());
    fireEvent("notification.new", make("n1", 0));
    expect(result.current.latestToast).toBeNull();
  });

  test("markAsRead flips read and sends wallet.mark_notification_read", async () => {
    const { useNotifications } = await import("./useNotifications");
    const { result } = renderHook(() => useNotifications());
    fireEvent("wallet.list_notifications:response", {
      status: "ok",
      notifications: [make("n1", 1)],
    });
    act(() => {
      result.current.markAsRead("n1");
    });
    expect(result.current.notifications[0]?.read).toBe(true);
    expect(result.current.unreadCount).toBe(0);
    expect(sent.some((s) => s.type === "wallet.mark_notification_read")).toBe(
      true,
    );
  });
});
