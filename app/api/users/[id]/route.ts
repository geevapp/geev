import { NextRequest } from 'next/server';
import { mockUsers, mockPosts, mockEntries } from '@/lib/mock-data';
import { User } from '@/lib/types';
import { apiSuccess, apiError } from '@/lib/api-response';
import { getCurrentUser } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Find user in mock data
    const user = mockUsers.find((u: User) => u.id === id);
    
    if (!user) {
      return apiError('User not found', 404);
    }

    // Return user profile data
    return apiSuccess({
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio,
      walletAddress: user.walletAddress,
      walletBalance: user.walletBalance,
      followersCount: user.followersCount,
      followingCount: user.followingCount,
      postsCount: user.postsCount,
      rank: user.rank,
      badges: user.badges,
      joinedAt: user.joinedAt,
      isVerified: user.isVerified,
    });

  } catch (error) {
    return apiError('Failed to fetch user', 500);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) return apiError('Unauthorized', 401);

    const { id } = await params;

    // Check if user is updating their own profile
    if (currentUser.id !== id) {
      return apiError('Can only update own profile', 403);
    }

    const { name, bio } = await request.json();

    // Find user in mock data
    const userIndex = mockUsers.findIndex((u: User) => u.id === id);
    if (userIndex === -1) {
      return apiError('User not found', 404);
    }

    // Update user data
    const updatedUser = {
      ...mockUsers[userIndex],
      ...(name !== undefined && { name }),
      ...(bio !== undefined && { bio }),
      updatedAt: new Date(),
    };

    // Update in mock data array
    mockUsers[userIndex] = updatedUser;

    return apiSuccess({
      id: updatedUser.id,
      name: updatedUser.name,
      username: updatedUser.username,
      bio: updatedUser.bio,
      avatar: updatedUser.avatar,
      walletBalance: updatedUser.walletBalance,
      badges: updatedUser.badges,
    });

  } catch (error) {
    return apiError('Failed to update profile', 500);
  }
}