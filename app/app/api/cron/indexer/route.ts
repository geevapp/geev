/**
 * Vercel Cron Job for Indexer
 * 
 * This route is triggered by Vercel's cron scheduler
 * Configuration in vercel.json:
 * {
 *   "crons": [
 *     {
 *       "path": "/api/cron/indexer",
 *       "schedule": "*/5 * * * *"
 *     }
 *   ]
 * }
 * 
 * Runs every 5 minutes to sync blockchain events
 */

import { NextRequest, NextResponse } from "next/server";
import { runIndexerOnce } from "@/lib/indexer";

/**
 * GET handler - Triggered by Vercel Cron
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("[Cron] Running indexer at", new Date().toISOString());
    
    const startTime = Date.now();
    await runIndexerOnce();
    const duration = Date.now() - startTime;
    
    console.log(`[Cron] Indexer completed in ${duration}ms`);

    return NextResponse.json({
      success: true,
      message: "Indexer completed",
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Cron] Indexer failed:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: "Indexer failed",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * POST handler - Alternative trigger method
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  return GET(request);
}
