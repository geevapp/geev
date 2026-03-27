import { getTokenFromRequest, verifyToken } from "@/lib/jwt";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Checks for an active session.
 * 
 * @deprecated This endpoint is legacy. For new implementations, use Auth.js `auth()` 
 * or `useSession()` instead.
 * 
 * @param request - The incoming Request object
 * @returns A NextResponse with session data
 */
export async function GET (request: Request) {
  try {
    // Get token from cookies
    const token = getTokenFromRequest(request);

    if (!token) {
      return NextResponse.json(
        { error: "No authentication token found" },
        { status: 401 }
      );
    }

    // Verify and decode token
    const payload = await verifyToken(token);
    console.log("Session payload:", payload);
    // Find user in database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Return session data
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        walletAddress: user.walletAddress,
        username: user.name,
        email: null,
        avatar: user.avatarUrl,
        bio: user.bio,
        joinDate: user.createdAt,
      },
      token: {
        expiresAt: new Date(payload.exp * 1000).toISOString(),
      },
    }, {
      headers: {
        // RFC 299: Miscellaneous persistent warning
        "Warning": '299 - "Deprecated: This endpoint is legacy. Use Auth.js session instead."',
      },
    });
  } catch (error: any) {
    if (error.message === "Invalid token") {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    console.error("Session check error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}