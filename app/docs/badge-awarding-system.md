# Server-Side Badge Awarding System

## Overview

The Geev application implements a **fully automated server-side badge awarding system** that evaluates user activity and automatically awards badges based on predefined eligibility rules. This system ensures badges are persisted in the database and immediately reflected across all UI components.

## Architecture

### Core Components

1. **Badge Rules Engine** (`lib/badges.ts`)
   - Defines eligibility criteria for each badge
   - Implements `checkAndAwardBadges(userId)` function
   - Evaluates rules and creates `UserBadge` records

2. **Database Schema** (Prisma)
   - `Badge` model: Stores badge definitions
   - `UserBadge` join table: Links users to earned badges with `awardedAt` timestamp
   - Automatic seeding via `prisma/seed.ts`

3. **API Integration Points**
   - Badge checking triggered after relevant user actions
   - No client-side logic required for badge awarding

## Badge Rules

### Currently Implemented Badges

| Badge ID | Name | Criteria | Tier |
|----------|------|----------|------|
| `first-giveaway` | First Giveaway | Create your first giveaway | Bronze |
| `generous-heart` | Generous Heart | Contribute to 10 help requests | Silver |
| `community-builder` | Community Builder | Reach 100 followers | Gold |
| `first-win` | First Win | Win your first giveaway | Bronze |
| `experienced-giver` | Experienced Giver | Create 5 giveaways | Silver |
| `dedicated-helper` | Dedicated Helper | Make 25 contributions | Gold |

### How It Works

```typescript
// Example from lib/badges.ts
async function checkGenerousHeart(userId: string): Promise<boolean> {
  const contributionCount = await prisma.helpContribution.count({
    where: { userId },
  });
  return contributionCount === 10; // Awarded exactly at 10 contributions
}
```

## Integration Points

The `checkAndAwardBadges()` function is called from the following API endpoints:

### 1. Creating Posts (`/api/posts`)
```typescript
// When a user creates a giveaway
if (type === 'giveaway') {
  await checkAndAwardBadges(user.id);
}
```

### 2. Submitting Entries (`/api/entries`)
```typescript
// When a user submits an entry to a giveaway
if (post.type === 'giveaway') {
  await checkAndAwardBadges(user.id);
}
```

### 3. Making Contributions (`/api/contributions`)
```typescript
// When a user contributes to a help request
await checkAndAwardBadges(user.id);
```

### 4. Winning Giveaways (`/api/winners`)
```typescript
// When a user wins a giveaway
await checkAndAwardBadges(winnerId);
await awardBadge(winnerId, 'first-win'); // Also manually award specific badge
```

### 5. Gaining Followers (`/api/follow`)
```typescript
// When someone follows a user (checks if they reached 100 followers)
await checkAndAwardBadges(followingId);
```

## Database Operations

### Awarding a Badge

The system uses Prisma's `create` to insert a `UserBadge` record:

```typescript
await prisma.userBadge.create({
  data: {
    userId,
    badgeId: rule.badgeId,
  },
});
```

### Checking Existing Badges

Before evaluating rules, the system fetches already-owned badges to avoid duplicates:

```typescript
const userBadges = await prisma.userBadge.findMany({
  where: { userId },
  select: { badgeId: true },
});

const ownedBadgeIds = new Set(userBadges.map(ub => ub.badgeId));
```

## API Response Format

All user-related endpoints return badges with the `awardedAt` timestamp:

```typescript
// /api/auth/me, /api/users/[id]
{
  id: "user-123",
  name: "Alex Chen",
  badges: [
    {
      id: "first-giveaway",
      name: "First Giveaway",
      description: "Created your first giveaway",
      color: "bg-purple-100 text-purple-800",
      tier: "Bronze",
      iconUrl: "https://api.dicebear.com/9.x/icons/svg?seed=first-giveaway",
      awardedAt: "2026-03-25T10:30:00Z"
    }
  ]
}
```

## UI Components

### Achievements Dialog

The [`AchievementsDialog`](../components/achievements-dialog.tsx) component displays earned badges:

```tsx
<AchievementsDialog
  open={showBadges}
  onOpenChange={setShowBadges}
  badges={user.badges}
  userName={user.name}
/>
```

Features:
- Displays badge icon, name, description, and tier
- Shows award date
- Responsive grid layout
- Empty state for users without badges

## Error Handling

The badge awarding system uses **best-effort** error handling:

```typescript
try {
  // Badge evaluation and creation
} catch (error) {
  console.error('Error checking and awarding badges:', error);
  // Don't throw - badge awarding shouldn't break main operations
}
```

This ensures that:
- Database errors don't prevent the primary action (post creation, entry submission, etc.)
- Errors are logged for debugging
- The user experience remains uninterrupted

## Testing

### Unit Tests

Test badge rules individually:

```typescript
describe('Badge Rules', () => {
  it('should award First Giveaway badge when user creates first giveaway', async () => {
    const userId = await createTestUser();
    await createGiveaway(userId);
    
    const badges = await prisma.userBadge.findMany({
      where: { userId },
    });
    
    expect(badges.some(b => b.badgeId === 'first-giveaway')).toBe(true);
  });
});
```

### Integration Tests

Verify end-to-end badge awarding through API endpoints:

```typescript
describe('POST /api/entries', () => {
  it('should trigger badge evaluation after entry submission', async () => {
    const user = await authenticateUser();
    const post = await createGiveawayPost();
    
    const response = await submitEntry(post.id, user.token);
    
    expect(response.status).toBe(201);
    // Badge should be evaluated and potentially awarded
  });
});
```

## CI/CD Pipeline

### GitHub Actions Workflow

The build workflow (`.github/workflows/build.yml`) includes:

1. **Database Setup**: PostgreSQL service container
2. **Prisma Migration**: Apply schema migrations
3. **Database Seeding**: Seed badges and ranks
4. **Build Verification**: Ensure TypeScript compilation succeeds
5. **Artifact Upload**: Build artifacts for deployment

### Key Steps

```yaml
- name: Seed database with badges
  run: npx prisma db seed

- name: Build application
  run: npm run build
```

## Manual Badge Awarding

For special cases or administrative purposes, badges can be awarded manually:

```typescript
import { awardBadge } from '@/lib/badges';

// Force award a specific badge
await awardBadge(userId, 'community-hero');
```

This is useful for:
- Migrating legacy achievements
- Special recognition
- Testing during development

## Migration from Client-Side Logic

### Before (Client-Side)
```typescript
// app-context.tsx - OLD APPROACH
dispatch({ type: 'AWARD_BADGE', payload: { userId, badge } });
```

### After (Server-Side)
```typescript
// API endpoint - CURRENT APPROACH
await checkAndAwardBadges(user.id);
// Frontend automatically reflects changes via API refetch
```

### Benefits

1. **Persistence**: Badges stored in database, not just memory
2. **Consistency**: Single source of truth across all clients
3. **Security**: Server validates eligibility criteria
4. **Reliability**: Works even if user closes browser immediately
5. **Scalability**: Can process badge evaluation asynchronously if needed

## Performance Considerations

### Optimization Strategies

1. **Efficient Queries**: Uses Prisma's `count()` for O(1) checks
2. **Skip Duplicates**: Checks owned badges before evaluation
3. **Best-Effort**: Non-blocking error handling
4. **Targeted Evaluation**: Only checks relevant badges per action

### Future Improvements

- Implement caching for badge counts
- Batch evaluation for multiple actions
- Background job processing for heavy computations
- Incremental checks (only evaluate changed criteria)

## Troubleshooting

### Common Issues

**Issue**: Badges not appearing after action
- **Check**: Database connection and Prisma client generation
- **Verify**: Badge exists in database (`SELECT * FROM badges`)
- **Debug**: Check server logs for award messages

**Issue**: Duplicate badges awarded
- **Check**: `ownedBadgeIds` set logic in `checkAndAwardBadges`
- **Verify**: Database unique constraint on `userId_badgeId`

**Issue**: Badge criteria not triggering
- **Check**: Threshold values in check functions (e.g., `=== 10` vs `>= 10`)
- **Verify**: User action counts match expected thresholds

## Future Enhancements

1. **Dynamic Badge Configuration**: Store rules in database instead of code
2. **Notification System**: Push notifications when badges are earned
3. **Badge Tiers**: Progressive badges (Bronze → Silver → Gold)
4. **Analytics Dashboard**: Track badge earning rates
5. **Seasonal Badges**: Time-limited achievement opportunities
6. **Community Nominations**: Peer-nominated badges

## Related Files

- `lib/badges.ts` - Core badge logic
- `prisma/seed.ts` - Badge definitions
- `components/achievements-dialog.tsx` - UI display
- `.github/workflows/build.yml` - CI/CD pipeline
- `app/api/**/route.ts` - API integration points
