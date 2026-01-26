"use client";

export async function trackEvent(
  eventType: string,
  eventData?: Record<string, any>,
  options?: { userId?: string },
) {
  if (typeof window === "undefined") return;

  try {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (options?.userId) {
      headers["x-user-id"] = options.userId;
    }

    await fetch("/api/analytics/events", {
      method: "POST",
      headers,
      body: JSON.stringify({
        eventType,
        eventData,
        pageUrl: window.location.href,
      }),
    });
  } catch (error) {
    // Silent fail - don't interrupt user experience
    if (process.env.NODE_ENV === "development") {
      console.error("Event tracking failed:", error);
    }
  }
}