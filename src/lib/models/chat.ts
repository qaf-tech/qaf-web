export type ChatMessageType =
  | "user_message"
  | "agent_text"
  | "agent_thinking"
  | "agent_quotes"
  | "purchase_confirmation"
  | "purchase_status"
  | "purchase_complete"
  | "agent_error";

export type ChatMessageVariant = "user" | "agent";

export interface QuoteData {
  merchantId: string;
  merchantName: string;
  merchantUrl: string;
  productName: string;
  productDescription: string;
  priceDrops: number;
  currency: string;
  features: string[];
  identityFactsRequired: string[];
  rating: number;
  validUntil: string;
  score: number;
}

export interface PurchaseStepData {
  id: string;
  label: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  timestamp: number;
  detail?: string;
}

export interface PurchaseCompleteData {
  txHash: string;
  nftTokenId: string;
  merchantName: string;
  productName: string;
  message: string;
}

export type ChatMessageContent =
  | string
  | QuoteData[]
  | PurchaseStepData[]
  | PurchaseCompleteData;

export interface ChatMessage {
  id: string;
  type: ChatMessageType;
  content: ChatMessageContent;
  timestamp: number;
  variant: ChatMessageVariant;
  statusText?: string;
  isError?: boolean;
  isSuccess?: boolean;
  retryable?: boolean;
}

export type BiometricStatus =
  | "idle"
  | "authenticating"
  | "authenticated"
  | "failed";

export type PurchaseFlowState =
  | "idle"
  | "confirming"
  | "authenticating"
  | "executing"
  | "complete"
  | "failed";
