import { apiError, apiSuccess } from '@/lib/api-response';
import { awardXp, XP_REWARDS } from '@/lib/xp';

import { NextRequest } from 'next/server';
import { randomUUID } from 'crypto';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const SLUG_MAX_LENGTH = 50;
const SLUG_SUFFIX_LENGTH = 6;

function slugify(value: string) {
  const normalized = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-')
    .slice(0, SLUG_MAX_LENGTH);

  return normalized || 'post';
}

function buildSlugWithSuffix(baseSlug: string, suffix: string) {
  const maxBaseLength = SLUG_MAX_LENGTH - SLUG_SUFFIX_LENGTH - 1;
  const trimmedBase = baseSlug.slice(0, Math.max(1, maxBaseLength));

  return `${trimmedBase}-${suffix}`;
}

async function generateUniquePostSlug(
  postDelegate: Pick<typeof prisma.post, 'findFirst'>,
  title: string,
  requestedSlug?: string,
) {
  const normalizedRequestedSlug = typeof requestedSlug === 'string' ? requestedSlug.trim() : '';
  const baseSlug = slugify(normalizedRequestedSlug || title);
  const existingBaseSlug = await postDelegate.findFirst({
    where: { slug: baseSlug },
    select: { id: true },
  });

  if (!existingBaseSlug) {
    return baseSlug;
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = buildSlugWithSuffix(
      baseSlug,
      randomUUID().replace(/-/g, '').slice(0, SLUG_SUFFIX_LENGTH),
    );
    const existingCandidate = await postDelegate.findFirst({
      where: { slug: candidate },
      select: { id: true },
    });

    if (!existingCandidate) {
      return candidate;
    }
  }

  return buildSlugWithSuffix(
    baseSlug,
    Date.now().toString(36).slice(-SLUG_SUFFIX_LENGTH).padStart(SLUG_SUFFIX_LENGTH, '0'),
  );
}

function isUniqueConstraintError(error: unknown) {
  return (
    typeof error === 'object'
    && error !== null
    && 'code' in error
    && (error as { code?: string }).code === 'P2002'
  );
}

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
      const uniqueSlug = await generateUniquePostSlug(tx.post, title, body.slug);

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
          slug: uniqueSlug,
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
    if (isUniqueConstraintError(error)) {
      return apiError(
        'A post with a conflicting slug already exists. Please retry your request.',
        409,
      );
    }

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
