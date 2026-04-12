import type { Notification } from "@/lib/models/notification";

export interface NotificationItemProps {
  notification: Notification;
  onMarkRead: (id: string) => void;
}
