# HOJAI SkillNet - Comprehensive Fix Plan

## Context

Audit identified 5 critical, 5 high-priority, and multiple medium/low issues in the HOJAI SkillNet codebase. This plan addresses all issues systematically.

---

## Phase 1: Core Infrastructure Upgrades

### 1.1 JWT Authentication Middleware

**Problem:** Tenant middleware only checks header presence, no token validation.

**Files to Create:**
- `hojai-core/shared/middleware/auth.ts` - JWT authentication middleware

**Pattern:** Follow existing `HOJAI-CLINIC-AI/src/middleware/auth.ts` pattern

**Implementation:**
```typescript
// Verify JWT token from Authorization: Bearer <token> header
// Extract: userId, tenantId, email, roles
// Attach to request as req.user
// Return 401 for invalid/expired tokens
```

### 1.2 Enhanced Tenant Middleware

**Problem:** Current tenant middleware doesn't validate tokens.

**File to Modify:** `hojai-core/shared/middleware/tenant.ts`

**Changes:**
1. Add JWT token verification (extract tenant_id from token)
2. Validate X-Tenant-Id header matches token's tenant_id
3. Merge existing header-based and token-based tenant context

### 1.3 Config Validation with Zod

**Problem:** No startup validation of required environment variables.

**Files to Create:**
- `hojai-core/shared/config/schema.ts` - Zod schema for all env vars
- `hojai-core/shared/config/index.ts` - Config validation and export

**Schemas Required:**
```typescript
// Required
MONGODB_URI: z.string().url()
JWT_SECRET: z.string().min(32)  // Must be strong
REDIS_URL: z.string().url().optional()

// Optional with defaults
PORT: z.coerce.number().default(3000)
NODE_ENV: z.enum(['development', 'production', 'test']).default('development')
CORS_ORIGINS: z.string().default('')  // Empty = no CORS
```

---

## Phase 2: Graceful Shutdown Infrastructure

### 2.1 Shutdown Manager Utility

**Problem:** No SIGTERM/SIGINT handlers across services.

**File to Create:** `hojai-core/shared/utils/shutdown.ts`

**Features:**
- IsShuttingDown flag to prevent double shutdown
- Connection draining (close HTTP server)
- MongoDB connection close via mongoose
- Redis connection close
- 5-second timeout for in-flight requests
- Structured logging with logger

**Implementation Pattern:** From `hojai-expert-os/src/index.ts:1226-1298`

### 2.2 Add Shutdown to Base Service

**File to Modify:** `hojai-core/shared/base-service.ts`

**Changes:**
1. Import shutdown utility
2. Register SIGTERM/SIGINT handlers on server creation
3. Export `gracefulShutdown()` function

### 2.3 Service-Level Shutdown Handlers

**Files to Modify:**
- `hojai-intelligence/src/index.ts`
- `hojai-event/src/index.ts`
- `hojai-shared/src/index.ts`
- `hojai-api-gateway/src/index.ts`

**Changes:**
- Register shutdown handlers with connection cleanup
- Log shutdown events

---

## Phase 3: MongoDB Persistence

### 3.1 Entity Definitions

**File to Modify:** `hojai-core/hojai-data/entities/index.ts`

**Add Entities:**
1. `EventSubscription` - Subscription model
2. `EventStream` - Event stream model
3. `IntelligencePrediction` - Prediction model
4. `IntelligenceRecommendation` - Recommendation model
5. `IntelligenceInsight` - Insight model
6. `SharedTenant` - Tenant model for hojai-shared
7. `SharedApiKey` - API key model
8. `SharedWebhookConfig` - Webhook model

### 3.2 Repositories

**Files to Create:**
- `hojai-core/hojai-data/repositories/event-repository.ts`
- `hojai-core/hojai-data/repositories/subscription-repository.ts`
- `hojai-core/hojai-data/repositories/stream-repository.ts`
- `hojai-core/hojai-data/repositories/prediction-repository.ts`
- `hojai-core/hojai-data/repositories/recommendation-repository.ts`
- `hojai-core/hojai-data/repositories/insight-repository.ts`

**Pattern:** Extend BaseRepository with tenant scoping

### 3.3 Update Services

#### hojai-intelligence Service

**File to Modify:** `hojai-core/hojai-intelligence/src/index.ts`

**Changes:**
1. Add MongoDB connection (follow `hojai-customer-intelligence` pattern)
2. Replace `predictionStore`, `recommendationStore`, `insightStore` Maps with repositories
3. Update all route handlers to use repositories
4. Add index creation on startup
5. Add connection error handling

**Route Files to Update:**
- `src/routes/predictions.ts`
- `src/routes/recommendations.ts`
- `src/routes/insights.ts`

#### hojai-event Service

**File to Modify:** `hojai-core/hojai-event/src/index.ts`

**Changes:**
1. Add MongoDB connection
2. Replace `eventStore`, `subscriptionStore`, `streamStore` Maps with repositories
3. Update all route handlers to use repositories
4. Add parallel subscriber notification (`Promise.all`)

**Route Files to Update:**
- `src/routes/events.ts`
- `src/routes/subscriptions.ts`
- `src/routes/stream.ts`

#### hojai-shared Service

**File to Modify:** `hojai-shared/src/index.ts`

**Changes:**
1. Add MongoDB connection
2. Replace in-memory Maps with repositories
3. Add JWT authentication middleware to protected routes
4. Fix console.log to use structured logger
5. Fix error response format (add `success: false`)

---

## Phase 4: Security Hardening

### 4.1 CORS Configuration

**Files to Modify:**
- `hojai-api-gateway/src/index.ts` (line 51)
- `hojai-core/shared/base-service.ts`

**Changes:**
```typescript
// OLD: CORS_ORIGINS defaults to '*'
// NEW: Require explicit CORS_ORIGINS, default to no CORS
const CORS_ORIGINS = process.env.CORS_ORIGINS?.split(',') || [];
// If empty and production, reject requests
if (CORS_ORIGINS.length === 0 && process.env.NODE_ENV === 'production') {
  console.warn('WARNING: No CORS origins configured for production');
}
```

### 4.2 Input Sanitization

**Files to Modify:**
- `hojai-intelligence/src/routes/insights.ts`
- `hojai-event/src/routes/events.ts`

**Changes:**
- Add sanitization for user-provided strings
- Add XSS prevention for event types and data payloads
- Use `helmet` middleware for security headers

### 4.3 Strong JWT Secret Enforcement

**File to Modify:** `hojai-skillnet/.env.example`

**Changes:**
```bash
# OLD
JWT_SECRET=CHANGE_ME_generate_strong_secret_here

# NEW
# Must be at least 32 characters
JWT_SECRET=your-very-long-and-secure-secret-key-at-least-32-chars
```

---

## Phase 5: Error Handling & Logging

### 5.1 Fix Generic Error Handler

**File to Modify:** `hojai-shared/src/index.ts` (lines 378-381)

**Changes:**
```typescript
// OLD: Exposes stack traces
// NEW: Only expose in development
errorHandler: (err, req, res, next) => {
  const response = {
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    },
    meta: { timestamp: new Date().toISOString() }
  };
  res.status(err.status || 500).json(response);
}
```

### 5.2 Replace console.log with Structured Logger

**Files to Modify:**
- `hojai-shared/src/index.ts` (line 71)

**Changes:**
```typescript
// OLD
console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);

// NEW
logger.info('request_received', { method: req.method, path: req.path });
```

### 5.3 Parallel Subscriber Notification

**File to Modify:** `hojai-event/src/routes/events.ts` (lines 183-211)

**Changes:**
```typescript
// OLD: Sequential for loop
for (const subscriber of subscribers) {
  await notifySubscriber(subscriber, event);
}

// NEW: Parallel with Promise.all
await Promise.all(subscribers.map(subscriber => notifySubscriber(subscriber, event)));
```

---

## Phase 6: Testing

### 6.1 Add Unit Tests

**Files to Create:**
- `hojai-core/shared/test/auth.test.ts` - JWT middleware tests
- `hojai-core/shared/test/config.test.ts` - Config validation tests
- `hojai-core/shared/test/shutdown.test.ts` - Graceful shutdown tests

### 6.2 Add Repository Tests

**Files to Create:**
- `hojai-core/hojai-data/test/event-repository.test.ts`
- `hojai-core/hojai-data/test/prediction-repository.test.ts`

### 6.3 Enhance Existing Tests

**File to Modify:** `hojai-core/shared/test/tenant-isolation.test.ts`

**Changes:**
- Add tests for auth middleware
- Add tests for MongoDB persistence (mock mongoose)

---

## Execution Order

```
Phase 1: Core Infrastructure Upgrades
├── 1.1 JWT Auth Middleware (CREATE)
├── 1.2 Enhanced Tenant Middleware (MODIFY)
└── 1.3 Config Validation (CREATE)

Phase 2: Graceful Shutdown Infrastructure
├── 2.1 Shutdown Manager (CREATE)
├── 2.2 Update Base Service (MODIFY)
└── 2.3 Service Handlers (MODIFY)

Phase 3: MongoDB Persistence
├── 3.1 Entity Definitions (MODIFY)
├── 3.2 Repositories (CREATE)
├── 3.3 Update hojai-intelligence (MODIFY)
├── 3.4 Update hojai-event (MODIFY)
└── 3.5 Update hojai-shared (MODIFY)

Phase 4: Security Hardening
├── 4.1 CORS Configuration (MODIFY)
├── 4.2 Input Sanitization (MODIFY)
└── 4.3 JWT Secret (MODIFY)

Phase 5: Error Handling & Logging
├── 5.1 Fix Error Handler (MODIFY)
├── 5.2 Structured Logging (MODIFY)
└── 5.3 Parallel Notification (MODIFY)

Phase 6: Testing
├── 6.1 Unit Tests (CREATE)
└── 6.2 Repository Tests (CREATE)
```

---

## Estimated Files to Create/Modify

| Type | Count |
|------|-------|
| Create | 12 |
| Modify | 15 |

**Total:** ~27 files

---

## Verification

After all fixes:
1. Run existing tenant isolation tests: `npm test`
2. Run new unit tests: `npm test`
3. Verify services start with MongoDB: `docker-compose up`
4. Test graceful shutdown: `kill -TERM <pid>`
5. Verify JWT auth on protected routes
6. Verify CORS rejects wildcard in production
