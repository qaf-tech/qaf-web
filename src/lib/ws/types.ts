export type WsMessageType =
  | "wallet:balance_update"
  | "wallet:transaction"
  | "chat:message"
  | "chat:typing"
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
