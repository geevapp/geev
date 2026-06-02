'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  Check,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { syncUnreadNotifications } from '@/hooks/use-unread-notifications';

interface Notification {
  id: string;
  message: string;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
}

interface NotificationsResponse {
  notifications?: Notification[];
  total?: number;
  unreadCount?: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
}

const PAGE_SIZE = 10;

function formatNotificationTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());

  const hasPreviousPage = page > 1;
  const hasNextPage = page < totalPages;

  const pageSummary = useMemo(() => {
    if (total === 0) return '0 notifications';

    const start = (page - 1) * PAGE_SIZE + 1;
    const end = Math.min(total, page * PAGE_SIZE);
    return `${start}-${end} of ${total}`;
  }, [page, total]);

  const applyUnreadCount = useCallback((count: number) => {
    setUnreadCount(count);
    syncUnreadNotifications(count);
  }, []);

  const fetchNotifications = useCallback(
    async ({ silent = false } = {}) => {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const res = await fetch(
          `/api/notifications?page=${page}&pageSize=${PAGE_SIZE}`,
          { cache: 'no-store' },
        );

        if (!res.ok) {
          setNotifications([]);
          setTotal(0);
          setTotalPages(1);
          applyUnreadCount(0);
          return;
        }

        const data = (await res.json()) as NotificationsResponse;
        setNotifications(data.notifications ?? []);
        setTotal(data.total ?? 0);
        setTotalPages(Math.max(1, data.totalPages ?? 1));
        applyUnreadCount(data.unreadCount ?? 0);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [applyUnreadCount, page],
  );

  useEffect(() => {
    void fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (id: string) => {
    setUpdatingIds((prev) => new Set(prev).add(id));

    try {
      const res = await fetch(`/api/notifications/${id}`, { method: 'PATCH' });
      const data = await res.json().catch(() => ({}));

      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === id
            ? { ...notification, isRead: true }
            : notification,
        ),
      );

      if (typeof data.unreadCount === 'number') {
        applyUnreadCount(data.unreadCount);
      } else {
        syncUnreadNotifications();
      }
    } finally {
      setUpdatingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const openNotification = async (notification: Notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }

    if (notification.link) {
      router.push(notification.link);
    }
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications
      .filter((notification) => !notification.isRead)
      .map((notification) => notification.id);

    setUpdatingIds(new Set(unreadIds));

    try {
      const res = await fetch('/api/notifications', { method: 'POST' });
      const data = await res.json().catch(() => ({}));

      setNotifications((prev) =>
        prev.map((notification) => ({ ...notification, isRead: true })),
      );
      applyUnreadCount(typeof data.unreadCount === 'number' ? data.unreadCount : 0);
      void fetchNotifications({ silent: true });
    } finally {
      setUpdatingIds(new Set());
    }
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-950 dark:text-gray-50">
              Notifications
            </h1>
            {unreadCount > 0 && (
              <Badge variant="destructive">{unreadCount} unread</Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {pageSummary}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => void fetchNotifications({ silent: true })}
            disabled={loading || refreshing}
            aria-label="Refresh notifications"
          >
            {refreshing ? <Loader2 className="animate-spin" /> : <RefreshCw />}
          </Button>
          <Button
            variant="outline"
            onClick={markAllAsRead}
            disabled={unreadCount === 0 || loading || updatingIds.size > 0}
          >
            <Check />
            Mark all read
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-24 animate-pulse rounded-lg border bg-gray-100 dark:bg-gray-900"
            />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex min-h-64 flex-col items-center justify-center rounded-lg border border-dashed px-6 text-center">
          <Bell className="mb-3 size-8 text-gray-400" />
          <h2 className="text-base font-semibold text-gray-950 dark:text-gray-50">
            No notifications yet
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            New activity will appear here as it arrives.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {notifications.map((notification) => {
            const isUpdating = updatingIds.has(notification.id);

            return (
              <li
                key={notification.id}
                className={`rounded-lg border p-4 transition ${
                  notification.isRead
                    ? 'bg-white dark:bg-gray-950'
                    : 'border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950/30'
                }`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <button
                    type="button"
                    onClick={() => void openNotification(notification)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-950 dark:text-gray-50">
                        {notification.message}
                      </span>
                      {!notification.isRead && (
                        <Badge variant="destructive">New</Badge>
                      )}
                    </div>
                    <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {formatNotificationTime(notification.createdAt)}
                    </div>
                  </button>
                  <div className="flex shrink-0 items-center gap-2">
                    {notification.link && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => void openNotification(notification)}
                        aria-label="Open notification"
                      >
                        <ExternalLink />
                      </Button>
                    )}
                    {!notification.isRead && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => void markAsRead(notification.id)}
                        disabled={isUpdating}
                      >
                        {isUpdating ? (
                          <Loader2 className="animate-spin" />
                        ) : (
                          <Check />
                        )}
                        Read
                      </Button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-6 flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setPage((current) => Math.max(1, current - 1))}
          disabled={!hasPreviousPage || loading}
        >
          <ChevronLeft />
          Previous
        </Button>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Page {page} of {totalPages}
        </span>
        <Button
          variant="outline"
          onClick={() => setPage((current) => current + 1)}
          disabled={!hasNextPage || loading}
        >
          Next
          <ChevronRight />
        </Button>
      </div>
    </main>
  );
}
