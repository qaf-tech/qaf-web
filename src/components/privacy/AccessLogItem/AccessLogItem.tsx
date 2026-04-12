"use client";

import { useState } from "react";
import glass from "@/styles/glass.module.css";
import type { AccessLogItemProps } from "./AccessLogItem.model";
import styles from "./AccessLogItemStyles.module.css";

const relativeFormatter = new Intl.RelativeTimeFormat("en", {
  numeric: "auto",
});

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 60 * 60 * 24 * 365],
  ["month", 60 * 60 * 24 * 30],
  ["day", 60 * 60 * 24],
  ["hour", 60 * 60],
  ["minute", 60],
];

function formatRelative(iso: string): string {
  const diffSeconds = Math.round((new Date(iso).getTime() - Date.now()) / 1000);
  for (const [unit, seconds] of UNITS) {
    if (Math.abs(diffSeconds) >= seconds) {
      return relativeFormatter.format(Math.round(diffSeconds / seconds), unit);
    }
  }
  return relativeFormatter.format(diffSeconds, "second");
}

export function AccessLogItem({
  entry,
  onRevoke,
  isRevoking,
}: AccessLogItemProps): React.JSX.Element {
  const [inlineError, setInlineError] = useState<string | null>(null);

  const handleRevoke = async (): Promise<void> => {
    setInlineError(null);
    try {
      await onRevoke(entry.id);
    } catch (err) {
      setInlineError(err instanceof Error ? err.message : "Failed to revoke");
    }
  };

  const relative = formatRelative(entry.accessedAt);
  const fullDate = new Date(entry.accessedAt).toLocaleString();

  return (
    <div className={`${glass.surface} ${styles.item}`}>
      <div className={styles.info}>
        <p className={styles.accessor}>{entry.accessorName}</p>
        <p className={styles.credential}>{entry.credentialName}</p>
        <p className={styles.fact}>{entry.factDisclosed}</p>
        <span className={styles.timestamp} title={fullDate}>
          {relative}
        </span>
      </div>
      <div className={styles.actions}>
        {entry.revoked ? (
          <span className={styles.revokedBadge}>Revoked</span>
        ) : (
          <button
            type="button"
            className={styles.revokeButton}
            onClick={handleRevoke}
            disabled={isRevoking}
            aria-label={`Revoke access for ${entry.accessorName} to your ${entry.factDisclosed}`}
          >
            {isRevoking ? (
              <span className={styles.spinner} aria-hidden="true">
                ⏳
              </span>
            ) : (
              "Revoke"
            )}
          </button>
        )}
        {inlineError ? (
          <p className={styles.inlineError} role="alert">
            {inlineError}
          </p>
        ) : null}
      </div>
    </div>
  );
}
