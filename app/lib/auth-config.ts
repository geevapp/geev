import { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { JWT } from "next-auth/jwt";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { PrismaAdapter } from "@auth/prisma-adapter"
import { Keypair } from "@stellar/stellar-sdk";

// Lazy import SEP-10 functions to avoid initialization errors during tests
let _verifyChallenge: typeof import("@/lib/sep10").verifyChallenge | null = null;
async function getVerifyChallenge() {
  if (!_verifyChallenge) {
    const sep10 = await import("@/lib/sep10");
    _verifyChallenge = sep10.verifyChallenge;
  }
  return _verifyChallenge;
}

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

/**
 * Legacy wallet signature validation using simple message signing
 * Used for backwards compatibility with existing clients
 */
async function verifyWalletSignature (
  walletAddress: string,
  signature: string,
  message: string
): Promise<boolean> {
  try {
    const keypair = Keypair.fromPublicKey(walletAddress);
    // Freighter returns base64 string for signMessage, so we parse it into Buffer to verify
    return keypair.verify(Buffer.from(message), Buffer.from(signature, "base64"));
  } catch (error) {
    console.error("Invalid signature or verification failed:", error);
    return false;
  }
}

/**
 * SEP-10 transaction verification with replay attack prevention
 * This is the recommended authentication method for Stellar wallets
 */
async function verifySEP10Transaction(
  signedXDR: string,
  walletAddress: string
): Promise<{ valid: boolean; error?: string }> {
  try {
    // Step 1: Check if this transaction has already been used (replay attack prevention)
    const { TransactionBuilder, Networks } = await import("@stellar/stellar-sdk");
    const transaction = TransactionBuilder.fromXDR(signedXDR, Networks.PUBLIC);
    const transactionHash = transaction.hash().toString("hex");

    const existingChallenge = await prisma.usedChallenge.findUnique({
      where: { transactionHash },
    });

    if (existingChallenge) {
      return { valid: false, error: "Replay attack detected: This signature has already been used" };
    }

    // Step 2: Verify the signed challenge transaction
    const verifyChallenge = await getVerifyChallenge();
    const verificationResult = verifyChallenge(signedXDR, walletAddress);

    if (!verificationResult.valid) {
      return { valid: false, error: verificationResult.error };
    }

    // Step 3: Mark this transaction as used to prevent replay attacks
    await prisma.usedChallenge.create({
      data: {
        transactionHash,
        publicKey: walletAddress,
        usedAt: new Date(),
      },
    });

    return { valid: true };
  } catch (error) {
    console.error("SEP-10 verification error:", error);
    return { valid: false, error: "Failed to verify SEP-10 transaction" };
  }
}

export const authConfig = {
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      name: "Wallet",
      credentials: {
        walletAddress: { label: "Wallet Address", type: "text" },
        signature: { label: "Signature", type: "text" },
        message: { label: "Message", type: "text" },
        transaction: { label: "SEP-10 Transaction XDR", type: "text" },
        username: { label: "Username", type: "text", optional: true },
        email: { label: "Email", type: "email", optional: true },
      },
      async authorize (credentials: any) {
        // Parse credentials with support for both legacy and SEP-10 authentication
        const parsedCredentials = z
          .object({
            walletAddress: z.string().min(1),
            // Legacy authentication fields
            signature: z.string().optional().nullable(),
            message: z.string().optional().nullable(),
            // SEP-10 authentication field
            transaction: z.string().optional().nullable(),
            username: z.string().optional().nullable(),
            email: z.string().email().optional().nullable(),
          })
          .safeParse(credentials);

        if (!parsedCredentials.success) {
          return null;
        }

        const { walletAddress, signature, message, transaction, username, email } = parsedCredentials.data;

        try {
          let isAuthenticated = false;

          // Determine authentication method and verify
          if (transaction) {
            // SEP-10 Transaction-based authentication (recommended)
            const sep10Result = await verifySEP10Transaction(transaction, walletAddress);
            if (!sep10Result.valid) {
              console.error("SEP-10 verification failed:", sep10Result.error);
              throw new Error(sep10Result.error || "Invalid SEP-10 transaction");
            }
            isAuthenticated = true;
          } else if (signature && message) {
            // Legacy message-based authentication
            isAuthenticated = await verifyWalletSignature(walletAddress, signature, message);
            if (!isAuthenticated) {
              throw new Error("Invalid wallet signature");
            }
          } else {
            throw new Error("Missing authentication credentials. Provide either transaction (SEP-10) or signature+message (legacy).");
          }

          if (!isAuthenticated) {
            throw new Error("Authentication failed");
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
                username,
                email: email || null,
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
              email: user.email,
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
    async jwt ({ token, user }): Promise<JWT> {
      if (user) {
        token.id = user.id;
        // Store walletAddress and username in token
        (token as any).walletAddress = (user as any).walletAddress || '';
        (token as any).username = (user as any).username || user.name || '';
      }
      return token;
    },
    async session ({ session, token }): Promise<any> {
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