# Follow Management UI

## Overview

The profile page now supports managing social relationships directly from the frontend.

Users can:

- follow another user from their profile page
- unfollow a user from their profile page
- open followers and following lists in a dialog
- see follower and following counts update after each mutation

## Frontend Surfaces

- `app/app/profile/[userId]/page.tsx`
  Handles profile-level follow state, loading states, errors, and count refresh after follow mutations.

- `app/components/follow-list-dialog.tsx`
  Shows followers and following in a modal dialog with loading, retry, and empty states.

## Backend Routes Used

- `POST /api/users/:id/follow`
  Follows the target user and returns fresh follower/following counts.

- `DELETE /api/users/:id/follow`
  Unfollows the target user and returns fresh follower/following counts.

- `GET /api/users/:id/followers`
  Returns a paginated list of users who follow the target user.

- `GET /api/users/:id/following`
  Returns a paginated list of users followed by the target user.

## UI Sync Behavior

After a follow or unfollow action:

- the profile button updates to reflect the latest relationship state
- follower counts are refreshed from the mutation response
- following counts stay aligned with the backend response

This avoids relying only on optimistic updates and keeps the page consistent with server state.
