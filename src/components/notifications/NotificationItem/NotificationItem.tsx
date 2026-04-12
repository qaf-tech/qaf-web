"use client";

import type { NotificationType } from "@/lib/models/notification";
import glass from "@/styles/glass.module.css";
import type { NotificationItemProps } from "./NotificationItem.model";
import styles from "./NotificationItemStyles.module.css";

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
  const diff = Math.round((new Date(iso).getTime() - Date.now()) / 1000);
  for (const [unit, seconds] of UNITS) {
    if (Math.abs(diff) >= seconds) {
      return relativeFormatter.format(Math.round(diff / seconds), unit);
    }
  }
  return relativeFormatter.format(diff, "second");
}

const ICON_MAP: Record<NotificationType, { emoji: string; color: string }> = {
  transaction_confirmed: { emoji: "✅", color: "iconSuccess" },
  purchase_complete: { emoji: "🛍️", color: "iconPrimary" },
  credential_expiring: { emoji: "⚠️", color: "iconWarning" },
  access_alert: { emoji: "🛡️", color: "iconError" },
};

export function NotificationItem({
  notification,
  onMarkRead,
}: NotificationItemProps): React.JSX.Element {
  const { emoji, color } = ICON_MAP[notification.type];
  const relative = formatRelative(notification.createdAt);

  const handleClick = (): void => {
    if (!notification.read) {
      onMarkRead(notification.id);
    }
  };

  return (
    <button
      type="button"
      className={`${glass.surface} ${styles.item}`}
      onClick={handleClick}
      aria-label={`${notification.type} notification: ${notification.title}, ${relative}`}
    >
      <span
        className={`${styles.dot} ${notification.read ? styles.dotHidden : ""}`}
        aria-hidden="true"
      />
      <span
        className={`${styles.icon} ${styles[color] ?? ""}`}
        aria-hidden="true"
      >
        {emoji}
      </span>
      <div className={styles.content}>
        <p className={styles.title}>{notification.title}</p>
        <p className={styles.body}>{notification.body}</p>
        <span className={styles.time}>{relative}</span>
      </div>
    </button>
  );
}
