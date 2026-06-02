import { prisma } from "@/lib/prisma";
import { Notification, NotificationType, Prisma } from "@prisma/client";

// Priority levels for notification delivery
export enum NotificationPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  URGENT = "urgent",
}

// Delivery metadata for future realtime transport
export interface DeliveryMetadata {
  priority?: NotificationPriority;
  channel?: "in_app" | "email" | "push" | "websocket";
  ttl?: number; // Time to live in seconds
}

// Extended notification data with delivery info
export interface ExtendedNotification extends Notification {
  priority?: NotificationPriority;
  deliveryChannels?: Array<"in_app" | "email" | "push" | "websocket">;
}

export interface PaginatedNotificationsResult {
  notifications: ExtendedNotification[];
  total: number;
  unreadCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// Default priority mapping for notification types
const DEFAULT_PRIORITIES: Record<NotificationType, NotificationPriority> = {
  giveaway_entry: NotificationPriority.MEDIUM,
  giveaway_win: NotificationPriority.HIGH,
  help_contribution: NotificationPriority.MEDIUM,
  post_closed: NotificationPriority.LOW,
  badge_awarded: NotificationPriority.HIGH,
  rank_up: NotificationPriority.HIGH,
};

/**
 * Create a single notification with delivery metadata
 */
export async function createNotification({
  userId,
  type,
  message,
  link,
  priority,
}: {
  userId: string;
  type: NotificationType;
  message: string;
  link?: string;
  priority?: NotificationPriority;
}) {
  return prisma.notification.create({
    data: {
      userId,
      type,
      message,
      link,
    },
  });
}

/**
 * Fan out notifications to multiple users from a single event
 * Supports batch creation with consistent error handling
 */
export async function fanOutNotifications({
  userIds,
  type,
  message,
  link,
  priority,
}: {
  userIds: string[];
  type: NotificationType;
  message: string;
  link?: string;
  priority?: NotificationPriority;
}): Promise<number> {
  if (userIds.length === 0) return 0;

  try {
    const result = await prisma.notification.createMany({
      data: userIds.map((userId) => ({
        userId,
        type,
        message,
        link,
      })),
      skipDuplicates: true,
    });

    return result.count;
  } catch (error: unknown) {
    const code = (error as { code?: string })?.code;
    const modelName = String(
      (error as { meta?: { modelName?: string } })?.meta?.modelName || "",
    ).toLowerCase();

    // Gracefully handle missing notification table
    if (code === "P2021" && modelName === "notification") {
      return 0;
    }

    throw error;
  }
}

/**
 * Create notifications within a transaction for atomicity
 * Returns the notification creation function to be used in transactions
 */
export function createNotificationInTransaction(tx: Prisma.TransactionClient) {
  return async ({
    userId,
    type,
    message,
    link,
  }: {
    userId: string;
    type: NotificationType;
    message: string;
    link?: string;
  }) => {
    return tx.notification.create({
      data: {
        userId,
        type,
        message,
        link,
      },
    });
  };
}

/**
 * Fan out notifications within a transaction
 */
export function fanOutNotificationsInTransaction(tx: Prisma.TransactionClient) {
  return async ({
    userIds,
    type,
    message,
    link,
  }: {
    userIds: string[];
    type: NotificationType;
    message: string;
    link?: string;
  }): Promise<number> => {
    if (userIds.length === 0) return 0;

    try {
      const result = await tx.notification.createMany({
        data: userIds.map((userId) => ({
          userId,
          type,
          message,
          link,
        })),
        skipDuplicates: true,
      });

      return result.count;
    } catch (error: unknown) {
      const code = (error as { code?: string })?.code;
      const modelName = String(
        (error as { meta?: { modelName?: string } })?.meta?.modelName || "",
      ).toLowerCase();

      if (code === "P2021" && modelName === "notification") {
        return 0;
      }

      throw error;
    }
  };
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.notification.count({
    where: {
      userId,
      isRead: false,
    },
  });
}

export async function getPaginatedNotifications({
  userId,
  page = 1,
  pageSize = 20,
  isRead,
}: {
  userId: string;
  page?: number;
  pageSize?: number;
  isRead?: boolean;
}): Promise<PaginatedNotificationsResult> {
  const normalizedPage = Math.max(1, Math.floor(page));
  const normalizedPageSize = Math.min(50, Math.max(1, Math.floor(pageSize)));
  const where: { userId: string; isRead?: boolean } = { userId };

  if (isRead !== undefined) {
    where.isRead = isRead;
  }

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (normalizedPage - 1) * normalizedPageSize,
      take: normalizedPageSize,
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({
      where: { userId, isRead: false },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / normalizedPageSize));
  const enrichedNotifications: ExtendedNotification[] = notifications.map(
    (notification) => ({
      ...notification,
      priority:
        DEFAULT_PRIORITIES[notification.type] || NotificationPriority.MEDIUM,
      deliveryChannels: ["in_app"],
    }),
  );

  return {
    notifications: enrichedNotifications,
    total,
    unreadCount,
    page: normalizedPage,
    pageSize: normalizedPageSize,
    totalPages,
    hasNextPage: normalizedPage < totalPages,
    hasPreviousPage: normalizedPage > 1,
  };
}

/**
 * Mark multiple notifications as read in bulk
 */
export async function markAsRead(
  userId: string,
  notificationIds: string[],
): Promise<number> {
  if (notificationIds.length === 0) return 0;

  const result = await prisma.notification.updateMany({
    where: {
      id: { in: notificationIds },
      userId,
    },
    data: {
      isRead: true,
    },
  });

  return result.count;
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(userId: string): Promise<number> {
  const result = await prisma.notification.updateMany({
    where: {
      userId,
      isRead: false,
    },
    data: {
      isRead: true,
    },
  });

  return result.count;
}

/**
 * Get recent notifications with delivery-ready payload
 * Suitable for polling now, realtime transport later
 */
export async function getRecentNotifications({
  userId,
  limit = 20,
  isRead,
}: {
  userId: string;
  limit?: number;
  isRead?: boolean;
}): Promise<{
  notifications: ExtendedNotification[];
  unreadCount: number;
  hasMore: boolean;
}> {
  const where: { userId: string; isRead?: boolean } = { userId };
  if (isRead !== undefined) {
    where.isRead = isRead;
  }

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit + 1, // Fetch one extra to check if there are more
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({
      where: { userId, isRead: false },
    }),
  ]);

  const hasMore = notifications.length > limit;
  const limitedNotifications = hasMore
    ? notifications.slice(0, limit)
    : notifications;

  // Enrich with priority metadata for delivery layer
  const enrichedNotifications: ExtendedNotification[] =
    limitedNotifications.map((notification) => ({
      ...notification,
      priority:
        DEFAULT_PRIORITIES[notification.type] || NotificationPriority.MEDIUM,
      deliveryChannels: ["in_app"], // Ready for future channels
    }));

  return {
    notifications: enrichedNotifications,
    unreadCount,
    hasMore,
  };
}

/**
 * Get notification delivery payload optimized for transport
 * Prepares data structure for future realtime/WebSocket delivery
 */
export function prepareDeliveryPayload(notification: ExtendedNotification): {
  id: string;
  type: NotificationType;
  message: string;
  link?: string;
  priority: NotificationPriority;
  createdAt: Date;
  isRead: boolean;
} {
  return {
    id: notification.id,
    type: notification.type,
    message: notification.message,
    link: notification.link || undefined,
    priority:
      notification.priority ||
      DEFAULT_PRIORITIES[notification.type] ||
      NotificationPriority.MEDIUM,
    createdAt: notification.createdAt,
    isRead: notification.isRead,
  };
}
