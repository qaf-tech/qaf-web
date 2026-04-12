"use client";

import { type UIEvent, useCallback, useEffect, useRef, useState } from "react";
import { ChatBubble } from "@/components/chat/ChatBubble";
import { PurchaseStatus } from "@/components/chat/PurchaseStatus";
import { QuoteCard } from "@/components/chat/QuoteCard";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import type {
  ChatMessage,
  PurchaseCompleteData,
  PurchaseStepData,
  QuoteData,
} from "@/lib/models/chat";
import type { ChatThreadProps } from "./ChatThread.model";
import styles from "./ChatThreadStyles.module.css";

const SCROLL_TOLERANCE_PX = 100;
const MAX_QUOTES = 3;

function asString(content: ChatMessage["content"]): string {
  return typeof content === "string" ? content : "";
}

function asQuotes(content: ChatMessage["content"]): QuoteData[] {
  if (!Array.isArray(content) || content.length === 0) return [];
  const first = content[0];
  return first && "merchantId" in first ? (content as QuoteData[]) : [];
}

function asSteps(content: ChatMessage["content"]): PurchaseStepData[] {
  if (!Array.isArray(content) || content.length === 0) return [];
  const first = content[0];
  return first && "status" in first ? (content as PurchaseStepData[]) : [];
}

function asComplete(
  content: ChatMessage["content"],
): PurchaseCompleteData | null {
  if (
    content &&
    typeof content === "object" &&
    !Array.isArray(content) &&
    "txHash" in content
  ) {
    return content as PurchaseCompleteData;
  }
  return null;
}

export function ChatThread({
  messages,
  onSelectQuote,
  onRetry,
}: ChatThreadProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [userHasScrolledUp, setUserHasScrolledUp] = useState(false);

  const handleScroll = useCallback((e: UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const atBottom =
      el.scrollTop + el.clientHeight >= el.scrollHeight - SCROLL_TOLERANCE_PX;
    setUserHasScrolledUp(!atBottom);
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: re-run when messages length changes; scrollRef access is stable
  useEffect(() => {
    if (userHasScrolledUp) return;
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages.length, userHasScrolledUp]);

  const jumpToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    setUserHasScrolledUp(false);
  }, []);

  return (
    <div
      ref={scrollRef}
      role="log"
      aria-label="Chat conversation"
      aria-live="polite"
      className={styles.thread}
      onScroll={handleScroll}
    >
      {messages.map((message) => {
        if (message.type === "user_message" || message.type === "agent_text") {
          return (
            <ChatBubble
              key={message.id}
              content={asString(message.content)}
              variant={message.variant}
              timestamp={message.timestamp}
            />
          );
        }

        if (message.type === "agent_thinking") {
          return (
            <TypingIndicator
              key={message.id}
              statusText={message.statusText ?? "Thinking..."}
            />
          );
        }

        if (message.type === "agent_quotes") {
          const quotes = asQuotes(message.content).slice(0, MAX_QUOTES);
          return (
            <div key={message.id} className={styles.quoteRow}>
              {quotes.map((quote) => (
                <QuoteCard
                  key={quote.merchantId}
                  quote={quote}
                  onSelect={onSelectQuote}
                />
              ))}
            </div>
          );
        }

        if (message.type === "purchase_status") {
          return (
            <PurchaseStatus key={message.id} steps={asSteps(message.content)} />
          );
        }

        if (message.type === "purchase_complete") {
          const complete = asComplete(message.content);
          return (
            <ChatBubble
              key={message.id}
              content={complete?.message ?? "Purchase complete."}
              variant="agent"
              timestamp={message.timestamp}
              isSuccess
            />
          );
        }

        if (message.type === "agent_error") {
          return (
            <div key={message.id} aria-live="assertive">
              <ChatBubble
                content={asString(message.content)}
                variant="agent"
                timestamp={message.timestamp}
                isError
                onRetry={() => onRetry(message.id)}
              />
            </div>
          );
        }

        return null;
      })}
      {userHasScrolledUp ? (
        <button
          type="button"
          className={styles.newMessageButton}
          onClick={jumpToBottom}
        >
          New message ↓
        </button>
      ) : null}
    </div>
  );
}
