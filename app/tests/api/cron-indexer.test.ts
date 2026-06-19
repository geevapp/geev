import { GET } from "@/app/api/cron/indexer/route";
import { createMockRequest, parseResponse } from "../helpers/api";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRunIndexerOnce = vi.hoisted(() => vi.fn());

vi.mock("@/lib/indexer", () => ({
  runIndexerOnce: mockRunIndexerOnce,
}));

describe("GET /api/cron/indexer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.CRON_SECRET;
  });

  it("returns 401 when CRON_SECRET is unset (fail closed)", async () => {
    const request = createMockRequest("http://localhost:3000/api/cron/indexer");
    const response = await GET(request);
    const { status, data } = await parseResponse(response);

    expect(status).toBe(401);
    expect(data.error).toBe("Unauthorized");
    expect(mockRunIndexerOnce).not.toHaveBeenCalled();
  });

  it("returns 401 when authorization header is missing", async () => {
    process.env.CRON_SECRET = "test-secret";

    const request = createMockRequest("http://localhost:3000/api/cron/indexer");
    const response = await GET(request);
    const { status, data } = await parseResponse(response);

    expect(status).toBe(401);
    expect(data.error).toBe("Unauthorized");
    expect(mockRunIndexerOnce).not.toHaveBeenCalled();
  });

  it("returns 401 when authorization header is wrong", async () => {
    process.env.CRON_SECRET = "test-secret";

    const request = createMockRequest("http://localhost:3000/api/cron/indexer", {
      headers: { authorization: "Bearer wrong-secret" },
    });
    const response = await GET(request);
    const { status, data } = await parseResponse(response);

    expect(status).toBe(401);
    expect(data.error).toBe("Unauthorized");
    expect(mockRunIndexerOnce).not.toHaveBeenCalled();
  });

  it("runs indexer when authorized with correct bearer token", async () => {
    process.env.CRON_SECRET = "test-secret";
    mockRunIndexerOnce.mockResolvedValue(undefined);

    const request = createMockRequest("http://localhost:3000/api/cron/indexer", {
      headers: { authorization: "Bearer test-secret" },
    });
    const response = await GET(request);
    const { status, data } = await parseResponse(response);

    expect(status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockRunIndexerOnce).toHaveBeenCalledOnce();
  });
});
