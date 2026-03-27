import { NextResponse } from "next/server";

/**
 * Handles user logout by clearing all authentication cookies.
 * 
 * @deprecated This endpoint is legacy. For new implementations, use Auth.js `signOut()` 
 * or the Auth.js signout endpoint directly (POST /api/auth/signout).
 * 
 * @param request - The incoming NextRequest object
 * @returns A NextResponse confirming successful logout and clearing session cookies
 */
export async function POST(request: Request) {
  try {
    // Create response to confirm logout
    const response = NextResponse.json(
      {
        success: true,
        message: "Successfully logged out",
      },
      {
        headers: {
          // RFC 299: Miscellaneous persistent warning
          "Warning": '299 - "Deprecated: This endpoint is legacy. Use Auth.js signOut instead."',
        },
      }
    );

    const isProduction = process.env.NODE_ENV === "production";

    // Cookie options for secure clearing
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax" as const,
      maxAge: 0, // Expire immediately
      path: "/",
      expires: new Date(0), // Set to epoch to ensure expiration
    };

    // 1. Clear the legacy auth-token
    response.cookies.set("auth-token", "", cookieOptions);

    // 2. Clear Auth.js session token (standard)
    response.cookies.set("next-auth.session-token", "", cookieOptions);

    // 3. Clear Auth.js session token (secure version used in production/HTTPS)
    response.cookies.set("__Secure-next-auth.session-token", "", cookieOptions);

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}