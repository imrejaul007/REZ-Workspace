# StayOwn Hospitality - Fixes Applied

**Date:** June 10, 2026
**Version:** 1.0

---

## Issues Fixed

### 1. ✅ AI Front Desk - HOJAI Staybot Integration

**Problem:** `ai-front-desk` had config for HOJAI Staybot (port 4840) but NEVER called it. All responses were local keyword matching.

**Files Changed:**
- `ai-front-desk/src/services/ConciergeService.ts`
- `ai-front-desk/src/routes/conciergeRoutes.ts`

**Fix Applied:**
- Added async `processQuery()` method that first checks local patterns (fast path)
- Complex queries now call HOJAI Staybot at `http://localhost:4840/api/concierge/query`
- Implemented circuit breaker pattern (opens after 3 consecutive failures, recovers after 1 minute)
- Added `source` field to response ('ai' vs 'fallback')
- Updated route to pass `hotelId` and `roomId` for context-aware AI

**Before:**
```typescript
processQuery(query: string, guestId?: string): ConciergeResponse {
  // Local keyword matching only - NO AI call
}
```

**After:**
```typescript
async processQuery(query: string, guestId?: string, hotelId?: string, roomId?: string): Promise<ConciergeResponse> {
  // Fast path: local patterns
  // Complex: Call HOJAI Staybot (4840)
  // Fallback: Local patterns with lower confidence
}
```

---

### 2. ✅ Port Mismatch - REZ Mind

**Problem:** Two different ports for REZ Mind:
- `rez-mind-client.ts` → port 4017 (correct)
- `rez-mind-integration.ts` → port 4008 (wrong - was verify-service)

**File Changed:**
- `rez-stayown-service/src/services/rez-mind-integration.ts`

**Fix Applied:**
- Changed default from `localhost:4008` to `localhost:4017`
- Added `REZ_MIND_HOTEL_URL` env variable for clarity

**Before:**
```typescript
const REZ_MIND_URL = process.env.REZ_MIND_URL || process.env.EXPO_PUBLIC_EVENT_PLATFORM_URL || 'http://localhost:4008';
```

**After:**
```typescript
const REZ_MIND_URL = process.env.REZ_MIND_URL || process.env.REZ_MIND_HOTEL_URL || 'http://localhost:4017';
```

---

### 3. ✅ Created Hotel OS Integration Layer

**Problem:** No unified integration service connecting StayOwn, REZ-Merchant, RidZa, and HOJAI.

**File Created:**
- `hotel-os-integration/src/index.ts`
- `hotel-os-integration/package.json`

**What It Does:**
- Central registry of all hotel services
- Health checks for all services
- Integration flow documentation
- Guest journey view (combines data from multiple sources)
- Hotel overview (combines metrics from PMS, analytics)
- Proxy to individual services for debugging

**Port:** 3899

**Endpoints:**
- `GET /health` - Service health
- `GET /registry/services` - All services with URLs
- `GET /registry/health` - Health check all services
- `GET /flows` - Integration flow documentation
- `GET /guest/:guestId/journey` - Complete guest view
- `GET /hotel/:hotelId/overview` - Hotel metrics

---

### 4. ✅ Created Master Architecture Documentation

**File Created:**
- `docs/MASTER-ARCHITECTURE.md`

**Contents:**
- Product structure (StayOwn, REZ-Merchant, RidZa)
- Service connections with diagram
- Integration flows (Booking, Check-in, AI Concierge, Checkout)
- Complete port allocation table
- Technology stack
- Data flow diagrams
- GitHub repository references

---

## Known Issues (Lower Priority)

### 5. 🔶 Email Service Uses Mock Provider

**Location:** `rez-stayown-service/src/services/email.service.ts`
**Issue:** Default provider is `'mock'` - emails don't actually send in dev
**Fix:** Set `EMAIL_PROVIDER=sendgrid` or `EMAIL_PROVIDER=ses` in production

### 6. 🔶 Missing Webhook Handlers

**Location:** `rez-stayown-service/src/routes/`
**Missing handlers for:**
- `rez-hotel-housekeeping` (4021) events
- `rez-hotel-maintenance` (4019) events
- `rez-channel-manager` OTA events
- `rez-dynamic-pricing` (4040) price updates
- `rez-reputation-service` (4010) review webhooks

**Impact:** Some events won't sync between services

### 7. 🔶 Multiple Copies of Services

**Issue:** Some services exist in multiple places:
- `rez-stayown-service` in StayOwn, RidZa, CorpPerks
- Hotel OTA in RidZa but should be under StayOwn

**Recommendation:** Consolidate to single source of truth per service

---

## Verification

To verify fixes are working:

```bash
# 1. Check AI Front Desk calls Staybot
curl -X POST http://localhost:3800/api/concierge/query \
  -H "Content-Type: application/json" \
  -d '{"query": "I need a taxi to the airport at 6 AM", "hotelId": "hotel_001"}'
# Should show "source": "ai" for complex queries

# 2. Check Integration Service
curl http://localhost:3899/registry/health
# Should show status of all connected services

# 3. Check Guest Journey
curl http://localhost:3899/guest/guest_123/journey
# Should combine data from multiple sources
```

---

## Next Steps

1. **Add missing webhook handlers** in `rez-stayown-service`
2. **Consolidate duplicate services** (move RidZa/Hotel OTA to StayOwn)
3. **Add circuit breakers** to all external service calls
4. **Implement retry logic** with exponential backoff
5. **Add Prometheus metrics** to all services

---

**Document Version:** 1.0
**Last Updated:** June 10, 2026