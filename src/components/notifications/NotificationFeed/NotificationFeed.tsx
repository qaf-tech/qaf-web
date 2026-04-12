"use client";

import { NotificationItem } from "@/components/notifications/NotificationItem";
import type { NotificationFeedProps } from "./NotificationFeed.model";
import styles from "./NotificationFeedStyles.module.css";

export function NotificationFeed({
  notifications,
  onMarkRead,
}: NotificationFeedProps): React.JSX.Element {
  return (
    <ul className={styles.list}>
      {notifications.map((n) => (
        <li key={n.id} className={styles.item}>
          <NotificationItem notification={n} onMarkRead={onMarkRead} />
        </li>
      ))}
    </ul>
  );
}
