/**
 * Indexer API Routes
 * 
 * POST /api/indexer/run - Manually trigger indexer run
 * GET /api/indexer/stats - Get indexer statistics
 * POST /api/indexer/reset - Reset indexer state (admin only)
 */

import { NextRequest, NextResponse } from "next/server";
import { runIndexerOnce, getIndexerStats, resetIndexerState } from "@/lib/indexer";
import { getCurrentAdmin } from "@/lib/auth";
import { apiError } from "@/lib/api-response";

/**
 * POST handler - Trigger indexer run
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) return apiError("Forbidden", 403);

    const body = await request.json().catch(() => ({}));
    
    if (body.action === "reset") {
      await resetIndexerState(body.startLedger);
      return NextResponse.json({
        success: true,
        message: "Indexer state reset",
        startLedger: body.startLedger,
      });
    }

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
    const admin = await getCurrentAdmin();
    if (!admin) return apiError("Forbidden", 403);

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
