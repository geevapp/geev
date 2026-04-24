import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';
import { getCurrentUser } from '@/lib/auth';
import { readJsonBody } from '@/lib/parse-json-body';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where: { postId: id, parentId: null },
        include: {
          user: {
            select: { id: true, name: true, avatarUrl: true, rank: true }
          },
          replies: {
            include: {
              user: {
                select: { id: true, name: true, avatarUrl: true, rank: true }
              }
            },
            orderBy: { createdAt: 'asc' }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.comment.count({
        where: { postId: id, parentId: null }
      })
    ]);

    return apiSuccess({
      comments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    return apiError('Failed to fetch comments', 500);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) return apiError('Unauthorized', 401);

    const { id } = await params;
    const body = await readJsonBody(request);
    if (!body.ok) return body.response;

    const { content, parentId, entryId } = body.data as any;

    if (!content || typeof content !== 'string') {
      return apiError('Content is required', 400);
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        postId: id,
        userId: currentUser.id,
        parentId: parentId || null,
        entryId: entryId || null,
      },
      include: {
        user: {
          select: { id: true, name: true, avatarUrl: true, rank: true }
        },
        replies: {
          include: {
            user: true
          }
        }
      }
    });

    return apiSuccess(comment);
  } catch (error) {
    return apiError('Failed to create comment', 500);
  }
}
