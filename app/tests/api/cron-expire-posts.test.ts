import { GET } from "@/app/api/cron/expire-posts/route";
import * as notifications from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockRequest, parseResponse } from "../helpers/api";

describe("GET /api/cron/expire-posts", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    delete process.env.CRON_SECRET;
    vi.spyOn(notifications, "createNotification").mockResolvedValue({
      id: "n1",
    } as Awaited<ReturnType<typeof notifications.createNotification>>);
  });

  it("returns 401 without Vercel cron header or bearer secret", async () => {
    const request = createMockRequest("http://localhost:3000/api/cron/expire-posts");
    const response = await GET(request);
    expect(response.status).toBe(401);
  });

  it("allows Vercel cron header without CRON_SECRET", async () => {
    prisma.post.findMany = vi.fn().mockResolvedValue([]);
    prisma.post.updateMany = vi.fn().mockResolvedValue({ count: 0 });

    const request = createMockRequest("http://localhost:3000/api/cron/expire-posts", {
      headers: { "x-vercel-cron": "1" },
    });
    const response = await GET(request);
    const { status, data } = await parseResponse(response);
    expect(status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.expired).toBe(0);
  });

  it("expires open posts and notifies creators with bearer token", async () => {
    process.env.CRON_SECRET = "unit-test-secret";

    prisma.post.findMany = vi
      .fn()
      .mockResolvedValue([
        { id: "post_a", userId: "user_a", title: "Giveaway A" },
      ]);
    prisma.post.updateMany = vi.fn().mockResolvedValue({ count: 1 });

    const request = createMockRequest("http://localhost:3000/api/cron/expire-posts", {
      headers: { authorization: "Bearer unit-test-secret" },
    });
    const response = await GET(request);
    const { status, data } = await parseResponse(response);

    expect(status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.expired).toBe(1);
    expect(prisma.post.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: "open",
          endsAt: { lt: expect.any(Date) },
        }),
        data: { status: "expired" },
      }),
    );
    expect(notifications.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user_a",
        type: "post_closed",
        link: "/post/post_a",
      }),
    );
  });
});
