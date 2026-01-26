import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";

interface MetricsPayload {
  period: string;
  metrics: {
    active_users: number;
    posts_created: number;
    entries_submitted: number;
    page_views: number;
  };
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const metricsCache: Record<string, { data: MetricsPayload; expiresAt: number }> = {};

function getDateFromPeriod(period: string): Date {
  const now = Date.now();
  switch (period) {
    case "24h":
      return new Date(now - 24 * 60 * 60 * 1000);
    case "30d":
      return new Date(now - 30 * 24 * 60 * 60 * 1000);
    case "7d":
    default:
      return new Date(now - 7 * 24 * 60 * 60 * 1000);
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "7d";

    const cached = metricsCache[period];
    const now = Date.now();
    if (cached && cached.expiresAt > now) {
      return apiSuccess(cached.data);
    }

    const dateFrom = getDateFromPeriod(period);

    const [activeUsersData, postsCreated, entriesSubmitted, pageViews] =
      await Promise.all([
        prisma.analyticsEvent.findMany({
          where: {
            createdAt: { gte: dateFrom },
            userId: { not: null },
          },
          select: { userId: true },
          distinct: ["userId"],
        } as any),
        prisma.post.count({
          where: { createdAt: { gte: dateFrom } },
        } as any),
        prisma.analyticsEvent.count({
          where: {
            eventType: "entry_submitted",
            createdAt: { gte: dateFrom },
          },
        } as any),
        prisma.analyticsEvent.count({
          where: {
            eventType: "page_view",
            createdAt: { gte: dateFrom },
          },
        } as any),
      ]);

    const payload: MetricsPayload = {
      period,
      metrics: {
        active_users: activeUsersData.length,
        posts_created: postsCreated,
        entries_submitted: entriesSubmitted,
        page_views: pageViews,
      },
    };

    metricsCache[period] = {
      data: payload,
      expiresAt: now + CACHE_TTL_MS,
    };

    return apiSuccess(payload);
  } catch (error) {
    console.error("Analytics metrics error:", error);
    return apiError("Failed to fetch metrics", 500);
  }
}