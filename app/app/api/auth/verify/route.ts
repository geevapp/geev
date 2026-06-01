/**
 * SEP-10 Verification Endpoint
 * 
 * POST /api/auth/verify
 * 
 * Verifies a signed Stellar transaction (XDR) and issues a JWT if valid.
 * This implements the second step of SEP-10 Web Authentication.
 * 
 * Request body:
 * {
 *   "transaction": "<signed_xdr_string>",
 *   "publicKey": "<client_public_key>"
 * }
 * 
 * Response:
 * {
 *   "token": "<jwt_token>",
 *   "user": { ...user_data... }
 * }
 * 
 * @see https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0010.md
 */

import { NextRequest, NextResponse } from "next/server";
import { createToken } from "@/lib/jwt";
import { authenticateWalletWithChallenge } from "@/lib/wallet-auth";
import { z } from "zod";

// Validation schema for the request body
const verifyRequestSchema = z.object({
  transaction: z.string().min(1, "Transaction XDR is required"),
  publicKey: z.string().length(56, "Invalid Stellar public key"),
  username: z.string().min(3).max(30).optional(),
  email: z.string().email().optional(),
});

/**
 * POST handler for verifying SEP-10 signed challenges
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = verifyRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request",
          message: "Request body validation failed",
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const {
      transaction: signedXDR,
      publicKey: clientPublicKey,
      username,
      email,
    } = validationResult.data;

    const authResult = await authenticateWalletWithChallenge({
      walletAddress: clientPublicKey,
      transaction: signedXDR,
      username,
      email,
    });

    if (!authResult.success) {
      return NextResponse.json(
        {
          error: authResult.error,
          message: authResult.message,
        },
        { status: authResult.status }
      );
    }

    const { user } = authResult;

    // Step 5: Generate JWT token
    const token = await createToken({
      userId: user.id,
      walletAddress: user.walletAddress,
      username: user.name || user.username || "Anonymous",
    });

    // Step 6: Return the token and user data
    return NextResponse.json(
      {
        token,
        user: {
          id: user.id,
          walletAddress: user.walletAddress,
          username: user.username,
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl,
          bio: user.bio,
          xp: user.xp,
          walletBalance: user.walletBalance,
          createdAt: user.createdAt,
        },
      },
      {
        status: 200,
        headers: {
          // Prevent caching of authentication responses
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          "Pragma": "no-cache",
          "Expires": "0",
        },
      }
    );
  } catch (error) {
    console.error("Error verifying challenge:", error);

    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Failed to verify challenge",
      },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS handler for CORS preflight requests
 */
export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
}

