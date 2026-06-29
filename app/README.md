# Geev App (Next.js)

Geev is a decentralized social platform built on the Stellar blockchain that enables users to create giveaways, post help requests, and participate in community-driven mutual aid.

[![Telegram](https://img.shields.io/badge/Telegram-2CA5E0?style=for-the-badge&logo=telegram&logoColor=white)](https://t.me/geevapp)

This package is the web application for Geev, built with Next.js, TypeScript, Prisma, and PostgreSQL.

Use this guide to get a full local development environment running, including database migration and seed data.

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS v4 + shadcn/ui + Radix UI
- Auth.js (NextAuth)
- Prisma 7 + PostgreSQL

## Prerequisites

- Node.js 20+
- pnpm 10+
- PostgreSQL running locally

## 1) Install Dependencies

From the monorepo root (`new.app/`):

```bash
pnpm install
```

## 2) Configure Environment Variables

From `new.app/app/`, create `.env` (or copy `.env.example`):

```bash
cp .env.example .env
```

Ensure the following minimum required values are configured:

- `DATABASE_URL`: PostgreSQL connection string.
- `AUTH_SECRET` & `NEXTAUTH_SECRET`: Used by NextAuth.js. Generate a strong secret:
  ```bash
  openssl rand -base64 32
  ```
- **Stellar Web Authentication (SEP-10)**:
  - `STELLAR_NETWORK`: Use `testnet` for local development.
  - `STELLAR_SERVER_SECRET`: You **must** generate a unique server keypair for SEP-10 to work. Generate a Testnet keypair [here](https://laboratory.stellar.org/#account-creator?network=testnet) and paste the Secret Key.
  - `STELLAR_HOME_DOMAIN` & `STELLAR_WEB_AUTH_DOMAIN`: Set to `localhost:3000` for local testing.

## 3) Install Freighter Wallet

For local development and testing, you must install the [Freighter browser extension](https://www.freighter.app/). 
Once installed, open the extension settings and ensure your network is set to **Testnet** (matching your `STELLAR_NETWORK` env var).

## 4) Prepare the Database

Run these commands from `new.app/app/`:

```bash
pnpm prisma generate
pnpm prisma migrate deploy
pnpm prisma db seed
```

What seeding adds:

- Default user ranks
- Default badges
- 5 dummy users for development login/testing

## 5) Run the App

From `new.app/app/`:

```bash
pnpm dev
```

Open:

- http://localhost:3000

## 6) Verify Dev Login

In development mode, use the Dev User Switcher (bottom-right) to sign in as a seeded user, or use Freighter to test the Web3 authentication flow.

Expected behavior:

- Navbar/sidebar update to authenticated state
- Main content redirects to `/feed`

## How Authentication Works

Geev uses [SEP-10 Stellar Web Authentication](https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0010.md) for Web3 login via the Freighter extension.

1. **Challenge**: The client requests a challenge transaction from the Next.js API. The server generates this challenge, signing it with `STELLAR_SERVER_SECRET`.
2. **Sign**: The client prompts the user to sign the challenge transaction using their Freighter wallet.
3. **Verify**: The client sends the signed transaction back to the server. The server verifies the signature and the network passphrase before issuing a session cookie via NextAuth.

**Testing Locally (Caveat)**: Ensure that your `STELLAR_NETWORK` is set to `testnet` and that Freighter is also set to Testnet. A misconfigured network passphrase will cause the signature verification to silently fail.

## Useful Commands

From `new.app/app/`:

```bash
pnpm dev
pnpm build
pnpm start
pnpm lint
pnpm test
pnpm test:watch
pnpm test:coverage
pnpm prisma studio
```

## Reset Local DB (Optional)

If you want a clean local database and reseed everything:

```bash
pnpm prisma migrate reset
```

This drops/recreates the schema, reapplies migrations, and runs seed.

## Troubleshooting

- `DATABASE_URL is required to run Prisma seed`:
  - Ensure `.env` exists in `new.app/app/` and contains `DATABASE_URL`.
- Auth/session issues:
  - Ensure `AUTH_SECRET` and `NEXTAUTH_SECRET` are set.
- Migration errors:
  - Confirm PostgreSQL is running and the database in `DATABASE_URL` exists.

## Project Docs

- Theme system: `docs/theme.md`
- Components: `docs/components.md`

## Resources

- Figma UI Kit: https://www.figma.com/design/bx1z49rPLAXSsUSlQ03ElA/Geev-App?node-id=6-192&t=a3DcI1rqYjGvbhBd-0
- App Prototype (Figma): https://www.figma.com/proto/bx1z49rPLAXSsUSlQ03ElA/Geev-App?node-id=6-192&t=Sk47E3cbSLVg2zcA-0&scaling=min-zoom&content-scaling=fixed&page-id=0%3A1&starting-point-node-id=6%3A192&show-proto-sidebar=1
- Project Summary: https://docs.google.com/document/d/1ZEfrbVF_rjJ3GrLYeTxTboRL15dT0kaVyioXrdPpmMU
- Feature Specifications: https://docs.google.com/document/d/1qRyFhhAqBgZU8NtrVmMk6HV2qSi0nb_K3sxrgPaKymI

## API Reference (Analytics)

- **Endpoint:** `POST /api/analytics/events`
- **Purpose:** Track client and server events (page views, post lifecycle, interactions, errors).

**Request Body**

```json
{
  "eventType": "page_view",
  "eventData": { "path": "/feed" },
  "pageUrl": "https://app.example.com/feed"
}
```

- `eventType` must be one of:
  - `"page_view"`
  - `"post_created"`
  - `"entry_submitted"`
  - `"like_added"`
  - `"share_clicked"`
  - `"error_occurred"`
- `eventData` is optional JSON metadata (non-PII only).
- `pageUrl` is optional; when omitted, the client helper populates it from `window.location.href`.

**Headers**

- `x-user-id` (optional) – the authenticated user ID for DAU/attribution. The default client helper will set this when a user is available.

**Response**

```json
{
  "success": true,
  "data": { "tracked": true }
}
```

Analytics failures never block product flows; on internal errors the endpoint returns `{"tracked": false}` but still responds with `success: true`.

### Metrics API

- **Endpoint:** `GET /api/analytics/metrics`
- **Purpose:** Fetch high-level platform metrics over a time window.

**Query Params**

- `period` (optional):
  - `"24h"` – last 24 hours
  - `"7d"` – last 7 days (default)
  - `"30d"` – last 30 days

**Response**

```json
{
  "success": true,
  "data": {
    "period": "7d",
    "metrics": {
      "active_users": 12,
      "posts_created": 5,
      "entries_submitted": 42,
      "page_views": 380
    }
  }
}
```

- `active_users` – distinct users with at least one tracked event in the period.
- `posts_created` – posts created in the period.
- `entries_submitted` – number of `entry_submitted` events in the period.
- `page_views` – number of `page_view` events in the period.

Results are cached in-memory for 5 minutes per `period` value to reduce load.

### Client Tracking Helper

A lightweight helper exists at `lib/analytics.ts`:

```ts
import { trackEvent } from '@/lib/analytics';

await trackEvent('page_view', { path: '/feed' });
await trackEvent('post_created', { postId: 'post_123' }, { userId: '1' });
```

Signature:

- `trackEvent(eventType: string, eventData?: Record<string, any>, options?: { userId?: string })`
- No-ops on the server, silently swallows network errors on the client.

Privacy guarantees:

- No PII is added on the server; `eventData` should not include emails, wallet secrets, or other sensitive values.
- Anonymous events are supported (no `x-user-id`).
- Events are used for behavioral and performance insights, not for tracking individual identities beyond an opaque user ID.
