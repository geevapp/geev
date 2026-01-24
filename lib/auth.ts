import { NextRequest } from 'next/server';
import { getCurrentUser as getMockCurrentUser } from './mock-auth';
import type { User } from './types';

/**
 * Gets the current authenticated user from request cookies/session
 * This is a bridge between the mock auth system and API routes
 * 
 * @param request 
 * @returns 
 */
export async function getCurrentUser(request: NextRequest): Promise<User | null> {

  

  const userId = request.headers.get('x-user-id');
  
  if (userId) {
    const users = [
      {
        id: 'user-1',
        name: 'Alex Chen',
        username: 'alexchen',
        email: 'alex@example.com',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
        bio: 'Crypto enthusiast and community builder. Love helping others succeed! 🚀',
        walletAddress: '0x1234...5678',
        walletBalance: 2500.75,
        followersCount: 1250,
        followingCount: 340,
        postsCount: 45,
        rank: {
          level: 5,
          title: 'Champion',
          color: 'text-purple-500',
          minPoints: 1000
        },
        badges: [],
        joinedAt: new Date('2023-06-15'),
        isVerified: true,
      },
      {
        id: 'user-2',
        name: 'Sarah Johnson',
        username: 'sarahj',
        email: 'sarah@example.com',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
        bio: 'Artist and designer. Creating beautiful things and spreading positivity ✨',
        walletAddress: '0x2345...6789',
        walletBalance: 890.25,
        followersCount: 850,
        followingCount: 200,
        postsCount: 32,
        rank: {
          level: 3,
          title: 'Contributor',
          color: 'text-blue-500',
          minPoints: 500
        },
        badges: [],
        joinedAt: new Date('2023-09-20'),
        isVerified: true,
      }
    ];
    
    const user = users.find(u => u.id === userId);
    return user || null;
  }
  
  return null;
}

/**
 * Middleware to require authentication
 * 
 * @param handler - The route handler function
 * @returns Wrapped handler that checks authentication
 */
export function withAuth<T extends any[]>(handler: (request: NextRequest, ...args: T) => Promise<Response>) {
  return async (request: NextRequest, ...args: T): Promise<Response> => {
    const user = await getCurrentUser(request);
    
    if (!user) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Unauthorized',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    // Add user to request context (if needed)
    (request as any).user = user;
    
    return handler(request, ...args);
  };
}
