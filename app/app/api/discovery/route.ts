import { apiError, apiSuccess } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";

type DiscoveryResultType = "post" | "user" | "topic";
type DiscoveryRankBy = "relevance" | "recent" | "popular";

type DiscoveryResult = {
  id: string;
  type: DiscoveryResultType;
  score: number;
  title: string;
  subtitle: string | null;
  href: string;
  imageUrl: string | null;
  meta: Record<string, unknown>;
};

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 30;
const TOPIC_SCAN_LIMIT = 100;

function parseRequestedTypes(rawTypes: string | null): DiscoveryResultType[] {
  const allowed: DiscoveryResultType[] = ["post", "user", "topic"];
  if (!rawTypes) return allowed;

  const parsed = rawTypes
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter((value): value is DiscoveryResultType =>
      allowed.includes(value as DiscoveryResultType),
    );

  return parsed.length > 0 ? parsed : allowed;
}

function normalizeQuery(query: string | null): string | null {
  const trimmed = query?.trim();
  return trimmed ? trimmed : null;
}

function computeTextScore(query: string | null, values: Array<string | null | undefined>) {
  if (!query) return 0;

  const loweredQuery = query.toLowerCase();
  let score = 0;

  for (const value of values) {
    if (!value) continue;

    const loweredValue = value.toLowerCase();

    if (loweredValue === loweredQuery) {
      score += 120;
      continue;
    }

    if (loweredValue.startsWith(loweredQuery)) {
      score += 80;
    }

    if (loweredValue.includes(loweredQuery)) {
      score += 40;
    }
  }

  return score;
}

function rankResults(results: DiscoveryResult[], rankBy: DiscoveryRankBy) {
  return [...results].sort((a, b) => {
    if (rankBy === "recent") {
      const aCreatedAt = new Date(String(a.meta.createdAt || 0)).getTime();
      const bCreatedAt = new Date(String(b.meta.createdAt || 0)).getTime();

      if (bCreatedAt !== aCreatedAt) {
        return bCreatedAt - aCreatedAt;
      }
    }

    if (rankBy === "popular") {
      const aPopularity = Number(a.meta.popularity ?? a.score);
      const bPopularity = Number(b.meta.popularity ?? b.score);

      if (bPopularity !== aPopularity) {
        return bPopularity - aPopularity;
      }
    }

    if (b.score !== a.score) {
      return b.score - a.score;
    }

    return a.title.localeCompare(b.title);
  });
}

async function searchPosts(args: {
  query: string | null;
  limit: number;
  postType: string | null;
  postStatus: string | null;
  rankBy: DiscoveryRankBy;
}) {
  const { query, limit, postType, postStatus, rankBy } = args;

  const where: Prisma.PostWhereInput = {};

  if (query) {
    where.OR = [
      { title: { contains: query, mode: "insensitive" } },
      { description: { contains: query, mode: "insensitive" } },
      { category: { equals: query.toLowerCase() as any } },
    ];
  }

  if (postType) {
    where.type = postType as any;
  }

  if (postStatus) {
    where.status = postStatus as any;
  }

  const orderBy: Prisma.PostOrderByWithRelationInput[] =
    rankBy === "popular"
      ? [{ interactions: { _count: "desc" } } as any, { createdAt: "desc" }]
      : [{ createdAt: "desc" }];

  const posts = await prisma.post.findMany({
    where,
    take: limit,
    orderBy,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          username: true,
          avatarUrl: true,
        },
      },
      _count: {
        select: {
          interactions: true,
          comments: true,
          entries: true,
        },
      },
    },
  });

  return posts.map<DiscoveryResult>((post) => {
    const popularity =
      post._count.interactions * 3 + post._count.comments * 2 + post._count.entries;
    const score =
      computeTextScore(query, [post.title, post.description, post.category]) +
      popularity;

    return {
      id: post.id,
      type: "post",
      score,
      title: post.title,
      subtitle: post.description || null,
      href: `/post/${post.id}`,
      imageUrl: post.user.avatarUrl || null,
      meta: {
        postType: post.type,
        category: post.category,
        status: post.status,
        creatorId: post.user.id,
        creatorName: post.user.name,
        creatorUsername: post.user.username,
        interactions: post._count.interactions,
        comments: post._count.comments,
        entries: post._count.entries,
        popularity,
        createdAt: post.createdAt.toISOString(),
        endsAt: post.endsAt.toISOString(),
      },
    };
  });
}

async function searchUsers(args: {
  query: string | null;
  limit: number;
  period: string;
  rankBy: DiscoveryRankBy;
}) {
  const { query, limit, period, rankBy } = args;

  let dateFilter: Date | undefined;
  if (period === "weekly") {
    dateFilter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  } else if (period === "monthly") {
    dateFilter = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  }

  const where: Prisma.UserWhereInput = query
    ? {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { username: { contains: query, mode: "insensitive" } },
          { bio: { contains: query, mode: "insensitive" } },
        ],
      }
    : {};

  const orderBy =
    rankBy === "recent"
      ? [{ createdAt: "desc" as const }]
      : [{ xp: "desc" as const }, { createdAt: "desc" as const }];

  const users = await prisma.user.findMany({
    where,
    take: limit,
    orderBy,
    select: {
      id: true,
      name: true,
      username: true,
      bio: true,
      avatarUrl: true,
      xp: true,
      createdAt: true,
      rank: true,
      badges: {
        include: { badge: true },
      },
      _count: {
        select: {
          posts: dateFilter ? { where: { createdAt: { gte: dateFilter } } } : true,
          entries: dateFilter
            ? { where: { createdAt: { gte: dateFilter } } }
            : true,
          followers: true,
        },
      },
    },
  });

  return users.map<DiscoveryResult>((user) => {
    const totalContributions = user._count.posts + user._count.entries;
    const popularity = user.xp + totalContributions * 5 + user._count.followers * 3;
    const score =
      computeTextScore(query, [user.name, user.username, user.bio]) + popularity;

    return {
      id: user.id,
      type: "user",
      score,
      title: user.name,
      subtitle: user.username ? `@${user.username}` : user.bio || null,
      href: `/profile/${user.id}`,
      imageUrl: user.avatarUrl || null,
      meta: {
        username: user.username,
        bio: user.bio,
        xp: user.xp,
        rank: user.rank,
        badgeCount: user.badges.length,
        badges: user.badges.map((userBadge) => userBadge.badge),
        postCount: user._count.posts,
        entryCount: user._count.entries,
        followerCount: user._count.followers,
        totalContributions,
        popularity,
        createdAt: user.createdAt.toISOString(),
      },
    };
  });
}

async function searchTopics(args: {
  query: string | null;
  rankBy: DiscoveryRankBy;
}) {
  const { query } = args;

  const posts = await prisma.post.findMany({
    where: {
      category: { not: null },
      ...(query
        ? {
            OR: [
              { title: { contains: query, mode: "insensitive" } },
              { description: { contains: query, mode: "insensitive" } },
              { category: { equals: query.toLowerCase() as any } },
            ],
          }
        : {}),
    },
    take: TOPIC_SCAN_LIMIT,
    orderBy: [{ createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      category: true,
      createdAt: true,
      _count: {
        select: {
          interactions: true,
          comments: true,
          entries: true,
        },
      },
    },
  });

  const topicMap = new Map<
    string,
    {
      label: string;
      postCount: number;
      engagement: number;
      latestCreatedAt: Date;
      sampleTitles: string[];
      score: number;
    }
  >();

  for (const post of posts) {
    if (!post.category) continue;

    const existing = topicMap.get(post.category) || {
      label: post.category,
      postCount: 0,
      engagement: 0,
      latestCreatedAt: post.createdAt,
      sampleTitles: [],
      score: 0,
    };

    existing.postCount += 1;
    existing.engagement +=
      post._count.interactions * 3 + post._count.comments * 2 + post._count.entries;
    existing.latestCreatedAt =
      existing.latestCreatedAt > post.createdAt ? existing.latestCreatedAt : post.createdAt;

    if (existing.sampleTitles.length < 3) {
      existing.sampleTitles.push(post.title);
    }

    existing.score =
      computeTextScore(query, [post.category, post.title]) +
      existing.engagement +
      existing.postCount * 10;

    topicMap.set(post.category, existing);
  }

  return [...topicMap.entries()].map<DiscoveryResult>(([category, topic]) => ({
    id: `topic:${category}`,
    type: "topic",
    score: topic.score,
    title: category.replace(/_/g, " "),
    subtitle:
      topic.sampleTitles.length > 0 ? topic.sampleTitles.join(" • ") : null,
    href: `/feed?category=${encodeURIComponent(category)}`,
    imageUrl: null,
    meta: {
      category,
      postCount: topic.postCount,
      engagement: topic.engagement,
      popularity: topic.engagement + topic.postCount * 10,
      createdAt: topic.latestCreatedAt.toISOString(),
    },
  }));
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = normalizeQuery(searchParams.get("q"));
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || String(DEFAULT_LIMIT), 10);
    const rankBy = (searchParams.get("rankBy") || "relevance") as DiscoveryRankBy;
    const period = searchParams.get("period") || "all-time";
    const postType = searchParams.get("postType");
    const postStatus = searchParams.get("status");
    const requestedTypes = parseRequestedTypes(searchParams.get("types"));

    if (page < 1 || limit < 1 || limit > MAX_LIMIT) {
      return apiError("Invalid pagination parameters", 400);
    }

    if (!["relevance", "recent", "popular"].includes(rankBy)) {
      return apiError("Invalid ranking option", 400);
    }

    if (!["all-time", "weekly", "monthly"].includes(period)) {
      return apiError("Invalid leaderboard period", 400);
    }

    const fetchLimit = Math.min(limit * page * 3, 90);
    const tasks: Array<Promise<DiscoveryResult[]>> = [];

    if (requestedTypes.includes("post")) {
      tasks.push(
        searchPosts({
          query,
          limit: fetchLimit,
          postType,
          postStatus,
          rankBy,
        }),
      );
    }

    if (requestedTypes.includes("user")) {
      tasks.push(
        searchUsers({
          query,
          limit: fetchLimit,
          period,
          rankBy,
        }),
      );
    }

    if (requestedTypes.includes("topic")) {
      tasks.push(
        searchTopics({
          query,
          rankBy,
        }),
      );
    }

    const resultSets = await Promise.all(tasks);
    const combinedResults = rankResults(resultSets.flat(), rankBy);
    const total = combinedResults.length;
    const paginatedResults = combinedResults.slice((page - 1) * limit, page * limit);

    const counts = combinedResults.reduce(
      (acc, result) => {
        acc[result.type] += 1;
        return acc;
      },
      { post: 0, user: 0, topic: 0 },
    );

    return apiSuccess({
      query,
      results: paginatedResults,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
      ranking: {
        rankBy,
        period,
      },
      counts,
    });
  } catch (error) {
    console.error("Discovery API error:", error);
    return apiError("Failed to fetch discovery results", 500);
  }
}
