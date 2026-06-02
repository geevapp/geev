import { GET, POST } from "@/app/api/admin/moderation/route";
import { createMockRequest, parseResponse } from "../../helpers/api";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";

const mockGetCurrentAdmin = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth", () => ({
  getCurrentAdmin: mockGetCurrentAdmin,
}));

describe("Admin moderation API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("blocks moderation queue access for non-admin users", async () => {
    mockGetCurrentAdmin.mockResolvedValue(null);

    const response = await GET(
      createMockRequest("http://localhost:3000/api/admin/moderation"),
    );
    const { status, data } = await parseResponse(response);

    expect(status).toBe(403);
    expect(data.error).toBe("Forbidden");
  });

  it("returns flagged and suspended content for admins", async () => {
    mockGetCurrentAdmin.mockResolvedValue({
      id: "admin_123",
      name: "Admin",
      role: "admin",
    });

    (prisma.post.findMany as any) = vi.fn().mockResolvedValue([
      {
        id: "post_123",
        title: "Flagged post",
        moderationStatus: "under_review",
        contentFlags: [{ id: "flag_123" }],
        moderationActions: [],
        _count: { contentFlags: 1 },
      },
    ]);
    (prisma.post.groupBy as any) = vi.fn().mockResolvedValue([
      { moderationStatus: "under_review", _count: { _all: 1 } },
    ]);

    const response = await GET(
      createMockRequest("http://localhost:3000/api/admin/moderation"),
    );
    const { status, data } = await parseResponse(response);

    expect(status).toBe(200);
    expect(data.data.posts).toHaveLength(1);
    expect(data.data.totals.under_review).toBe(1);
    expect(prisma.post.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.any(Array),
        }),
      }),
    );
  });

  it("records a suspend action and audit history", async () => {
    mockGetCurrentAdmin.mockResolvedValue({
      id: "admin_123",
      name: "Admin",
      role: "admin",
    });

    (prisma.post.findUnique as any) = vi.fn().mockResolvedValue({
      id: "00000000-0000-4000-8000-000000000001",
      userId: "user_123",
      title: "Flagged post",
    });

    const tx = {
      post: {
        update: vi.fn().mockResolvedValue({
          id: "00000000-0000-4000-8000-000000000001",
          moderationStatus: "suspended",
        }),
      },
      moderationAction: {
        create: vi.fn().mockResolvedValue({ id: "action_123" }),
      },
      user: {
        update: vi.fn(),
      },
    };

    (prisma.$transaction as any) = vi.fn(async (callback: any) => callback(tx));

    const response = await POST(
      createMockRequest("http://localhost:3000/api/admin/moderation", {
        method: "POST",
        body: {
          postId: "00000000-0000-4000-8000-000000000001",
          action: "suspend",
          note: "Repeated scam reports",
        },
      }),
    );
    const { status, data } = await parseResponse(response);

    expect(status).toBe(200);
    expect(data.data.moderationStatus).toBe("suspended");
    expect(tx.post.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { moderationStatus: "suspended" },
      }),
    );
    expect(tx.moderationAction.create).toHaveBeenCalledWith({
      data: {
        postId: "00000000-0000-4000-8000-000000000001",
        moderatorId: "admin_123",
        action: "suspended",
        note: "Repeated scam reports",
      },
    });
  });
});
