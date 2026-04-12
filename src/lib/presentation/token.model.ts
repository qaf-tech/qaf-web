export interface PresentationToken {
  credential_id: string;
  presenter: string;
  fact: string;
  nonce: string;
  issued_at: number;
  expires_at: number;
  signature: string;
}
