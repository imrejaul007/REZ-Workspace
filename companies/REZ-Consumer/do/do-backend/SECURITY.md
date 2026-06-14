# Do Backend - Security Guidelines

**Version**: 2.0.0 | **Last Updated**: May 12, 2026

---

## Overview

This document outlines security requirements and best practices for the Do Backend service.

---

## Critical Security Requirements

### 1. Environment Variables (Production)

| Variable | Requirements | Default |
|----------|-------------|---------|
| `JWT_SECRET` | Minimum 32 characters | Fails in production if not set |
| `OTP_SECRET` | Minimum 32 characters | Fails in production if not set |
| `CORS_ORIGIN` | Specific URL, not `*` | Fails in production if `*` |
| `NODE_ENV` | Must be `production` | - |

**Generate secure secrets:**
```bash
openssl rand -hex 32
```

### 2. Production Startup Check

The application **exits with error** if:
- Running in production mode (`NODE_ENV=production`)
- `JWT_SECRET` is missing or too short
- `OTP_SECRET` is missing or too short
- `CORS_ORIGIN` is set to `*`

---

## Authentication Flow

### OTP Verification

```
┌─────────┐     ┌──────────────┐     ┌─────────────┐
│ Client  │────▶│ Do Backend  │────▶│ ReZ Auth    │
└─────────┘     └──────────────┘     └─────────────┘
                      │
                      │ On failure
                      ▼
              ┌──────────────┐
              │ Return 503   │
              │ (NO BYPASS)  │
              └──────────────┘
```

**Key Rules:**
- Never bypass OTP verification
- Never accept any OTP as valid
- Never expose `mockOtp` in API responses

### WebSocket Authentication

All WebSocket connections require authentication:

```javascript
// Client must connect with token
const ws = new WebSocket('wss://api.rez.money/do/stream?token=<jwt>');

// Server validates token before allowing connection
// Invalid token → Close with code 1008
```

---

## Input Validation

### Zod Schemas

All user input must be validated using Zod schemas:

```typescript
// Example: Wallet debit
const debitSchema = z.object({
  amount: z.number().positive().max(1000000),
  reason: z.string().min(1).max(200).optional(),
  orderId: z.string().max(100).optional(),
  idempotencyKey: z.string().min(16).max(64).optional(),
});
```

### Validation Rules

| Field | Rule |
|-------|------|
| Phone | `^[6-9]\d{9}$` (Indian mobile) |
| OTP | Exactly 4 digits |
| Amount | Positive, max 1,000,000 |
| Text message | Max 2000 characters |
| Idempotency key | 16-64 characters |

---

## Idempotency

Wallet operations support idempotency to prevent duplicate transactions:

```bash
POST /wallet/debit
{
  "amount": 100,
  "reason": "Booking #123",
  "idempotencyKey": "book_abc123_1715500000"
}
```

**Rules:**
- Key must be 16-64 characters
- Store has 24-hour TTL
- Duplicate requests return cached response

---

## Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/auth/*` | 5 requests | 15 minutes |
| `/do/chat/*` | 30 requests | 1 minute |
| All others | 100 requests | 1 minute |

---

## Error Handling

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid input |
| `UNAUTHORIZED` | 401 | Invalid/missing token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `RATE_LIMITED` | 429 | Too many requests |
| `AUTH_RATE_LIMITED` | 429 | Too many auth attempts |
| `SERVER_ERROR` | 500 | Internal error |

### WebSocket Error Codes

| Code | Description |
|------|-------------|
| `UNAUTHORIZED` | Invalid or missing token |
| `INVALID_MESSAGE` | Malformed message |
| `INVALID_CONTENT` | Empty or invalid text |
| `PROCESSING_ERROR` | Workflow execution failed |
| `PARSE_ERROR` | Invalid JSON |

---

## CORS Configuration

**Development:**
```typescript
CORS_ORIGIN=*  // Allow all origins
```

**Production:**
```typescript
CORS_ORIGIN=https://do.yourapp.com  // Specific origin only
```

---

## Logging

All security-relevant events are logged:

| Event | Log Level |
|-------|-----------|
| Auth attempts | INFO |
| Auth failures | WARN |
| Rate limits triggered | WARN |
| Invalid tokens | WARN |
| Server errors | ERROR |

**Log format:**
```json
{
  "level": "info",
  "message": "...",
  "timestamp": "2026-05-12T10:00:00Z",
  "userId": "...",
  "ip": "...",
  "context": {}
}
```

---

## Dependencies

### Security-Critical Packages

| Package | Version | Purpose |
|---------|---------|---------|
| `helmet` | ^8.0.0 | Security headers |
| `cors` | ^2.8.5 | CORS control |
| `express-rate-limit` | ^7.4.1 | Rate limiting |
| `jsonwebtoken` | ^9.0.2 | JWT handling |
| `zod` | ^3.23.8 | Schema validation |

---

## Checklist Before Production

- [ ] Set `NODE_ENV=production`
- [ ] Generate new `JWT_SECRET` (32+ chars)
- [ ] Generate new `OTP_SECRET` (32+ chars)
- [ ] Set `CORS_ORIGIN` to specific domain
- [ ] Enable Redis for session/idempotency storage
- [ ] Configure log aggregation
- [ ] Set up monitoring/alerting
- [ ] Run security audit: `npm audit`
- [ ] Test rate limiting
- [ ] Test invalid token rejection
- [ ] Test input validation

---

## Incident Response

If a security incident occurs:

1. **Contain**: Rotate affected secrets immediately
2. **Assess**: Identify scope of breach
3. **Notify**: Alert affected users
4. **Remediate**: Fix vulnerabilities
5. **Review**: Post-incident analysis

---

## Contact

For security issues, contact: security@rez.money
