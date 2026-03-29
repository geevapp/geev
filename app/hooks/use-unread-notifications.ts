import { useEffect, useState } from 'react';

export function useUnreadNotifications() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    async function fetchUnread() {
      try {
        const res = await fetch('/api/notifications?isRead=false&page=1&pageSize=1');
        if (!res.ok) return;
        const data = await res.json();
        setCount(data.total || 0);
      } catch (e) {
        setCount(0);
      }
    }
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000); // poll every 30s
    return () => clearInterval(interval);
  }, []);

  return count;
}
