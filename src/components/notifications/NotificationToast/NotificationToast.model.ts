import type { Notification } from "@/lib/models/notification";

export interface NotificationToastProps {
  notification: Notification;
  onDismiss: () => void;
  index: number;
}
