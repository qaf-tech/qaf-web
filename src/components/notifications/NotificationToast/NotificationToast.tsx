"use client";

import { useEffect } from "react";
import type { NotificationType } from "@/lib/models/notification";
import glass from "@/styles/glass.module.css";
import type { NotificationToastProps } from "./NotificationToast.model";
import styles from "./NotificationToastStyles.module.css";

const ICON_MAP: Record<NotificationType, string> = {
  transaction_confirmed: "✅",
  purchase_complete: "🛍️",
  credential_expiring: "⚠️",
  access_alert: "🛡️",
};

const INDEX_CLASSES = [styles.index0, styles.index1, styles.index2];

export function NotificationToast({
  notification,
  onDismiss,
  index,
}: NotificationToastProps): React.JSX.Element {
  useEffect(() => {
    if (notification.tier === 3) return;
    if (notification.tier < 1) return;
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [notification.tier, onDismiss]);

  const positionClass =
    INDEX_CLASSES[Math.min(index, INDEX_CLASSES.length - 1)] ?? styles.index0;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`${glass.surfaceElevated} ${styles.toast} ${positionClass}`}
    >
      <div className={styles.content}>
        <span className={styles.icon} aria-hidden="true">
          {ICON_MAP[notification.type]}
        </span>
        <div className={styles.body}>
          <p className={styles.title}>{notification.title}</p>
          <p className={styles.message}>{notification.body}</p>
        </div>
        {notification.tier === 3 ? (
          <span className={styles.delayBadge}>24h Delay</span>
        ) : null}
        <button
          type="button"
          className={styles.dismissButton}
          onClick={onDismiss}
          aria-label="Dismiss notification"
        >
          ×
        </button>
      </div>
    </div>
  );
}
