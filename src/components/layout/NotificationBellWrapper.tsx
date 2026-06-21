import { getMyNotifications, getUnreadCount } from "@/lib/repositories/notifications";
import { NotificationBell } from "./NotificationBell";

interface NotificationBellWrapperProps {
  userId: string;
}

export async function NotificationBellWrapper({ userId }: NotificationBellWrapperProps) {
  const [notifications, unread] = await Promise.all([getMyNotifications(), getUnreadCount()]);

  return (
    <NotificationBell initialNotifications={notifications} initialUnread={unread} userId={userId} />
  );
}
