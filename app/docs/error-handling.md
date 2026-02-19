# Error Handling Documentation

This document outlines the error handling patterns implemented in the Geev application.

## 1. Error Boundary (Sitewide Protection)

The `ErrorBoundary` component wraps the entire application in `layout.tsx`. It catches unhandled JavaScript errors during rendering and displays a user-friendly fallback UI.

### When to Use

- **Root Level**: Automatically handles any component crash.
- **Granular Level**: Wrap high-risk components (like custom charts or complex forms) with a local `ErrorBoundary` to prevent a single component from crashing the whole page.

```tsx
<ErrorBoundary fallback={<CustomLocalFallback />}>
  <HighRiskComponent />
</ErrorBoundary>
```

## 2. Page-level Error Handling

Next.js App Router features are used for routing errors:

- `app/not-found.tsx`: Custom 404 page for invalid routes.
- `app/error.tsx`: Custom 500 page for global app errors.

## 3. Error State Component

For non-crashing errors (e.g., API failure, empty data), use the `ErrorState` component.

### When to Use

- API fetch failed.
- Data list is empty.
- No search results.

```tsx
if (error) {
  return (
    <ErrorState 
      title="Failed to Load" 
      message="We couldn't fetch the posts. Please try again."
      action={{
        label: "Retry",
        onClick: () => refetch()
      }}
    />
  );
}
```

## 4. Error Toast Notifications

For async actions or background failures that shouldn't disrupt the UI flow, use `sonner` toasts.

```tsx
import { toast } from 'sonner';

try {
  await performAction();
} catch (error) {
  toast.error('Action Failed', {
    description: 'Please try again later.',
    action: {
      label: 'Retry',
      onClick: () => performAction(),
    },
  });
}
```

## 5. Console Logging

All errors caught by `ErrorBoundary` or handled in `app/error.tsx` are logged to the console using `console.error`. This is prepared for future integration with error tracking services like Sentry.
