import {
  afterEach,
  beforeEach,
  describe,
  expect,
  test,
} from "bun:test";
import { renderHook } from "@testing-library/react";
import { useWebSocket } from "./useWebSocket";

interface MockWS {
  url: string;
  onopen: (() => void) | null;
  onmessage: ((event: { data: string }) => void) | null;
  onclose: (() => void) | null;
  onerror: (() => void) | null;
  readyState: number;
  send: (data: string) => void;
  close: () => void;
}

let created: MockWS[] = [];
let closed = 0;

class TrackedWS implements MockWS {
  static readonly OPEN = 1;
  url: string;
  readyState = 0;
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;

  constructor(url: string) {
    this.url = url;
    created.push(this);
  }

  send(_data: string): void {
    // no-op
  }

  close(): void {
    closed += 1;
    this.readyState = 3;
  }
}

const originalWebSocket = globalThis.WebSocket;

describe("useWebSocket", () => {
  beforeEach(() => {
    created = [];
    closed = 0;
    Object.defineProperty(globalThis, "WebSocket", {
      value: TrackedWS,
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
  });

  test("creates a WebSocket on mount", () => {
    renderHook(() => useWebSocket());
    expect(created).toHaveLength(1);
  });

  test("closes the WebSocket on unmount", () => {
    const { unmount } = renderHook(() => useWebSocket());
    unmount();
    expect(closed).toBeGreaterThanOrEqual(1);
  });

  test("exposes subscribe and send", () => {
    const { result } = renderHook(() => useWebSocket());
    expect(typeof result.current.subscribe).toBe("function");
    expect(typeof result.current.send).toBe("function");
  });

  test("initial status is not 'connected' before onopen fires", () => {
    const { result } = renderHook(() => useWebSocket());
    expect(result.current.status).not.toBe("connected");
  });
});
