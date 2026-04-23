'use client';

import { useEffect, useState, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';

interface Notification {
  id: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/notifications?page=1&pageSize=50');
      const data = await res.json();
      setNotifications(data.notifications || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (id: string) => {
    await fetch(`/api/notifications/${id}`, { method: 'PATCH' });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter((n) => !n.isRead);
    await Promise.all(
      unread.map((n) => fetch(`/api/notifications/${n.id}`, { method: 'PATCH' })),
    );
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">
          Notifications
          {unreadCount > 0 && (
            <Badge variant="destructive" className="ml-2">{unreadCount}</Badge>
          )}
        </h1>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-sm text-blue-600 hover:underline"
          >
            Mark all as read
          </button>
        )}
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : notifications.length === 0 ? (
        <div className="text-gray-500">No notifications yet.</div>
      ) : (
        <ul className="space-y-4">
          {notifications.map((n) => (
            <li
              key={n.id}
              className={`p-4 rounded-lg border ${n.isRead ? 'bg-gray-50' : 'bg-orange-50 border-orange-200'}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium">{n.message}</span>
                  {n.link && (
                    <a href={n.link} className="ml-2 text-blue-600 underline text-xs">
                      View
                    </a>
                  )}
                </div>
                {!n.isRead && (
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive">New</Badge>
                    <button
                      onClick={() => markAsRead(n.id)}
                      className="text-xs text-gray-500 hover:text-gray-800 hover:underline"
                    >
                      Mark as read
                    </button>
                  </div>
                )}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {new Date(n.createdAt).toLocaleString()}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
