import type {
  WsClient,
  WsMessage,
  WsMessageType,
  WsStatus,
  WsSubscriber,
  WsUnsubscribe,
} from "./types";

const INITIAL_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 30000;

export function createWsClient(url: string): WsClient {
  const subscribers = new Map<WsMessageType, Set<WsSubscriber>>();
  let socket: WebSocket | null = null;
  let status: WsStatus = "disconnected";
  let backoffMs = INITIAL_BACKOFF_MS;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let explicitDisconnect = false;

  function emit<T>(type: WsMessageType, payload: T): void {
    const set = subscribers.get(type);
    if (!set) return;
    for (const cb of set) {
      (cb as WsSubscriber<T>)(payload);
    }
  }

  function scheduleReconnect(): void {
    if (reconnectTimer !== null) return;
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      backoffMs = Math.min(backoffMs * 2, MAX_BACKOFF_MS);
      connect();
    }, backoffMs);
  }

  function connect(): void {
    if (typeof WebSocket === "undefined") return;
    explicitDisconnect = false;
    status = "connecting";
    socket = new WebSocket(url);

    socket.onopen = () => {
      status = "connected";
      backoffMs = INITIAL_BACKOFF_MS;
      emit("system:connected", { url });
    };

    socket.onmessage = (event: MessageEvent) => {
      try {
        const parsed = JSON.parse(event.data) as WsMessage;
        emit(parsed.type, parsed.payload);
      } catch (err) {
        emit("system:error", {
          message: "Failed to parse message",
          error: String(err),
        });
      }
    };

    socket.onclose = () => {
      socket = null;
      if (explicitDisconnect) {
        status = "disconnected";
        return;
      }
      status = "reconnecting";
      scheduleReconnect();
    };

    socket.onerror = () => {
      emit("system:error", { message: "WebSocket error" });
    };
  }

  function disconnect(): void {
    explicitDisconnect = true;
    if (reconnectTimer !== null) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    if (socket !== null) {
      socket.close();
      socket = null;
    }
    status = "disconnected";
  }

  function subscribe<T>(
    type: WsMessageType,
    callback: WsSubscriber<T>,
  ): WsUnsubscribe {
    let set = subscribers.get(type);
    if (!set) {
      set = new Set();
      subscribers.set(type, set);
    }
    set.add(callback as WsSubscriber);
    return () => {
      const current = subscribers.get(type);
      if (!current) return;
      current.delete(callback as WsSubscriber);
      if (current.size === 0) subscribers.delete(type);
    };
  }

  function send<T>(type: WsMessageType, payload: T): void {
    if (socket === null || socket.readyState !== WebSocket.OPEN) return;
    const message: WsMessage<T> = {
      type,
      payload,
      timestamp: Date.now(),
    };
    socket.send(JSON.stringify(message));
  }

  return {
    connect,
    disconnect,
    send,
    subscribe,
    get status() {
      return status;
    },
  };
}
