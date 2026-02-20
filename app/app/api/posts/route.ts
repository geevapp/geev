import { apiError, apiSuccess } from '@/lib/api-response';

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

    const { title, description, category, type, winnerCount, endsAt } = body;

    if (!title || title.length < 10 || title.length > 200) {
      return apiError('Title must be 10-200 characters', 400);
    }

    if (!description || description.length < 50) {
      return apiError('Description must be at least 50 characters', 400);
    }

    const post = await prisma.post.create({
      data: {
        creatorId: user.id,
        type,
        title,
        slug: body.slug || title.toLowerCase().replace(/\s+/g, '-').slice(0, 50),
        description,
        category,
        winnerCount,
        endsAt: new Date(endsAt),
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
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
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const type = searchParams.get('type');

    const where: any = {};

    if (category) where.category = category;
    if (status) where.status = status;
    if (type) where.type = type;

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          creator: {
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