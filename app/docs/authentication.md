# Wallet-Based Authentication System

## Overview

This authentication system provides secure wallet-based login and registration for the Geev application. Users can authenticate using their wallet addresses with cryptographic signatures.

## Features

- 🔐 Wallet-based authentication
- 📝 User registration with wallet address
- 🔑 JWT token management
- 🛡️ Route protection middleware
- 🍪 Secure HTTP-only cookies
- 📱 Session management
- 🧪 Comprehensive test coverage

## API Endpoints

### POST /api/auth/register
Register a new user with wallet address

**Request Body:**
```json
{
  "walletAddress": "0x123456789...",
  "signature": "0xabcdef...",
  "message": "Sign this message...",
  "username": "john_doe",
  "email": "john@example.com" (optional)
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user_123",
    "walletAddress": "0x123456789...",
    "username": "john_doe",
    "email": "john@example.com",
    "avatar": "https://api.dicebear.com/...",
    "bio": null,
    "joinDate": "2024-01-01T00:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### POST /api/auth/login
Authenticate existing user with wallet

**Request Body:**
```json
{
  "walletAddress": "0x123456789...",
  "signature": "0xabcdef...",
  "message": "Sign this message..."
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user_123",
    "walletAddress": "0x123456789...",
    "username": "john_doe",
    "email": "john@example.com",
    "avatar": "https://api.dicebear.com/...",
    "bio": null,
    "joinDate": "2024-01-01T00:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### POST /api/auth/logout
End user session

**Response:**
```json
{
  "success": true,
  "message": "Successfully logged out"
}
```

### GET /api/auth/session
Get current session information

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user_123",
    "walletAddress": "0x123456789...",
    "username": "john_doe",
    "email": "john@example.com",
    "avatar": "https://api.dicebear.com/...",
    "bio": null,
    "joinDate": "2024-01-01T00:00:00.000Z"
  },
  "token": {
    "expiresAt": "2024-01-31T00:00:00.000Z"
  }
}
```

## Authentication Flow

1. **Registration:**
   - User provides wallet address, username, and optional email
   - Wallet signs authentication message
   - Signature is verified
   - User account is created
   - JWT token is generated and returned

2. **Login:**
   - User provides wallet address
   - Wallet signs authentication message
   - Signature is verified
   - JWT token is generated and returned

3. **Session Management:**
   - Token stored in HTTP-only cookie
   - Middleware validates token on protected routes
   - Token automatically expires after 30 days

## Security Features

- **JWT Tokens**: Cryptographically signed JSON Web Tokens
- **HTTP-Only Cookies**: Prevents XSS attacks
- **Secure Cookies**: Only sent over HTTPS in production
- **SameSite Protection**: Prevents CSRF attacks
- **Signature Verification**: Cryptographic proof of wallet ownership
- **Token Expiration**: Automatic session timeout
- **Rate Limiting**: Built-in request limiting (Next.js default)

## Wallet Integration (Demo Mode)

Current implementation uses mock signature verification for demonstration purposes. In production, integrate with actual wallet providers:

```javascript
// Example integration with ethers.js
import { ethers } from 'ethers';

const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();
const signature = await signer.signMessage(message);
```

## Protected Routes

The following routes require authentication:
- `/api/posts` (POST, PUT, DELETE)
- `/api/wallet/*`
- `/wallet`
- `/settings`
- `/profile/*`

The following routes are public:
- `/api/auth/*`
- `/api/health`
- `/api/posts` (GET only)
- `/`

## Error Handling

All endpoints return appropriate HTTP status codes:
- `200`: Success
- `400`: Bad request (invalid data)
- `401`: Unauthorized (invalid token/no token)
- `404`: Not found (user not found)
- `409`: Conflict (user already exists)
- `500`: Internal server error

## Testing

Run authentication tests:
```bash
npm test auth.test.ts
```

## Environment Variables

```env
NEXTAUTH_SECRET=your-secret-key-here
DATABASE_URL=your-database-url
NODE_ENV=development|production
```

## Next Steps for Production

1. **Wallet Integration**: Replace mock signature verification with actual wallet providers
2. **Rate Limiting**: Add explicit rate limiting for auth endpoints
3. **Email Verification**: Add email verification for registered users
4. **Password Recovery**: Implement wallet-based account recovery
5. **Multi-Wallet Support**: Support multiple wallet addresses per user
6. **Session Monitoring**: Add logging and monitoring for auth events
7. **Token Refresh**: Implement token refresh mechanism
8. **Logout All Sessions**: Add endpoint to logout from all devices

## Dependencies

- `jose`: JWT token creation and verification
- `next-auth`: Authentication framework
- `zod`: Request validation
- `@prisma/client`: Database operations