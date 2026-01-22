# Routing Structure

## Overview

Geev uses Next.js 15 App Router with file-based routing. All routes are organized in the `app/` directory with proper metadata, route protection, and dynamic route support.

## Route Structure

```
app/
├── page.tsx                    // Landing page (/)
├── layout.tsx                  // Root layout
├── not-found.tsx               // 404 page
├── feed/
│   └── page.tsx                // Feed (/feed) - PROTECTED
├── post/
│   └── [postId]/
│       └── page.tsx            // Post detail (/post/:postId) - PUBLIC
├── profile/
│   └── [userId]/
│       └── page.tsx            // User profile (/profile/:userId) - PUBLIC
├── login/
│   └── page.tsx                // Login (/login) - PUBLIC
├── wallet/
│   └── page.tsx                // Wallet (/wallet) - PROTECTED
├── leaderboard/
│   └── page.tsx                // Leaderboard (/leaderboard) - PUBLIC
├── settings/
│   └── page.tsx                // Settings (/settings) - PROTECTED
└── activity/
    └── page.tsx                // Activity (/activity) - PROTECTED
```

## Routes

### Public Routes

These routes are accessible to all users, including guests:

- **`/`** - Landing page
  - Main entry point for the application
  - Shows app overview and call-to-action

- **`/login`** - Wallet connection
  - Authentication page for connecting wallets
  - Redirects to `/feed` after successful login

- **`/post/:postId`** - Post detail (dynamic route)
  - View individual giveaway or help request posts
  - Read-only for guests, interactions require authentication
  - Example: `/post/123`



- **`/leaderboard`** - Top contributors
  - Public leaderboard showing community leaders
  - Rankings based on contributions and activity

### Protected Routes (Require Authentication)

These routes require users to be authenticated. Unauthenticated users are redirected to `/login`:

- **`/feed`** - Main feed
  - Browse all giveaways and help requests
  - Primary content discovery page

- **`/wallet`** - Wallet management
  - View and manage wallet balance
  - Transaction history
  - Token management

- **`/settings`** - User settings
  - Account preferences
  - Profile customization
  - Privacy settings

- **`/activity`** - Activity history
  - User's personal activity log
  - Posts, entries, and contributions

### Error Pages

- **`/not-found`** - 404 page
  - Custom error page for invalid routes
  - Provides navigation back to home

## Route Protection

### AuthGuard Component

Protected routes use the `AuthGuard` component located at [`components/auth-guard.tsx`](file:///c:/Users/HP/Desktop/Code/geev/components/auth-guard.tsx).

**How it works:**
1. Checks authentication state from `AppContext`
2. Redirects to `/login` if user is not authenticated
3. Renders protected content if authenticated

**Usage:**

```tsx
import { AuthGuard } from '@/components/auth-guard';

export default function ProtectedPage() {
  return (
    <AuthGuard>
      <div>Protected content here</div>
    </AuthGuard>
  );
}
```

## Dynamic Routes

Dynamic routes use Next.js 15's async params pattern:

```tsx
interface PageProps {
  params: Promise<{ postId: string }>;
}

export default async function PostDetailPage({ params }: PageProps) {
  const { postId } = await params;
  // Use postId in your component
}
```

### Available Dynamic Routes

- **`/post/[postId]`** - Post detail pages
- **`/profile/[userId]`** - User profile pages

## Navigation Patterns

### Programmatic Navigation

```tsx
'use client';
import { useRouter } from 'next/navigation';

function MyComponent() {
  const router = useRouter();
  
  const handleClick = () => {
    router.push('/feed');
  };
}
```

### Link Component

```tsx
import Link from 'next/link';

function MyComponent() {
  return <Link href="/feed">Go to Feed</Link>;
}
```

### Getting Route Parameters

```tsx
import { useParams } from 'next/navigation';

function MyComponent() {
  const params = useParams();
  const { postId } = params;
}
```

## Metadata

All pages include proper metadata for SEO:

```tsx
export const metadata: Metadata = {
  title: 'Page Title | Geev',
  description: 'Page description',
};
```

For dynamic routes, use `generateMetadata`:

```tsx
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { postId } = await params;
  return {
    title: `Post ${postId} | Geev`,
  };
}
```

## Adding New Routes

### 1. Create Page File

Create a new file in the appropriate directory:

```
app/
└── your-route/
    └── page.tsx
```

### 2. Add Metadata

```tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Your Page | Geev',
  description: 'Page description',
};
```

### 3. Add Route Protection (if needed)

For protected routes, wrap content with `AuthGuard`:

```tsx
import { AuthGuard } from '@/components/auth-guard';

export default function YourPage() {
  return (
    <AuthGuard>
      <div>Your content</div>
    </AuthGuard>
  );
}
```

### 4. Add to Navigation (if needed)

Update navigation components to include links to your new route.

## Best Practices

1. **Keep pages simple** - Move complex logic to components
2. **Use layouts** - Share UI across routes with layout files
3. **Add loading states** - Create `loading.tsx` for better UX
4. **Handle errors** - Add `error.tsx` for error boundaries
5. **Type safety** - Always type route params and props
6. **Metadata** - Include proper SEO metadata on all pages
7. **Route protection** - Use `AuthGuard` consistently for protected routes

