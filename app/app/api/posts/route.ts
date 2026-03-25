import { apiError, apiSuccess } from '@/lib/api-response';
import { awardXp, XP_REWARDS } from '@/lib/xp';

import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const POST = async (request: NextRequest) => {
  try {
    const user = await getCurrentUser(request);
    if (!user) return apiError('Unauthorized', 401);

    let body;
    try {
      body = await request.json();
    } catch {
      return apiError('Invalid or missing JSON body', 400);
    }

    const { title, description, type, winnerCount, endsAt, proofRequired } = body;

    if (!title || title.length < 10 || title.length > 200) {
      return apiError('Title must be 10-200 characters', 400);
    }

    if (!description || description.length < 50) {
      return apiError('Description must be at least 50 characters', 400);
    }

    const post = await prisma.$transaction(async (tx) => {
      const requirements = await tx.postRequirements.create({
        data: {
          proofRequired: Boolean(proofRequired),
        },
      });

      const createdPost = await tx.post.create({
        data: {
          userId: user.id,
          type,
          title,
          slug: body.slug || title.toLowerCase().replace(/\s+/g, '-').slice(0, 50),
          description,
          maxWinners: winnerCount ? Number(winnerCount) : null,
          postRequirementsId: requirements.id,
          endsAt: new Date(endsAt),
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

      if (type === 'giveaway') {
        await awardXp(
          user.id,
          XP_REWARDS.createGiveawayPost,
          'giveaway_post_created',
          {
            metadata: {
              postId: createdPost.id,
              postType: type,
            },
          },
          tx,
        );
      } else if (type === 'request') {
        await awardXp(
          user.id,
          XP_REWARDS.createHelpRequest,
          'help_request_created',
          {
            metadata: {
              postId: createdPost.id,
              postType: type,
            },
          },
          tx,
        );
      }

      return createdPost;
    });

    return apiSuccess(post, "Post created successfully", 201);
  } catch (error) {
    return apiError('Failed to create post', 500);
  }
}

const GET = async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const type = searchParams.get('type');

    const where: any = {};

    if (status) where.status = status;
    if (type) where.type = type;

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
      }),
      prisma.post.count({ where }),
    ]);

    return apiSuccess({
      posts,
      page,
      limit,
      total,
    });
  } catch (error) {
    return apiError('Failed to fetch posts', 500);
  }
}

export {
  POST,
  GET
}
