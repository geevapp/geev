/**
 * Test file for the analytics API endpoints
 * Run this with: npx tsx app/api/analytics/test.ts
 */

import { POST as postEvent } from "./events/route";
import { GET as getMetrics } from "./metrics/route";

async function testAnalyticsAPI() {
  console.log("========================================");
  console.log("     Testing ANALYTICS API endpoints    ");
  console.log("========================================\n");

  const EVENTS_URL = "http://localhost:3000/api/analytics/events";
  const METRICS_URL = "http://localhost:3000/api/analytics/metrics";

  // 1) Test basic valid event tracking
  console.log("[1] POST /api/analytics/events  →  valid page_view event");
  const validEventReq = new Request(EVENTS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-user-id": "user-1",
      "user-agent": "AnalyticsTest/1.0",
    },
    body: JSON.stringify({
      eventType: "page_view",
      eventData: { path: "/feed" },
      pageUrl: "http://localhost:3000/feed",
    }),
  });

  const validEventRes = await postEvent(validEventReq as any);
  const validEventJson = await validEventRes.json();

  console.log("  Status  :", validEventRes.status);
  console.log("  Success :", validEventJson.success);
  console.log("  Tracked :", validEventJson.data?.tracked ?? "—");
  console.log("----------------------------------------\n");

  // 2) Test invalid event type handling
  console.log("[2] POST /api/analytics/events  →  invalid event type");
  const invalidEventReq = new Request(EVENTS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      eventType: "not_a_real_event",
      eventData: {},
    }),
  });

  const invalidEventRes = await postEvent(invalidEventReq as any);
  const invalidEventJson = await invalidEventRes.json();

  console.log("  Status  :", invalidEventRes.status);
  console.log("  Success :", invalidEventJson.success);
  console.log("  Error   :", invalidEventJson.error ?? "—");
  console.log("----------------------------------------\n");

  // 3) Seed additional events for metrics (two users, multiple types)
  console.log("[3] POST /api/analytics/events  →  seed events for metrics");

  const seedEvents = [
    {
      userId: "user-1",
      eventType: "page_view",
      eventData: { path: "/leaderboard" },
    },
    {
      userId: "user-2",
      eventType: "page_view",
      eventData: { path: "/feed" },
    },
    {
      userId: "user-2",
      eventType: "entry_submitted",
      eventData: { postId: "post_a1" },
    },
    {
      userId: "user-1",
      eventType: "error_occurred",
      eventData: { source: "analytics-test", message: "Simulated error" },
    },
  ] as const;

  for (const evt of seedEvents) {
    const req = new Request(EVENTS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": evt.userId,
      },
      body: JSON.stringify({
        eventType: evt.eventType,
        eventData: evt.eventData,
        pageUrl: "http://localhost:3000" + ((evt.eventData as any)?.path || "/"),
      }),
    });
    const res = await postEvent(req as any);
    const json = await res.json();
    console.log(
      `  Seeded ${evt.eventType} for ${evt.userId} → status ${res.status}, tracked=${json.data?.tracked}`,
    );
  }
  console.log("----------------------------------------\n");

  // 4) Fetch metrics for last 24h
  console.log("[4] GET /api/analytics/metrics  →  period=24h");
  const metricsReq = new Request(`${METRICS_URL}?period=24h`);
  const metricsRes = await getMetrics(metricsReq as any);
  const metricsJson = await metricsRes.json();

  console.log("  Status  :", metricsRes.status);
  console.log("  Success :", metricsJson.success);
  console.log("  Period  :", metricsJson.data?.period ?? "—");
  console.log("  Metrics :", JSON.stringify(metricsJson.data?.metrics ?? {}, null, 2));
  console.log("----------------------------------------\n");

  // 5) Call metrics again to exercise cache
  console.log("[5] GET /api/analytics/metrics  →  cached (24h)");
  const metricsReqCached = new Request(`${METRICS_URL}?period=24h`);
  const metricsResCached = await getMetrics(metricsReqCached as any);
  const metricsJsonCached = await metricsResCached.json();

  console.log("  Status  :", metricsResCached.status);
  console.log("  Success :", metricsJsonCached.success);
  console.log("  Period  :", metricsJsonCached.data?.period ?? "—");
  console.log("  Metrics :", JSON.stringify(metricsJsonCached.data?.metrics ?? {}, null, 2));
  console.log("----------------------------------------\n");

  console.log("\n");
  console.log("====================================");
  console.log("       Analytics tests completed     ");
  console.log("====================================");
}

if (require.main === module) {
  testAnalyticsAPI().catch((err) => {
    console.error("\nAnalytics test suite failed:", err);
    process.exit(1);
  });
}
