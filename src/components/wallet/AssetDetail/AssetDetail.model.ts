import type { Asset } from "@/lib/models/asset";

export interface AssetDetailProps {
  asset: Asset;
  onSell?: () => void;
  onTransfer?: () => void;
}
