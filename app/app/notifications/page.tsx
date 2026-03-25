import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNotifications() {
      setLoading(true);
      const res = await fetch('/api/notifications?page=1&pageSize=50');
      const data = await res.json();
      setNotifications(data.notifications || []);
      setLoading(false);
    }
    fetchNotifications();
  }, []);

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Notifications</h1>
      {loading ? (
        <div>Loading...</div>
      ) : notifications.length === 0 ? (
        <div className="text-gray-500">No notifications yet.</div>
      ) : (
        <ul className="space-y-4">
          {notifications.map((n) => (
            <li key={n.id} className={`p-4 rounded-lg border ${n.isRead ? 'bg-gray-50' : 'bg-orange-50 border-orange-200'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium">{n.message}</span>
                  {n.link && (
                    <a href={n.link} className="ml-2 text-blue-600 underline text-xs">View</a>
                  )}
                </div>
                {!n.isRead && <Badge variant="destructive">New</Badge>}
              </div>
              <div className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
