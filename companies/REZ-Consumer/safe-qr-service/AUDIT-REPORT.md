# safe-qr-service Security Audit Report

**Service:** safe-qr-service (Backend API)
**Date:** 2026-05-16
**Status:** NEEDS IMPROVEMENT

---

## Security Posture: NEEDS ATTENTION

Critical issues found that require immediate remediation.

---

## Critical Issues

### 1. CORS Wildcard Origin 🔴 CRITICAL
**File:** `src/index.ts:37-41`

```typescript
app.use(cors({
  origin: '*',  // ALLOWS ANY ORIGIN
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Internal-Token', 'x-app-source'],
}));
```

**Impact:** Any website can make authenticated requests on behalf of users.

**Fix:**
```typescript
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
  'https://rez.money',
  'https://www.rez.money',
  'https://safe-qr.app',
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Internal-Token', 'x-app-source'],
}));
```

---

### 2. Insecure Token Comparison 🔴 CRITICAL
**File:** `src/middleware/auth.ts:149`

```typescript
if (internalToken !== config.internalToken) {
  res.status(403).json({ error: 'Invalid internal token' });
}
```

**Impact:** Vulnerable to timing attacks to discover internal token.

**Fix:**
```typescript
import crypto from 'crypto';

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

if (!timingSafeEqual(internalToken as string, config.internalToken)) {
  res.status(403).json({ error: 'Invalid internal token' });
}
```

---

### 3. Missing Rate Limiting 🔴 HIGH
**File:** `src/index.ts`

No rate limiting middleware is applied.

**Fix:**
```typescript
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({ client: redis }),
});

app.use('/api', limiter);

// Stricter limits for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  store: new RedisStore({ client: redis }),
});
app.use('/api/auth', authLimiter);
```

---

### 4. No MongoDB Authentication 🔴 CRITICAL
**File:** `src/index.ts:118`

```typescript
await mongoose.connect(config.mongodbUri);
```

**Fix:**
```typescript
await mongoose.connect(config.mongodbUri, {
  auth: {
    username: process.env.MONGODB_USER,
    password: process.env.MONGODB_PASSWORD,
  },
  authSource: 'admin',
});
```

Or use connection string:
```
mongodb://user:password@host:27017/database?authSource=admin
```

---

### 5. Missing QR Content Sanitization 🔴 HIGH
**Files:** All QR processing routes

Malicious QR codes could contain:
- XSS payloads
- SQL injection
- Command injection

**Fix:** Add validation layer:
```typescript
import validator from 'validator';

function sanitizeQRContent(content: string): string {
  // Remove HTML tags
  let sanitized = validator.stripLow(content);
  sanitized = validator.escape(sanitized);
  return sanitized;
}

// Validate URLs in QR codes
function validateQRUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}
```

---

### 6. Missing Webhook Signature Verification 🔴 HIGH
**Files:** Any webhook endpoints

**Fix:** Implement HMAC verification:
```typescript
import crypto from 'crypto';

function verifyWebhookSignature(req: Request, res: Response, next: NextFunction) {
  const signature = req.headers['x-rez-signature'] as string;
  const rawBody = (req as any).rawBody;
  
  if (!signature || !rawBody) {
    return res.status(401).json({ message: 'Missing signature' });
  }
  
  const expected = crypto
    .createHmac('sha256', process.env.WEBHOOK_SECRET!)
    .update(rawBody)
    .digest('hex');
  
  const signatureBuffer = Buffer.from(signature.replace('sha256=', ''), 'hex');
  const expectedBuffer = Buffer.from(expected, 'hex');
  
  if (signatureBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return res.status(401).json({ message: 'Invalid signature' });
  }
  
  next();
}
```

---

## Good Practices Found

### Auth Service ✅
- Uses RABTUL auth service for verification
- Internal token header for service-to-service auth
- Proper 401/403 responses

### Helmet.js ✅
```typescript
app.use(helmet());
```

### Body Size Limits ✅
```typescript
app.use(express.json({ limit: '10mb' }));
```

### Fraud Detection (in rendez) ✅
Atomic Redis operations prevent race conditions.

---

## Security Checklist

| Control | Status | Notes |
|---------|--------|-------|
| CORS | ❌ | Wildcard origin |
| Rate limiting | ❌ | Not implemented |
| Token comparison | ❌ | Timing vulnerable |
| MongoDB auth | ❌ | No auth configured |
| QR sanitization | ❌ | Missing |
| Webhook verification | ❌ | Not implemented |
| HTTPS redirect | ⚠️ | Not verified |
| Security headers | ✅ | Helmet enabled |
| Input validation | ⚠️ | Needs review |

---

## Priority Remediation

### IMMEDIATE (This Week)
1. Fix CORS configuration
2. Add rate limiting
3. Fix token comparison
4. Add MongoDB auth

### HIGH (Next Week)
5. Add QR content sanitization
6. Implement webhook signatures
7. Add request logging/monitoring

---

## Verdict

**NOT READY FOR PRODUCTION** until critical issues are remediated.

The service has good structural foundations (Express, helmet, proper routing) but lacks critical security controls.
