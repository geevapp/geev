# Leaderboard API Documentation

## Overview

The Leaderboard API provides ranked lists of top contributors based on their activity on the platform. Users are ranked by their total contributions (posts + entries) and can be filtered by time periods.

## Endpoint

```
GET /api/leaderboard
```

## Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `period` | string | `all-time` | Time period filter. Options: `all-time`, `monthly`, `weekly` |
| `page` | number | `1` | Page number for pagination (minimum: 1) |
| `limit` | number | `50` | Number of results per page (minimum: 1, maximum: 100) |

## Response Format

### Success Response (200)

```json
{
  "success": true,
  "data": {
    "leaderboard": [
      {
        "id": "string",
        "name": "string",
        "avatar_url": "string",
        "xp": number,
        "post_count": number,
        "entry_count": number,
        "total_contributions": number,
        "badges": [
          {
            "id": "string",
            "name": "string",
            "description": "string",
            "tier": number,
            "icon": "string",
            "color": "string"
          }
        ]
      }
    ],
    "page": number,
    "limit": number,
    "period": "string",
    "total": number
  }
}
```

### Error Response (400/500)

```json
{
  "success": false,
  "error": "string"
}
```

## Examples

### Get all-time leaderboard

```bash
curl "http://localhost:3000/api/leaderboard"
```

### Get weekly leaderboard with pagination

```bash
curl "http://localhost:3000/api/leaderboard?period=weekly&page=1&limit=10"
```

### Get monthly leaderboard

```bash
curl "http://localhost:3000/api/leaderboard?period=monthly"
```

## Ranking Logic

Users are ranked by their `total_contributions` in descending order. The `total_contributions` is calculated as:

```
total_contributions = post_count + entry_count
```

When a time period filter is applied, only posts and entries created within that period are counted.

## Performance

- Target response time: < 500ms
- Results are sorted in-memory after database query
- Badges are fetched separately for each user (could be optimized with joins)