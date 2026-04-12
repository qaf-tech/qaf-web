export type Category = "tickets" | "insurance" | "money_rwa" | "esims";

export interface Asset {
  id: string;
  title: string;
  issuer: string;
  category: Category;
  description: string;
  expiresAt: string | null;
  issuedAt: string;
  tokenId: string;
  metadata: Record<string, string>;
  iconUrl: string;
}
