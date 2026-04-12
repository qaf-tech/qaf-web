import type { BiometricStatus, QuoteData } from "@/lib/models/chat";

export interface PurchaseConfirmationProps {
  quote: QuoteData;
  timeRemaining: number;
  biometricStatus: BiometricStatus;
  onCancel: () => void;
  onConfirm: () => void;
  onBiometricAuth: () => void;
}
