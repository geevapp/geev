import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";

const VALID_EVENTS = [
  "page_view",
  "post_created",
  "entry_submitted",
  "like_added",
  "share_clicked",
  "error_occurred",
] as const;

export async function POST(request: NextRequest) {
  try {
    let body: any;
    try {
      body = await request.json();
    } catch {
      return apiError("Invalid or missing JSON body", 400);
    }

    const { eventType, eventData, pageUrl } = body ?? {};

    if (typeof eventType !== "string" || !VALID_EVENTS.includes(eventType)) {
      return apiError("Invalid event type", 400);
    }

    // Basic guard against excessively large payloads
    const serialized = JSON.stringify(eventData ?? {});
    if (serialized.length > 10_000) {
      return apiError("Event data too large", 400);
    }

    const userIdHeader = request.headers.get("x-user-id");
    const userAgent = request.headers.get("user-agent");

    await prisma.analyticsEvent.create({
      data: {
        userId: userIdHeader || null,
        eventType,
        eventData: eventData ?? {},
        pageUrl: pageUrl ?? null,
        userAgent: userAgent ?? null,
      },
    } as any);

    return apiSuccess({ tracked: true });
  } catch (error) {
    console.error("Analytics tracking failed:", error);
    // Do not break user flows because of analytics
    return apiSuccess({ tracked: false });
  }
}