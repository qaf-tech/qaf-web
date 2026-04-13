export type SellStep =
  | "estimate"
  | "authenticate"
  | "submitting"
  | "waiting"
  | "success"
  | "error";

export type TransferStep =
  | "recipient"
  | "authenticate"
  | "submitting"
  | "success"
  | "error";

export type AssetType = "nft" | "iou";

export interface SellOffer {
  offerIndex: string;
  txHash: string;
  amount: string;
  assetType: AssetType;
}

export interface TransferResult {
  txHash: string;
  offerIndex: string;
  recipientAddress: string;
}

export interface UserLookupResult {
  username: string;
  xrplAddress: string;
}

export interface PriceEstimate {
  estimatedPrice: number;
  currency: "RLUSD";
}
