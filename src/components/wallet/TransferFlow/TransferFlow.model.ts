import type { Asset } from "@/lib/models/asset";

export interface TransferFlowProps {
  asset: Asset;
  onClose: () => void;
}
