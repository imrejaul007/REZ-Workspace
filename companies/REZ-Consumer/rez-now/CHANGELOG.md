# REZ NOW Changelog

All notable changes to REZ NOW are documented here.

## [Unreleased]

### Code Quality Fixes

#### lib/notifications/loyalty.ts
- **Fixed:** Deprecated `substr()` → `substring()` with `crypto.randomUUID()` fallback
- **Fixed:** ID collision risk from `Math.random()` → secure UUID generation
- **Fixed:** Missing `perks` in tier upgrade notifications → Added `TIER_PERKS` lookup
- **Fixed:** Browser `Notification` API without SSR guard → Added `isBrowser()` helper
- **Fixed:** Missing error handling in `requestNotificationPermission` → Added try-catch

#### lib/loyalty/index.ts
- **Fixed:** Client-side env var exposure → Added fallback pattern `KARMA_API_URL` / `NEXT_PUBLIC_`
- **Fixed:** `localStorage` read without error boundary → Added try-catch with `logger.warn`
- **Fixed:** Missing fetch error validation → Added `response.ok` check
- **Fixed:** Inconsistent error handling → Standardized `logger.error` with object
- **Fixed:** Missing timeout on karma API calls → Added `AbortSignal.timeout(5000)`

#### lib/kb/menuKnowledge.ts
- **Fixed:** Typo "Masoala Masala" → "Rogan Josh" in wine pairings
- **Fixed:** Null/undefined menu items crash → Filter + type guard added
- **Fixed:** Price assumption (always paisa) → Auto-detect paisa vs rupees
- **Fixed:** SSR cache memory leaks → Separate server/client cache via global store

#### lib/api/unifiedCrmApi.ts
- **Fixed:** Dead code in `getUnifiedCustomerSegments` → Proper implementation
- **Fixed:** Missing timeout on API calls → `AbortSignal.timeout(5000)`
- **Fixed:** Missing logger import → Added `logger` from utils
- **Fixed:** Swallowed errors → Proper `logger.warn` calls
- **Fixed:** Type mismatch → Correct `CustomerSegment` transform

---

## [Previous Releases]

*(Add previous releases here)*
