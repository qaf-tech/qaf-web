export interface ChatBubbleProps {
  content: string;
  variant: "user" | "agent";
  timestamp: number;
  isError?: boolean;
  isSuccess?: boolean;
  onRetry?: () => void;
}
