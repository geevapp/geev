import { apiError, apiSuccess } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

<<<<<<< HEAD
function isAuthorizedCron(request: NextRequest): boolean {
=======
const CHALLENGE_WINDOW_MS = 15 * 60 * 1000;

function isAuthorizedCron(request: NextRequest): boolean {
  if (request.headers.get("x-vercel-cron") === "1") {
    return true;
  }
>>>>>>> upstream/main
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return false;
  }
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

/**
<<<<<<< HEAD
 * Hourly job: prune used challenges older than 15 minutes to prevent unbounded growth.
=======
 * 15-minute job: prune stale auth replay-protection rows.
>>>>>>> upstream/main
 */
const GET = async (request: NextRequest) => {
  if (!isAuthorizedCron(request)) {
    return apiError("Unauthorized", 401);
  }

  const now = new Date();
<<<<<<< HEAD

  // SEP-10 challenges are valid for up to 15 minutes
  // We keep them for slightly longer to be safe (e.g. 20 minutes)
  const challengeWindowMinutes = 20;
  const pruneThreshold = new Date(now.getTime() - challengeWindowMinutes * 60 * 1000);

  try {
    const { count } = await prisma.usedChallenge.deleteMany({
      where: {
        usedAt: {
          lt: pruneThreshold,
        },
      },
    });

    return apiSuccess({
      pruned: count,
      threshold: pruneThreshold,
    });
  } catch (error) {
    console.error("Error pruning used challenges:", error);
    return apiError("Internal server error", 500);
  }
=======
  const challengeCutoff = new Date(now.getTime() - CHALLENGE_WINDOW_MS);

  const [usedChallengesResult, authNoncesResult] = await prisma.$transaction([
    prisma.usedChallenge.deleteMany({
      where: {
        usedAt: {
          lt: challengeCutoff,
        },
      },
    }),
    prisma.authNonce.deleteMany({
      where: {
        OR: [{ expiresAt: { lt: now } }, { used: true }],
      },
    }),
  ]);

  return apiSuccess({
    prunedUsedChallenges: usedChallengesResult.count,
    prunedAuthNonces: authNoncesResult.count,
    challengeCutoff: challengeCutoff.toISOString(),
  });
>>>>>>> upstream/main
};

export { GET };
