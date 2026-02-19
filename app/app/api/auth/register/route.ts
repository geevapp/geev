import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createToken } from "@/lib/jwt";
import { z } from "zod";

const registerSchema = z.object({
  walletAddress: z.string().min(1, "Wallet address is required"),
  signature: z.string().min(1, "Signature is required"),
  message: z.string().min(1, "Message is required"),
  username: z.string().min(3, "Username must be at least 3 characters").max(30, "Username too long"),
  email: z.string().email("Invalid email").optional(),
});

// Mock wallet signature verification - replace with actual implementation
async function verifyWalletSignature(
  walletAddress: string,
  signature: string,
  message: string
): Promise<boolean> {
  // In production, verify the signature using the wallet's public key
  console.log(`Verifying signature for wallet: ${walletAddress}`);
  return signature.length > 10; // Simple validation for demo
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { walletAddress, signature, message, username, email } = parsed.data;

    // Verify wallet signature
    const isValidSignature = await verifyWalletSignature(walletAddress, signature, message);
    
    if (!isValidSignature) {
      return NextResponse.json(
        { error: "Invalid wallet signature" },
        { status: 401 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { walletAddress },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this wallet address already exists" },
        { status: 409 }
      );
    }

    // Check if username is taken
    const existingUsers = await prisma.user.findMany({
      where: { name: username },
    });

    if (existingUsers.length > 0) {
      return NextResponse.json(
        { error: "Username already taken" },
        { status: 409 }
      );
    }



    // Create new user
    const user = await prisma.user.create({
      data: {
        walletAddress,
        name: username,
        bio: null,
        avatarUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${walletAddress}`,
        xp: 0,
      },
    });

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
      token,
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
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}