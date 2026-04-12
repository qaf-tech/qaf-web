"use client";

import { NotificationFeed } from "@/components/notifications/NotificationFeed";
import { useNotifications } from "@/hooks/useNotifications";
import glass from "@/styles/glass.module.css";
import styles from "./notificationsPage.module.css";

export default function NotificationsPage(): React.JSX.Element {
  const { notifications, isLoading, error, markAsRead } = useNotifications();

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Notifications</h1>

      {isLoading ? (
        <>
          <div className={styles.skeleton} aria-hidden="true" />
          <div className={styles.skeleton} aria-hidden="true" />
          <div className={styles.skeleton} aria-hidden="true" />
        </>
      ) : error ? (
        <div className={`${glass.surface} ${styles.error}`} role="alert">
          {error}
        </div>
      ) : notifications.length === 0 ? (
        <div className={`${glass.surface} ${styles.emptyState}`}>
          <span className={styles.emptyIcon} aria-hidden="true">
            🔔
          </span>
          <p className={styles.emptyText}>No notifications yet.</p>
        </div>
      ) : (
        <NotificationFeed
          notifications={notifications}
          onMarkRead={markAsRead}
        />
      )}
    </div>
  );
}
