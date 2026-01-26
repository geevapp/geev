/**
 * Prisma client setup for database operations
 * Note: This is a placeholder implementation. In a real app, you would:
 * 1. Install @prisma/client and prisma
 * 2. Set up your database schema
 * 3. Configure your database connection
 */

const now = new Date();

// In-memory analytics events store for development analytics
interface AnalyticsEventRecord {
  id: string;
  userId: string | null;
  eventType: string;
  eventData: any | null;
  pageUrl: string | null;
  userAgent: string | null;
  createdAt: Date;
}

const analyticsEvents: AnalyticsEventRecord[] = [];

const mockPosts = [
  {
    id: 'post_a1',
    creatorId: 'usr_1',
    type: 'giveaway',
    title: 'Win 0.5 SOL – Retweet & Tag 3 Friends',
    description: 'Simple engagement giveaway. Ends soon!',
    category: 'crypto',
    status: 'open',
    selectionMethod: 'random',
    winnerCount: 3,
    media: { images: ['https://example.com/sol-giveaway.jpg'] },
    endsAt: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
    createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'post_b2',
    creatorId: 'usr_2',
    type: 'request',
    title: 'Looking for Solidity dev – 3 SOL budget',
    description: 'Need help auditing my contract...',
    category: 'development',
    status: 'open',
    selectionMethod: 'manual',
    winnerCount: 1,
    media: null,
    endsAt: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
    createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'post_c3',
    creatorId: 'usr_1',
    type: 'giveaway',
    title: 'NFT Mint Giveaway – 5 winners',
    description: 'Free mint for active community members',
    category: 'nft',
    status: 'open',
    selectionMethod: 'random',
    winnerCount: 5,
    media: null,
    endsAt: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
    createdAt: new Date(now.getTime() - 12 * 60 * 60 * 1000),
    updatedAt: new Date(now.getTime() - 12 * 60 * 60 * 1000),
  },
];

// Mock Prisma client for development
// Replace this with actual Prisma client when database is set up
export const prisma = {
  user: {
    findMany: async (options: any) => {
      // Mock implementation - replace with actual Prisma queries
      const mockUsers = [
        {
          id: '1',
          name: 'Alex Chen',
          avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
          xp: 2500,
          _count: {
            posts: 15,
            entries: 32,
          },
        },
        {
          id: '2',
          name: 'Sarah Johnson',
          avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
          xp: 1800,
          _count: {
            posts: 8,
            entries: 28,
          },
        },
        {
          id: '3',
          name: 'Marcus Williams',
          avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus',
          xp: 3200,
          _count: {
            posts: 22,
            entries: 45,
          },
        },
        {
          id: '4',
          name: 'Emma Rodriguez',
          avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma',
          xp: 1950,
          _count: {
            posts: 12,
            entries: 25,
          },
        },
        {
          id: '5',
          name: 'David Kim',
          avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David',
          xp: 1650,
          _count: {
            posts: 9,
            entries: 18,
          },
        },
      ];

      return mockUsers.slice(0, options.take || 50);
    },
  },
  badge: {
    findMany: async (options: any) => {
      // Mock badges
      const mockBadges = [
        {
          id: '1',
          name: 'Top Contributor',
          description: 'Made 50+ contributions',
          tier: 3,
          icon: '🏆',
          color: 'gold',
        },
        {
          id: '2',
          name: 'Community Helper',
          description: 'Helped 25+ people',
          tier: 2,
          icon: '🤝',
          color: 'silver',
        },
        {
          id: '3',
          name: 'Generous Giver',
          description: 'Created 10+ giveaways',
          tier: 2,
          icon: '🎁',
          color: 'blue',
        },
      ];

      return mockBadges;
    },
  },
  analyticsEvent: {
    create: async ({ data }: { data: Partial<AnalyticsEventRecord> }) => {
      const record: AnalyticsEventRecord = {
        id: `ae_${Math.random().toString(36).substr(2, 9)}`,
        userId: (data.userId as string | null) ?? null,
        eventType: String(data.eventType ?? "unknown"),
        eventData: data.eventData ?? null,
        pageUrl: (data.pageUrl as string | null) ?? null,
        userAgent: (data.userAgent as string | null) ?? null,
        createdAt: data.createdAt instanceof Date ? data.createdAt : new Date(),
      };
      analyticsEvents.push(record);
      return record;
    },
    findMany: async (options: any = {}) => {
      const { where, select, distinct } = options;
      let results = [...analyticsEvents];

      if (where) {
        if (where.createdAt?.gte instanceof Date) {
          const from = where.createdAt.gte as Date;
          results = results.filter((e) => e.createdAt >= from);
        }
        if (where.userId) {
          if (where.userId.not === null) {
            results = results.filter((e) => e.userId !== null);
          } else if (typeof where.userId === "string") {
            results = results.filter((e) => e.userId === where.userId);
          }
        }
        if (where.eventType) {
          if (typeof where.eventType === "string") {
            results = results.filter((e) => e.eventType === where.eventType);
          } else if (where.eventType.in) {
            const allowed: string[] = where.eventType.in;
            results = results.filter((e) => allowed.includes(e.eventType));
          }
        }
      }

      if (distinct && Array.isArray(distinct) && distinct.includes("userId")) {
        const seen = new Set<string>();
        results = results.filter((e) => {
          if (!e.userId) return false;
          if (seen.has(e.userId)) return false;
          seen.add(e.userId);
          return true;
        });
      }

      if (select && select.userId) {
        return results.map((e) => ({ userId: e.userId }));
      }

      return results;
    },
    count: async (options: any = {}) => {
      const { where } = options;
      const list = await (prisma as any).analyticsEvent.findMany({ where });
      return list.length;
    },
  },
  post: {
    create: async ({ data, include }: { data: any; include?: any }) => {
      const now = new Date();
      const mockPost = {
        id: `post_${Math.random().toString(36).substr(2, 9)}`,
        creatorId: data.creatorId || 'usr_1',
        type: data.type || 'giveaway',
        title: data.title || 'Untitled Giveaway',
        description: data.description || 'No description provided.',
        category: data.category || 'general',
        status: 'open' as const,
        selectionMethod: data.selectionMethod || 'random',
        winnerCount: Number(data.winnerCount) || 1,
        media: data.media || null,
        endsAt: data.endsAt ? new Date(data.endsAt) : new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        createdAt: now,
        updatedAt: now,
      };
      if (include?.creator) {
        const users = await prisma.user.findMany({ take: 5 });
        const creator = users.find(u => u.id === mockPost.creatorId) || {
          id: mockPost.creatorId,
          name: 'Unknown User',
          avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=unknown',
        };
        return { ...mockPost, creator };
      }
      return mockPost;
    },
    findMany: async ({ where, orderBy, skip = 0, take = 20, include }: any = {}) => {
      let filtered = [...mockPosts];
      if (where?.type) filtered = filtered.filter(p => p.type === where.type);
      if (where?.status) filtered = filtered.filter(p => p.status === where.status);
      if (where?.category) filtered = filtered.filter(p => p.category === where.category);

      if (orderBy?.createdAt === 'desc') {
        filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      }
      const paginated = filtered.slice(skip, skip + take);
      if (include?.creator) {
        const creatorMap: Record<string, { id: string; name: string; avatarUrl: string | null }> = {
          usr_1: { id: 'usr_1', name: 'Alex Chen', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex' },
          usr_2: { id: 'usr_2', name: 'Sarah Johnson', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah' },
        };
        return paginated.map(post => ({
          ...post,
          creator: creatorMap[post.creatorId] ?? { id: post.creatorId, name: 'Unknown', avatarUrl: null },
        }));
      }
      return paginated;
    },
    count: async ({ where }: any = {}) => {
      const allPosts = await prisma.post.findMany();
      let count = allPosts.length;
      if (where?.type) count = allPosts.filter(p => p.type === where.type).length;
      if (where?.status) count = allPosts.filter(p => p.status === where.status).length;
      return count;
    },
    findUnique: async ({ where, include }: { where: { id: string }; include?: any }) => {
      const post = mockPosts.find(p => p.id === where.id);
      if (!post) return null;

      const result: any = { ...post };

      if (include?.creator) {
        const creatorMap: Record<string, any> = {
          usr_1: { id: 'usr_1', name: 'Alex Chen', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex' },
          usr_2: { id: 'usr_2', name: 'Sarah Johnson', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah' },
        };
        result.creatorId = creatorMap[post.creatorId] ?? {
          id: post.creatorId,
          name: 'Unknown',
          avatarUrl: null,
        };
      }

      if (include?._count?.select) {
        result._count = {
          entries: include._count.select.entries
            ? (post.id === 'post_a1' ? 8 : post.id === 'post_b2' ? 0 : 3)
            : undefined,
          interactions: include._count.select.interactions
            ? Math.floor(Math.random() * 50) + 10
            : undefined,
        };
      }

      return result;
    },
    update: async ({ where, data }: { where: { id: string }; data: any }) => {
      const index = mockPosts.findIndex(p => p.id === where.id);
      if (index === -1) throw new Error('Post not found');
      mockPosts[index] = {
        ...mockPosts[index],
        ...data,
        updatedAt: new Date(),
      };
      return mockPosts[index];
    },
    delete: async ({ where }: { where: { id: string } }) => {
      const index = mockPosts.findIndex(p => p.id === where.id);
      if (index === -1) throw new Error('Post not found');
      const deleted = mockPosts.splice(index, 1)[0];
      return deleted;
    },
  },
};