import type { Notification } from "@/lib/models/notification";

export interface NotificationFeedProps {
  notifications: Notification[];
  onMarkRead: (id: string) => void;
}
