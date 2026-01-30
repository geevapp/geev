# Loading Patterns

## When to Use Spinner vs Skeleton

**Use Spinner:**

- Button actions
- Form submissions
- Simple page loads
- Loading overlays

**Use Skeleton:**

- Posts, profiles, lists
- Content that has a known layout
- When you want to prevent layout shift

## Components

### Spinner

```tsx
import { Spinner } from '@/components/ui/spinner';

<Spinner size="sm" />  // Small
<Spinner size="md" />  // Medium (default)
<Spinner size="lg" />  // Large
```

### Skeletons

```tsx
import { PostCardSkeleton } from '@/components/skeletons/post-card-skeleton';
import { ProfileCardSkeleton } from '@/components/skeletons/profile-card-skeleton';
import { CommentSkeleton } from '@/components/skeletons/comment-skeleton';

<PostCardSkeleton />
<ProfileCardSkeleton />
<CommentSkeleton />
```

### Loading Overlay

```tsx
import { LoadingOverlay } from "@/components/ui/loading-overlay";

{
  isProcessing && <LoadingOverlay />;
}
```

### Page Loader

```tsx
import { PageLoader } from "@/components/page-loader";

<PageLoader />;
```

## Patterns

### 1. Conditional Rendering

```tsx
{
  isLoading ? <Spinner /> : <Content />;
}
```

### 2. Suspense

```tsx
<Suspense fallback={<PostCardSkeleton />}>
  <AsyncComponent />
</Suspense>
```

### 3. Button Loading

```tsx
<Button isLoading={isSubmitting}>Submit</Button>
```

### 4. Full Page

```tsx
{
  isLoading && <PageLoader />;
}
```

## Examples

### Feed Page

```tsx
<Suspense
  fallback={
    <div className="space-y-4">
      <PostCardSkeleton />
      <PostCardSkeleton />
      <PostCardSkeleton />
    </div>
  }
>
  <FeedContent />
</Suspense>
```

### Post Detail

```tsx
<Suspense fallback={<PostCardSkeleton />}>
  <PostContent />
</Suspense>

<Suspense fallback={<><CommentSkeleton /><CommentSkeleton /></>}>
  <Comments />
</Suspense>
```

### Profile Page

```tsx
<Suspense fallback={<ProfileCardSkeleton />}>
  <ProfileHeader />
</Suspense>

<Suspense fallback={<><PostCardSkeleton /><PostCardSkeleton /></>}>
  <UserPosts />
</Suspense>
```

### Leaderboard

```tsx
<Suspense
  fallback={
    <div className="space-y-4">
      <ProfileCardSkeleton />
      <ProfileCardSkeleton />
      <ProfileCardSkeleton />
    </div>
  }
>
  <TopUsers />
</Suspense>
```

### Simple Page

```tsx
<Suspense
  fallback={
    <div className="flex justify-center p-8">
      <Spinner size="lg" />
    </div>
  }
>
  <SettingsContent />
</Suspense>
```

### Form Submission

```tsx
const [isSubmitting, setIsSubmitting] = useState(false);

<Button isLoading={isSubmitting} onClick={handleSubmit}>
  Submit
</Button>;
```

## Accessibility

Always include ARIA labels:

```tsx
<Spinner aria-label="Loading" />
<div aria-busy={isLoading}>Content</div>
```

## Best Practices

- Show loading for operations >200ms
- Use 2-3 skeletons for lists
- Match skeleton layout to final content
- Keep skeletons lightweight (divs + CSS)
- Use CSS animations, not JavaScript
- Avoid too many loading states

## Testing Checklist

- [ ] Loading shows for slow operations
- [ ] No layout shift when content loads
- [ ] Works on all screen sizes
- [ ] ARIA labels present
- [ ] Button disables during loading
- [ ] Smooth transitions (200-300ms)
