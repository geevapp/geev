import { apiError, apiSuccess } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

const CHALLENGE_WINDOW_MS = 15 * 60 * 1000;

function isAuthorizedCron(request: NextRequest): boolean {
  if (request.headers.get("x-vercel-cron") === "1") {
    return true;
  }
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return false;
  }
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

/**
 * 15-minute job: prune stale auth replay-protection rows.
 */
const GET = async (request: NextRequest) => {
  if (!isAuthorizedCron(request)) {
    return apiError("Unauthorized", 401);
  }

  const now = new Date();
  const challengeCutoff = new Date(now.getTime() - CHALLENGE_WINDOW_MS);

  const usedChallengesResult = await prisma.usedChallenge.deleteMany({
    where: {
      usedAt: {
        lt: challengeCutoff,
      },
    },
  });

  return apiSuccess({
    prunedUsedChallenges: usedChallengesResult.count,
    challengeCutoff: challengeCutoff.toISOString(),
  });
};

export { GET };
