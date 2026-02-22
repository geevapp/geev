# Entry API Documentation

This document describes the API endpoints for managing entries in giveaways and requests.

## Endpoints

### 1. Submit Entry to Post

**POST** `/api/posts/[id]/entries`

Submit an entry to a giveaway or request.

#### Authentication

Required. User must be logged in.

#### Path Parameters

| Parameter | Type   | Description               |
|-----------|--------|---------------------------|
| id        | string | The ID of the post        |

#### Request Body

```json
{
  "content": "string (required, min: 10 chars, max: 5000 chars)",
  "proofUrl": "string (optional)"
}
```

#### Success Response

**Code:** 201 Created

**Content:**
```json
{
  "success": true,
  "message": "Entry created successfully",
  "data": {
    "id": "string",
    "postId": "string",
    "userId": "string",
    "content": "string",
    "proofUrl": "string | null",
    "isWinner": false,
    "createdAt": "timestamp",
    "user": {
      "id": "string",
      "name": "string",
      "avatarUrl": "string | null"
    }
  }
}
```

#### Error Responses

**Code:** 401 Unauthorized
```json
{
  "success": false,
  "error": "Unauthorized"
}
```

**Code:** 400 Bad Request
```json
{
  "success": false,
  "error": "Entry must be at least 10 characters"
}
```

**Code:** 400 Bad Request
```json
{
  "success": false,
  "error": "You have already entered this post"
}
```

**Code:** 400 Bad Request
```json
{
  "success": false,
  "error": "You cannot enter your own post"
}
```

**Code:** 400 Bad Request
```json
{
  "success": false,
  "error": "Post is closed"
}
```

**Code:** 400 Bad Request
```json
{
  "success": false,
  "error": "Post has ended"
}
```

**Code:** 404 Not Found
```json
{
  "success": false,
  "error": "Post not found"
}
```

#### Business Rules

- Users can only submit one entry per post
- Users cannot enter their own posts
- Entries can only be submitted to open posts
- Entries cannot be submitted after the post end date
- Entry content must be between 10 and 5000 characters

---

### 2. Get Entries for Post

**GET** `/api/posts/[id]/entries`

Retrieve all entries for a specific post with pagination.

#### Authentication

Not required (public endpoint).

#### Path Parameters

| Parameter | Type   | Description               |
|-----------|--------|---------------------------|
| id        | string | The ID of the post        |

#### Query Parameters

| Parameter | Type    | Default | Description                        |
|-----------|---------|---------|-------------------------------------|
| page      | integer | 1       | Page number for pagination         |
| limit     | integer | 20      | Number of entries per page         |

#### Success Response

**Code:** 200 OK

**Content:**
```json
{
  "success": true,
  "data": {
    "entries": [
      {
        "id": "string",
        "postId": "string",
        "userId": "string",
        "content": "string",
        "proofUrl": "string | null",
        "isWinner": false,
        "createdAt": "timestamp",
        "user": {
          "id": "string",
          "name": "string",
          "avatarUrl": "string | null",
          "xp": number
        }
      }
    ],
    "page": number,
    "limit": number,
    "total": number
  }
}
```

#### Error Responses

**Code:** 404 Not Found
```json
{
  "success": false,
  "error": "Post not found"
}
```

---

### 3. Get User's Entries

**GET** `/api/users/[id]/entries`

Retrieve all entries submitted by a specific user.

#### Authentication

Not required (public endpoint).

#### Path Parameters

| Parameter | Type   | Description               |
|-----------|--------|---------------------------|
| id        | string | The ID of the user        |

#### Success Response

**Code:** 200 OK

**Content:**
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "postId": "string",
      "userId": "string",
      "content": "string",
      "proofUrl": "string | null",
      "isWinner": false,
      "createdAt": "timestamp",
      "post": {
        "id": "string",
        "title": "string",
        "type": "giveaway | request",
        "status": "open | closed | completed",
        "createdAt": "timestamp"
      }
    }
  ]
}
```

#### Error Responses

**Code:** 404 Not Found
```json
{
  "success": false,
  "error": "User not found"
}
```

---

### 4. Delete Entry

**DELETE** `/api/entries/[id]`

Delete a user's own entry. Only allowed while the post is still open.

#### Authentication

Required. User must be logged in and must own the entry.

#### Path Parameters

| Parameter | Type   | Description               |
|-----------|--------|---------------------------|
| id        | string | The ID of the entry       |

#### Success Response

**Code:** 200 OK

**Content:**
```json
{
  "success": true,
  "message": "Entry deleted successfully",
  "data": {
    "id": "string"
  }
}
```

#### Error Responses

**Code:** 401 Unauthorized
```json
{
  "success": false,
  "error": "Unauthorized"
}
```

**Code:** 403 Forbidden
```json
{
  "success": false,
  "error": "You can only delete your own entries"
}
```

**Code:** 404 Not Found
```json
{
  "success": false,
  "error": "Entry not found"
}
```

**Code:** 400 Bad Request
```json
{
  "success": false,
  "error": "Cannot delete entry after post has closed or ended"
}
```

#### Business Rules

- Users can only delete their own entries
- Entries can only be deleted while the post is still open
- Once a post is closed or has ended, entries cannot be deleted

---

## Database Schema

The Entry model in the database:

```typescript
model Entry {
  id        String   @id @default(uuid())
  postId    String   @map("post_id")
  userId    String   @map("user_id")
  content   String
  proofUrl  String?  @map("proof_url")
  isWinner  Boolean  @default(false) @map("is_winner")
  createdAt DateTime @default(now()) @map("created_at")

  post     Post      @relation(fields: [postId], references: [id], onDelete: Cascade)
  user     User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  comments Comment[]

  @@unique([postId, userId])
  @@index([postId])
  @@index([userId])
  @@map("entries")
}
```

## Example Usage

### Submit an Entry

```bash
curl -X POST https://api.geev.app/api/posts/abc123/entries \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "content": "I would love to win this gaming laptop because I am a game developer!",
    "proofUrl": "https://github.com/myusername"
  }'
```

### Get Entries for a Post

```bash
curl https://api.geev.app/api/posts/abc123/entries?page=1&limit=20
```

### Get User's Entries

```bash
curl https://api.geev.app/api/users/user123/entries
```

### Delete an Entry

```bash
curl -X DELETE https://api.geev.app/api/entries/entry123 \
  -H "Authorization: Bearer YOUR_TOKEN"
```
