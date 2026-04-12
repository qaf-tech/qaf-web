export interface AccessLogEntry {
  id: string;
  accessorName: string;
  credentialName: string;
  factDisclosed: string;
  accessedAt: string;
  expiresAt: string | null;
  revoked: boolean;
}
