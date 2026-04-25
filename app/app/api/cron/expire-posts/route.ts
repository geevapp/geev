import { apiError, apiSuccess } from "@/lib/api-response";
import { createNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

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
 * Hourly job: mark open giveaways whose deadline has passed as expired,
 * and notify creators.
 */
const GET = async (request: NextRequest) => {
  if (!isAuthorizedCron(request)) {
    return apiError("Unauthorized", 401);
  }

  const now = new Date();

  const toExpire = await prisma.post.findMany({
    where: {
      status: "open",
      endsAt: { lt: now },
    },
    select: { id: true, userId: true, title: true },
  });

  if (toExpire.length === 0) {
    return apiSuccess({ expired: 0, ids: [] as string[] });
  }

  await prisma.post.updateMany({
    where: {
      status: "open",
      endsAt: { lt: now },
    },
    data: { status: "expired" },
  });

  await Promise.all(
    toExpire.map((post) =>
      createNotification({
        userId: post.userId,
        type: "post_closed",
        message: `Your giveaway "${post.title}" has ended (deadline passed).`,
        link: `/post/${post.id}`,
      }).catch(() => undefined),
    ),
  );

  return apiSuccess({
    expired: toExpire.length,
    ids: toExpire.map((p) => p.id),
  });
};

export { GET };
