import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';
import { getCurrentUser } from '@/lib/auth';

/**
 * POST /api/posts/[id]/entries
 * Submit an entry to a giveaway or request
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return apiError('Unauthorized', 401);

    const { id: postId } = await params;

    let body;
    try {
      body = await request.json();
    } catch {
      return apiError('Invalid or missing JSON body', 400);
    }

    const { content, proofUrl } = body;

    // Validate content
    if (!content || typeof content !== 'string') {
      return apiError('Entry content is required', 400);
    }

    if (content.length < 10) {
      return apiError('Entry must be at least 10 characters', 400);
    }

    if (content.length > 5000) {
      return apiError('Entry must not exceed 5000 characters', 400);
    }

    // Check post exists and is open
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        status: true,
        endsAt: true,
        creatorId: true,
      },
    });

    if (!post) {
      return apiError('Post not found', 404);
    }

    // Check if post creator is trying to enter their own post
    if (post.creatorId === user.id) {
      return apiError('You cannot enter your own post', 400);
    }

    if (post.status !== 'open') {
      return apiError('Post is closed', 400);
    }

    if (new Date(post.endsAt) < new Date()) {
      return apiError('Post has ended', 400);
    }

    // Check for duplicate entry
    const existingEntry = await prisma.entry.findFirst({
      where: {
        postId,
        userId: user.id,
      },
    });

    if (existingEntry) {
      return apiError('You have already entered this post', 400);
    }

    // Create entry
    const entry = await prisma.entry.create({
      data: {
        postId,
        userId: user.id,
        content,
        proofUrl: proofUrl || null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    return apiSuccess(entry, 'Entry created successfully', 201);
  } catch (error) {
    console.error('Failed to create entry:', error);
    return apiError('Failed to create entry', 500);
  }
}

/**
 * GET /api/posts/[id]/entries
 * Retrieve all entries for a post
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: postId } = await params;

    // Verify post exists
    const postExists = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true },
    });

    if (!postExists) {
      return apiError('Post not found', 404);
    }

    // Get query parameters for pagination
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Fetch entries with pagination
    const [entries, total] = await Promise.all([
      prisma.entry.findMany({
        where: { postId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
              xp: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.entry.count({ where: { postId } }),
    ]);

    return apiSuccess({
      entries,
      page,
      limit,
      total,
    });
  } catch (error) {
    console.error('Failed to fetch entries:', error);
    return apiError('Failed to fetch entries', 500);
  }
}
