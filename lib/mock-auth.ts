/**
 * Mock Authentication System for Geev App
 *
 * This module provides mock authentication utilities for UI development and testing.
 * It simulates login/logout functionality without actual blockchain/backend integration.
 *
 * Storage Key: 'geev_auth' in localStorage
 * Format: { userId: string, username: string, loginTime: number }
 *
 * @note This is a temporary system for development purposes.
 * Will be replaced with actual wallet authentication in production.
 */

import type { User, UserRank, Badge } from './types'

// User ranks for varied user profiles
const userRanks: UserRank[] = [
  { level: 1, title: 'Newcomer', color: 'text-gray-500', minPoints: 0 },
  { level: 2, title: 'Helper', color: 'text-green-500', minPoints: 100 },
  { level: 3, title: 'Contributor', color: 'text-blue-500', minPoints: 500 },
  { level: 4, title: 'Champion', color: 'text-orange-500', minPoints: 1000 },
  { level: 5, title: 'Legend', color: 'text-purple-500', minPoints: 2500 },
]

// Badge definitions for mock users
const mockBadges: Badge[] = [
  {
    id: 'badge-1',
    name: 'First Giveaway',
    description: 'Created your first giveaway',
    icon: '🎁',
    color: 'bg-blue-100 text-blue-800',
    earnedAt: new Date('2024-01-15'),
  },
  {
    id: 'badge-2',
    name: 'Generous Heart',
    description: 'Helped 10 people with their requests',
    icon: '❤️',
    color: 'bg-red-100 text-red-800',
    earnedAt: new Date('2024-02-01'),
  },
  {
    id: 'badge-3',
    name: 'Community Builder',
    description: 'Gained 100 followers',
    icon: '🏗️',
    color: 'bg-green-100 text-green-800',
    earnedAt: new Date('2024-02-15'),
  },
  {
    id: 'badge-4',
    name: 'Verified Giver',
    description: 'Completed 5 verified giveaways',
    icon: '✅',
    color: 'bg-emerald-100 text-emerald-800',
    earnedAt: new Date('2024-03-01'),
  },
  {
    id: 'badge-5',
    name: 'Top Contributor',
    description: 'Among top 10% of contributors',
    icon: '🏆',
    color: 'bg-yellow-100 text-yellow-800',
    earnedAt: new Date('2024-03-10'),
  },
]

/**
 * Mock Users for Testing
 *
 * Includes varied user profiles for comprehensive UI testing:
 * - New users (minimal activity)
 * - Active givers (high giveaway activity)
 * - Active receivers (help request participants)
 * - Verified users (with verification badge)
 * - Users with various badge/follower/stat combinations
 */
export const mockAuthUsers: User[] = [
  // User 1: Verified Legend - Active Giver with high stats
  {
    id: 'user-1',
    name: 'Alex Chen',
    username: 'alexchen',
    email: 'alex@example.com',
    avatar: '/avatars/alex.png',
    bio: 'Crypto enthusiast and community builder. Love helping others succeed! 🚀',
    walletAddress: '0x1234...5678',
    walletBalance: 2500.75,
    followersCount: 1250,
    followingCount: 340,
    postsCount: 45,
    rank: userRanks[4], // Legend
    badges: [mockBadges[0], mockBadges[1], mockBadges[2], mockBadges[3], mockBadges[4]],
    joinedAt: new Date('2023-06-15'),
    isVerified: true,
  },
  // User 2: Verified Champion - Active Giver
  {
    id: 'user-2',
    name: 'Sarah Johnson',
    username: 'sarahj',
    email: 'sarah@example.com',
    avatar: '/avatars/sarah.png',
    bio: 'Artist and designer. Creating beautiful things and spreading positivity ✨',
    walletAddress: '0x2345...6789',
    walletBalance: 890.25,
    followersCount: 850,
    followingCount: 200,
    postsCount: 32,
    rank: userRanks[3], // Champion
    badges: [mockBadges[0], mockBadges[2], mockBadges[3]],
    joinedAt: new Date('2023-09-20'),
    isVerified: true,
  },
  // User 3: Legend - Tech Entrepreneur
  {
    id: 'user-3',
    name: 'Marcus Williams',
    username: 'marcusw',
    email: 'marcus@example.com',
    avatar: '/avatars/marcus.png',
    bio: 'Tech entrepreneur. Building the future one project at a time 💻',
    walletAddress: '0x3456...7890',
    walletBalance: 5200.0,
    followersCount: 2100,
    followingCount: 150,
    postsCount: 67,
    rank: userRanks[4], // Legend
    badges: mockBadges,
    joinedAt: new Date('2023-06-10'),
    isVerified: true,
  },
  // User 4: Helper - Student/Receiver with moderate activity
  {
    id: 'user-4',
    name: 'Emma Rodriguez',
    username: 'emmar',
    email: 'emma@example.com',
    avatar: '/avatars/emma.png',
    bio: 'Student and aspiring developer. Always learning something new! 📚',
    walletBalance: 125.5,
    followersCount: 320,
    followingCount: 450,
    postsCount: 18,
    rank: userRanks[1], // Helper
    badges: [mockBadges[0]],
    joinedAt: new Date('2024-01-05'),
    isVerified: false,
  },
  // User 5: Contributor - Content Creator
  {
    id: 'user-5',
    name: 'David Kim',
    username: 'davidk',
    email: 'david@example.com',
    avatar: '/avatars/david.png',
    bio: 'Gaming content creator and streamer. Let\'s play together! 🎮',
    walletAddress: '0x5678...9012',
    walletBalance: 1750.8,
    followersCount: 980,
    followingCount: 280,
    postsCount: 41,
    rank: userRanks[2], // Contributor
    badges: [mockBadges[0], mockBadges[1]],
    joinedAt: new Date('2023-11-12'),
    isVerified: true,
  },
  // User 6: Newcomer - Brand New User
  {
    id: 'user-6',
    name: 'Olivia Martinez',
    username: 'oliviam',
    email: 'olivia@example.com',
    avatar: '/avatars/olivia.png',
    bio: 'Just joined! Excited to be part of this community 🌟',
    walletBalance: 50.0,
    followersCount: 12,
    followingCount: 45,
    postsCount: 2,
    rank: userRanks[0], // Newcomer
    badges: [],
    joinedAt: new Date('2024-03-01'),
    isVerified: false,
  },
  // User 7: Helper - Active Receiver
  {
    id: 'user-7',
    name: 'James Thompson',
    username: 'jamest',
    email: 'james@example.com',
    avatar: '/avatars/james.png',
    bio: 'Musician and freelance artist. Creating magic through sound 🎵',
    walletAddress: '0x6789...0123',
    walletBalance: 275.3,
    followersCount: 156,
    followingCount: 312,
    postsCount: 8,
    rank: userRanks[1], // Helper
    badges: [mockBadges[1]],
    joinedAt: new Date('2024-02-10'),
    isVerified: false,
  },
  // User 8: Contributor - Verified Designer
  {
    id: 'user-8',
    name: 'Nina Patel',
    username: 'ninap',
    email: 'nina@example.com',
    avatar: '/avatars/nina.png',
    bio: 'UI/UX Designer at heart. Making the web beautiful one pixel at a time 🎨',
    walletAddress: '0x7890...1234',
    walletBalance: 620.0,
    followersCount: 540,
    followingCount: 180,
    postsCount: 24,
    rank: userRanks[2], // Contributor
    badges: [mockBadges[0], mockBadges[2], mockBadges[3]],
    joinedAt: new Date('2023-12-05'),
    isVerified: true,
  },
  // User 9: Newcomer - Fresh join, no wallet
  {
    id: 'user-9',
    name: 'Tyler Brooks',
    username: 'tylerb',
    email: 'tyler@example.com',
    avatar: '/avatars/tyler.png',
    bio: 'New to crypto, here to learn and grow with the community 📈',
    walletBalance: 0,
    followersCount: 5,
    followingCount: 28,
    postsCount: 0,
    rank: userRanks[0], // Newcomer
    badges: [],
    joinedAt: new Date('2024-03-15'),
    isVerified: false,
  },
  // User 10: Champion - Anonymous Philanthropist
  {
    id: 'user-10',
    name: 'Anonymous Giver',
    username: 'anongiver',
    email: 'anon@example.com',
    avatar: '/avatars/anon.png',
    bio: 'Prefer to give quietly. Actions speak louder than words 🤫',
    walletAddress: '0x8901...2345',
    walletBalance: 3500.0,
    followersCount: 420,
    followingCount: 10,
    postsCount: 35,
    rank: userRanks[3], // Champion
    badges: [mockBadges[1], mockBadges[4]],
    joinedAt: new Date('2023-08-20'),
    isVerified: false,
  },
]

// localStorage key for auth data
export const AUTH_STORAGE_KEY = 'geev_auth'

/**
 * Auth data structure stored in localStorage
 */
export interface AuthData {
  userId: string
  username: string
  loginTime: number
}

/**
 * Authenticates a user by their ID
 *
 * @param userId - The ID of the user to log in
 * @returns The authenticated User object, or null if not found
 */
export function login(userId: string): User | null {
  const user = mockAuthUsers.find((u) => u.id === userId)

  if (!user) {
    console.warn(`[Mock Auth] User with ID "${userId}" not found`)
    return null
  }

  const authData: AuthData = {
    userId: user.id,
    username: user.username,
    loginTime: Date.now(),
  }

  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData))
  } catch (error) {
    console.error('[Mock Auth] Failed to save auth data to localStorage:', error)
  }

  return user
}

/**
 * Authenticates a user by their username
 *
 * @param username - The username to log in with
 * @returns The authenticated User object, or null if not found
 */
export function loginByUsername(username: string): User | null {
  const user = mockAuthUsers.find(
    (u) => u.username.toLowerCase() === username.toLowerCase()
  )

  if (!user) {
    console.warn(`[Mock Auth] User with username "${username}" not found`)
    return null
  }

  return login(user.id)
}

/**
 * Logs out the current user
 *
 * Clears auth data from localStorage
 */
export function logout(): void {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY)
  } catch (error) {
    console.error('[Mock Auth] Failed to remove auth data from localStorage:', error)
  }
}

/**
 * Gets the currently authenticated user
 *
 * Reads from localStorage and returns the corresponding User object
 *
 * @returns The current User object, or null if not authenticated
 */
export function getCurrentUser(): User | null {
  try {
    const authDataStr = localStorage.getItem(AUTH_STORAGE_KEY)

    if (!authDataStr) {
      return null
    }

    const authData: AuthData = JSON.parse(authDataStr)
    const user = mockAuthUsers.find((u) => u.id === authData.userId)

    if (!user) {
      // User ID in storage doesn't match any mock user
      // This might happen if mock data changed
      console.warn('[Mock Auth] Stored user ID not found in mock users, clearing auth')
      logout()
      return null
    }

    return user
  } catch (error) {
    console.error('[Mock Auth] Failed to get current user:', error)
    return null
  }
}

/**
 * Checks if a user is currently authenticated
 *
 * @returns true if authenticated, false otherwise
 */
export function isAuthenticated(): boolean {
  return getCurrentUser() !== null
}

/**
 * Gets the auth data from localStorage
 *
 * @returns The AuthData object or null if not authenticated
 */
export function getAuthData(): AuthData | null {
  try {
    const authDataStr = localStorage.getItem(AUTH_STORAGE_KEY)

    if (!authDataStr) {
      return null
    }

    return JSON.parse(authDataStr)
  } catch (error) {
    console.error('[Mock Auth] Failed to get auth data:', error)
    return null
  }
}

/**
 * Gets a user by their ID
 *
 * @param userId - The ID of the user to find
 * @returns The User object or null if not found
 */
export function getUserById(userId: string): User | null {
  return mockAuthUsers.find((u) => u.id === userId) || null
}

/**
 * Gets all available mock users
 *
 * @returns Array of all mock User objects
 */
export function getAllUsers(): User[] {
  return [...mockAuthUsers]
}
