import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createToken } from "@/lib/jwt";
import { z } from "zod";

const loginSchema = z.object({
  walletAddress: z.string().min(1, "Wallet address is required"),
  signature: z.string().min(1, "Signature is required"),
  message: z.string().min(1, "Message is required"),
});

// Mock wallet signature verification - replace with actual implementation
async function verifyWalletSignature(
  walletAddress: string,
  signature: string,
  message: string
): Promise<boolean> {
  // In production, verify the signature using the wallet's public key
  // This is a mock implementation for demonstration
  console.log(`Verifying signature for wallet: ${walletAddress}`);
  return signature.length > 10; // Simple validation for demo
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { walletAddress, signature, message } = parsed.data;

    // Verify wallet signature
    const isValidSignature = await verifyWalletSignature(walletAddress, signature, message);
    
    if (!isValidSignature) {
      return NextResponse.json(
        { error: "Invalid wallet signature" },
        { status: 401 }
      );
    }

    // Find user by wallet address
    const user = await prisma.user.findUnique({
      where: { walletAddress },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found. Please register first." },
        { status: 404 }
      );
    }

    // Create JWT token
    const token = await createToken({
      userId: user.id,
      walletAddress: user.walletAddress,
      username: user.name,
    });

    // Create response with cookie
    const response = NextResponse.json({
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
      token, // Also return token in response body for client storage
    });

    // Set secure cookie
    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}