# REZ-Consumer Security Implementation Guide

**Date:** 2026-05-16
**Version:** 1.0

---

## Quick Start

### 1. Install Shared Security Middleware

```bash
cd your-service
npm install @rez/security-middleware
```

### 2. Apply Security Middleware

```typescript
import express from 'express';
import { createSecurityMiddleware, createAuthMiddleware } from '@rez/security-middleware';

const app = express();

// Apply all security middleware
const config = createSecurityMiddleware(app, {
  allowedOrigins: ['https://rez.money', 'https://www.rez.money'],
  rateLimitMax: 100,
  authRateLimitMax: 10,
  internalApiKey: process.env.INTERNAL_API_KEY || '',
  webhookSecret: process.env.WEBHOOK_SECRET || '',
});

// Create auth helpers
const auth = createAuthMiddleware(config);
```

### 3. Protect Routes

```typescript
// Admin route with API key
app.post('/api/admin/action', auth.verifyApiKey, adminHandler);

// Webhook with signature verification
app.post('/webhook', 
  express.json({ limit: '10mb' }),
  auth.verifyWebhook,
  webhookHandler
);

// Sanitize user input
app.post('/api/user',
  auth.sanitizeBody(['name', 'bio'], 500),
  userHandler
);
```

---

## Security Checklist

### Node.js Services

- [ ] Install `@rez/security-middleware`
- [ ] Configure `ALLOWED_ORIGINS` environment variable
- [ ] Configure `INTERNAL_API_KEY` environment variable
- [ ] Configure `WEBHOOK_SECRET` environment variable
- [ ] Configure MongoDB authentication credentials
- [ ] Test CORS with allowed origins
- [ ] Test rate limiting

### Next.js Services

- [ ] Create `src/middleware.ts` with security headers
- [ ] Update `next.config.js` with security settings
- [ ] Configure `ALLOWED_ORIGINS` environment variable
- [ ] Test HTTPS redirect in production
- [ ] Test security headers

### React Native Apps

- [ ] Store secrets in environment variables
- [ ] Use SecureStore for sensitive data
- [ ] Implement certificate pinning (production)
- [ ] Add Firebase App Check
- [ ] Validate all user input
- [ ] Sanitize QR code content

---

## Environment Variables Reference

### Required for All Services

```bash
# Security
ALLOWED_ORIGINS=https://rez.money,https://www.rez.money,https://app.rez.money
INTERNAL_API_KEY=your-secure-api-key
WEBHOOK_SECRET=your-webhook-secret

# Database
MONGODB_URI=mongodb://localhost:27017/service
MONGODB_USER=your_db_user
MONGODB_PASSWORD=your_db_password
MONGODB_AUTH_SOURCE=admin

# Rate Limiting (optional)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
AUTH_RATE_LIMIT_MAX=10
```

---

## Security Patterns

### Timing-Safe Comparison

```typescript
import { timingSafeCompare } from '@rez/security-middleware';

// DON'T
if (token !== expectedToken) { ... }

// DO
if (!timingSafeCompare(token, expectedToken)) { ... }
```

### Webhook Verification

```typescript
import { verifyWebhookSignature } from '@rez/security-middleware';

app.post('/webhook', express.json({
  verify: (req, res, buf) => {
    (req as any).rawBody = buf;
  }
}), (req, res, next) => {
  const result = verifyWebhookSignature(req, process.env.WEBHOOK_SECRET!);
  if (!result.valid) {
    return res.status(401).json({ error: result.error });
  }
  next();
}, webhookHandler);
```

### Input Sanitization

```typescript
import { sanitizeString, isValidEmail, isValidPhone } from '@rez/security-middleware';

// Sanitize string
const sanitized = sanitizeString(userInput, 1000);

// Validate email
if (!isValidEmail(email)) {
  return res.status(400).json({ error: 'Invalid email' });
}

// Validate phone
if (!isValidPhone(phone)) {
  return res.status(400).json({ error: 'Invalid phone' });
}
```

### QR Content Sanitization

```typescript
import { sanitizeQRContent } from '@rez/security-middleware';

app.post('/api/scan', (req, res) => {
  const { content } = req.body;
  const result = sanitizeQRContent(content);

  if (!result.isValid) {
    return res.status(400).json({ 
      error: 'Invalid QR content',
      warnings: result.warnings 
    });
  }

  // Use result.content (sanitized)
  const safeContent = result.content;
  // ...
});
```

---

## Next.js Middleware Example

```typescript
// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
  'https://rez.money',
  'https://www.rez.money',
];

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  // CORS
  const origin = request.headers.get('origin');
  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
};
```

---

## Testing Security

### Test CORS

```bash
# Should work
curl -H "Origin: https://rez.money" https://api.example.com/health

# Should fail
curl -H "Origin: https://evil.com" https://api.example.com/health
```

### Test Rate Limiting

```bash
# Hit rate limit
for i in {1..150}; do curl -I https://api.example.com/api/health; done
# Should return 429 after limit
```

### Test Webhook Signature

```bash
# Generate signature
BODY='{"event":"test"}'
SIGNATURE=$(echo -n "$BODY" | openssl dgst -sha256 -hmac "your-secret" | cut -d' ' -f2)

# Send request
curl -X POST https://api.example.com/webhook \
  -H "Content-Type: application/json" \
  -H "X-Rez-Signature: sha256=$SIGNATURE" \
  -d "$BODY"
```

---

## Security Contacts

| Issue | Priority | Contact |
|-------|----------|---------|
| Critical vulnerability | P1 | security@rez.money |
| Data breach | P1 | security@rez.money |
| General security question | P2 | dev-team@rez.money |

---

## Security Training

All developers must complete:
1. OWASP Top 10
2. Secure Coding Practices
3. Incident Response Training

---

**Document Version:** 1.0
**Last Updated:** 2026-05-16
**Next Review:** 2026-06-16
