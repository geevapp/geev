import { NextResponse } from "next/server";

/**
 * Handles user registration with wallet signature.
 * 
 * @deprecated This endpoint is legacy. For new implementations, use Auth.js 
 * or the Auth.js signin endpoint directly (POST /api/auth/signin).
 * 
 * @param request - The incoming Request object
 * @returns A NextResponse confirming successful registration and setting session cookie
 */
export async function POST (request: Request) {
  try {
    void request;
    return NextResponse.json(
      {
        error: "Legacy wallet authentication retired",
        message:
          "Use the challenge and verify flow instead: GET /api/auth/challenge then POST /api/auth/verify.",
      },
      { status: 410 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
