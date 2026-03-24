import { apiError, apiSuccess } from '@/lib/api-response';
import type { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function buildCommentsTree(comments: any[]) {
  const commentMap: Record<string, any> = {};

  comments.forEach((comment) => {
    comment.replies = [];
    commentMap[comment.id] = comment;
  });

  const roots: any[] = [];

  comments.forEach((comment) => {
    if (comment.parentId) {
      const parent = commentMap[comment.parentId];
      if (parent) {
        parent.replies.push(comment);
      }
    } else {
      roots.push(comment);
    }
  });

  const sortRecursive = (items: any[]) => {
    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    items.forEach((item) => {
      if (item.replies?.length) {
        sortRecursive(item.replies);
      }
    });
  };

  sortRecursive(roots);

  return roots;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: postId } = await params;
    if (!postId) return apiError('Post id is required', 400);

    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) return apiError('Post not found', 404);

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '20', 10));

    const totalRootComments = await prisma.comment.count({
      where: {
        postId,
        parentId: null,
      },
    });

    const rootComments = await prisma.comment.findMany({
      where: {
        postId,
        parentId: null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            xp: true,
            rank: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const replies = await prisma.comment.findMany({
      where: {
        postId,
        parentId: { not: null },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            xp: true,
            rank: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const allComments = [...rootComments, ...replies];
    const tree = await buildCommentsTree(allComments);

    return apiSuccess({ comments: tree, page, limit, total: totalRootComments });
  } catch (error) {
    return apiError('Failed to fetch comments', 500);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return apiError('Unauthorized', 401);

    const { id: postId } = await params;
    if (!postId) return apiError('Post id is required', 400);

    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) return apiError('Post not found', 404);

    let body: any;
    try {
      body = await request.json();
    } catch {
      return apiError('Invalid or missing JSON body', 400);
    }

    const content = String(body.content || '').trim();
    const parentId = body.parentId ? String(body.parentId) : null;
    if (!content || content.length < 1) {
      return apiError('Content is required', 400);
    }

    if (parentId) {
      const parent = await prisma.comment.findUnique({ where: { id: parentId } });
      if (!parent || parent.postId !== postId) {
        return apiError('Invalid parent comment', 400);
      }
    }

    const comment = await prisma.comment.create({
      data: {
        postId,
        userId: user.id,
        content,
        parentId: parentId ?? null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            xp: true,
            rank: true,
          },
        },
      },
    });

    return apiSuccess(comment, 'Comment created successfully', 201);
  } catch (error) {
    return apiError('Failed to create comment', 500);
  }
}
