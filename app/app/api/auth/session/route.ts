import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, getTokenFromRequest } from "@/lib/jwt";

export async function GET(request: Request) {
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