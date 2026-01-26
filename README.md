# Geev

Geev is a decentralized social platform built on the Stellar blockchain that enables users to create giveaways, post help requests, and participate in community-driven mutual aid. It combines social networking features with Web3 wallet integration to facilitate transparent, trustless giving and receiving.

## FRONTEND TECHNOLOGY STACK

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **UI Library**: shadcn/ui + Radix UI
- **Styling**: Tailwind CSS v4
- **State Management**: React Context API + SWR for data fetching
- **Icons**: Lucide React
- **Animations**: Framer Motion (for scroll animations and transitions)
- **Theme System**: next-themes with light/dark mode support

## DOCUMENTATION

- [Theme System](docs/theme.md) - Light/dark mode implementation and usage guide
- [Components](docs/components.md) - Component library documentation

## RESOURCES

- [FIGMA UI KIT](https://www.figma.com/design/bx1z49rPLAXSsUSlQ03ElA/Geev-App?node-id=6-192&t=a3DcI1rqYjGvbhBd-0)
- [APP PROTOTYPE (FIGMA)](https://www.figma.com/proto/bx1z49rPLAXSsUSlQ03ElA/Geev-App?node-id=6-192&t=Sk47E3cbSLVg2zcA-0&scaling=min-zoom&content-scaling=fixed&page-id=0%3A1&starting-point-node-id=6%3A192&show-proto-sidebar=1)
- [PROJECT SUMMARY](https://docs.google.com/document/d/1ZEfrbVF_rjJ3GrLYeTxTboRL15dT0kaVyioXrdPpmMU)
- [FEATURE SPECIFICATIONS](https://docs.google.com/document/d/1qRyFhhAqBgZU8NtrVmMk6HV2qSi0nb_K3sxrgPaKymI)

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing and creating pages and components.

# API Reference

This document provides detailed information about the public and authenticated API endpoints of the platform.

**Base URL**

* Development: `http://localhost:3000/api`

**Response Format**
All endpoints return JSON with a consistent shape:

**Success**

```json
{
  "success": true,
  "data": { ... },           // the main payload
  "message": "optional text" // sometimes present
}
```

**Error**

```json
{
  "success": false,
  "error": "Human-readable message",
  "status": 400              // HTTP status code (sometimes included)
}
```

## Authentication

* Most write operations (`POST`, `PATCH`, `DELETE`) require authentication.
* Authentication is currently handled via session / cookies (implementation detail may change).
* The server uses `getCurrentUser(request)` to identify the authenticated user.

## Endpoints

### Posts

#### `POST /posts`

Create a new post (giveaway, job request, collaboration request, etc.)

**Authentication**: Required
**Rate limit**: Subject to change

**Request Body** (application/json)

```json
{
  "title":        string,     // required, 10–200 characters
  "description":  string,     // required, minimum 50 characters
  "category":     string,     // optional, e.g. "crypto", "nft", "development", "general", "memes"
  "type":         string,     // required – "giveaway" | "request"
  "winnerCount":  number,     // optional, positive integer, defaults to 1
  "endsAt":       string      // optional, ISO 8601 datetime (e.g. "2025-03-15T23:59:59Z")
}
```

**Success Response** (201 Created)

```json
{
  "success": true,
  "data": {
    "id": "post_abc123xyz",
    "creatorId": "usr_456",
    "type": "giveaway",
    "title": "...",
    "description": "...",
    "category": "crypto",
    "status": "open",
    "selectionMethod": "random",
    "winnerCount": 3,
    "endsAt": "2025-03-15T23:59:59.000Z",
    "createdAt": "2025-01-20T14:30:22.000Z",
    "updatedAt": "2025-01-20T14:30:22.000Z",
    "creator": {
      "id": "usr_456",
      "name": "Adekolu",
      "avatarUrl": "https://..."
    }
  },
  "message": "Post created successfully"
}
```

**Error cases**

* 400 – Validation failure (title too short/long, description too short, invalid date, etc.)
* 401 – Not authenticated
* 500 – Server error

---

#### `GET /posts`

List posts (paginated feed with filters)

**Authentication**: Optional (public)

**Query Parameters**

```
?page       number   default: 1
&limit      number   default: 20  (max ~50 recommended)
&category   string   e.g. crypto, nft, development
&status     string   currently mostly "open"
&type       string   giveaway | request
```

**Success Response** (200 OK)

```json
{
  "success": true,
  "data": {
    "posts": [
      {
        "id": "post_a1",
        "title": "Win 0.5 SOL – Retweet & Tag 3 Friends",
        "type": "giveaway",
        "category": "crypto",
        "status": "open",
        "createdAt": "...",
        "endsAt": "...",
        "creator": {
          "id": "...",
          "name": "Alex Chen",
          "avatarUrl": "..."
        }
      }
    ],
    "page": 1,
    "limit": 20,
    "total": 87
  }
}
```

---

#### `GET /posts/:id`

Get a single post with detailed information

**Authentication**: Optional (public)

**Path param**: `:id` (post ID)

**Success Response** (200)

```json
{
  "success": true,
  "data": {
    "id": "post_a1",
    "title": "...",
    "description": "...",
    "type": "giveaway",
    "category": "...",
    "status": "open",
    "winnerCount": 3,
    "selectionMethod": "random",
    "endsAt": "...",
    "createdAt": "...",
    "updatedAt": "...",
    "creator": { ... },
    "_count": {
      "entries": 12,
      "interactions": 45
    }
  }
}
```

**Errors**

* 404 – Post not found

---

#### `PATCH /posts/:id`

Update title or description of your own post

**Authentication**: Required
**Authorization**: Must be the creator

**Constraints**

* Cannot edit if the post already has entries (`entries > 0`)

**Request Body** (partial – only fields you want to change)

```json
{
  "title": "Updated: Win 1 SOL – Like + RT",
  "description": "New longer description here..."
}
```

**Success Response** (200)

```json
{
  "success": true,
  "data": { "updated": "post" }
}
```

**Errors**

* 400 – Cannot edit post with entries
* 401 – Not authenticated
* 403 – Not the owner
* 404 – Post not found

---

#### `DELETE /posts/:id`

Delete your own post

**Authentication**: Required
**Authorization**: Must be the creator

**Constraints**

* Cannot delete if the post has entries (`entries > 0`)

**Success Response** (200)

```json
{
  "success": true,
  "data": {
    "deleted": true
  }
}
```

**Errors**

* 400 – Cannot delete post with entries
* 401 – Not authenticated
* 403 – Not the owner
* 404 – Post not found

##

## Analytics

### Event Tracking API

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
import { trackEvent } from "@/lib/analytics";

await trackEvent("page_view", { path: "/feed" });
await trackEvent("post_created", { postId: "post_123" }, { userId: "1" });
```

Signature:

- `trackEvent(eventType: string, eventData?: Record<string, any>, options?: { userId?: string })`
- No-ops on the server, silently swallows network errors on the client.

Privacy guarantees:

- No PII is added on the server; `eventData` should not include emails, wallet secrets, or other sensitive values.
- Anonymous events are supported (no `x-user-id`).
- Events are used for behavioral and performance insights, not for tracking individual identities beyond an opaque user ID.
