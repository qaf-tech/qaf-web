"use client";

import { AccessLogItem } from "@/components/privacy/AccessLogItem";
import type { AccessLogListProps } from "./AccessLogList.model";
import styles from "./AccessLogListStyles.module.css";

export function AccessLogList({
  entries,
  onRevoke,
  revokingIds,
}: AccessLogListProps): React.JSX.Element {
  return (
    <ul className={styles.list}>
      {entries.map((entry) => (
        <li key={entry.id} className={styles.item}>
          <AccessLogItem
            entry={entry}
            onRevoke={onRevoke}
            isRevoking={revokingIds.has(entry.id)}
          />
        </li>
      ))}
    </ul>
  );
}
