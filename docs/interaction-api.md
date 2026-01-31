# Interaction API Documentation

This document describes the API endpoints for the interaction system (likes and burns).

## Base URL
`/api/posts/[id]`

## Endpoints

### Like a Post
- **URL**: `POST /api/posts/:id/like`
- **Authentication**: Required
- **Description**: Adds a "like" interaction for the current user on the specified post. If the user already liked the post, this operation is idempotent (upsert).
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "liked": true,
      "count": 123
    }
  }
  ```

### Unlike a Post
- **URL**: `DELETE /api/posts/:id/like`
- **Authentication**: Required
- **Description**: Removes the "like" interaction for the current user on the specified post.
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "liked": false,
      "count": 122
    }
  }
  ```

### Burn a Post
- **URL**: `POST /api/posts/:id/burn`
- **Authentication**: Required
- **Description**: Adds a "burn" interaction for the current user on the specified post. Burns are distinct from likes.
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "burned": true,
      "count": 45
    }
  }
  ```

### Unburn a Post
- **URL**: `DELETE /api/posts/:id/burn`
- **Authentication**: Required
- **Description**: Removes the "burn" interaction for the current user on the specified post.
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "burned": false,
      "count": 44
    }
  }
  ```

### Get Interaction Stats
- **URL**: `GET /api/posts/:id/stats`
- **Authentication**: Public (Optional)
- **Description**: Retrieves the total counts of likes, burns, and entries for a post.
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "likes": 123,
      "burns": 45,
      "entries": 10
    }
  }
  ```

## Notes
- Interactions are stored in the `Interaction` model.
- A user can have at most one like AND one burn per post (based on current implementation allowing both types distinctively, though UI might enforce mutual exclusivity). The schema constraint `@@unique([userId, postId, type])` allows one of each type.
- Counts are calculated dynamically from the database.
