"use client";

import { useCallback } from "react";
import { ChatInput } from "@/components/chat/ChatInput";
import { ChatThread } from "@/components/chat/ChatThread";
import { PurchaseConfirmation } from "@/components/overlays/PurchaseConfirmation";
import { useChat } from "@/hooks/useChat";
import { usePurchaseFlow } from "@/hooks/usePurchaseFlow";
import type { ChatMessage } from "@/lib/models/chat";
import styles from "./pageStyles.module.css";

export default function ChatPage() {
  const { messages, sendMessage, isAgentProcessing } = useChat();
  const {
    purchaseState,
    selectedQuote,
    startPurchase,
    cancelPurchase,
    biometricStatus,
    triggerBiometric,
    timeRemaining,
    confirmPurchase,
  } = usePurchaseFlow();

  const handleRetry = useCallback(
    (messageId: string) => {
      const message = messages.find((m: ChatMessage) => m.id === messageId);
      const userMessage = [...messages]
        .reverse()
        .find((m: ChatMessage) => m.type === "user_message");
      const text =
        (message && typeof message.content === "string" && message.content) ||
        (userMessage && typeof userMessage.content === "string"
          ? userMessage.content
          : "");
      if (text) sendMessage(text);
    },
    [messages, sendMessage],
  );

  return (
    <div className={styles.container}>
      <ChatThread
        messages={messages}
        onSelectQuote={startPurchase}
        onRetry={handleRetry}
      />
      <ChatInput onSend={sendMessage} isDisabled={isAgentProcessing} />
      {purchaseState === "confirming" && selectedQuote ? (
        <PurchaseConfirmation
          quote={selectedQuote}
          timeRemaining={timeRemaining}
          biometricStatus={biometricStatus}
          onCancel={cancelPurchase}
          onConfirm={confirmPurchase}
          onBiometricAuth={triggerBiometric}
        />
      ) : null}
    </div>
  );
}
