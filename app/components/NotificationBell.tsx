import { Bell } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { useUnreadNotifications } from '@/hooks/use-unread-notifications';

export function NotificationBell() {
  const unread = useUnreadNotifications();
  return (
    <Link href="/notifications" className="relative flex items-center">
      <Bell className="w-6 h-6 text-gray-500 dark:text-gray-400" />
      {unread > 0 && (
        <Badge className="absolute -top-1 -right-1 bg-red-500 text-white border-0 px-1.5 py-0.5 text-xs">
          {unread}
        </Badge>
      )}
    </Link>
  );
}
