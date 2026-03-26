import { apiError, apiSuccess } from '@/lib/api-response';
import { awardXp, XP_REWARDS } from '@/lib/xp';

// Prisma import removed for value-level compatibility
import { NextRequest } from 'next/server';
import { randomUUID } from 'crypto';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { readJsonBody } from '@/lib/parse-json-body';
import { POST_SLUG_MAX_LENGTH, sanitizePostSlug } from '@/lib/post-slug';

const SLUG_SUFFIX_LENGTH = 6;

function buildSlugWithSuffix(baseSlug: string, suffix: string) {
  const maxBaseLength = POST_SLUG_MAX_LENGTH - SLUG_SUFFIX_LENGTH - 1;
  const trimmedBase = baseSlug.slice(0, Math.max(1, maxBaseLength));

  return `${trimmedBase}-${suffix}`;
}

async function generateUniquePostSlug(
  postDelegate: Pick<typeof prisma.post, 'findUnique'>,
  title: string,
  requestedSlug?: string,
) {
  const baseSlug = sanitizePostSlug(requestedSlug, title);
  const existingBaseSlug = await postDelegate.findUnique({
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
    const existingCandidate = await postDelegate.findUnique({
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

function isSlugConstraintError(error: unknown) {
  if (!(typeof error === 'object' && error !== null && 'code' in error)) {
    return false;
  }

  const code = (error as { code?: string }).code;
  if (code !== 'P2002') {
    return false;
  }

  const metaTarget = 'meta' in error
    ? (error as { meta?: { target?: string[] | string } }).meta?.target
    : undefined;

  if (!metaTarget) {
    return true;
  }

  if (Array.isArray(metaTarget)) {
    return metaTarget.includes('slug');
  }

  return metaTarget === 'slug';
}

const POST = async (request: NextRequest) => {
  try {
    const user = await getCurrentUser(request);
    if (!user) return apiError('Unauthorized', 401);

    const parsed = await readJsonBody<Record<string, unknown>>(request);
    if (!parsed.ok) return parsed.response;

    const body = (parsed.data as any);
    const { title, description, type, winnerCount, endsAt, proofRequired, media, slug } = body as {
      title?: string;
      description?: string;
      type?: string;
      winnerCount?: unknown;
      endsAt?: string;
      proofRequired?: unknown;
      media?: Array<{ type: 'image' | 'video', url: string, thumbnail?: string }>;
      slug?: string;
    };

    if (!title || title.length < 10 || title.length > 200) {
      return apiError('Title must be 10-200 characters', 400);
    }

    if (!description || description.length < 50) {
      return apiError('Description must be at least 50 characters', 400);
    }

    const post = await prisma.$transaction(async (tx: any) => {
      const uniqueSlug = await generateUniquePostSlug(tx.post, title, slug);

      const requirements = await tx.postRequirements.create({
        data: {
          proofRequired: Boolean(proofRequired),
        },
      });

      const createdPost = await tx.post.create({
        data: {
          userId: user.id,
          type: type as any,
          title,
          slug: uniqueSlug,
          description,
          maxWinners: winnerCount ? Number(winnerCount) : null,
          postRequirementsId: requirements.id,
          endsAt: endsAt ? new Date(endsAt) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 7 days
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

      // Handle media attachments
      if (media && Array.isArray(media) && media.length > 0) {
        await Promise.all(
          media.map((item) =>
            tx.postMedia.create({
              data: {
                postId: createdPost.id,
                type: item.type as 'image' | 'video',
                url: item.url,
                thumbnail: item.thumbnail,
              },
            })
          )
        );
      }

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
  } catch (error: any) {
    if (error?.code === 'P2002' && isSlugConstraintError(error)) {
      return apiError('Slug already in use', 409);
    }
    if (isSlugConstraintError(error)) {
      return apiError('Slug already in use', 409);
    }
    console.error('Post creation error:', error);
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
