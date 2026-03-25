import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// PATCH /api/notifications/[id]/read
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;
  const { id } = params;

  const notification = await prisma.notification.findUnique({ where: { id } });
  if (!notification || notification.userId !== userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  await prisma.notification.update({ where: { id }, data: { isRead: true } });
  return NextResponse.json({ success: true });
}
