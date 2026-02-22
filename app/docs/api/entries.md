# Entry API Documentation

This document describes the Entry API endpoints for submitting, retrieving, and managing giveaway entries.

## Endpoints

### 1. Submit Entry to Giveaway

Submit an entry to a giveaway post.

**Endpoint:** `POST /api/posts/[id]/entries`

**Authentication:** Required

**Request Body:**
```json
{
  "content": "string (10-5000 characters, required)",
  "proofUrl": "string (optional)"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Entry created successfully",
  "data": {
    "id": "entry-uuid",
    "postId": "post-uuid",
    "userId": "user-uuid",
    "content": "Entry content",
    "proofUrl": "https://example.com/proof.jpg",
    "isWinner": false,
    "createdAt": "2025-01-15T10:30:00.000Z",
    "user": {
      "id": "user-uuid",
      "name": "User Name",
      "walletAddress": "GUSER123...",
      "avatarUrl": "https://..."
    }
  }
}
```

**Error Responses:**

- `401 Unauthorized` - User not authenticated
- `400 Bad Request` - Invalid content length, duplicate entry, or post not accepting entries
- `403 Forbidden` - User trying to enter their own giveaway
- `404 Not Found` - Post does not exist

**Example Request:**
```bash
curl -X POST http://localhost:3000/api/posts/abc123/entries \
  -H "Content-Type: application/json" \
  -H "x-mock-wallet: GUSER123..." \
  -d '{
    "content": "I would love to win this giveaway!",
    "proofUrl": "https://example.com/proof.jpg"
  }'
```

**Business Rules:**
- Content must be between 10 and 5000 characters
- Users can only enter a giveaway once (unique constraint on `[postId, userId]`)
- Post must have status `open`
- Post must be of type `giveaway`
- Creators cannot enter their own giveaways
- ProofUrl is optional

---

### 2. Get Entries for a Post

Retrieve all entries for a specific post with pagination.

**Endpoint:** `GET /api/posts/[id]/entries`

**Authentication:** Not required

**Query Parameters:**
- `page` (optional, default: 1) - Page number (minimum: 1)
- `limit` (optional, default: 10) - Items per page (minimum: 1, maximum: 100)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "entries": [
      {
        "id": "entry-uuid",
        "postId": "post-uuid",
        "userId": "user-uuid",
        "content": "Entry content",
        "proofUrl": "https://example.com/proof.jpg",
        "isWinner": false,
        "createdAt": "2025-01-15T10:30:00.000Z",
        "user": {
          "id": "user-uuid",
          "name": "User Name",
          "walletAddress": "GUSER123...",
          "avatarUrl": "https://..."
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3
    }
  }
}
```

**Error Responses:**

- `400 Bad Request` - Invalid pagination parameters
- `404 Not Found` - Post does not exist

**Example Request:**
```bash
curl http://localhost:3000/api/posts/abc123/entries?page=2&limit=20
```

**Business Rules:**
- Entries are sorted by creation date (newest first)
- Each entry includes associated user information
- Page must be at least 1
- Limit must be between 1 and 100

---

### 3. Delete Entry

Delete an entry (only the owner can delete their own entry).

**Endpoint:** `DELETE /api/entries/[id]`

**Authentication:** Required

**Success Response (200):**
```json
{
  "success": true,
  "message": "Entry deleted successfully",
  "data": {
    "id": "entry-uuid"
  }
}
```

**Error Responses:**

- `401 Unauthorized` - User not authenticated
- `403 Forbidden` - User trying to delete someone else's entry
- `400 Bad Request` - Post is closed or completed
- `404 Not Found` - Entry does not exist

**Example Request:**
```bash
curl -X DELETE http://localhost:3000/api/entries/xyz789 \
  -H "x-mock-wallet: GUSER123..."
```

**Business Rules:**
- Only the entry owner can delete their entry
- Entries can only be deleted from posts with status `open`
- Cannot delete entries from closed or completed posts

---

## Data Models

### Entry

```typescript
interface Entry {
  id: string;                  // UUID
  postId: string;              // Foreign key to Post
  userId: string;              // Foreign key to User
  content: string;             // Entry content (10-5000 chars)
  proofUrl: string | null;     // Optional proof URL
  isWinner: boolean;           // Winner flag (default: false)
  createdAt: Date;             // Creation timestamp
}
```

---

## Error Handling

All endpoints return errors in the following format:

```json
{
  "success": false,
  "error": "Error message description"
}
```

Common HTTP status codes:
- `200` - Success (for GET and DELETE operations)
- `201` - Created (for POST operations)
- `400` - Bad Request (validation errors, business rule violations)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error (unexpected server errors)

---

## Testing

Run the comprehensive test suite:

```bash
npm test tests/api/entries.test.ts
```

The test suite covers:
- Successful entry creation
- Entry creation without proofUrl
- Authentication validation
- Content length validation
- Duplicate entry prevention
- Post status validation
- Creator self-entry prevention
- Pagination
- Entry deletion with authorization checks
- Error scenarios

---

## Notes

- The authentication system currently uses mock authentication for development
- In production, replace mock authentication with proper JWT or wallet signature verification
- ProofUrl can be used to store links to social media posts, screenshots, or other proof of entry
- The `isWinner` flag is set automatically by the winner selection system
