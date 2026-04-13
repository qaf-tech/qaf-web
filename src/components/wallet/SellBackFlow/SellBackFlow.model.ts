import type { Asset } from "@/lib/models/asset";

export interface SellBackFlowProps {
  asset: Asset;
  onClose: () => void;
}
