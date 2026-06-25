import { GET } from "@/app/api/cron/prune-auth/route";
import { prisma } from "@/lib/prisma";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockRequest, parseResponse } from "../helpers/api";

describe("GET /api/cron/prune-auth", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    delete process.env.CRON_SECRET;
  });

  it("returns 401 when CRON_SECRET is unset (fail closed)", async () => {
    const request = createMockRequest("http://localhost:3000/api/cron/prune-auth");
    const response = await GET(request);
    expect(response.status).toBe(401);
  });

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

    const response = await GET(request);
    const { status, data } = await parseResponse(response);

    expect(status).toBe(200);
    expect(data.success).toBe(true);
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

    const request = createMockRequest("http://localhost:3000/api/cron/prune-auth", {
      headers: { authorization: "Bearer unit-test-secret" },
    });
    const response = await GET(request);
    const { status, data } = await parseResponse(response);

    expect(status).toBe(500);
    expect(data.success).toBe(false);
  });
});
