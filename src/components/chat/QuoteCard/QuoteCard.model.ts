import type { QuoteData } from "@/lib/models/chat";

export interface QuoteCardProps {
  quote: QuoteData;
  onSelect: (quote: QuoteData) => void;
}
