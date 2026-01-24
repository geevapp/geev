# Entry API Documentation

## Overview

The Entry API provides endpoints for users to submit entries to giveaways/requests and retrieve entry lists. Each user can submit one entry per post.

## Base URL

All endpoints are relative to `/api`

## Authentication

All endpoints require authentication. Pass the user ID in the `x-user-id` header for development/testing purposes.

**Example:**
```bash
curl -H "x-user-id: user-1" http://localhost:3000/api/posts/post-1/entries
```

## Endpoints

### 1. Submit Entry to Post

**POST** `/posts/{postId}/entries`

Submit an entry to a specific post (giveaway or help request).

#### Request Body

```json
{
  "content": "string",        // Required. Entry message (10-1000 characters)
  "proofUrl": "string"        // Optional. URL to proof document/image
}
```

#### Success Response

```json
{
  "success": true,
  "data": {
    "id": "entry-123",
    "postId": "post-1",
    "userId": "user-1",
    "content": "I would love to win this giveaway!",
    "proofUrl": "https://example.com/proof.jpg",
    "isWinner": false,
    "createdAt": "2024-01-15T10:30:00Z",
    "user": {
      "id": "user-1",
      "name": "Alex Chen",
      "avatar": "https://...",
      "username": "alexchen"
    }
  },
  "message": "Entry submitted successfully"
}
```

#### Error Responses

- `400 Bad Request` - Invalid content length or post is closed
- `401 Unauthorized` - User not authenticated
- `404 Not Found` - Post not found
- `400 Bad Request` - User already entered this post

---

### 2. List Entries for Post

**GET** `/posts/{postId}/entries`

Retrieve all entries for a specific post, sorted by creation date (newest first).

#### Success Response

```json
{
  "success": true,
  "data": [
    {
      "id": "entry-1",
      "postId": "post-1",
      "userId": "user-1",
      "content": "Great giveaway!",
      "proofUrl": null,
      "isWinner": false,
      "createdAt": "2024-01-15T10:30:00Z",
      "user": {
        "id": "user-1",
        "name": "Alex Chen",
        "avatar": "https://...",
        "username": "alexchen"
      }
    }
  ]
}
```

#### Error Responses

- `401 Unauthorized` - User not authenticated
- `404 Not Found` - Post not found

---

### 3. List User's Entries

**GET** `/users/{userId}/entries`

Retrieve all entries submitted by a specific user, sorted by creation date (newest first).

#### Success Response

```json
{
  "success": true,
  "data": {
    "userId": "user-1",
    "userName": "Alex Chen",
    "userAvatar": "https://...",
    "entries": [
      {
        "id": "entry-1",
        "postId": "post-1",
        "content": "I want to win!",
        "proofUrl": null,
        "isWinner": false,
        "createdAt": "2024-01-15T10:30:00Z",
        "post": {
          "id": "post-1",
          "title": "Amazing Giveaway",
          "description": "Win cool prizes",
          "category": "giveaway",
          "status": "open"
        }
      }
    ],
    "totalEntries": 5
  }
}
```

#### Error Responses

- `401 Unauthorized` - User not authenticated
- `404 Not Found` - User not found

---

### 4. Get Single Entry

**GET** `/entries/{entryId}`

Retrieve details of a specific entry.

#### Success Response

```json
{
  "success": true,
  "data": {
    "id": "entry-1",
    "postId": "post-1",
    "userId": "user-1",
    "content": "I want to win!",
    "proofUrl": null,
    "isWinner": false,
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

#### Error Responses

- `404 Not Found` - Entry not found

---

### 5. Delete Entry

**DELETE** `/entries/{entryId}`

Delete a user's own entry.

#### Success Response

```json
{
  "success": true,
  "data": {
    "id": "entry-1",
    "postId": "post-1",
    "userId": "user-1",
    "content": "I want to win!",
    "proofUrl": null,
    "isWinner": false,
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "message": "Entry deleted successfully"
}
```

#### Error Responses

- `401 Unauthorized` - User not authenticated
- `403 Forbidden` - User doesn't own this entry
- `404 Not Found` - Entry not found

## Validation Rules

### Content Validation
- **Minimum length**: 10 characters
- **Maximum length**: 1000 characters
- **Required**: Yes

### Business Rules
1. **One entry per user per post**: Users cannot submit multiple entries to the same post
2. **Post must be open**: Entries can only be submitted to posts with status "open" and before the end date
3. **Ownership**: Users can only delete their own entries
4. **Authentication required**: All endpoints except GET `/entries/{id}` require authentication

## Example Usage

### Submitting an Entry

```bash
curl -X POST http://localhost:3000/api/posts/post-1/entries \
  -H "Content-Type: application/json" \
  -H "x-user-id: user-1" \
  -d '{
    "content": "I am excited to participate in this giveaway! I have been following the community for months and would love to contribute more.",
    "proofUrl": "https://imgur.com/my-proof-image"
  }'
```

### Getting Post Entries

```bash
curl -H "x-user-id: user-1" http://localhost:3000/api/posts/post-1/entries
```

### Getting User's Entry History

```bash
curl -H "x-user-id: user-1" http://localhost:3000/api/users/user-1/entries
```

### Deleting an Entry

```bash
curl -X DELETE -H "x-user-id: user-1" http://localhost:3000/api/entries/entry-123
```

## Implementation Notes

### Current Implementation
This is a mock implementation using in-memory data structures for development purposes. In production, this would connect to a PostgreSQL database using Prisma ORM.

### Future Enhancements
- Add pagination for entry lists
- Implement entry editing (currently out of scope)
- Add entry voting/liking functionality
- Support nested comments/replies on entries
- Add moderation tools for post creators
- Implement real-time notifications for entry submissions

### Database Schema
The API maps to the following Prisma models:
- `Entry` - Main entry model
- `Post` - Parent post for entries
- `User` - Entry submitter

See `prisma/schema.prisma` for the full database schema.
