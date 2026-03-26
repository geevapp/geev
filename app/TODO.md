# API Integration for Modals - TODO

## Approved Plan Summary
- Remove fake createPost/submitEntry/makeContribution from app-context.tsx
- Add refreshPosts() and refreshEntries(postId) to context  
- Modals: Replace context fake calls → real API POST + refresh on success
- Contributions: Keep local-only (no API endpoint yet)
- Use direct fetch() (no new helpers needed)

## Step-by-Step Implementation


   - Remove `createPost`, `submitEntry`, `makeContribution` functions
   - Update contextValue to expose refresh fns
   - Keep dispatch actions (ADD_ENTRY etc. not needed anymore)

### 2. Update CreateGiveawayModal ✅
   - handleSubmit: fetch(POST /api/posts, {formData})
   - Success: context.refreshPosts() + toast + reset + close
   - Remove `const { createPost } = useAppContext()`

### 3. Update CreateRequestModal ✅  
   - Same as above for help-requests

### 4. Update EntryForm ✅
   - handleSubmit: fetch(POST /api/posts/${post.id}/entries)
   - Success: context.refreshEntries(post.id) + context.refreshPosts()

### 5. Update ContributionForm ✅
   - Keep existing `makeContribution` call (local only for now)

### 6. Test
   - Open app, test all modals
   - Verify data persists on refresh
   - Check API routes work

### 7. Cleanup
   - Remove unused context actions if any
   - attempt_completion

**Next: Step 1 - Context updates**

