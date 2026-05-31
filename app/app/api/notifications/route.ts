import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getRecentNotifications,
  markAllAsRead,
  markAsRead,
  getUnreadCount,
} from "@/lib/notifications";

// GET /api/notifications?isRead=false&page=1&pageSize=20
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  const { searchParams } = new URL(req.url);
  const isRead = searchParams.get("isRead");
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") || "20", 10);

  const where: any = { userId };
  if (isRead !== null) where.isRead = isRead === "true";

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.notification.count({ where }),
  ]);

  return NextResponse.json({ notifications, total, page, pageSize });
}

// POST /api/notifications/read-all - Mark all notifications as read
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const count = await markAllAsRead(userId);
    return NextResponse.json({ success: true, markedCount: count });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return NextResponse.json(
      { error: "Failed to mark notifications as read" },
      { status: 500 },
    );
  }
}

// PATCH /api/notifications/read - Mark specific notifications as read
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const body = await req.json();
    const { notificationIds } = body as { notificationIds?: string[] };

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return NextResponse.json(
        { error: "notificationIds array is required" },
        { status: 400 },
      );
    }

    const count = await markAsRead(userId, notificationIds);
    return NextResponse.json({ success: true, markedCount: count });
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    return NextResponse.json(
      { error: "Failed to mark notifications as read" },
      { status: 500 },
    );
  }
}

// DELETE /api/notifications/unread-count - Get unread count
export async function DELETE(req: NextRequest) {
  // Note: Using DELETE to get unread count is a temporary pattern
  // This should be changed to GET /api/notifications/unread-count in the future
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const count = await getUnreadCount(userId);
    return NextResponse.json({ unreadCount: count });
  } catch (error) {
    console.error("Error getting unread count:", error);
    return NextResponse.json(
      { error: "Failed to get unread count" },
      { status: 500 },
    );
  }
}
