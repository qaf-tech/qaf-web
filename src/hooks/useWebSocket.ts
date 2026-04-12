"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { config } from "@/lib/config";
import { createWsClient } from "@/lib/ws/client";
import type {
  WsClient,
  WsMessageType,
  WsStatus,
  WsSubscriber,
  WsUnsubscribe,
} from "@/lib/ws/types";

export function useWebSocket(): {
  status: WsStatus;
  subscribe: <T>(type: WsMessageType, cb: WsSubscriber<T>) => WsUnsubscribe;
  send: <T>(type: WsMessageType, payload: T) => void;
} {
  const clientRef = useRef<WsClient | null>(null);
  if (clientRef.current === null) {
    clientRef.current = createWsClient(config.wsUrl);
  }
  const [status, setStatus] = useState<WsStatus>(clientRef.current.status);

  useEffect(() => {
    const client = clientRef.current;
    if (!client) return;

    const unsubConnected = client.subscribe("system:connected", () =>
      setStatus("connected"),
    );
    const unsubError = client.subscribe("system:error", () =>
      setStatus(client.status),
    );

    const interval = setInterval(() => setStatus(client.status), 1000);

    client.connect();
    setStatus(client.status);

    return () => {
      unsubConnected();
      unsubError();
      clearInterval(interval);
      client.disconnect();
    };
  }, []);

  const subscribe = useCallback(
    <T>(type: WsMessageType, cb: WsSubscriber<T>): WsUnsubscribe => {
      const client = clientRef.current;
      if (!client) return () => undefined;
      return client.subscribe(type, cb);
    },
    [],
  );

  const send = useCallback(<T>(type: WsMessageType, payload: T): void => {
    clientRef.current?.send(type, payload);
  }, []);

  return { status, subscribe, send };
}
