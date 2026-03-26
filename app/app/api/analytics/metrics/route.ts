import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import { unstable_cache } from "next/cache";

interface MetricsPayload {
  period: string;
  metrics: {
    active_users: number;
    posts_created: number;
    entries_submitted: number;
    page_views: number;
  };
}

const CACHE_TTL_SECONDS = 5 * 60; // 5 minutes
const ALLOWED_PERIODS = ["24h", "7d", "30d"] as const;
type AllowedPeriod = (typeof ALLOWED_PERIODS)[number];

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

/**
 * Fetches analytics metrics from the database.
 * Wrapped in unstable_cache for persistent caching across restarts and instances.
 */
const getCachedMetrics = unstable_cache(
  async (period: AllowedPeriod): Promise<MetricsPayload> => {
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

    return {
      period,
      metrics: {
        active_users: activeUsersData.length,
        posts_created: postsCreated,
        entries_submitted: entriesSubmitted,
        page_views: pageViews,
      },
    };
  },
  ["analytics-metrics"],
  {
    revalidate: CACHE_TTL_SECONDS,
    tags: ["analytics"],
  }
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const periodParam = searchParams.get("period") || "7d";

    // Validate period to prevent unbounded cache growth and invalid queries
    if (!ALLOWED_PERIODS.includes(periodParam as AllowedPeriod)) {
      return apiError(
        `Invalid period. Allowed values: ${ALLOWED_PERIODS.join(", ")}`,
        400
      );
    }

    const period = periodParam as AllowedPeriod;
    const payload = await getCachedMetrics(period);

    return apiSuccess(payload);
  } catch (error) {
    console.error("Analytics metrics error:", error);
    return apiError("Failed to fetch metrics", 500);
  }
}