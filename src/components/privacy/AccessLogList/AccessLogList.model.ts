import type { AccessLogEntry } from "@/lib/models/accessLog";

export interface AccessLogListProps {
  entries: AccessLogEntry[];
  onRevoke: (id: string) => Promise<void>;
  revokingIds: Set<string>;
}
