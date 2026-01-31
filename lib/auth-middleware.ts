import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken, getTokenFromRequest } from "@/lib/jwt";

/**
 * Middleware to protect routes that require authentication
 */
export async function authMiddleware(request: NextRequest) {
  try {
    // Get token from cookies
    const token = getTokenFromRequest(request);
    
    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Verify token
    const payload = await verifyToken(token);
    
    // Add user info to request headers for downstream use
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-id", payload.userId);
    requestHeaders.set("x-wallet-address", payload.walletAddress);
    requestHeaders.set("x-username", payload.username);
    
    // Return modified request with user info
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid or expired token" },
      { status: 401 }
    );
  }
}

/**
 * Helper function to get user info from request headers (for use in API routes)
 */
export function getUserFromRequest(request: Request) {
  const headers = request.headers as Headers;
  return {
    userId: headers.get("x-user-id"),
    walletAddress: headers.get("x-wallet-address"),
    username: headers.get("x-username"),
  };
}