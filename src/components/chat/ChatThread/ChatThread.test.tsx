import { describe, expect, mock, test } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";
import type { ChatMessage, QuoteData } from "@/lib/models/chat";
import { ChatThread } from "./ChatThread";

function quote(id: string): QuoteData {
  return {
    merchantId: id,
    merchantName: `Merchant ${id}`,
    merchantUrl: `https://m${id}.test`,
    productName: "Widget",
    productDescription: "desc",
    priceDrops: 15_000_000,
    currency: "RLUSD",
    features: ["fast"],
    identityFactsRequired: [],
    rating: 4.5,
    validUntil: "2026-01-01T00:00:00Z",
    score: 0.9,
  };
}

function makeMessages(extras: ChatMessage[] = []): ChatMessage[] {
  return [
    {
      id: "1",
      type: "user_message",
      content: "hi",
      timestamp: 0,
      variant: "user",
    },
    {
      id: "2",
      type: "agent_text",
      content: "hello",
      timestamp: 1,
      variant: "agent",
    },
    ...extras,
  ];
}

describe("ChatThread", () => {
  test("renders user and agent ChatBubbles", () => {
    render(
      <ChatThread
        messages={makeMessages()}
        onSelectQuote={mock(() => {})}
        onRetry={mock(() => {})}
      />,
    );
    expect(screen.getByText("hi")).toBeDefined();
    expect(screen.getByText("hello")).toBeDefined();
  });

  test("renders agent_thinking as TypingIndicator", () => {
    render(
      <ChatThread
        messages={[
          {
            id: "t1",
            type: "agent_thinking",
            content: "",
            timestamp: 0,
            variant: "agent",
            statusText: "Parsing intent...",
          },
        ]}
        onSelectQuote={mock(() => {})}
        onRetry={mock(() => {})}
      />,
    );
    expect(screen.getByRole("status")).toBeDefined();
    expect(screen.getByText("Parsing intent...")).toBeDefined();
  });

  test("renders agent_quotes as QuoteCards", () => {
    render(
      <ChatThread
        messages={[
          {
            id: "q1",
            type: "agent_quotes",
            content: [quote("a"), quote("b")],
            timestamp: 0,
            variant: "agent",
          },
        ]}
        onSelectQuote={mock(() => {})}
        onRetry={mock(() => {})}
      />,
    );
    expect(screen.getAllByRole("article").length).toBe(2);
  });

  test("limits quote cards to maximum 3", () => {
    render(
      <ChatThread
        messages={[
          {
            id: "q1",
            type: "agent_quotes",
            content: [
              quote("a"),
              quote("b"),
              quote("c"),
              quote("d"),
              quote("e"),
            ],
            timestamp: 0,
            variant: "agent",
          },
        ]}
        onSelectQuote={mock(() => {})}
        onRetry={mock(() => {})}
      />,
    );
    expect(screen.getAllByRole("article").length).toBe(3);
  });

  test("has role='log' and aria-label='Chat conversation'", () => {
    render(
      <ChatThread
        messages={[]}
        onSelectQuote={mock(() => {})}
        onRetry={mock(() => {})}
      />,
    );
    const log = screen.getByRole("log");
    expect(log.getAttribute("aria-label")).toBe("Chat conversation");
  });

  test("calls onSelectQuote when a QuoteCard select button is clicked", () => {
    const onSelectQuote = mock(() => {});
    render(
      <ChatThread
        messages={[
          {
            id: "q1",
            type: "agent_quotes",
            content: [quote("x")],
            timestamp: 0,
            variant: "agent",
          },
        ]}
        onSelectQuote={onSelectQuote}
        onRetry={mock(() => {})}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: /Select quote from Merchant x/ }),
    );
    expect(onSelectQuote).toHaveBeenCalledTimes(1);
  });

  test("calls onRetry when error message retry button is clicked", () => {
    const onRetry = mock((_id: string) => {});
    render(
      <ChatThread
        messages={[
          {
            id: "err-42",
            type: "agent_error",
            content: "Something broke",
            timestamp: 0,
            variant: "agent",
            isError: true,
          },
        ]}
        onSelectQuote={mock(() => {})}
        onRetry={onRetry}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Retry message" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onRetry.mock.calls[0]?.[0]).toBe("err-42");
  });
});
