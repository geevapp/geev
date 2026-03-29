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
import { verifyChallenge } from "@/lib/sep10";
import { createToken } from "@/lib/jwt";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Validation schema for the request body
const verifyRequestSchema = z.object({
  transaction: z.string().min(1, "Transaction XDR is required"),
  publicKey: z.string().length(56, "Invalid Stellar public key"),
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

    const { transaction: signedXDR, publicKey: clientPublicKey } = validationResult.data;

    // Step 1: Check if this transaction has already been used (replay attack prevention)
    const transactionHash = await getTransactionHash(signedXDR);
    const existingChallenge = await prisma.usedChallenge.findUnique({
      where: { transactionHash },
    });

    if (existingChallenge) {
      return NextResponse.json(
        {
          error: "Replay attack detected",
          message: "This signature has already been used. Please request a new challenge.",
        },
        { status: 403 }
      );
    }

    // Step 2: Verify the signed challenge transaction
    const verificationResult = verifyChallenge(signedXDR, clientPublicKey);

    if (!verificationResult.valid) {
      return NextResponse.json(
        {
          error: "Verification failed",
          message: verificationResult.error || "Invalid signature",
        },
        { status: 401 }
      );
    }

    // Step 3: Mark this transaction as used to prevent replay attacks
    await prisma.usedChallenge.create({
      data: {
        transactionHash,
        publicKey: clientPublicKey,
        usedAt: new Date(),
      },
    });

    // Step 4: Find or create the user
    let user = await prisma.user.findUnique({
      where: { walletAddress: clientPublicKey },
    });

    // If user doesn't exist, create a new user with default values
    if (!user) {
      user = await prisma.user.create({
        data: {
          walletAddress: clientPublicKey,
          name: `User_${clientPublicKey.slice(0, 8)}`,
          username: `user_${clientPublicKey.slice(0, 8)}`,
          avatarUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${clientPublicKey}`,
          xp: 0,
          walletBalance: 0,
        },
      });
    }

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

/**
 * Helper function to extract transaction hash from XDR
 * This is a simplified version - in production, use proper XDR parsing
 */
async function getTransactionHash(signedXDR: string): Promise<string> {
  // Import dynamically to avoid issues if stellar-sdk isn't available at build time
  const { TransactionBuilder, Networks } = await import("@stellar/stellar-sdk");
  
  const transaction = TransactionBuilder.fromXDR(
    signedXDR,
    Networks.PUBLIC
  );
  
  return transaction.hash().toString("hex");
}
