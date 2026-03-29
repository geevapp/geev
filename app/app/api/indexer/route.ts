/**
 * Indexer API Routes
 * 
 * POST /api/indexer/run - Manually trigger indexer run
 * GET /api/indexer/stats - Get indexer statistics
 * POST /api/indexer/reset - Reset indexer state (admin only)
 */

import { NextRequest, NextResponse } from "next/server";
import { runIndexerOnce, getIndexerStats, resetIndexerState } from "@/lib/indexer";
import { auth } from "@/lib/auth";

/**
 * POST handler - Trigger indexer run
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Check authentication for reset action
    const session = await auth();
    const body = await request.json().catch(() => ({}));
    
    if (body.action === "reset") {
      // Only admins can reset
      if (!session?.user) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }
      
      await resetIndexerState(body.startLedger);
      return NextResponse.json({
        success: true,
        message: "Indexer state reset",
        startLedger: body.startLedger,
      });
    }

    // Run indexer once
    await runIndexerOnce();
    
    return NextResponse.json({
      success: true,
      message: "Indexer run completed",
    });
  } catch (error) {
    console.error("Indexer API error:", error);
    return NextResponse.json(
      {
        error: "Indexer failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET handler - Get indexer statistics
 */
export async function GET(): Promise<NextResponse> {
  try {
    const stats = await getIndexerStats();
    
    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Indexer stats error:", error);
    return NextResponse.json(
      {
        error: "Failed to get stats",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
