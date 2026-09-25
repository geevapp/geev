import { POST as SelectWinners } from "@/app/api/posts/[id]/select-winners/route";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockRequest, parseResponse } from "../helpers/api";

import { prisma } from "@/lib/prisma";

vi.mock("@/lib/badges", () => ({
  checkAndAwardBadges: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/notifications", () => ({
  fanOutNotificationsInTransaction: vi.fn(() =>
    vi.fn().mockResolvedValue(undefined),
  ),
}));

const POST_ID = "post_1";
const OWNER_ID = "owner_1";

type FakeEntry = {
  id: string;
  userId: string;
  createdAt: Date;
  burns: unknown[];
};

type FakeState = {
  status: string;
  maxWinners: number;
  entries: FakeEntry[];
  winners: Array<{ userId: string }>;
};

function makeEntry(id: string, userId: string, createdAt: Date): FakeEntry {
  return { id, userId, createdAt, burns: [] };
}

// Lets both concurrent requests read the post *before* either one commits,
// reproducing the stale read that the TOCTOU race depends on.
function makeReadGate(arrivals: number) {
  let count = 0;
  let release: (() => void) | null = null;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  return async () => {
    count += 1;
    if (count >= arrivals) release?.();
    await gate;
  };
}

function installFakePrisma(
  state: FakeState,
  readGate: () => Promise<void> = async () => {},
) {
  const baseTx = {
    post: {
      findUnique: async () => {
        await readGate();
        return {
          id: POST_ID,
          userId: OWNER_ID,
          title: "Test Giveaway",
          status: state.status,
          moderationStatus: "none",
          maxWinners: state.maxWinners,
          entries: state.entries.map((e) => ({ ...e })),
          winners: state.winners.map((w) => ({ ...w })),
        };
      },
    },
    entry: {
      updateMany: async () => ({ count: 0 }),
    },
  };

  prisma.$transaction = vi.fn(async (callback: any) => {
    // Roll back only what THIS transaction wrote, so a losing concurrent
    // transaction cannot undo the winner's committed claim.
    let claimedHere = false;
    const addedWinners: string[] = [];

    const tx = {
      ...baseTx,
      post: {
        ...baseTx.post,
        // Compare-and-set on the status, exactly like the conditional
        // updateMany in the route: only the first concurrent claim wins.
        updateMany: async ({ data }: { data: { status: string } }) => {
          if (state.status === "completed") return { count: 0 };
          state.status = data.status;
          claimedHere = true;
          return { count: 1 };
        },
      },
      postWinner: {
        count: async () => state.winners.length,
        createMany: async ({ data }: { data: Array<{ userId: string }> }) => {
          let created = 0;
          for (const row of data) {
            if (!state.winners.some((w) => w.userId === row.userId)) {
              state.winners.push({ userId: row.userId });
              addedWinners.push(row.userId);
              created += 1;
            }
          }
          return { count: created };
        },
      },
    };

    try {
      return await callback(tx);
    } catch (error) {
      if (claimedHere) state.status = "open";
      state.winners = state.winners.filter(
        (w) => !addedWinners.includes(w.userId),
      );
      throw error;
    }
  }) as any;

  return state;
}

function selectRequest() {
  return createMockRequest(
    `http://localhost:3000/api/posts/${POST_ID}/select-winners`,
    { method: "POST", body: { method: "random" } },
  );
}

describe("POST /api/posts/[id]/select-winners concurrency", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.spyOn(await import("@/lib/auth"), "getCurrentUser").mockResolvedValue({
      id: OWNER_ID,
      name: "Owner",
    } as any);
  });

  it("lets exactly one of two simultaneous selections win and never exceeds maxWinners", async () => {
    const state = installFakePrisma(
      {
        status: "open",
        maxWinners: 1,
        entries: [
          makeEntry("entry_1", "user_1", new Date(2026, 0, 1)),
          makeEntry("entry_2", "user_2", new Date(2026, 0, 2)),
        ],
        winners: [],
      },
      makeReadGate(2),
    );

    const [first, second] = await Promise.all([
      SelectWinners(selectRequest(), {
        params: Promise.resolve({ id: POST_ID }),
      }),
      SelectWinners(selectRequest(), {
        params: Promise.resolve({ id: POST_ID }),
      }),
    ]);

    const [firstRes, secondRes] = await Promise.all([
      parseResponse(first),
      parseResponse(second),
    ]);

    expect([firstRes.status, secondRes.status].sort()).toEqual([200, 400]);
    expect(state.winners).toHaveLength(1);
    expect(state.status).toBe("completed");
  });

  it("caps a single selection at the remaining slots", async () => {
    const state = installFakePrisma({
      status: "open",
      maxWinners: 3,
      entries: [
        makeEntry("entry_1", "user_1", new Date(2026, 0, 1)),
        makeEntry("entry_2", "user_2", new Date(2026, 0, 2)),
        makeEntry("entry_3", "user_3", new Date(2026, 0, 3)),
      ],
      winners: [{ userId: "already_won" }],
    });

    const response = await SelectWinners(selectRequest(), {
      params: Promise.resolve({ id: POST_ID }),
    });
    const { status, data } = await parseResponse(response);

    expect(status).toBe(200);
    expect(data.data.totalSelected).toBe(2);
    expect(state.winners).toHaveLength(3);
  });

  it("rejects a selection on a post that is already completed", async () => {
    installFakePrisma({
      status: "completed",
      maxWinners: 1,
      entries: [makeEntry("entry_1", "user_1", new Date(2026, 0, 1))],
      winners: [{ userId: "user_1" }],
    });

    const response = await SelectWinners(selectRequest(), {
      params: Promise.resolve({ id: POST_ID }),
    });
    const { status, data } = await parseResponse(response);

    expect(status).toBe(400);
    expect(data.error).toBe("Winners already selected for this post");
  });
});
