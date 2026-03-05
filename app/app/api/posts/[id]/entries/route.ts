import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';
import { getCurrentUser } from '@/lib/auth';

/**
 * POST /api/posts/[id]/entries
 * Submit an entry to a giveaway post
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return apiError('Unauthorized', 401);

    const { id: postId } = await params;
    const body = await request.json();
    const { content, proofUrl } = body;

    // Validate content
    if (!content || typeof content !== 'string') {
      return apiError('Content is required', 400);
    }

    if (content.length < 10 || content.length > 5000) {
      return apiError('Content must be between 10 and 5000 characters', 400);
    }

    // Check if post exists and is open
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, status: true, creatorId: true, type: true },
    });

    if (!post) {
      return apiError('Post not found', 404);
    }

    if (post.type !== 'giveaway') {
      return apiError('Entries can only be submitted to giveaway posts', 400);
    }

    if (post.status !== 'open') {
      return apiError('Post is not accepting entries', 400);
    }

    // Prevent creators from entering their own posts
    if (post.creatorId === user.id) {
      return apiError('You cannot enter your own giveaway', 403);
    }

    // Check for existing entry (unique constraint will catch this too, but we provide better error message)
    const existingEntry = await prisma.entry.findUnique({
      where: {
        postId_userId: {
          postId,
          userId: user.id,
        },
      },
    });

    if (existingEntry) {
      return apiError('You have already entered this giveaway', 400);
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
            walletAddress: true,
            avatarUrl: true,
          },
        },
      },
    });

    return apiSuccess(entry, 'Entry created successfully', 201);
  } catch (error) {
    console.error('Error creating entry:', error);
    return apiError('Failed to create entry', 500);
  }
}

/**
 * GET /api/posts/[id]/entries
 * Get all entries for a post with pagination
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: postId } = await params;
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Validate pagination params
    if (page < 1 || limit < 1 || limit > 100) {
      return apiError('Invalid pagination parameters', 400);
    }

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true },
    });

    if (!post) {
      return apiError('Post not found', 404);
    }

    // Get entries with pagination
    const [entries, total] = await Promise.all([
      prisma.entry.findMany({
        where: { postId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              walletAddress: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.entry.count({ where: { postId } }),
    ]);

    return apiSuccess(
      {
        entries,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      undefined,
      200,
    );
  } catch (error) {
    console.error('Error fetching entries:', error);
    return apiError('Failed to fetch entries', 500);
  }
}
