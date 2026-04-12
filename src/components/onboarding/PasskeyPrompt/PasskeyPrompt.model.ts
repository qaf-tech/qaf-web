export type PasskeyPromptStatus =
  | "creating_passkey"
  | "deriving_wallet"
  | "funding"
  | "error";

export interface PasskeyPromptProps {
  status: PasskeyPromptStatus;
  message?: string;
  onRetry?: () => void;
}
