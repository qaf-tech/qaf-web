"use client";

import { useCallback, useEffect, useState } from "react";
import { useWebSocket } from "@/hooks/useWebSocket";
import type { AccessLogEntry } from "@/lib/models/accessLog";

export interface UseAccessLogReturn {
  entries: AccessLogEntry[];
  isLoading: boolean;
  error: string | null;
  revokeAccess: (accessId: string) => Promise<void>;
  revokingIds: Set<string>;
}

export function useAccessLog(): UseAccessLogReturn {
  const { subscribe, send } = useWebSocket();
  const [entries, setEntries] = useState<AccessLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revokingIds, setRevokingIds] = useState<Set<string>>(new Set());

  const revokeAccess = useCallback(
    (accessId: string): Promise<void> => {
      setRevokingIds((prev) => {
        const next = new Set(prev);
        next.add(accessId);
        return next;
      });
      return new Promise<void>((resolve, reject) => {
        const unsub = subscribe<{
          status: "ok" | "error";
          access_id?: string;
          error?: string;
        }>("wallet.revoke_access:response", (payload) => {
          if (payload.access_id !== accessId) return;
          unsub();
          setRevokingIds((prev) => {
            const next = new Set(prev);
            next.delete(accessId);
            return next;
          });
          if (payload.status === "ok") {
            setEntries((prev) =>
              prev.map((e) =>
                e.id === accessId ? { ...e, revoked: true } : e,
              ),
            );
            resolve();
          } else {
            reject(new Error(payload.error ?? "Failed to revoke access"));
          }
        });
        send("wallet.revoke_access", { access_id: accessId });
      });
    },
    [subscribe, send],
  );

  useEffect(() => {
    const unsub = subscribe<{
      status: "ok" | "error";
      entries?: AccessLogEntry[];
      error?: string;
    }>("wallet.list_access_log:response", (payload) => {
      setIsLoading(false);
      if (payload.status === "ok" && payload.entries) {
        const sorted = [...payload.entries].sort((a, b) =>
          b.accessedAt.localeCompare(a.accessedAt),
        );
        setEntries(sorted);
        setError(null);
      } else {
        setError(payload.error ?? "Unknown error");
      }
    });
    send("wallet.list_access_log", {});
    return () => unsub();
  }, [subscribe, send]);

  return { entries, isLoading, error, revokeAccess, revokingIds };
}
