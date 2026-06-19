import { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { authenticateWalletWithChallenge } from "@/lib/wallet-auth";

export const authConfig = {
  providers: [
    Credentials({
      name: "Wallet",
      credentials: {
        walletAddress: { label: "Wallet Address", type: "text" },
        transaction: { label: "SEP-10 Transaction XDR", type: "text" },
        username: { label: "Username", type: "text", optional: true },
        email: { label: "Email", type: "email", optional: true },
      },
      async authorize (credentials: any) {
        const parsedCredentials = z
          .object({
            walletAddress: z.string().regex(/^G[A-Z2-7]{55}$/, "Invalid Stellar address (must start with G and be 56 characters long)"),
            transaction: z.string().min(1, "SEP-10 transaction is required"),
            username: z.string().optional().nullable(),
            email: z.string().email().optional().nullable(),
          })
          .safeParse(credentials);

        if (!parsedCredentials.success) {
          return null;
        }

        const { walletAddress, transaction, username, email } = parsedCredentials.data;

        try {
          const authResult = await authenticateWalletWithChallenge({
            walletAddress,
            transaction,
            username,
            email,
          });

          if (!authResult.success) {
            throw new Error(authResult.message);
          }
          const { user } = authResult;

          if (user) {
            return {
              id: user.id,
              walletAddress: user.walletAddress,
              username: user.username || user.name,
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
    async jwt ({ token, user }) {
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
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
} satisfies NextAuthConfig;
