import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createNotification,
  fanOutNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  getRecentNotifications,
  prepareDeliveryPayload,
  NotificationPriority,
  createNotificationInTransaction,
  fanOutNotificationsInTransaction,
} from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

describe("Notification Delivery System", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("createNotification", () => {
    it("should create a notification successfully", async () => {
      const mockNotification = {
        id: "notif_1",
        userId: "user_1",
        type: "giveaway_entry" as const,
        message: "Test notification",
        link: "/post/1",
        isRead: false,
        createdAt: new Date(),
      };

      prisma.notification.create = vi.fn().mockResolvedValue(mockNotification);

      const result = await createNotification({
        userId: "user_1",
        type: "giveaway_entry",
        message: "Test notification",
        link: "/post/1",
      });

      expect(result).toEqual(mockNotification);
      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: {
          userId: "user_1",
          type: "giveaway_entry",
          message: "Test notification",
          link: "/post/1",
        },
      });
    });
  });

  describe("fanOutNotifications", () => {
    it("should fan out notifications to multiple users", async () => {
      const userIds = ["user_1", "user_2", "user_3"];
      prisma.notification.createMany = vi.fn().mockResolvedValue({ count: 3 });

      const result = await fanOutNotifications({
        userIds,
        type: "giveaway_win",
        message: "You won!",
        link: "/post/1",
      });

      expect(result).toBe(3);
      expect(prisma.notification.createMany).toHaveBeenCalledWith({
        data: userIds.map((userId) => ({
          userId,
          type: "giveaway_win",
          message: "You won!",
          link: "/post/1",
        })),
        skipDuplicates: true,
      });
    });

    it("should return 0 for empty userIds array", async () => {
      prisma.notification.createMany = vi.fn();

      const result = await fanOutNotifications({
        userIds: [],
        type: "giveaway_win",
        message: "You won!",
      });

      expect(result).toBe(0);
      expect(prisma.notification.createMany).not.toHaveBeenCalled();
    });

    it("should gracefully handle missing notification table", async () => {
      prisma.notification.createMany = vi.fn().mockRejectedValue({
        code: "P2021",
        meta: { modelName: "Notification" },
      });

      const result = await fanOutNotifications({
        userIds: ["user_1"],
        type: "giveaway_win",
        message: "You won!",
      });

      expect(result).toBe(0);
    });
  });

  describe("getUnreadCount", () => {
    it("should return unread notification count", async () => {
      prisma.notification.count = vi.fn().mockResolvedValue(5);

      const result = await getUnreadCount("user_1");

      expect(result).toBe(5);
      expect(prisma.notification.count).toHaveBeenCalledWith({
        where: {
          userId: "user_1",
          isRead: false,
        },
      });
    });
  });

  describe("markAsRead", () => {
    it("should mark specific notifications as read", async () => {
      prisma.notification.updateMany = vi.fn().mockResolvedValue({ count: 2 });

      const result = await markAsRead("user_1", ["notif_1", "notif_2"]);

      expect(result).toBe(2);
      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: {
          id: { in: ["notif_1", "notif_2"] },
          userId: "user_1",
        },
        data: { isRead: true },
      });
    });

    it("should return 0 for empty notificationIds array", async () => {
      prisma.notification.updateMany = vi.fn();

      const result = await markAsRead("user_1", []);

      expect(result).toBe(0);
      expect(prisma.notification.updateMany).not.toHaveBeenCalled();
    });
  });

  describe("markAllAsRead", () => {
    it("should mark all notifications as read", async () => {
      prisma.notification.updateMany = vi.fn().mockResolvedValue({ count: 10 });

      const result = await markAllAsRead("user_1");

      expect(result).toBe(10);
      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: {
          userId: "user_1",
          isRead: false,
        },
        data: { isRead: true },
      });
    });
  });

  describe("getRecentNotifications", () => {
    it("should return recent notifications with unread count", async () => {
      const mockNotifications = [
        {
          id: "notif_1",
          userId: "user_1",
          type: "giveaway_entry" as const,
          message: "Entry notification",
          link: "/post/1",
          isRead: false,
          createdAt: new Date(),
        },
        {
          id: "notif_2",
          userId: "user_1",
          type: "giveaway_win" as const,
          message: "Win notification",
          link: "/post/2",
          isRead: true,
          createdAt: new Date(),
        },
      ];

      prisma.notification.findMany = vi
        .fn()
        .mockResolvedValue(mockNotifications);
      prisma.notification.count = vi
        .fn()
        .mockResolvedValueOnce(2) // total count
        .mockResolvedValueOnce(1); // unread count

      const result = await getRecentNotifications({
        userId: "user_1",
        limit: 20,
      });

      expect(result.notifications).toHaveLength(2);
      expect(result.unreadCount).toBe(1);
      expect(result.hasMore).toBe(false);
      expect(result.notifications[0]).toHaveProperty("priority");
      expect(result.notifications[0]).toHaveProperty("deliveryChannels");
    });

    it("should filter by isRead status", async () => {
      prisma.notification.findMany = vi.fn().mockResolvedValue([]);
      prisma.notification.count = vi.fn().mockResolvedValue(0);

      await getRecentNotifications({
        userId: "user_1",
        isRead: false,
      });

      expect(prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId: "user_1",
            isRead: false,
          },
        }),
      );
    });

    it("should indicate hasMore when exceeding limit", async () => {
      const mockNotifications = Array(21).fill({
        id: "notif_1",
        userId: "user_1",
        type: "giveaway_entry" as const,
        message: "Test",
        isRead: false,
        createdAt: new Date(),
      });

      prisma.notification.findMany = vi
        .fn()
        .mockResolvedValue(mockNotifications);
      prisma.notification.count = vi.fn().mockResolvedValue(50);

      const result = await getRecentNotifications({
        userId: "user_1",
        limit: 20,
      });

      expect(result.hasMore).toBe(true);
      expect(result.notifications).toHaveLength(20);
    });
  });

  describe("prepareDeliveryPayload", () => {
    it("should prepare notification for delivery transport", async () => {
      const notification = {
        id: "notif_1",
        userId: "user_1",
        type: "giveaway_win" as const,
        message: "You won!",
        link: "/post/1",
        isRead: false,
        createdAt: new Date(),
        priority: NotificationPriority.HIGH,
        deliveryChannels: ["in_app" as const, "push" as const],
      };

      const payload = prepareDeliveryPayload(notification);

      expect(payload).toEqual({
        id: "notif_1",
        type: "giveaway_win",
        message: "You won!",
        link: "/post/1",
        priority: NotificationPriority.HIGH,
        createdAt: notification.createdAt,
        isRead: false,
      });
    });

    it("should use default priority if not provided", async () => {
      const notification = {
        id: "notif_1",
        userId: "user_1",
        type: "giveaway_entry" as const,
        message: "Entry notification",
        isRead: false,
        createdAt: new Date(),
      };

      const payload = prepareDeliveryPayload(notification as any);

      expect(payload.priority).toBe(NotificationPriority.MEDIUM);
    });
  });

  describe("Transaction helpers", () => {
    it("should create notification within transaction", async () => {
      const mockTx = {
        notification: {
          create: vi.fn().mockResolvedValue({ id: "notif_1" }),
        },
      };

      const createInTx = createNotificationInTransaction(mockTx as any);
      const result = await createInTx({
        userId: "user_1",
        type: "giveaway_entry",
        message: "Test",
        link: "/post/1",
      });

      expect(result.id).toBe("notif_1");
      expect(mockTx.notification.create).toHaveBeenCalled();
    });

    it("should fan out notifications within transaction", async () => {
      const mockTx = {
        notification: {
          createMany: vi.fn().mockResolvedValue({ count: 3 }),
        },
      };

      const fanOutInTx = fanOutNotificationsInTransaction(mockTx as any);
      const result = await fanOutInTx({
        userIds: ["user_1", "user_2", "user_3"],
        type: "giveaway_win",
        message: "You won!",
        link: "/post/1",
      });

      expect(result).toBe(3);
      expect(mockTx.notification.createMany).toHaveBeenCalled();
    });
  });
});
