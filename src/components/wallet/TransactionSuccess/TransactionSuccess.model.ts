export interface TransactionSuccessProps {
  type: "sell" | "transfer";
  amount?: number;
  duration?: number;
  recipientAddress?: string;
  txHash: string;
  explorerBaseUrl: string;
}
