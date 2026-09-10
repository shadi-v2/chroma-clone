import NotificationList from "@/components/notifications/NotificationList";
import { connectDB } from "@/lib/db";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { findNotificationsForUser } from "@/lib/db/notifications";

export default async function NotificationsPage() {
  await connectDB();

  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const notifications = await findNotificationsForUser(user.id || user._id);
  const serializedNotifications = JSON.parse(JSON.stringify(notifications));

  return (
    <main className="min-h-screen bg-cream-50 py-20">
      <div className="container mx-auto max-w-5xl px-4">
        <NotificationList
          notifications={serializedNotifications}
          userId={user.id || user._id}
        />
      </div>
    </main>
  );
}
