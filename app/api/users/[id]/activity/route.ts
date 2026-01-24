import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Response helper functions
function apiSuccess(data: any) {
  return NextResponse.json({
    success: true,
    data,
  });
}

function apiError(message: string, status: number) {
  return NextResponse.json(
    {
      success: false,
      error: message,
    },
    { status }
  );
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return apiError('Invalid pagination parameters', 400);
    }

    // Fetch all activity types in parallel
    const [posted, entered, won, liked] = await Promise.all([
      // 1. Posted activities - posts created by user
      prisma.post.findMany({
        where: { creatorId: id },
        select: {
          id: true,
          title: true,
          createdAt: true,
        },
      }),
      
      // 2. Entered activities - giveaways entered by user
      prisma.entry.findMany({
        where: { 
          userId: id,
          isWinner: { not: true }, // Exclude winners (they're in 'won')
        },
        include: {
          post: {
            select: { title: true },
          },
        },
      }),
      
      // 3. Won activities - giveaways won by user
      prisma.entry.findMany({
        where: { 
          userId: id, 
          isWinner: true,
        },
        include: {
          post: {
            select: { title: true },
          },
        },
      }),
      
      // 4. Liked activities - posts liked by user
      prisma.interaction.findMany({
        where: { 
          userId: id, 
          type: 'like',
        },
        include: {
          post: {
            select: { title: true },
          },
        },
      }),
    ]);

    // Combine and format all activities
    const activities = [
      ...posted.map((p) => ({
        type: 'posted' as const,
        item_id: p.id,
        item_title: p.title,
        timestamp: p.createdAt,
      })),
      ...entered.map((e) => ({
        type: 'entered' as const,
        item_id: e.id,
        item_title: e.post.title,
        timestamp: e.createdAt,
      })),
      ...won.map((e) => ({
        type: 'won' as const,
        item_id: e.id,
        item_title: e.post.title,
        timestamp: e.createdAt,
      })),
      ...liked.map((i) => ({
        type: 'liked' as const,
        item_id: i.postId,
        item_title: i.post.title,
        timestamp: i.createdAt,
      })),
    ];

    // Sort by timestamp (newest first)
    activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    // Paginate
    const paginatedActivities = activities.slice(
      (page - 1) * limit,
      page * limit
    );

    return apiSuccess({
      activity: paginatedActivities,
      page,
      limit,
      total: activities.length,
      totalPages: Math.ceil(activities.length / limit),
    });
    
  } catch (error) {
    console.error('Error fetching user activity:', error);
    return apiError('Failed to fetch activity', 500);
  }
}
