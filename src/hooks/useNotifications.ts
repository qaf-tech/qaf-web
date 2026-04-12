"use client";

import { useCallback, useEffect, useState } from "react";
import { useWebSocket } from "@/hooks/useWebSocket";
import type { Notification } from "@/lib/models/notification";

export interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  markAsRead: (id: string) => void;
  latestToast: Notification | null;
}

export function useNotifications(): UseNotificationsReturn {
  const { subscribe, send } = useWebSocket();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [latestToast, setLatestToast] = useState<Notification | null>(null);

  const markAsRead = useCallback(
    (id: string) => {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
      send("wallet.mark_notification_read", { notification_id: id });
    },
    [send],
  );

  useEffect(() => {
    const unsubList = subscribe<{
      status: "ok" | "error";
      notifications?: Notification[];
      error?: string;
    }>("wallet.list_notifications:response", (payload) => {
      setIsLoading(false);
      if (payload.status === "ok" && payload.notifications) {
        const sorted = [...payload.notifications].sort((a, b) =>
          b.createdAt.localeCompare(a.createdAt),
        );
        setNotifications(sorted);
        setError(null);
      } else {
        setError(payload.error ?? "Unknown error");
      }
    });
    const unsubPush = subscribe<Notification>("notification.new", (n) => {
      setNotifications((prev) => [n, ...prev]);
      if (n.tier >= 1) {
        setLatestToast(n);
      }
    });
    send("wallet.list_notifications", {});
    return () => {
      unsubList();
      unsubPush();
    };
  }, [subscribe, send]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    latestToast,
  };
}
