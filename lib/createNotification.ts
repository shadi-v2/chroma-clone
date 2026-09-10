import { createDbNotification, type NotificationType } from "@/lib/db/notifications";

interface CreateNotificationProps {
  title: string;
  message: string;
  createdBy: string;
  recipients?: string[];
  isGlobal?: boolean;
  type?: NotificationType;
}

export async function createNotification({
  title,
  message,
  createdBy,
  recipients = [],
  isGlobal = false,
  type = "General",
}: CreateNotificationProps) {
  return createDbNotification({
    title,
    message,
    createdBy,
    recipients,
    isGlobal,
    type,
  });
}
