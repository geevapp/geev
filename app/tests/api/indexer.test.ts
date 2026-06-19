import { GET, POST } from "@/app/api/indexer/route";
import { createMockRequest, parseResponse } from "../helpers/api";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetCurrentAdmin = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth", () => ({
  getCurrentAdmin: mockGetCurrentAdmin,
}));

const mockRunIndexerOnce = vi.hoisted(() => vi.fn());
const mockGetIndexerStats = vi.hoisted(() => vi.fn());
const mockResetIndexerState = vi.hoisted(() => vi.fn());

vi.mock("@/lib/indexer", () => ({
  runIndexerOnce: mockRunIndexerOnce,
  getIndexerStats: mockGetIndexerStats,
  resetIndexerState: mockResetIndexerState,
}));

describe("POST /api/indexer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 403 for unauthenticated callers", async () => {
    mockGetCurrentAdmin.mockResolvedValue(null);

    const response = await POST(
      createMockRequest("http://localhost:3000/api/indexer", {
        method: "POST",
        body: {},
      }),
    );
    const { status, data } = await parseResponse(response);

    expect(status).toBe(403);
    expect(data.error).toBe("Forbidden");
    expect(mockRunIndexerOnce).not.toHaveBeenCalled();
  });

  // Non-admin callers are also rejected — getCurrentAdmin returns null for them

  it("runs indexer for admin callers", async () => {
    mockGetCurrentAdmin.mockResolvedValue({
      id: "admin_123",
      name: "Admin",
      role: "admin",
    });
    mockRunIndexerOnce.mockResolvedValue(undefined);

    const response = await POST(
      createMockRequest("http://localhost:3000/api/indexer", {
        method: "POST",
        body: {},
      }),
    );
    const { status, data } = await parseResponse(response);

    expect(status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockRunIndexerOnce).toHaveBeenCalledOnce();
  });

  it("resets indexer state for admin callers with action=reset", async () => {
    mockGetCurrentAdmin.mockResolvedValue({
      id: "admin_123",
      name: "Admin",
      role: "admin",
    });
    mockResetIndexerState.mockResolvedValue(undefined);

    const response = await POST(
      createMockRequest("http://localhost:3000/api/indexer", {
        method: "POST",
        body: { action: "reset", startLedger: 12345 },
      }),
    );
    const { status, data } = await parseResponse(response);

    expect(status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe("Indexer state reset");
    expect(mockResetIndexerState).toHaveBeenCalledWith(12345);
    expect(mockRunIndexerOnce).not.toHaveBeenCalled();
  });
});

describe("GET /api/indexer/stats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 403 for unauthenticated callers", async () => {
    mockGetCurrentAdmin.mockResolvedValue(null);

    const response = await GET(
      createMockRequest("http://localhost:3000/api/indexer/stats"),
    );
    const { status, data } = await parseResponse(response);

    expect(status).toBe(403);
    expect(data.error).toBe("Forbidden");
  });

  it("returns stats for admin callers", async () => {
    mockGetCurrentAdmin.mockResolvedValue({
      id: "admin_123",
      name: "Admin",
      role: "admin",
    });
    mockGetIndexerStats.mockResolvedValue({
      lastLedger: 12345,
      status: "synced",
    });

    const response = await GET(
      createMockRequest("http://localhost:3000/api/indexer/stats"),
    );
    const { status, data } = await parseResponse(response);

    expect(status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual({ lastLedger: 12345, status: "synced" });
  });
});
