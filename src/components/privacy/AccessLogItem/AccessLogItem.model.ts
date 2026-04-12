import type { AccessLogEntry } from "@/lib/models/accessLog";

export interface AccessLogItemProps {
  entry: AccessLogEntry;
  onRevoke: (id: string) => Promise<void>;
  isRevoking: boolean;
}
