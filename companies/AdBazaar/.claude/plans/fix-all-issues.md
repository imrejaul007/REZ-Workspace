# Fix All Audit Issues - Implementation Plan

## Overview
Fix all critical, high, and medium priority issues identified in the AdBazaar audit.

---

## Issue 1: Logger Import Mismatch in intelligenceIntegration.ts 🔴 CRITICAL

**Files affected:**
- `/companies/AdBazaar/adBazaar-backend/src/services/intelligenceIntegration.ts`

**Problem:** Uses `logger.error()` but never imports it (lines 66, 82, 98, 118).

**Fix:** Add import at top of file:
```typescript
import logger from '../utils/logger.js';
```

---

## Issue 2: Logger Export Mismatch 🔴 CRITICAL

**Files affected:**
- `/companies/AdBazaar/adBazaar-backend/src/utils/logger.ts`

**Problem:** `logger.ts` exports `{ Logger, LogLevel, LogEntry }` but NOT `createLogger`. However, `index.ts` line 23 imports `{ createLogger }` from it, and `database.ts` line 7 imports `{ createLogger }` from `'./logger'` (wrong path).

**Fix in logger.ts:** Add `createLogger` function:
```typescript
export function createLogger(module: string) {
  return {
    info: (msg: string, context?: any) => logger.info(`[${module}] ${msg}`, context),
    error: (msg: string, err?: any) => logger.error(`[${module}] ${msg}`, err),
    warn: (msg: string, context?: any) => logger.warn(`[${module}] ${msg}`, context),
    debug: (msg: string, context?: any) => logger.debug(`[${module}] ${msg}`, context),
  };
}
```

**Fix in database.ts:** Change import from `'./logger'` to `'../utils/logger'` and update usage to match actual export.

---

## Issue 3: Hardcoded dev-token Fallback 🔴 CRITICAL

**Files affected:**
- `/companies/AdBazaar/adBazaar-backend/src/services/paymentService.ts` (line 13)
- `/companies/AdBazaar/adBazaar-backend/src/services/authIntegration.ts` (line 10)

**Problem:** Falls back to `'dev-token'` if env var not set - security risk.

**Fix:** Fail fast in production:
```typescript
const token = process.env.INTERNAL_SERVICE_TOKEN;
if (!token) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('INTERNAL_SERVICE_TOKEN environment variable is required in production');
  }
  console.warn('WARNING: Using fallback dev-token - set INTERNAL_SERVICE_TOKEN in production');
}
const INTERNAL_TOKEN = token || 'dev-token'; // Only as fallback in dev
```

---

## Issue 4: eval() with User Input 🔴 CRITICAL

**Files affected:**
- `/companies/AdBazaar/data-warehouse-service/src/services/DataService.ts` (lines 211, 218)

**Problem:** `eval(transformation.expression)` allows code injection if expression is user-controlled.

**Fix:** Replace with safe expression evaluation using `math.js`:

1. Install math.js: `npm install mathjs`
2. Replace eval with safe parser:
```typescript
import { evaluate } from 'mathjs';

private safeEvaluate(expression: string, context: Record<string, any>): any {
  // Whitelist allowed characters and patterns
  const safePattern = /^[a-zA-Z_][a-zA-Z0-9_.\[\]]*[\s]*[+\-*/%<>!=&|]+[a-zA-Z0-9_.\[\]]*$/;
  if (!safePattern.test(expression.trim())) {
    throw new Error('Invalid expression');
  }

  try {
    return evaluate(expression, context);
  } catch {
    return undefined;
  }
}
```

---

## Issue 5: Missing Zod Validation on Endpoints 🟡 MEDIUM

**Files affected:**
- `/companies/AdBazaar/adBazaar-backend/src/index.ts` (lines 120-129, 140-153, 192-201, 216-230, 307-320)

**Fix:** Add Zod validation schemas and validate requests:

1. Create validation schemas:
```typescript
import { z } from 'zod';

const ownerSchema = z.object({
  userId: z.string().min(1),
  businessName: z.string().min(1),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/),
  email: z.string().email().optional(),
  businessType: z.enum(['individual', 'company']),
  address: z.object({
    street: z.string().optional(),
    city: z.string().min(1),
    state: z.string().optional(),
    pincode: z.string().optional(),
    country: z.string().default('India'),
  }).optional(),
});
```

2. Apply validation in routes:
```typescript
app.post('/api/owners/register', async (req: Request, res: Response) => {
  const result = ownerSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ success: false, error: result.error.format() });
  }
  // proceed with result.data
});
```

---

## Issue 6: Silent Error Swallowing 🟡 MEDIUM

**Files affected:**
- `/companies/AdBazaar/adBazaar-backend/src/services/advertiserService.ts` (lines 198-200, 215-217)

**Fix:** Add proper error logging:
```typescript
import logger from '../utils/logger.js';

// Before: catch { /* silent */ }
// After:
catch (error) {
  logger.error('Failed to calculate dynamic CPM', { screenType: screen.screenType, error });
  // Use floor price as fallback
}
```

---

## Issue 7: Mixed Test Frameworks 🟡 MEDIUM

**Recommendation:** Standardize on vitest (already used by 64 services).

1. Convert jest configs to vitest in affected services
2. Add migration script to convert test files

---

## Implementation Order

1. **Fix logger issues first** (Issues 1-2) - required for other fixes to log properly
2. **Fix dev-token fallback** (Issue 3) - security priority
3. **Fix eval() vulnerability** (Issue 4) - security priority
4. **Add Zod validation** (Issue 5) - input sanitization
5. **Fix error logging** (Issue 6) - debugging improvement
6. **Test framework consolidation** (Issue 7) - long-term maintenance

---

## Files to Modify

| File | Issues |
|------|--------|
| `adBazaar-backend/src/utils/logger.ts` | #2 |
| `adBazaar-backend/src/services/intelligenceIntegration.ts` | #1 |
| `adBazaar-backend/src/config/database.ts` | #2 |
| `adBazaar-backend/src/services/paymentService.ts` | #3 |
| `adBazaar-backend/src/services/authIntegration.ts` | #3 |
| `data-warehouse-service/src/services/DataService.ts` | #4 |
| `adBazaar-backend/src/index.ts` | #5, #6 |
| `adBazaar-backend/src/services/advertiserService.ts` | #6 |

---

## Verification

After fixes:
1. Run `npm run build` to verify TypeScript compiles
2. Run `npm test` to verify tests pass
3. Run `npm run lint` to verify no linting errors
4. Manually test endpoints with invalid input to verify validation works
