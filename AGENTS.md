# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Key commands

### Install dependencies

```bash
npm install
```

### Run the development server

Next.js 16 App Router app served on port 3000 by default.

```bash
npm run dev
```

Then open http://localhost:3000.

### Build and run in production mode

```bash
npm run build
npm run start
```

### Linting

ESLint is configured to lint the entire project.

```bash
npm run lint
```

### API smoke tests (manual)

There is no formal unit test runner configured yet (no `npm test` script). Instead there are TypeScript scripts that exercise the API routes directly. These require `tsx` to be available (install locally with `npm install -D tsx` if needed).

Run the leaderboard API tests:

```bash
npx tsx app/api/leaderboard/test.ts
```

Run the posts API tests:

```bash
npx tsx app/api/posts/test.ts
```

These scripts construct `Request` objects and call the route handlers in `app/api/**/route.ts` directly, logging status codes and response shapes.

## High-level architecture

### Stack and conventions

- **Framework:** Next.js 16 using the App Router (`app/` directory).
- **Language:** TypeScript with `strict` mode enabled and path alias `@/*` pointing at the project root.
- **Styling:** Tailwind CSS v4 via `@tailwindcss/postcss`, with custom responsive utilities defined in `app/globals.css` (see `docs/responsive-system.md`).
- **UI components:** shadcn/ui + Radix-based primitives, consolidated under `components/ui` (documented in `docs/components.md`).
- **State management:** Custom React Context in `contexts/app-context.tsx` plus helper hook `hooks/use-auth.tsx`.
- **Routing:** Next.js App Router pages and layouts under `app/`, documented in `docs/routing.md`.
- **Persistence / data:** Currently powered by mock data in `lib/mock-data.ts`, `lib/mock-auth.ts`, and an in-memory `prisma` client in `lib/prisma.ts`. A full Prisma schema exists in `prisma/schema.prisma` but is not yet wired to a real database.

### Application shell and routing

- `app/layout.tsx` is the root layout and is responsible for wiring global providers:
  - `SessionProvider` from `next-auth/react` for Auth.js sessions.
  - `ThemeProvider` for dark/light mode (see `components/theme-provider.tsx` and `components/theme-toggle.tsx`).
  - `AppProvider` from `contexts/app-context.tsx` for global app state.
  - `AppLayout` from `components/app-layout.tsx` for the main UI chrome.
- `AppLayout` composes:
  - `DesktopSidebar` (primary navigation on md+ screens).
  - `Navbar` (top bar with user menu and theme toggle on desktop).
  - `MobileBottomNav` (bottom nav for small screens).
  - `DevUserSwitcher` (floating dev-only auth helper panel).
  - `ScrollRestoration` to manage scroll between navigations.
- Route structure (see `docs/routing.md` for details and auth requirements):
  - `/` – marketing/landing page.
  - `/login` – mock login page using `LoginForm` and mock users.
  - `/feed` – main authenticated feed showing posts rendered via `PostCard`.
  - `/post/[postId]` – post detail.
  - `/profile/[userId]` – user profile pages.
  - `/wallet`, `/settings`, `/activity` – user-centric pages (partially stubbed; wallet UI components live under `app/wallet/components`).
  - `/leaderboard` – leaderboard shell page backed by the `/api/leaderboard` endpoint.
  - `/test/*` – development-only pages for layout/responsive system demos (see `docs/responsive-system.md`).

### State management, auth, and session flow

**Global app context (`contexts/app-context.tsx`):**

- Central source of truth for the client-side state (`AppState` and `AppContextType` are defined in `lib/types.ts`). The context tracks:
  - `user`: the currently logged-in mock user.
  - Collections: `posts`, `users`, `entries`, `contributions`, `replies`, `comments`.
  - Interaction state: `likes` and `burns` as `Set<string>` IDs, plus per-post `likesCount`, `burnCount`, `shareCount`.
  - UI state: theme (`light`/`dark`), and booleans for `showCreateModal`, `showGiveawayModal`, `showRequestModal`.
  - Loading and error flags.
- `AppProvider` responsibilities:
  - On mount, hydrate state from `localStorage` under the `geev_app_state` key (using custom `serializeState` / `deserializeState` helpers to handle `Set`s).
  - Load mock users/posts from `lib/mock-data.ts` into `users` and `posts`.
  - Mirror the Auth.js session: it calls `useSession()` and uses `getUserById` from `lib/mock-auth.ts` to resolve the full `User` object for `session.user.id`, storing that in `state.user`.
  - Persist state back to `localStorage` on changes (debounced).
  - Maintain a separate theme preference in `localStorage` (`theme`) and applies the `dark` class to `document.documentElement`.
  - Provide a rich set of action methods on the context (e.g. `createPost`, `submitEntry`, `makeContribution`, `addReply`, `toggleLike`, `toggleBurn`, `incrementShare`, modal setters, etc.). These methods generate IDs, attach `state.user` as the author, and dispatch the correct reducer actions.
  - Award badges dynamically based on user activity using `checkAndAwardBadges`, which inspects entries and contributions and pushes new `Badge` objects into the relevant user.

**Auth.js / NextAuth integration (`auth.ts` and `/api/auth`):**

- `auth.ts` configures Auth.js with a **Credentials** provider:
  - Users log in via an email address that must match one of the `mockAuthUsers` defined in `lib/mock-auth.ts`.
  - The `authorize` callback returns a minimal user object (id, name, email, avatar image) derived from the corresponding mock user.
  - JWT callback adds `token.id`; session callback copies `token.id` onto `session.user.id` for easy access.
  - `pages.signIn` is set to `/login`, and the session strategy is JWT.
- `app/api/auth/[...nextauth]/route.ts` simply re-exports `handlers` from `auth.ts` so the Next.js App Router can route Auth.js requests.
- On the client:
  - `contexts/app-context.tsx` uses the Auth.js session to decide which `mockAuthUser` should be considered the current `AppState.user`.
  - `useAuth` (in `hooks/use-auth.tsx`) wraps this with additional behavior: it provides `required` and `redirectIfAuthenticated` options and uses the Next.js router to push/replace routes based on auth state.
  - `AuthGuard` (in `components/auth-guard.tsx`) is a simple component-level guard that redirects to `/login` if there is no `user` in the app context, showing a loading spinner while `isLoading` is true.

**Legacy/mock server auth (`lib/auth.ts`):**

- `lib/auth.ts` exports `getCurrentUser(request: NextRequest)` which:
  - Uses a hard-coded `MOCK_MODE` flag and `MOCK_USER` object.
  - Returns a constructed user if `MOCK_MODE.loggedIn` is `true`, optionally overriding `walletAddress` from the `x-mock-wallet` header.
  - Returns `null` when `MOCK_MODE.loggedIn` is `false`.
- This function is used only on the server-side API routes (`app/api/posts/**`) to simulate authentication independently from Auth.js. At present, the client-facing App Router pages use `mock-auth` + Auth.js, and the API routes use this simpler mock header-based auth.

When modifying auth, be aware that there are **two** parallel mock auth systems:

1. Client/UI auth via `lib/mock-auth.ts` + Auth.js + `AppProvider`.
2. Server/API auth via `lib/auth.ts` and the `x-mock-wallet` header.

Align or consolidate them if you begin integrating a real backend.

### Domain model and data layer

**Types (`lib/types.ts`):**

- Centralized TypeScript types for the core domain: `User`, `Post`, `Entry`, `Reply`, `HelpContribution`, `Comment`, `Activity`, and various interaction types (`Like`, `Burn`, `Share`).
- Includes enums for `PostStatus`, `PostCategory`, `SelectionMethod`, `BadgeTier` and interfaces such as `Badge`, `UserRank`, `Wallet`, `AppState`, and `AppContextType`.
- These types are more expressive and UI-oriented than the current Prisma schema, and not yet auto-generated from it.

**Prisma schema (`prisma/schema.prisma`):**

- Defines a relational schema for `User`, `Post`, `Entry`, `Comment`, `Interaction`, `Badge`, and `UserBadge` using a PostgreSQL datasource (`DATABASE_URL` env var).
- Matches the conceptual model of giveaways, entries, comments, likes/burns, and badges, but is not wired into a real database client in this branch.

**Mock Prisma client (`lib/prisma.ts`):**

- `lib/prisma.ts` exports a hand-written `prisma` object that mimics a subset of Prisma's API:
  - `prisma.user.findMany` returns a hard-coded list of users with `_count.posts` and `_count.entries` used by the leaderboard endpoint.
  - `prisma.badge.findMany` returns mock badges.
  - `prisma.post` methods (`create`, `findMany`, `count`, `findUnique`, `update`, `delete`) operate on an in-memory `mockPosts` array seeded at module load.
- API route handlers under `app/api/**` use this mock client instead of a generated Prisma client. Any code that assumes a real database should be updated accordingly when you integrate actual Prisma.

**Mock auth data (`lib/mock-auth.ts`, `lib/mock-data.ts`):**

- `lib/mock-auth.ts` defines:
  - `mockAuthUsers`: 10 rich mock users with different ranks, verification status, wallet balances, follower counts, and badges.
  - Functions `login`, `loginByUsername`, `logout`, `getCurrentUser`, `isAuthenticated`, `getAuthData`, `getUserById`, `getAllUsers` that read/write from `localStorage` under the `geev_auth` key.
- `lib/mock-data.ts` (not exhaustively described here) seeds the client-side `AppProvider` with mock posts, entries, etc., aligned to the `lib/types.ts` domain model.

### API routes

All API routes are implemented as App Router route handlers under `app/api/**` and use the `ApiResponse` helpers in `lib/api-response.ts` to enforce a consistent JSON envelope:

- `apiSuccess(data, message?)` → `{ success: true, data, message? }`.
- `apiError(message, status)` → `{ success: false, error: message }` with HTTP status code.

Key endpoints (see `README.md` and `docs/leaderboard-api.md` for response shapes):

- `app/api/posts/route.ts`:
  - `POST /api/posts` – Validates `title`, `description`, `category`, `type`, `winnerCount`, `endsAt` from the JSON body. Requires a non-null `getCurrentUser(request)`; otherwise returns 401.
  - `GET /api/posts` – Supports `page`, `limit`, `category`, `status`, `type` as query params, forwards them to `prisma.post.findMany`, and returns `{ posts, page, limit, total }`.
- `app/api/posts/[id]/route.ts`:
  - `GET /api/posts/:id` – Fetches a single post by ID, including `creator` and `_count` for `entries` and `interactions`.
  - `PATCH /api/posts/:id` – Requires auth; only the creator may update; refuses to edit posts that already have entries.
  - `DELETE /api/posts/:id` – Requires auth; only the creator may delete; refuses to delete posts that already have entries.
- `app/api/leaderboard/route.ts`:
  - `GET /api/leaderboard` – Accepts `period` (`all-time`, `monthly`, `weekly`), `page`, and `limit` query params.
  - Optionally applies a `createdAt >= dateFilter` constraint when `period` is weekly/monthly.
  - Builds a `leaderboard` array with `total_contributions = post_count + entry_count`, fetches badges for each user, sorts descending by `total_contributions`, and returns the structure described in `docs/leaderboard-api.md`.

API test scripts in `app/api/posts/test.ts` and `app/api/leaderboard/test.ts` are a good reference for how the handlers are expected to behave.

### UI components and design system

**Shared layout and navigation (`components/`):**

- `components/app-layout.tsx` defines the global shell used by `app/layout.tsx`.
- `components/navbar.tsx` is the main desktop navbar, relying on `useApp` for the current user, theme toggle, and log out behavior; it shows user rank, verification status, and a hard-coded wallet balance pill.
- `components/auth-navbar.tsx` is a mobile-optimized navbar used on the feed page, including a "Create" button wired to `setShowCreateModal(true)`.
- `components/desktop-sidebar.tsx`, `components/mobile-bottom-nav.tsx`, and `lib/navigation-items.ts` work together to provide primary navigation across routes.
- `components/dev-user-switcher.tsx` and `components/login-form.tsx` are part of the mock auth UX described in `docs/mock-auth.md`.

**Post feed (`PostCard` and related):**

- `components/post-card.tsx` is the canonical representation of a post in the feed:
  - Accepts a `Post` (from `lib/types.ts`) and uses `post.author` for creator info.
  - Truncates descriptions, shows optional thumbnail (`post.media`), and displays derived badges for category and status.
  - Uses `entriesCount`/`entries.length`, `likesCount`, and `burnCount` for stats.
  - Wraps everything in a `<Link href={/post/[id]}>` and provides a CTA button whose label depends on `post.type` (`"Enter Giveaway"` vs `"Offer Help"`).
  - Has a matching `PostCardSkeleton` for loading states.
- The `/feed` page (`app/feed/page.tsx`) pulls `user`, `posts`, and `isHydrated` from `useApp()` and renders an `AuthNavbar` plus a list of `PostCard`s.

**Design system and responsiveness:**

- `components/ui/*` contains shadcn-derived primitives (Button, Card, Avatar, Dropdown, Tabs, etc.), all documented in `docs/components.md`.
- `docs/responsive-system.md` documents the custom responsive helpers (e.g. `grid-responsive-1`, `gap-responsive`, `Container` component) and gives example layout patterns. The `/test/layout` route is a live showcase of these utilities.
- `docs/wallet.md` documents the intended wallet UI architecture under `app/wallet/` (including `wallet-main.tsx`, `wallet-content.tsx`, `side-bar.tsx`, `sidebar-context.tsx`, `profile-card.tsx`, `footer.tsx`). The current `app/wallet/page.tsx` is a stub; consult this doc before implementing or refactoring wallet behavior.

### Documentation and where to look for context

Before making non-trivial changes, consult these docs for domain-specific context:

- `README.md` – high-level product description, tech stack, and API response envelope.
- `docs/components.md` – how the shadcn-based components are configured and expected to be used.
- `docs/mock-auth.md` – full behavior of the mock auth system, including test users, storage format, and usage examples for `useAuth` and `AppContext`.
- `docs/responsive-system.md` – responsive design rules, custom utilities, and testing checklist.
- `docs/routing.md` – canonical route list, public vs protected, and usage patterns for `AuthGuard`.
- `docs/leaderboard-api.md` – formal contract for the leaderboard API endpoint.
- `docs/wallet.md` – detailed plan for the wallet experience and future Stellar integration.

## Notes for future agents

- There is currently **no configured Jest/Vitest or similar test runner**. If you need automated tests, introduce a test framework and add appropriate `npm` scripts rather than assuming `npm test` exists.
- Be conscious of the split between mock frontend state (`AppProvider` + `mock-auth`) and mock backend state (`lib/prisma.ts` + `lib/auth.ts`). When introducing a real backend, you will likely: (1) replace `lib/prisma.ts` with a generated Prisma client, (2) remove or adapt the in-memory mocks, and (3) consolidate auth so that UI and API share the same source of truth.
- When modifying route behavior or adding new pages, align with the patterns and requirements documented in `docs/routing.md` and the existing `AuthGuard` / `useAuth` helpers to keep navigation, protection, and metadata consistent.
