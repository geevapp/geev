import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUnreadCount, markAsRead } from "@/lib/notifications";

// PATCH /api/notifications/[id]/read
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const currentUser = await getCurrentUser(req);
  if (!currentUser?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const notification = await prisma.notification.findUnique({ where: { id } });
  if (!notification || notification.userId !== currentUser.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const markedCount = await markAsRead(currentUser.id, [id]);
  const unreadCount = await getUnreadCount(currentUser.id);

  return NextResponse.json({ success: true, markedCount, unreadCount });
}
