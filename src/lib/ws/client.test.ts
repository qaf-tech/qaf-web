import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { createWsClient } from "./client";

type OpenHandler = () => void;
type MessageHandler = (event: { data: string }) => void;
type CloseHandler = () => void;
type ErrorHandler = () => void;

interface MockSocket {
  url: string;
  readyState: number;
  onopen: OpenHandler | null;
  onmessage: MessageHandler | null;
  onclose: CloseHandler | null;
  onerror: ErrorHandler | null;
  send: (data: string) => void;
  close: () => void;
}

const OPEN = 1;
let lastSocket: MockSocket | null = null;
const sent: string[] = [];

class MockWebSocket {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;

  url: string;
  readyState = MockWebSocket.CONNECTING;
  onopen: OpenHandler | null = null;
  onmessage: MessageHandler | null = null;
  onclose: CloseHandler | null = null;
  onerror: ErrorHandler | null = null;

  constructor(url: string) {
    this.url = url;
    lastSocket = this as unknown as MockSocket;
  }

  send(data: string): void {
    sent.push(data);
  }

  close(): void {
    this.readyState = MockWebSocket.CLOSED;
  }
}

const originalWebSocket = globalThis.WebSocket;
const originalSetTimeout = globalThis.setTimeout;
const originalClearTimeout = globalThis.clearTimeout;

describe("createWsClient", () => {
  beforeEach(() => {
    lastSocket = null;
    sent.length = 0;
    Object.defineProperty(globalThis, "WebSocket", {
      value: MockWebSocket,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(globalThis, "WebSocket", {
      value: originalWebSocket,
      writable: true,
      configurable: true,
    });
    globalThis.setTimeout = originalSetTimeout;
    globalThis.clearTimeout = originalClearTimeout;
  });

  test("exposes connect, disconnect, send, subscribe, status", () => {
    const client = createWsClient("ws://test");
    expect(typeof client.connect).toBe("function");
    expect(typeof client.disconnect).toBe("function");
    expect(typeof client.send).toBe("function");
    expect(typeof client.subscribe).toBe("function");
    expect(client.status).toBe("disconnected");
  });

  test("subscribe returns an unsubscribe function", () => {
    const client = createWsClient("ws://test");
    const unsub = client.subscribe("chat:message", () => undefined);
    expect(typeof unsub).toBe("function");
    unsub();
  });

  test("send serializes JSON with type, payload, timestamp", () => {
    const client = createWsClient("ws://test");
    client.connect();
    if (!lastSocket) throw new Error("socket not created");
    lastSocket.readyState = OPEN;
    lastSocket.onopen?.();

    client.send("chat:message", { text: "hi" });

    expect(sent).toHaveLength(1);
    const parsed = JSON.parse(sent[0]!) as {
      type: string;
      payload: { text: string };
      timestamp: number;
    };
    expect(parsed.type).toBe("chat:message");
    expect(parsed.payload).toEqual({ text: "hi" });
    expect(typeof parsed.timestamp).toBe("number");
  });

  test("onmessage dispatches payload to subscribers", () => {
    const client = createWsClient("ws://test");
    const cb = mock((payload: unknown) => payload);
    client.subscribe("wallet:balance_update", cb);

    client.connect();
    if (!lastSocket) throw new Error("socket not created");
    lastSocket.readyState = OPEN;
    lastSocket.onopen?.();

    lastSocket.onmessage?.({
      data: JSON.stringify({
        type: "wallet:balance_update",
        payload: { balance: 100 },
        timestamp: 0,
      }),
    });

    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb.mock.calls[0]?.[0]).toEqual({ balance: 100 });
  });

  test("reconnect backoff doubles from 1000 to 2000 to 4000 and caps at 30000", () => {
    const delays: number[] = [];
    let pendingCb: (() => void) | null = null;
    let timerIdCounter = 1;
    (globalThis.setTimeout as unknown) = ((fn: () => void, delay: number) => {
      delays.push(delay);
      pendingCb = fn;
      return timerIdCounter++ as unknown as ReturnType<typeof setTimeout>;
    }) as typeof setTimeout;
    (globalThis.clearTimeout as unknown) = (() =>
      undefined) as typeof clearTimeout;

    const client = createWsClient("ws://test");
    client.connect();

    for (let i = 0; i < 10; i++) {
      lastSocket?.onclose?.();
      // Fire the scheduled reconnect callback, which resets the internal
      // timer handle and invokes connect() again.
      const cb = pendingCb;
      pendingCb = null;
      cb?.();
    }

    expect(delays[0]).toBe(1000);
    expect(delays[1]).toBe(2000);
    expect(delays[2]).toBe(4000);
    expect(delays[delays.length - 1]).toBeLessThanOrEqual(30000);
    expect(Math.max(...delays)).toBe(30000);
  });

  test("disconnect prevents reconnection and sets status to disconnected", () => {
    let scheduled = false;
    (globalThis.setTimeout as unknown) = ((_fn: () => void, _delay: number) => {
      scheduled = true;
      return 0 as unknown as ReturnType<typeof setTimeout>;
    }) as typeof setTimeout;
    (globalThis.clearTimeout as unknown) = (() =>
      undefined) as typeof clearTimeout;

    const client = createWsClient("ws://test");
    client.connect();
    client.disconnect();

    // Simulate onclose AFTER explicit disconnect — should not schedule
    scheduled = false;
    lastSocket?.onclose?.();

    expect(client.status).toBe("disconnected");
    expect(scheduled).toBe(false);
  });
});
