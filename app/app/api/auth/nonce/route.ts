import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

/**
 * GET /api/auth/nonce
 * 
 * Generates a unique nonce for the client to use in the login/register signature.
 * This ensures that signatures are one-time use and server-issued.
 */
export async function GET() {
  try {
    const nonce = crypto.randomBytes(32).toString("hex");
    
    // Nonce expires in 15 minutes
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // Save nonce to the database
    await prisma.authNonce.create({
      data: {
        nonce,
        expiresAt,
        used: false,
      },
    });

    return NextResponse.json({ nonce }, { status: 200 });
  } catch (error) {
    console.error("Error generating nonce:", error);
    return NextResponse.json(
      { error: "Internal server error", message: "Failed to generate nonce" },
      { status: 500 }
    );
  }
}
