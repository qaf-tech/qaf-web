export type WsMessageType =
  | "wallet:balance_update"
  | "wallet:transaction"
  | "wallet.list_assets"
  | "wallet.list_assets:response"
  | "wallet.get_asset"
  | "wallet.get_asset:response"
  | "wallet.list_access_log"
  | "wallet.list_access_log:response"
  | "wallet.revoke_access"
  | "wallet.revoke_access:response"
  | "wallet.list_notifications"
  | "wallet.list_notifications:response"
  | "wallet.mark_notification_read"
  | "wallet.mark_notification_read:response"
  | "notification.new"
  | "chat:message"
  | "chat:typing"
  | "chat:agent_event"
  | "agent.parse_intent"
  | "agent.execute_purchase"
  | "presentation.verify"
  | "presentation.verify:response"
  | "presentation.use_consumable"
  | "presentation.use_consumable:response"
  | "identity.verify"
  | "identity.verify:response"
  | "identity.mint_credential"
  | "identity.mint_credential:response"
  | "identity.verify_proof"
  | "identity.verify_proof:response"
  | `dex.${string}`
  | `dex:${string}`
  | "system:connected"
  | "system:error";

export interface WsMessage<T = unknown> {
  type: WsMessageType;
  payload: T;
  timestamp: number;
}

export type WsStatus =
  | "connecting"
  | "connected"
  | "disconnected"
  | "reconnecting";

export type WsSubscriber<T = unknown> = (payload: T) => void;

export type WsUnsubscribe = () => void;

export interface WsClient {
  connect(): void;
  disconnect(): void;
  send<T>(type: WsMessageType, payload: T): void;
  subscribe<T>(type: WsMessageType, callback: WsSubscriber<T>): WsUnsubscribe;
  readonly status: WsStatus;
}
