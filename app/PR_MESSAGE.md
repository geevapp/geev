# Feature: Allow users to save posts as drafts

## Branch Name
```
feature/60-save-posts-as-drafts
```

## Description
Implements draft functionality allowing users to save incomplete posts (giveaways and help requests) to localStorage and resume editing later. This addresses Issue #60.

## What's Changed

### Core Features
- ✅ **Save as Draft** button in create modals (giveaway & request)
- ✅ Draft storage in localStorage with persistence
- ✅ Drafts list view accessible from navbar
- ✅ Edit draft functionality
- ✅ Delete draft with confirmation
- ✅ Draft indicator badge in UI
- ✅ Draft count badge in navbar (updates in real-time)

### Technical Implementation

#### New Files
- `lib/drafts.ts` - Draft storage utilities (save, load, update, delete)
- `components/create-modal.tsx` - Main modal for choosing post type
- `components/giveaway-modal.tsx` - Giveaway creation/editing modal with draft support
- `components/request-modal.tsx` - Help request creation/editing modal with draft support
- `components/drafts-list.tsx` - Drafts management UI with list, edit, and delete

#### Modified Files
- `lib/types.ts` - Added `Draft` interface
- `components/app-layout.tsx` - Integrated create modals
- `components/auth-navbar.tsx` - Added draft count badge and drafts list access

### Features

1. **Draft Storage**
   - Drafts stored in localStorage with key `geev_drafts`
   - Automatic persistence across page refreshes
   - Real-time updates via custom events

2. **Create Modals**
   - New create modal for choosing post type
   - Giveaway modal with full form fields
   - Request modal with full form fields
   - Both modals support saving as draft

3. **Draft Management**
   - View all drafts in a dedicated modal
   - Edit drafts (loads into appropriate modal)
   - Delete drafts with confirmation
   - Shows last saved timestamp
   - Displays draft type (giveaway/request) with badges

4. **UI Enhancements**
   - Draft count badge in navbar (FileText icon)
   - Draft indicator badge when editing
   - Visual distinction between giveaway and request drafts

### Acceptance Criteria ✅
- [x] Drafts save to localStorage
- [x] Drafts persist on page refresh
- [x] Can edit saved drafts
- [x] Can delete drafts
- [x] Drafts list accessible from navbar
- [x] Draft count badge shows number of drafts
- [x] Drafts convert to posts on publish

### Testing
- ✅ Test draft save functionality
- ✅ Test draft load from localStorage
- ✅ Test draft edit
- ✅ Test draft delete
- ✅ Test persistence across sessions
- ✅ Test with multiple drafts
- ✅ Test draft conversion to post on publish

### UX Considerations
- Clear indication of draft status
- Easy access to drafts list from navbar
- Confirmation before deleting drafts
- Shows last saved timestamp
- Visual badges for draft type

## How to Test

1. **Save a Draft:**
   - Click "Create" in navbar
   - Choose "Create Giveaway" or "Request Help"
   - Fill in some fields (at least title or description)
   - Click "Save as Draft"
   - Verify draft count badge updates

2. **View Drafts:**
   - Click the FileText icon in navbar
   - Verify drafts list shows all saved drafts
   - Check draft details (title, description, timestamp)

3. **Edit Draft:**
   - Open drafts list
   - Click edit icon on a draft
   - Verify modal opens with draft data pre-filled
   - Make changes and save as draft again

4. **Delete Draft:**
   - Open drafts list
   - Click delete icon on a draft
   - Confirm deletion
   - Verify draft is removed

5. **Publish Draft:**
   - Edit a draft
   - Complete required fields
   - Click "Publish"
   - Verify draft is converted to post and removed from drafts

## Notes
- Drafts are stored locally in browser localStorage
- No cloud sync (out of scope per requirements)
- No auto-save (out of scope per requirements)
- Drafts are user-specific (stored per browser)

## Related
Closes #60
