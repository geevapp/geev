import { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { JWT } from "next-auth/jwt";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

// JWT payload structure
interface UserJWT extends JWT {
  id: string;
  walletAddress: string;
  username: string;
}

// User session structure
interface UserSession {
  id: string;
  walletAddress: string;
  username: string;
  email: string | null;
  avatar: string | null;
  bio: string | null;
  joinDate: Date;
}

// Wallet signature validation (mock for now)
async function verifyWalletSignature(
  walletAddress: string,
  signature: string,
  message: string
): Promise<boolean> {
  // In a real implementation, you would:
  // 1. Verify the signature using the wallet's public key
  // 2. Check that the signed message matches what we sent
  // 3. Validate the signature is recent (timestamp check)
  
  // Mock validation - in production, use proper signature verification
  console.log(`Verifying signature for wallet: ${walletAddress}`);
  return signature.length > 10; // Simple validation for demo
}

export const authConfig = {
  providers: [
    Credentials({
      name: "Wallet",
      credentials: {
        walletAddress: { label: "Wallet Address", type: "text" },
        signature: { label: "Signature", type: "text" },
        message: { label: "Message", type: "text" },
        username: { label: "Username", type: "text", optional: true },
        email: { label: "Email", type: "email", optional: true },
      },
      async authorize(credentials) {
        const parsedCredentials = z
          .object({
            walletAddress: z.string().min(1),
            signature: z.string().min(1),
            message: z.string().min(1),
            username: z.string().optional(),
            email: z.string().email().optional(),
          })
          .safeParse(credentials);

        if (!parsedCredentials.success) {
          return null;
        }

        const { walletAddress, signature, message, username, email } = parsedCredentials.data;

        try {
          // Verify wallet signature
          const isValidSignature = await verifyWalletSignature(walletAddress, signature, message);
          
          if (!isValidSignature) {
            throw new Error("Invalid wallet signature");
          }

          // Check if user exists
          let user = await prisma.user.findUnique({
            where: { walletAddress },
          });

          // If user doesn't exist and this is a login attempt, fail
          if (!user && !username) {
            throw new Error("User not found. Please register first.");
          }

          // If user doesn't exist and this is a registration attempt, create user
          if (!user && username) {
            user = await prisma.user.create({
              data: {
                walletAddress,
                name: username,
                bio: null,
                avatarUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${walletAddress}`,
                xp: 0,
              },
            });
          }

          if (user) {
            return {
              id: user.id,
              walletAddress: user.walletAddress,
              username: user.name,
              email: null,
              avatar: user.avatarUrl,
              bio: user.bio,
              joinDate: user.createdAt,
            };
          }

          return null;
        } catch (error) {
          console.error("Authentication error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }): Promise<JWT> {
      if (user) {
        token.id = user.id;
        // Store walletAddress and username in token
        (token as any).walletAddress = (user as any).walletAddress || '';
        (token as any).username = (user as any).username || user.name || '';
      }
      return token;
    },
    async session({ session, token }): Promise<any> {
      if (token) {
        (session.user as any) = {
          id: token.id as string,
          walletAddress: (token as any).walletAddress as string,
          username: (token as any).username as string,
        };
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET || "your-secret-key-change-in-production",
  trustHost: true,
} satisfies NextAuthConfig;