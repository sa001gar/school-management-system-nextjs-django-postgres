export interface Notification {
  id: string;
  notification_type: string;
  title: string;
  message: string;
  is_read: boolean;
  link: string;
  created_at: string;
}

export interface NotificationSummary {
  total: number;
  unread: number;
}
