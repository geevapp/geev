import { GET } from "@/app/api/cron/prune-auth/route";
import { prisma } from "@/lib/prisma";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockRequest, parseResponse } from "../helpers/api";

describe("GET /api/cron/prune-auth", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    delete process.env.CRON_SECRET;
  });

  it("returns 401 without Vercel cron header or bearer secret", async () => {
    const request = createMockRequest(
      "http://localhost:3000/api/cron/prune-auth",
    );
    const response = await GET(request);
    expect(response.status).toBe(401);
  });

  it("allows Vercel cron header without CRON_SECRET", async () => {
    prisma.usedChallenge.deleteMany = vi.fn().mockResolvedValue({ count: 2 });

    const request = createMockRequest(
      "http://localhost:3000/api/cron/prune-auth",
      {
        headers: { "x-vercel-cron": "1" },
      },
    );
    const response = await GET(request);
    const { status, data } = await parseResponse(response);

    expect(status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.prunedUsedChallenges).toBe(2);
  });

  it("prunes rows with bearer token and expected windows", async () => {
    process.env.CRON_SECRET = "unit-test-secret";

    prisma.usedChallenge.deleteMany = vi.fn().mockResolvedValue({ count: 1 });

    const request = createMockRequest(
      "http://localhost:3000/api/cron/prune-auth",
      {
        headers: { authorization: "Bearer unit-test-secret" },
      },
    );
    const response = await GET(request);
    const { status, data } = await parseResponse(response);

    expect(status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.prunedUsedChallenges).toBe(1);

    expect(prisma.usedChallenge.deleteMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          usedAt: { lt: expect.any(Date) },
        }),
      }),
    );
  });
});
