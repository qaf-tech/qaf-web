import { beforeEach, describe, expect, mock, test } from "bun:test";
import { act, renderHook } from "@testing-library/react";

type Subscriber = (payload: unknown) => void;

let capturedSubscriber: Subscriber | null = null;
const sendMock = mock(() => {});

mock.module("@/hooks/useWebSocket", () => ({
  useWebSocket: () => ({
    status: "connected",
    subscribe: (_type: string, cb: Subscriber) => {
      capturedSubscriber = cb;
      return () => {
        capturedSubscriber = null;
      };
    },
    send: sendMock,
  }),
}));

async function loadHook() {
  const mod = await import("./useChat");
  return mod.useChat;
}

describe("useChat", () => {
  beforeEach(() => {
    capturedSubscriber = null;
    sendMock.mockClear();
  });

  test("sendMessage appends a user_message", async () => {
    const useChat = await loadHook();
    const { result } = renderHook(() => useChat());
    act(() => {
      result.current.sendMessage("hello");
    });
    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0]?.type).toBe("user_message");
    expect(result.current.messages[0]?.content).toBe("hello");
  });

  test("sendMessage sets isAgentProcessing to true", async () => {
    const useChat = await loadHook();
    const { result } = renderHook(() => useChat());
    act(() => {
      result.current.sendMessage("hi");
    });
    expect(result.current.isAgentProcessing).toBe(true);
  });

  test("sendMessage calls ws.send with the correct type", async () => {
    const useChat = await loadHook();
    const { result } = renderHook(() => useChat());
    act(() => {
      result.current.sendMessage("buy me something");
    });
    expect(sendMock).toHaveBeenCalled();
    const call = sendMock.mock.calls[0] as unknown as [
      string,
      { text: string; conversation_id: string },
    ];
    expect(call[0]).toBe("agent.parse_intent");
    expect(call[1].text).toBe("buy me something");
    expect(typeof call[1].conversation_id).toBe("string");
  });

  test("agent_thinking message replaces existing typing indicator", async () => {
    const useChat = await loadHook();
    const { result } = renderHook(() => useChat());
    act(() => {
      capturedSubscriber?.({
        message_type: "agent_thinking",
        statusText: "Parsing...",
      });
    });
    act(() => {
      capturedSubscriber?.({
        message_type: "agent_thinking",
        statusText: "Querying...",
      });
    });
    const thinking = result.current.messages.filter(
      (m) => m.type === "agent_thinking",
    );
    expect(thinking).toHaveLength(1);
    expect(thinking[0]?.statusText).toBe("Querying...");
  });

  test("agent_text removes typing indicator and clears isAgentProcessing", async () => {
    const useChat = await loadHook();
    const { result } = renderHook(() => useChat());
    act(() => {
      result.current.sendMessage("hi");
    });
    act(() => {
      capturedSubscriber?.({
        message_type: "agent_thinking",
        statusText: "Thinking...",
      });
    });
    act(() => {
      capturedSubscriber?.({
        message_type: "agent_text",
        content: "Here's a thought.",
      });
    });
    expect(
      result.current.messages.some((m) => m.type === "agent_thinking"),
    ).toBe(false);
    expect(result.current.isAgentProcessing).toBe(false);
  });

  test("agent_quotes appends quotes limited to 3", async () => {
    const useChat = await loadHook();
    const { result } = renderHook(() => useChat());
    act(() => {
      capturedSubscriber?.({
        message_type: "agent_quotes",
        quotes: [1, 2, 3, 4, 5].map((i) => ({
          merchantId: `m${i}`,
          merchantName: `M${i}`,
          merchantUrl: "",
          productName: "p",
          productDescription: "",
          priceDrops: 1,
          currency: "RLUSD",
          features: [],
          identityFactsRequired: [],
          rating: 5,
          validUntil: "",
          score: 1,
        })),
      });
    });
    const quotesMsg = result.current.messages.find(
      (m) => m.type === "agent_quotes",
    );
    const content = quotesMsg?.content as unknown[];
    expect(Array.isArray(content)).toBe(true);
    expect(content.length).toBe(3);
  });

  test("agent_error sets error state and clears processing", async () => {
    const useChat = await loadHook();
    const { result } = renderHook(() => useChat());
    act(() => {
      result.current.sendMessage("hi");
    });
    act(() => {
      capturedSubscriber?.({
        message_type: "agent_error",
        content: "Service unavailable",
      });
    });
    expect(result.current.error).toBe("Service unavailable");
    expect(result.current.isAgentProcessing).toBe(false);
  });

  test("clearError resets error to null", async () => {
    const useChat = await loadHook();
    const { result } = renderHook(() => useChat());
    act(() => {
      capturedSubscriber?.({
        message_type: "agent_error",
        content: "boom",
      });
    });
    act(() => {
      result.current.clearError();
    });
    expect(result.current.error).toBeNull();
  });
});
