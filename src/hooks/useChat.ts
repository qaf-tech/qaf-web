"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useWebSocket } from "@/hooks/useWebSocket";
import type {
  ChatMessage,
  ChatMessageContent,
  PurchaseCompleteData,
  PurchaseStepData,
  QuoteData,
} from "@/lib/models/chat";

interface IncomingAgentPayload {
  message_type?: string;
  content?: string;
  statusText?: string;
  quotes?: QuoteData[];
  steps?: PurchaseStepData[];
  step?: PurchaseStepData;
  result?: PurchaseCompleteData;
  messageId?: string;
}

const MAX_QUOTES = 3;

function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function filterTyping(messages: ChatMessage[]): ChatMessage[] {
  return messages.filter((m) => m.type !== "agent_thinking");
}

export function useChat(): {
  messages: ChatMessage[];
  sendMessage: (text: string) => void;
  isAgentProcessing: boolean;
  error: string | null;
  clearError: () => void;
} {
  const ws = useWebSocket();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isAgentProcessing, setIsAgentProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  if (sessionIdRef.current === null) {
    sessionIdRef.current = newId();
  }

  useEffect(() => {
    const unsub = ws.subscribe<IncomingAgentPayload>(
      "chat:message",
      (payload) => {
        const type = payload.message_type;
        if (type === "agent_thinking") {
          setMessages((prev) => {
            const withoutTyping = filterTyping(prev);
            return [
              ...withoutTyping,
              {
                id: newId(),
                type: "agent_thinking",
                content: "",
                timestamp: Date.now(),
                variant: "agent",
                statusText: payload.statusText ?? "Thinking...",
              },
            ];
          });
          return;
        }
        if (type === "agent_text") {
          setMessages((prev) => [
            ...filterTyping(prev),
            {
              id: newId(),
              type: "agent_text",
              content: payload.content ?? "",
              timestamp: Date.now(),
              variant: "agent",
            },
          ]);
          setIsAgentProcessing(false);
          return;
        }
        if (type === "agent_quotes") {
          const limited = (payload.quotes ?? []).slice(0, MAX_QUOTES);
          setMessages((prev) => [
            ...filterTyping(prev),
            {
              id: newId(),
              type: "agent_quotes",
              content: limited as ChatMessageContent,
              timestamp: Date.now(),
              variant: "agent",
            },
          ]);
          setIsAgentProcessing(false);
          return;
        }
        if (type === "purchase_status") {
          const steps = payload.steps ?? (payload.step ? [payload.step] : []);
          setMessages((prev) => [
            ...prev,
            {
              id: newId(),
              type: "purchase_status",
              content: steps,
              timestamp: Date.now(),
              variant: "agent",
            },
          ]);
          return;
        }
        if (type === "purchase_complete") {
          const result = payload.result;
          if (!result) return;
          setMessages((prev) => [
            ...filterTyping(prev),
            {
              id: newId(),
              type: "purchase_complete",
              content: result,
              timestamp: Date.now(),
              variant: "agent",
              isSuccess: true,
            },
          ]);
          setIsAgentProcessing(false);
          return;
        }
        if (type === "agent_error") {
          const content = payload.content ?? "Something went wrong.";
          setError(content);
          setMessages((prev) => [
            ...filterTyping(prev),
            {
              id: newId(),
              type: "agent_error",
              content,
              timestamp: Date.now(),
              variant: "agent",
              isError: true,
              retryable: true,
            },
          ]);
          setIsAgentProcessing(false);
        }
      },
    );
    return () => {
      unsub();
    };
  }, [ws]);

  const sendMessage = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const userMsg: ChatMessage = {
        id: newId(),
        type: "user_message",
        content: trimmed,
        timestamp: Date.now(),
        variant: "user",
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsAgentProcessing(true);
      ws.send("agent.parse_intent", {
        text: trimmed,
        conversation_id: sessionIdRef.current,
      });
    },
    [ws],
  );

  const clearError = useCallback(() => setError(null), []);

  return { messages, sendMessage, isAgentProcessing, error, clearError };
}
