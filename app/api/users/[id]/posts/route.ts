import { NextRequest } from 'next/server';
import { mockPosts } from '@/lib/mock-data';
import { apiSuccess, apiError } from '@/lib/api-response';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Filter posts by author ID
    const userPosts = mockPosts.filter((post: any) => post.authorId === id);

    return apiSuccess(userPosts);

  } catch (error) {
    return apiError('Failed to fetch user posts', 500);
  }
}