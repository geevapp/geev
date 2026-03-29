/**
 * SEP-10 Challenge Endpoint
 * 
 * GET /api/auth/challenge?publicKey=<client_public_key>
 * 
 * Generates a Stellar transaction (XDR) challenge for the client to sign.
 * This implements the first step of SEP-10 Web Authentication.
 * 
 * @see https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0010.md
 */

import { NextRequest, NextResponse } from "next/server";
import { generateChallenge } from "@/lib/sep10";
import { z } from "zod";

// Validation schema for the request
const challengeQuerySchema = z.object({
  publicKey: z.string().min(56).max(56),
});

/**
 * GET handler for generating SEP-10 challenges
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const publicKey = searchParams.get("publicKey");

    const validationResult = challengeQuerySchema.safeParse({ publicKey });

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request",
          message: "Invalid or missing publicKey parameter. Must be a valid Stellar public key (56 characters).",
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { publicKey: clientPublicKey } = validationResult.data;

    // Generate the challenge transaction
    const challenge = generateChallenge(clientPublicKey);

    // Return the challenge to the client
    return NextResponse.json(
      {
        transaction: challenge.transactionXDR,
        network_passphrase: "Public Global Stellar Network ; September 2015",
        // Include additional metadata for client convenience
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
      },
      {
        status: 200,
        headers: {
          // Prevent caching of challenges
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          "Pragma": "no-cache",
          "Expires": "0",
        },
      }
    );
  } catch (error) {
    console.error("Error generating challenge:", error);

    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Failed to generate challenge",
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
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
}
