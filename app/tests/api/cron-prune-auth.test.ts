import { GET } from "@/app/api/cron/prune-auth/route";
import { prisma } from "@/lib/prisma";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockRequest, parseResponse } from "../helpers/api";

describe("GET /api/cron/prune-auth", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    delete process.env.CRON_SECRET;
  });

<<<<<<< HEAD
  it("returns 401 when CRON_SECRET is unset (fail closed)", async () => {
=======
  it("returns 401 without Vercel cron header or bearer secret", async () => {
>>>>>>> upstream/main
    const request = createMockRequest("http://localhost:3000/api/cron/prune-auth");
    const response = await GET(request);
    expect(response.status).toBe(401);
  });

<<<<<<< HEAD
  it("returns 401 when authorization header is missing", async () => {
    process.env.CRON_SECRET = "test-secret";

    const request = createMockRequest("http://localhost:3000/api/cron/prune-auth");
    const response = await GET(request);
    expect(response.status).toBe(401);
  });

  it("prunes used challenges older than 20 minutes with bearer token", async () => {
    process.env.CRON_SECRET = "unit-test-secret";

    prisma.usedChallenge.deleteMany = vi.fn().mockResolvedValue({ count: 5 });

    const request = createMockRequest("http://localhost:3000/api/cron/prune-auth", {
      headers: { authorization: "Bearer unit-test-secret" },
    });

    // Mock the date to ensure predictable threshold
    const now = new Date("2024-01-01T12:00:00Z");
    vi.setSystemTime(now);

=======
  it("allows Vercel cron header without CRON_SECRET", async () => {
    prisma.usedChallenge.deleteMany = vi.fn().mockResolvedValue({ count: 2 });
    prisma.authNonce.deleteMany = vi.fn().mockResolvedValue({ count: 3 });
    prisma.$transaction = vi.fn().mockResolvedValue([{ count: 2 }, { count: 3 }]);

    const request = createMockRequest("http://localhost:3000/api/cron/prune-auth", {
      headers: { "x-vercel-cron": "1" },
    });
>>>>>>> upstream/main
    const response = await GET(request);
    const { status, data } = await parseResponse(response);

    expect(status).toBe(200);
    expect(data.success).toBe(true);
<<<<<<< HEAD
    expect(data.data.pruned).toBe(5);

    const expectedThreshold = new Date(now.getTime() - 20 * 60 * 1000);

    expect(prisma.usedChallenge.deleteMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          usedAt: { lt: expectedThreshold },
        }),
      }),
    );

    vi.useRealTimers();
  });

  it("returns 500 when database operation fails", async () => {
    process.env.CRON_SECRET = "unit-test-secret";

    prisma.usedChallenge.deleteMany = vi.fn().mockRejectedValue(new Error("DB Error"));
=======
    expect(data.data.prunedUsedChallenges).toBe(2);
    expect(data.data.prunedAuthNonces).toBe(3);
  });

  it("prunes rows with bearer token and expected windows", async () => {
    process.env.CRON_SECRET = "unit-test-secret";

    prisma.usedChallenge.deleteMany = vi.fn().mockResolvedValue({ count: 1 });
    prisma.authNonce.deleteMany = vi.fn().mockResolvedValue({ count: 4 });
    prisma.$transaction = vi.fn().mockResolvedValue([{ count: 1 }, { count: 4 }]);
>>>>>>> upstream/main

    const request = createMockRequest("http://localhost:3000/api/cron/prune-auth", {
      headers: { authorization: "Bearer unit-test-secret" },
    });
    const response = await GET(request);
    const { status, data } = await parseResponse(response);

<<<<<<< HEAD
    expect(status).toBe(500);
    expect(data.success).toBe(false);
=======
    expect(status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.prunedUsedChallenges).toBe(1);
    expect(data.data.prunedAuthNonces).toBe(4);

    expect(prisma.usedChallenge.deleteMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          usedAt: { lt: expect.any(Date) },
        }),
      }),
    );
    expect(prisma.authNonce.deleteMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [{ expiresAt: { lt: expect.any(Date) } }, { used: true }],
        },
      }),
    );
>>>>>>> upstream/main
  });
});
