import { describe, it, expect, beforeEach, vi } from "vitest";
import { POST } from "@/app/api/posts/[id]/select-winners/route";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/posts/test-post-id/select-winners", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/lib/auth", () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock("@/lib/notifications", () => ({
  fanOutNotificationsInTransaction: vi.fn(() => vi.fn()),
}));

vi.mock("@/lib/badges", () => ({
  checkAndAwardBadges: vi.fn(),
}));

// ── Tests ────────────────────────────────────────────────────────────────────

describe("POST /api/posts/[id]/select-winners – concurrency protection", () => {
  const userId = "owner-user-id";
  const postId = "test-post-id";

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCurrentUser).mockResolvedValue({ id: userId } as any);
  });

  it("rejects the second concurrent request when the first completes first", async () => {
    // Arrange: a post with maxWinners=1 and 2 eligible entries
    const entry1 = {
      id: "entry-1",
      userId: "user-a",
      burns: [],
      createdAt: new Date("2025-01-01"),
    };
    const entry2 = {
      id: "entry-2",
      userId: "user-b",
      burns: [],
      createdAt: new Date("2025-01-02"),
    };

    const openPost = {
      id: postId,
      status: "open",
      userId,
      moderationStatus: "approved",
      title: "Test Giveaway",
      maxWinners: 1,
      entries: [entry1, entry2],
      winners: [],
    };

    const completedPost = {
      ...openPost,
      status: "completed",
      winners: [{ userId: "user-a", postId, assignedBy: userId }],
    };

    // The prisma mock tracks calls to simulate Serializable isolation:
    // first tx $transaction callback reads "open", second reads "completed"
    const txCallbacks: Array<() => Promise<any>> = [];
    const originalTransaction = (prisma as any).$transaction;

    let txCallCount = 0;
    (prisma as any).$transaction = vi.fn(
      async (fn: (tx: any) => Promise<any>, _opts?: any) => {
        txCallCount++;
        const isFirstTx = txCallCount <= 1;

        // Build a mock `tx` that re-reads the post
        const txMock = {
          post: {
            findUnique: vi.fn().mockResolvedValue(
              isFirstTx ? { ...openPost } : { ...completedPost },
            ),
            update: vi.fn().mockResolvedValue({}),
          },
          entry: {
            updateMany: vi.fn().mockResolvedValue({}),
          },
          postWinner: {
            createMany: vi.fn().mockResolvedValue({}),
          },
        };

        const result = await fn(txMock);
        return result;
      },
    );

    // Act: fire two concurrent "random" selections
    const [res1, res2] = await Promise.allSettled([
      POST(makeRequest({ method: "random" }), {
        params: Promise.resolve({ id: postId }),
      }),
      POST(makeRequest({ method: "random" }), {
        params: Promise.resolve({ id: postId }),
      }),
    ]);

    // Restore original
    (prisma as any).$transaction = originalTransaction;

    // Assert: one should succeed, the other should fail with 400
    const statuses = [
      res1.status === "fulfilled" ? res1.value.status : null,
      res2.status === "fulfilled" ? res2.value.status : null,
    ];

    expect(statuses).toContain(200);
    expect(statuses).toContain(400);
  }, 10_000);

  it("never exceeds maxWinners even with concurrent requests", async () => {
    // Arrange: post with maxWinners=2 and 4 entries
    const entries = Array.from({ length: 4 }, (_, i) => ({
      id: `entry-${i + 1}`,
      userId: `user-${i + 1}`,
      burns: [],
      createdAt: new Date(`2025-01-0${i + 1}`),
    }));

    const openPost = {
      id: postId,
      status: "open",
      userId,
      moderationStatus: "approved",
      title: "Test Giveaway",
      maxWinners: 2,
      entries,
      winners: [],
    };

    const postAfterFirstTx = {
      ...openPost,
      status: "completed",
      winners: [
        { userId: "user-1", postId, assignedBy: userId },
        { userId: "user-2", postId, assignedBy: userId },
      ],
    };

    let txCallCount = 0;
    const originalTransaction = (prisma as any).$transaction;

    (prisma as any).$transaction = vi.fn(
      async (fn: (tx: any) => Promise<any>, _opts?: any) => {
        txCallCount++;
        const isFirstTx = txCallCount <= 1;

        const txMock = {
          post: {
            findUnique: vi.fn().mockResolvedValue(
              isFirstTx ? { ...openPost } : { ...postAfterFirstTx },
            ),
            update: vi.fn().mockResolvedValue({}),
          },
          entry: {
            updateMany: vi.fn().mockResolvedValue({}),
          },
          postWinner: {
            createMany: vi.fn().mockResolvedValue({}),
          },
        };

        return await fn(txMock);
      },
    );

    // Act: fire two concurrent random selections
    const [res1, res2] = await Promise.allSettled([
      POST(makeRequest({ method: "random" }), {
        params: Promise.resolve({ id: postId }),
      }),
      POST(makeRequest({ method: "random" }), {
        params: Promise.resolve({ id: postId }),
      }),
    ]);

    (prisma as any).$transaction = originalTransaction;

    // Count how many winners were attempted via createMany
    const results = [res1, res2].filter(
      (r): r is PromiseFulfilledResult<Response> =>
        r.status === "fulfilled",
    );

    // At most one should have succeeded
    const successCount = results.filter((r) => r.value.status === 200).length;
    expect(successCount).toBeLessThanOrEqual(1);
  }, 10_000);
});
