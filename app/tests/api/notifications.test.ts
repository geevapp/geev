import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST, PATCH, DELETE } from "@/app/api/notifications/route";
import { createMockRequest, parseResponse } from "../helpers/api";
import * as notifications from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

// Mock auth module before importing routes
const mockAuth = vi.hoisted(() => vi.fn());
const mockGetCurrentUser = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth", () => ({
  auth: mockAuth,
  getCurrentUser: mockGetCurrentUser,
}));

describe("Notifications API", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockAuth.mockReset();
    mockGetCurrentUser.mockReset();
  });

  describe("GET /api/notifications", () => {
    it("should return 401 if not authenticated", async () => {
      mockGetCurrentUser.mockResolvedValue(null);

      const request = createMockRequest(
        "http://localhost:3000/api/notifications",
      );
      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it("should return notifications for authenticated user", async () => {
      mockGetCurrentUser.mockResolvedValue({ id: "user_1" });

      const mockNotifications = [
        {
          id: "notif_1",
          userId: "user_1",
          type: "giveaway_entry",
          message: "Test",
          isRead: false,
        },
      ];

      prisma.notification.findMany = vi
        .fn()
        .mockResolvedValue(mockNotifications);
      prisma.notification.count = vi.fn().mockResolvedValue(1);

      const request = createMockRequest(
        "http://localhost:3000/api/notifications",
      );
      const response = await GET(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(200);
      expect(data.notifications).toHaveLength(1);
      expect(data.total).toBe(1);
      expect(data.unreadCount).toBe(1);
    });

    it("should filter by isRead parameter", async () => {
      mockGetCurrentUser.mockResolvedValue({ id: "user_1" });

      prisma.notification.findMany = vi.fn().mockResolvedValue([]);
      prisma.notification.count = vi.fn().mockResolvedValue(0);

      const request = createMockRequest(
        "http://localhost:3000/api/notifications?isRead=false",
      );
      await GET(request);

      expect(prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: "user_1",
            isRead: false,
          }),
        }),
      );
    });
  });

  describe("POST /api/notifications/read-all", () => {
    it("should return 401 if not authenticated", async () => {
      mockGetCurrentUser.mockResolvedValue(null);

      const request = createMockRequest(
        "http://localhost:3000/api/notifications",
        {
          method: "POST",
        },
      );
      const response = await POST(request);

      expect(response.status).toBe(401);
    });

    it("should mark all notifications as read", async () => {
      mockGetCurrentUser.mockResolvedValue({ id: "user_1" });

      vi.spyOn(notifications, "markAllAsRead").mockResolvedValue(5);

      const request = createMockRequest(
        "http://localhost:3000/api/notifications",
        {
          method: "POST",
        },
      );
      const response = await POST(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.markedCount).toBe(5);
    });
  });

  describe("PATCH /api/notifications/read", () => {
    it("should return 401 if not authenticated", async () => {
      mockGetCurrentUser.mockResolvedValue(null);

      const request = createMockRequest(
        "http://localhost:3000/api/notifications",
        {
          method: "PATCH",
          body: { notificationIds: ["notif_1"] },
        },
      );
      const response = await PATCH(request);

      expect(response.status).toBe(401);
    });

    it("should return 400 if notificationIds not provided", async () => {
      mockGetCurrentUser.mockResolvedValue({ id: "user_1" });

      const request = createMockRequest(
        "http://localhost:3000/api/notifications",
        {
          method: "PATCH",
          body: {},
        },
      );
      const response = await PATCH(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(400);
      expect(data.error).toBe("notificationIds array is required");
    });

    it("should mark specific notifications as read", async () => {
      mockGetCurrentUser.mockResolvedValue({ id: "user_1" });

      vi.spyOn(notifications, "markAsRead").mockResolvedValue(2);

      const request = createMockRequest(
        "http://localhost:3000/api/notifications",
        {
          method: "PATCH",
          body: { notificationIds: ["notif_1", "notif_2"] },
        },
      );
      const response = await PATCH(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.markedCount).toBe(2);
    });
  });

  describe("DELETE /api/notifications/unread-count", () => {
    it("should return 401 if not authenticated", async () => {
      mockGetCurrentUser.mockResolvedValue(null);

      const request = createMockRequest(
        "http://localhost:3000/api/notifications",
        {
          method: "DELETE",
        },
      );
      const response = await DELETE(request);

      expect(response.status).toBe(401);
    });

    it("should return unread count", async () => {
      mockGetCurrentUser.mockResolvedValue({ id: "user_1" });

      vi.spyOn(notifications, "getUnreadCount").mockResolvedValue(7);

      const request = createMockRequest(
        "http://localhost:3000/api/notifications",
        {
          method: "DELETE",
        },
      );
      const response = await DELETE(request);
      const { status, data } = await parseResponse(response);

      expect(status).toBe(200);
      expect(data.unreadCount).toBe(7);
    });
  });
});
