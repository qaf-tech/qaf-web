import type { Asset } from "@/lib/models/asset";

export interface SellConfirmationProps {
  asset: Asset;
  estimatedPrice: number;
  onConfirm: () => void;
  onCancel: () => void;
}
