import type { Asset } from "@/lib/models/asset";

export interface CredentialSummaryProps {
  asset: Asset;
  balance: string | null;
}
