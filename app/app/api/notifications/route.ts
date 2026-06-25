import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { parsePaginationParam } from "@/lib/validation";
import {
  getPaginatedNotifications,
  markAllAsRead,
  markAsRead,
  getUnreadCount,
} from "@/lib/notifications";

// GET /api/notifications?isRead=false&page=1&pageSize=20
export async function GET(req: NextRequest) {
  const currentUser = await getCurrentUser(req);
  if (!currentUser?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const isRead = searchParams.get("isRead");
  const page = parsePaginationParam(searchParams.get("page"), {
    defaultValue: 1,
    min: 1,
  });
  const pageSize = parsePaginationParam(searchParams.get("pageSize"), {
    defaultValue: 20,
    min: 1,
    max: 100,
  });

  const result = await getPaginatedNotifications({
    userId: currentUser.id,
    page,
    pageSize,
    isRead: isRead === null ? undefined : isRead === "true",
  });

  return NextResponse.json(result);
}

// POST /api/notifications/read-all - Mark all notifications as read
export async function POST(req: NextRequest) {
  const currentUser = await getCurrentUser(req);
  if (!currentUser?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const count = await markAllAsRead(currentUser.id);
    const unreadCount = await getUnreadCount(currentUser.id);
    return NextResponse.json({ success: true, markedCount: count, unreadCount });
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
  const currentUser = await getCurrentUser(req);
  if (!currentUser?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { notificationIds } = body as { notificationIds?: string[] };

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return NextResponse.json(
        { error: "notificationIds array is required" },
        { status: 400 },
      );
    }

    const count = await markAsRead(currentUser.id, notificationIds);
    const unreadCount = await getUnreadCount(currentUser.id);
    return NextResponse.json({ success: true, markedCount: count, unreadCount });
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
  const currentUser = await getCurrentUser(req);
  if (!currentUser?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const count = await getUnreadCount(currentUser.id);
    return NextResponse.json({ unreadCount: count });
  } catch (error) {
    console.error("Error getting unread count:", error);
    return NextResponse.json(
      { error: "Failed to get unread count" },
      { status: 500 },
    );
  }
}
