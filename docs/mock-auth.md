# Mock Authentication System

This document describes the mock authentication system implemented for Geev app UI development and testing.

## Overview

The mock auth system simulates user authentication without real blockchain/backend integration. It's designed for:

- UI development and testing
- Rapid user switching during development
- Testing different user states and permissions
- Demo/showcase purposes

> **Note:** This is a temporary system for development purposes. It will be replaced with secure wallet-based authentication (Stellar) in production.

## Quick Start

### Logging In

1. Navigate to `/login`
2. Click on any user card to log in as that user
3. You'll be redirected to `/feed`

### Switching Users (Dev Mode)

In development mode (`NODE_ENV=development`), use the floating DevUserSwitcher panel:

1. Look for the "DEV" badge in the bottom-right corner
2. Click to expand the panel
3. Select a different user from the dropdown
4. The user switches instantly without page reload

### Logging Out

- Use the user menu in the navbar (click your avatar)
- Or use the DevUserSwitcher panel in dev mode

## Test Users

| Username | Name | Rank | Verified | Description |
|----------|------|------|----------|-------------|
| `alexchen` | Alex Chen | Legend | Yes | Verified Legend - Active Giver with high stats |
| `sarahj` | Sarah Johnson | Champion | Yes | Verified Champion - Active Giver, Designer |
| `marcusw` | Marcus Williams | Legend | Yes | Tech Entrepreneur with all badges |
| `emmar` | Emma Rodriguez | Helper | No | Student/Receiver with moderate activity |
| `davidk` | David Kim | Contributor | Yes | Gaming content creator |
| `oliviam` | Olivia Martinez | Newcomer | No | Brand new user, minimal activity |
| `jamest` | James Thompson | Helper | No | Active Receiver, Musician |
| `ninap` | Nina Patel | Contributor | Yes | Verified UI/UX Designer |
| `tylerb` | Tyler Brooks | Newcomer | No | Fresh join, no wallet connected |
| `anongiver` | Anonymous Giver | Champion | No | Anonymous philanthropist |

### User Characteristics

- **New Users:** `oliviam`, `tylerb` - Minimal followers, posts, and badges
- **Active Givers:** `alexchen`, `sarahj`, `marcusw` - High follower counts, many badges, verified
- **Receivers:** `emmar`, `jamest` - Moderate activity, typically seeking help
- **Verified Users:** `alexchen`, `sarahj`, `marcusw`, `davidk`, `ninap`
- **No Wallet:** `emmar`, `oliviam`, `jamest`, `tylerb`

## Usage Guide

### Importing Auth Utilities

```typescript
import {
  login,
  loginByUsername,
  logout,
  getCurrentUser,
  isAuthenticated,
  mockAuthUsers,
  getAllUsers
} from '@/lib/mock-auth'
```

### Using the useAuth Hook

```typescript
import { useAuth } from '@/hooks/use-auth'

// Protected page - redirects to login if not authenticated
function ProtectedPage() {
  const { user, isLoading } = useAuth({ required: true })

  if (isLoading) return <Loading />

  return <div>Welcome, {user.name}!</div>
}

// Auth page - redirects away if already authenticated
function LoginPage() {
  const { user } = useAuth({
    redirectIfAuthenticated: true,
    redirectAuthenticatedTo: '/feed'
  })

  return <LoginForm />
}

// Just check auth status
function AnyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth()

  return isAuthenticated ? <LoggedIn /> : <LoggedOut />
}
```

### Using the AppContext

```typescript
import { useApp } from '@/contexts/app-context'

function MyComponent() {
  const { user, login, logout, isHydrated } = useApp()

  // Wait for hydration before checking auth
  if (!isHydrated) return <Loading />

  return user ? <Dashboard /> : <Welcome />
}
```

## Components

### LoginForm

Located at: `components/login-form.tsx`

A responsive grid of user cards for selecting a test user to log in.

```tsx
import { LoginForm } from '@/components/login-form'

<LoginForm />
```

### DevUserSwitcher

Located at: `components/dev-user-switcher.tsx`

Floating panel for quick user switching in development mode.

- Only renders when `NODE_ENV === 'development'`
- Fixed position at bottom-right
- Collapsible to minimize screen clutter

```tsx
import { DevUserSwitcher } from '@/components/dev-user-switcher'

// Automatically included in AppLayout
<DevUserSwitcher />
```

### AuthNavbar

Located at: `components/auth-navbar.tsx`

Navigation bar for authenticated users showing user info and actions.

```tsx
import { AuthNavbar } from '@/components/auth-navbar'

<AuthNavbar />
```

## Storage Format

Auth data is stored in `localStorage` under the key `geev_auth`:

```json
{
  "userId": "user-1",
  "username": "alexchen",
  "loginTime": 1710432000000
}
```

### Clearing Auth

```typescript
// Via logout function
import { logout } from '@/lib/mock-auth'
logout()

// Or directly
localStorage.removeItem('geev_auth')
```

## API Reference

### `login(userId: string): User | null`

Authenticates a user by their ID.

```typescript
const user = login('user-1')
if (user) {
  console.log('Logged in as:', user.name)
}
```

### `loginByUsername(username: string): User | null`

Authenticates a user by their username (case-insensitive).

```typescript
const user = loginByUsername('alexchen')
```

### `logout(): void`

Logs out the current user and clears localStorage.

```typescript
logout()
```

### `getCurrentUser(): User | null`

Gets the currently authenticated user from localStorage.

```typescript
const user = getCurrentUser()
if (user) {
  console.log('Current user:', user.name)
}
```

### `isAuthenticated(): boolean`

Checks if a user is currently authenticated.

```typescript
if (isAuthenticated()) {
  // Show authenticated content
}
```

### `getUserById(userId: string): User | null`

Gets a user by their ID without logging in.

```typescript
const user = getUserById('user-1')
```

### `getAllUsers(): User[]`

Gets all available mock users.

```typescript
const users = getAllUsers()
users.forEach(user => console.log(user.name))
```

## Route Protection

### Using the useAuth Hook

```typescript
// Protect a page
const { isLoading, user } = useAuth({ required: true })

// Options:
// - required: Redirect to login if not authenticated
// - redirectTo: Custom login redirect (default: '/login')
// - redirectIfAuthenticated: Redirect if already logged in
// - redirectAuthenticatedTo: Where to redirect (default: '/feed')
```

### Using the withAuth HOC

```typescript
import { withAuth } from '@/hooks/use-auth'

function DashboardPage() {
  return <div>Protected content</div>
}

export default withAuth(DashboardPage)
```

## Testing Different States

### Guest Mode
1. Clear localStorage or call `logout()`
2. Navigate to any protected route
3. You should be redirected to `/login`

### New User
1. Log in as `oliviam` or `tylerb`
2. Test features with minimal badges/followers

### Verified User
1. Log in as `alexchen`, `sarahj`, or `marcusw`
2. Verify badge and verification checkmark display

### User Without Wallet
1. Log in as `emmar`, `oliviam`, `jamest`, or `tylerb`
2. Test wallet-related features gracefully handle missing wallet

## Migration Notes

When migrating to real authentication:

1. Replace `lib/mock-auth.ts` with actual auth service
2. Update `contexts/app-context.tsx` to use real auth
3. Replace `LoginForm` with wallet connection UI
4. Remove `DevUserSwitcher` or gate behind feature flag
5. Update storage key from `geev_auth` to production key
6. Add proper session management and refresh tokens

## Troubleshooting

### Auth Not Persisting

1. Check if localStorage is available
2. Verify `geev_auth` key exists in localStorage
3. Check browser console for errors
4. Ensure `isHydrated` is true before checking auth

### DevUserSwitcher Not Showing

1. Verify you're in development mode (`NODE_ENV=development`)
2. Check if component is properly imported in AppLayout
3. Look at bottom-right corner of viewport

### User Data Mismatch

If stored user ID doesn't match any mock user:
- Mock auth will auto-logout and clear storage
- This can happen if mock user data changes

## Related Files

- `lib/mock-auth.ts` - Core auth utilities and mock users
- `lib/types.ts` - User and auth type definitions
- `hooks/use-auth.ts` - React hook for auth state
- `contexts/app-context.tsx` - Global app context with auth
- `components/login-form.tsx` - Login UI component
- `components/dev-user-switcher.tsx` - Dev mode user switcher
- `components/auth-navbar.tsx` - Authenticated user navbar
- `app/login/page.tsx` - Login page
- `app/feed/page.tsx` - Protected feed page
