import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    // Create response to clear the auth cookie
    const response = NextResponse.json({
      success: true,
      message: "Successfully logged out",
    });

    // Clear the auth cookie
    response.cookies.set("auth-token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0, // Expire immediately
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}