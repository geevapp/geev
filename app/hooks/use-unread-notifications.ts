import { useCallback, useEffect, useState } from 'react';

export const NOTIFICATIONS_SYNC_EVENT = 'geev:notifications-sync';

export function syncUnreadNotifications(unreadCount?: number) {
  if (typeof window === 'undefined') return;

  window.dispatchEvent(
    new CustomEvent(NOTIFICATIONS_SYNC_EVENT, {
      detail: { unreadCount },
    }),
  );
}

export function useUnreadNotifications() {
  const [count, setCount] = useState(0);

  const fetchUnread = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications?isRead=false&page=1&pageSize=1', {
        cache: 'no-store',
      });
      if (!res.ok) return;

      const data = await res.json();
      setCount(data.unreadCount ?? data.total ?? 0);
    } catch {
      setCount(0);
    }
  }, []);

  useEffect(() => {
    const handleSync = (event: Event) => {
      const unreadCount = (event as CustomEvent<{ unreadCount?: number }>).detail
        ?.unreadCount;

      if (typeof unreadCount === 'number') {
        setCount(unreadCount);
      } else {
        void fetchUnread();
      }
    };

    fetchUnread();
    window.addEventListener(NOTIFICATIONS_SYNC_EVENT, handleSync);
    const interval = setInterval(fetchUnread, 30000); // poll every 30s
    return () => {
      window.removeEventListener(NOTIFICATIONS_SYNC_EVENT, handleSync);
      clearInterval(interval);
    };
  }, [fetchUnread]);

  return count;
}
