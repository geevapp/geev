import NextAuth, { type NextAuthConfig, type Session } from "next-auth";
import { type JWT } from "next-auth/jwt";

// ---------------------------------------------------------------------------
// Extend the built-in types so TypeScript knows about our custom fields
// ---------------------------------------------------------------------------
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      walletAddress?: string | null;
      username?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    walletAddress?: string | null;
    username?: string | null;
    // `picture` is the Auth.js built-in field that maps → session.user.image
  }
}

// ---------------------------------------------------------------------------
// Auth.js configuration
// ---------------------------------------------------------------------------
export const authConfig: NextAuthConfig = {
  // ... providers, pages, adapter, etc. remain unchanged
  providers: [
    // your existing providers here
  ],

  callbacks: {
    // ------------------------------------------------------------------
    // jwt callback
    // Called on:
    //   • sign-in   (user object is present)
    //   • session access (user is absent, trigger is undefined)
    //   • session.update() (trigger === "update", session payload present)
    // ------------------------------------------------------------------
    async jwt({
      token,
      user,
      trigger,
      session,
    }: {
      token: JWT;
      user?: any;
      trigger?: "signIn" | "signUp" | "update";
      session?: any;
    }): Promise<JWT> {
      // ── Initial sign-in: copy custom fields from the DB user into the token ──
      if (user) {
        token.id = user.id as string;
        token.walletAddress = user.walletAddress ?? null;
        token.username = user.username ?? null;
        // `picture` is Auth.js's canonical JWT avatar field
        token.picture = user.image ?? token.picture ?? null;
      }

      // ── Session update triggered by updateSession() / session.update() ──
      // Merge only the fields the client explicitly sent so we never
      // accidentally wipe fields that were not included in the payload.
      if (trigger === "update" && session) {
        const u = session?.user;
        if (u) {
          if (u.image !== undefined) token.picture = u.image;
          if (u.name !== undefined) token.name = u.name;
          if (u.email !== undefined) token.email = u.email;
          if (u.walletAddress !== undefined) token.walletAddress = u.walletAddress;
          if (u.username !== undefined) token.username = u.username;
        }
      }

      return token;
    },

    // ------------------------------------------------------------------
    // session callback
    // Spread rather than replace so standard Auth.js fields (name, email,
    // image) are preserved alongside our custom ones.
    // ------------------------------------------------------------------
    async session({
      session,
      token,
    }: {
      session: Session;
      token: JWT;
    }): Promise<Session> {
      if (token) {
        session.user = {
          // ── Preserve standard Auth.js fields ──────────────────────────
          ...session.user,           // keeps any fields already on the object
          name: token.name ?? session.user?.name ?? null,
          email: token.email ?? session.user?.email ?? null,
          // `token.picture` is Auth.js's JWT avatar field → map to `image`
          image: (token.picture as string | null) ?? session.user?.image ?? null,

          // ── Custom Geev fields ────────────────────────────────────────
          id: token.id as string,
          walletAddress: (token.walletAddress as string | null) ?? null,
          username: (token.username as string | null) ?? null,
        };
      }

      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);