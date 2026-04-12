export type NotificationType =
  | "transaction_confirmed"
  | "purchase_complete"
  | "credential_expiring"
  | "access_alert";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  tier: 0 | 1 | 2 | 3;
  read: boolean;
  createdAt: string;
  payload: Record<string, unknown>;
}
