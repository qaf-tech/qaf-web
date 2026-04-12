import type { ChatMessage, QuoteData } from "@/lib/models/chat";

export interface ChatThreadProps {
  messages: ChatMessage[];
  onSelectQuote: (quote: QuoteData) => void;
  onRetry: (messageId: string) => void;
}
