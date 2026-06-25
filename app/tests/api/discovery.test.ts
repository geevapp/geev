import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/discovery/route";
import { createMockRequest, parseResponse } from "../helpers/api";
import { prisma } from "@/lib/prisma";

describe("Discovery API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns combined normalized results from posts, users, and topics", async () => {
    prisma.post.findMany = vi
      .fn()
      .mockResolvedValueOnce([
        {
          id: "post_1",
          title: "Help with books for school",
          description: "Need book donations for the new term.",
          category: "books",
          type: "request",
          status: "open",
          createdAt: new Date("2026-01-01T00:00:00.000Z"),
          endsAt: new Date("2026-01-05T00:00:00.000Z"),
          user: {
            id: "user_1",
            name: "Alice",
            username: "alice",
            avatarUrl: "/alice.png",
          },
          _count: {
            interactions: 4,
            comments: 2,
            entries: 1,
          },
        },
      ])
      .mockResolvedValueOnce([
        {
          id: "post_1",
          title: "Help with books for school",
          category: "books",
          createdAt: new Date("2026-01-01T00:00:00.000Z"),
          _count: {
            interactions: 4,
            comments: 2,
            entries: 1,
          },
        },
      ]);

    prisma.user.findMany = vi.fn().mockResolvedValue([
      {
        id: "user_1",
        name: "Alice Johnson",
        username: "alice",
        bio: "Community helper",
        avatarUrl: "/alice.png",
        xp: 200,
        createdAt: new Date("2026-01-02T00:00:00.000Z"),
        rank: { id: "gold", title: "Gold", level: 3 },
        badges: [],
        _count: {
          posts: 3,
          entries: 5,
          followers: 7,
        },
      },
    ]);

    const request = createMockRequest(
      "http://localhost:3000/api/discovery?q=books&page=1&limit=10",
    );
    const response = await GET(request);
    const { status, data } = await parseResponse(response);

    expect(status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.results).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "post_1",
          type: "post",
          title: "Help with books for school",
          href: "/post/post_1",
        }),
        expect.objectContaining({
          id: "user_1",
          type: "user",
          title: "Alice Johnson",
          href: "/profile/user_1",
        }),
        expect.objectContaining({
          id: "topic:books",
          type: "topic",
          title: "books",
          href: "/feed?category=books",
        }),
      ]),
    );
    expect(data.data.pagination).toMatchObject({
      page: 1,
      limit: 10,
      total: 3,
      totalPages: 1,
      hasMore: false,
    });
  });

  it("supports ranking and pagination in the combined payload", async () => {
    prisma.post.findMany = vi
      .fn()
      .mockResolvedValueOnce([
        {
          id: "post_high",
          title: "Popular books post",
          description: "High engagement",
          category: "books",
          type: "giveaway",
          status: "open",
          createdAt: new Date("2026-01-03T00:00:00.000Z"),
          endsAt: new Date("2026-01-10T00:00:00.000Z"),
          user: {
            id: "user_2",
            name: "Bob",
            username: "bob",
            avatarUrl: null,
          },
          _count: {
            interactions: 20,
            comments: 4,
            entries: 10,
          },
        },
        {
          id: "post_low",
          title: "Quiet books post",
          description: "Low engagement",
          category: "books",
          type: "giveaway",
          status: "open",
          createdAt: new Date("2026-01-01T00:00:00.000Z"),
          endsAt: new Date("2026-01-08T00:00:00.000Z"),
          user: {
            id: "user_3",
            name: "Caro",
            username: "caro",
            avatarUrl: null,
          },
          _count: {
            interactions: 1,
            comments: 0,
            entries: 0,
          },
        },
      ])
      .mockResolvedValueOnce([
        {
          id: "topic-seed-1",
          title: "Popular books post",
          category: "books",
          createdAt: new Date("2026-01-03T00:00:00.000Z"),
          _count: {
            interactions: 20,
            comments: 4,
            entries: 10,
          },
        },
        {
          id: "topic-seed-2",
          title: "Quiet books post",
          category: "books",
          createdAt: new Date("2026-01-01T00:00:00.000Z"),
          _count: {
            interactions: 1,
            comments: 0,
            entries: 0,
          },
        },
      ]);

    prisma.user.findMany = vi.fn().mockResolvedValue([
      {
        id: "user_mid",
        name: "Mid User",
        username: "mid",
        bio: "steady helper",
        avatarUrl: null,
        xp: 50,
        createdAt: new Date("2026-01-02T00:00:00.000Z"),
        rank: null,
        badges: [],
        _count: {
          posts: 2,
          entries: 2,
          followers: 1,
        },
      },
    ]);

    const request = createMockRequest(
      "http://localhost:3000/api/discovery?q=books&rankBy=popular&page=1&limit=2",
    );
    const response = await GET(request);
    const { status, data } = await parseResponse(response);

    expect(status).toBe(200);
    expect(data.data.results).toHaveLength(2);
    expect(data.data.results[0]).toMatchObject({
      id: "topic:books",
      type: "topic",
    });
    expect(data.data.results[1]).toMatchObject({
      id: "post_high",
      type: "post",
    });
    expect(data.data.pagination).toMatchObject({
      page: 1,
      limit: 2,
      total: 4,
      totalPages: 2,
      hasMore: true,
    });
    expect(data.data.ranking).toMatchObject({
      rankBy: "popular",
      period: "all-time",
    });
  });

  it("validates ranking and pagination parameters", async () => {
    const request = createMockRequest(
      "http://localhost:3000/api/discovery?rankBy=unknown&page=0&limit=99",
    );
    const response = await GET(request);
    const { status, data } = await parseResponse(response);

    // rankBy=unknown should return 400, but pagination params now default gracefully
    expect(status).toBe(400);
    expect(data.success).toBe(false);
  });

  it("handles invalid pagination parameters gracefully", async () => {
    const request = createMockRequest(
      "http://localhost:3000/api/discovery?q=test&page=abc&limit=xyz",
    );
    const response = await GET(request);
    const { status, data } = await parseResponse(response);

    expect(status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.pagination.page).toBe(1);
    expect(data.data.pagination.limit).toBe(10);
  });
