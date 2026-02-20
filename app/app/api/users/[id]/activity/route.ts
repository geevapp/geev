'use server';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';

type ActivityItem = {
  id: string;
  type: 'posted' | 'entered' | 'won' | 'liked';
  timestamp: string; // ISO
  subject: {
    id: string | number;
    title?: string | null;
    slug?: string | null;
    // for entries we include entryId
    entryId?: string | number;
  };
  // optional raw meta for consumers that need more details (e.g. thumbnail)
  meta?: Record<string, unknown>;
};

const MAX_LIMIT = 100;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!id) {
      return apiError('Missing user id', 400);
    }

    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
    let limit = parseInt(url.searchParams.get('limit') || '20', 10);
    if (Number.isNaN(limit) || limit <= 0) limit = 20;
    limit = Math.min(limit, MAX_LIMIT);

    // Fetch activity in parallel (select only required fields)
    const [posted, entered, won, liked] = await Promise.all([
      prisma.post.findMany({
        where: { creatorId: id },
        select: {
          id: true,
          title: true,
          slug: true,
          createdAt: true,
        },
      }),
      prisma.entry.findMany({
        where: { userId: id },
        select: {
          id: true,
          createdAt: true,
          postId: true,
          post: {
            select: { id: true, title: true, slug: true },
          },
        },
      }),
      prisma.entry.findMany({
        where: { userId: id, isWinner: true },
        select: {
          id: true,
          createdAt: true,
          postId: true,
          post: {
            select: { id: true, title: true, slug: true },
          },
        },
      }),
      prisma.interaction.findMany({
        where: { userId: id, type: 'like' },
        select: {
          id: true,
          createdAt: true,
          postId: true,
          post: {
            select: { id: true, title: true, slug: true },
          },
        },
      }),
    ]);

    // Combine and normalize
    const activities: ActivityItem[] = [
      ...posted.map((p) => ({
        id: `post-${p.id}`,
        type: 'posted' as const,
        timestamp: p.createdAt.toISOString(),
        subject: {
          id: p.id,
          title: p.title ?? null,
          slug: p.slug ?? null,
        },
        meta: {},
      })),
      ...entered.map((e) => ({
        id: `entry-${e.id}`,
        type: 'entered' as const,
        timestamp: e.createdAt.toISOString(),
        subject: {
          id: e.postId,
          title: e.post?.title ?? null,
          slug: e.post?.slug ?? null,
          entryId: e.id,
        },
        meta: {},
      })),
      ...won.map((e) => ({
        id: `won-${e.id}`,
        type: 'won' as const,
        timestamp: e.createdAt.toISOString(),
        subject: {
          id: e.postId,
          title: e.post?.title ?? null,
          slug: e.post?.slug ?? null,
          entryId: e.id,
        },
        meta: {},
      })),
      ...liked.map((i) => ({
        id: `like-${i.id}`,
        type: 'liked' as const,
        timestamp: i.createdAt.toISOString(),
        subject: {
          id: i.postId,
          title: i.post?.title ?? null,
          slug: i.post?.slug ?? null,
        },
        meta: {},
      })),
    ];

    // Sort newest first
    activities.sort((a, b) => {
      const ta = new Date(a.timestamp).getTime();
      const tb = new Date(b.timestamp).getTime();
      return tb - ta;
    });

    const total = activities.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const start = (page - 1) * limit;
    const paginated = activities.slice(start, start + limit);

    return apiSuccess({
      activity: paginated,
      page,
      limit,
      total,
      totalPages,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('GET /api/users/[id]/activity error', error);
    return apiError('Failed to fetch activity', 500);
  }
}