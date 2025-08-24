# API Documentation

This document provides comprehensive information about the Electronic Voting System REST API.

## Base URL

```
Development: http://localhost:3001
Production: https://your-domain.com/api
```

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Response Format

All API responses follow this standard format:

```json
{
  "success": true,
  "data": {},
  "message": "Operation completed successfully",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

Error responses:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": []
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Endpoints

### Authentication

#### POST /auth/login

Authenticate a user and receive a JWT token.

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "admin",
      "role": "admin",
      "hasVoted": false
    }
  },
  "message": "Login successful"
}
```

**Status Codes:**
- `200` - Success
- `401` - Invalid credentials
- `400` - Validation error

#### POST /auth/register

Register a new user (admin only).

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Request Body:**
```json
{
  "username": "string",
  "password": "string",
  "role": "voter" | "admin"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "username": "newuser",
    "role": "voter",
    "hasVoted": false,
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "message": "User registered successfully"
}
```

**Status Codes:**
- `201` - Created
- `400` - Validation error
- `401` - Unauthorized
- `403` - Forbidden (not admin)
- `409` - Username already exists

#### GET /auth/profile

Get current user profile.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "admin",
    "role": "admin",
    "hasVoted": false,
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

### Candidates

#### GET /candidates

Get all candidates.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "candidateNumber": "01",
      "ketua": "John Doe",
      "wakil": "Jane Smith",
      "imageUrl": "https://example.com/image1.jpg",
      "visi": "Our vision for the future",
      "misi": "Our mission statement",
      "votes": 0
    }
  ]
}
```

#### POST /candidates

Create a new candidate (admin only).

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Request Body:**
```json
{
  "candidateNumber": "string",
  "ketua": "string",
  "wakil": "string",
  "imageUrl": "string",
  "visi": "string",
  "misi": "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "candidateNumber": "02",
    "ketua": "Alice Johnson",
    "wakil": "Bob Wilson",
    "imageUrl": "https://example.com/image2.jpg",
    "visi": "Innovation and progress",
    "misi": "Serving the community",
    "votes": 0,
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "message": "Candidate created successfully"
}
```

**Status Codes:**
- `201` - Created
- `400` - Validation error
- `401` - Unauthorized
- `403` - Forbidden (not admin)
- `409` - Candidate number already exists

#### PUT /candidates/:id

Update a candidate (admin only).

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Request Body:**
```json
{
  "candidateNumber": "string",
  "ketua": "string",
  "wakil": "string",
  "imageUrl": "string",
  "visi": "string",
  "misi": "string"
}
```

**Status Codes:**
- `200` - Updated
- `400` - Validation error
- `401` - Unauthorized
- `403` - Forbidden (not admin)
- `404` - Candidate not found

#### DELETE /candidates/:id

Delete a candidate (admin only).

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Status Codes:**
- `200` - Deleted
- `401` - Unauthorized
- `403` - Forbidden (not admin)
- `404` - Candidate not found

### Votes

#### POST /votes

Cast a vote.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "candidateId": 1
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "candidateId": 1,
    "userId": 2,
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "message": "Vote cast successfully"
}
```

**Status Codes:**
- `201` - Vote cast
- `400` - Validation error
- `401` - Unauthorized
- `403` - User already voted
- `404` - Candidate not found

#### GET /votes/results

Get voting results.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalVotes": 150,
    "candidates": [
      {
        "id": 1,
        "candidateNumber": "01",
        "ketua": "John Doe",
        "wakil": "Jane Smith",
        "votes": 75,
        "percentage": 50.0
      },
      {
        "id": 2,
        "candidateNumber": "02",
        "ketua": "Alice Johnson",
        "wakil": "Bob Wilson",
        "votes": 75,
        "percentage": 50.0
      }
    ]
  }
}
```

#### GET /votes/my-vote

Get current user's vote.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "hasVoted": true,
    "vote": {
      "id": 1,
      "candidateId": 1,
      "candidate": {
        "candidateNumber": "01",
        "ketua": "John Doe",
        "wakil": "Jane Smith"
      },
      "createdAt": "2024-01-15T10:30:00Z"
    }
  }
}
```

### Users

#### GET /users

Get all users (admin only).

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `role` (optional): Filter by role

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": 1,
        "username": "admin",
        "role": "admin",
        "hasVoted": false,
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  }
}
```

#### PUT /users/:id

Update a user (admin only).

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Request Body:**
```json
{
  "username": "string",
  "role": "voter" | "admin",
  "password": "string" // optional
}
```

**Status Codes:**
- `200` - Updated
- `400` - Validation error
- `401` - Unauthorized
- `403` - Forbidden (not admin)
- `404` - User not found

#### DELETE /users/:id

Delete a user (admin only).

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Status Codes:**
- `200` - Deleted
- `401` - Unauthorized
- `403` - Forbidden (not admin)
- `404` - User not found

### Audit Logs

#### GET /audit-logs

Get audit logs (admin only).

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `action` (optional): Filter by action type
- `startDate` (optional): Filter from date (ISO string)
- `endDate` (optional): Filter to date (ISO string)

**Response:**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": 1,
        "action": "USER_LOGIN",
        "details": "User admin logged in",
        "timestamp": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "pages": 10
    }
  }
}
```

## Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Request validation failed |
| `AUTHENTICATION_ERROR` | Invalid or missing authentication |
| `AUTHORIZATION_ERROR` | Insufficient permissions |
| `NOT_FOUND` | Resource not found |
| `CONFLICT` | Resource conflict (duplicate) |
| `ALREADY_VOTED` | User has already cast a vote |
| `INTERNAL_ERROR` | Server internal error |

## Rate Limiting

API endpoints are rate limited to prevent abuse:

- **Authentication endpoints**: 5 requests per minute per IP
- **Voting endpoints**: 1 request per minute per user
- **General endpoints**: 100 requests per minute per IP
- **Admin endpoints**: 50 requests per minute per user

## Security Headers

All API responses include security headers:

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

## Webhooks (Future Feature)

Webhook endpoints for real-time notifications:

- `POST /webhooks/vote-cast` - Triggered when a vote is cast
- `POST /webhooks/election-end` - Triggered when election ends

## SDK and Libraries

Official SDKs and client libraries:

- JavaScript/TypeScript: `@election-system/js-sdk`
- Python: `election-system-python`
- PHP: `election-system-php`

## Support

For API support:
- Email: api-support@election-system.com
- Documentation: https://docs.election-system.com
- Status Page: https://status.election-system.com