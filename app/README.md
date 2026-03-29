## Notification System

This app now includes a notification system for key user events:

- Someone enters your giveaway (post owner notified)
- You win a giveaway (winner notified) *(to be enabled when winner selection logic is implemented)*
- Someone contributes to your help request *(to be enabled when help contribution logic is implemented)*
- A post you follow is closed *(to be enabled when post close logic is implemented)*
- You receive a new badge or rank up *(to be enabled when badge/rank logic is implemented)*

**API Endpoints:**
- `GET /api/notifications` (paginated, filter by isRead)
- `PATCH /api/notifications/[id]/read`

**Frontend:**
- Unread notification badge in Navbar
- `/notifications` page to view all notifications

**How to add new triggers:**
Use the `createNotification` utility in `lib/notifications.ts` in any backend handler to send a notification for new events.

**Migration:**
If you have DB access, run:
```bash
npx prisma migrate dev --name add_notification_model
```
If you do not have DB access, a maintainer should run the above command after merging this PR.

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

Minimum required values:

```env
DATABASE_URL=postgresql://geev:bridgelet_pass@localhost:5432/geev
AUTH_SECRET=<random-secret>
NEXTAUTH_SECRET=<random-secret>
```

Generate a strong secret (use the same value for both secrets if you want):

```bash
openssl rand -base64 32
```

## 3) Prepare the Database

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

## 4) Run the App

From `new.app/app/`:

```bash
pnpm dev
```

Open:

- http://localhost:3000

## 5) Verify Dev Login

In development mode, use the Dev User Switcher (bottom-right) to sign in as a seeded user.

Expected behavior:

- Navbar/sidebar update to authenticated state
- Main content redirects to `/feed`

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
