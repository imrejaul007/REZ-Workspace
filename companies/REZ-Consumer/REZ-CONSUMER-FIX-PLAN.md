# REZ-CONSUMER — PHASE-WISE FIX PLAN
**Date:** June 4, 2026
**Version:** 1.0.0

---

## EXECUTIVE SUMMARY

### Current Status

| Category | Score | Issues |
|----------|-------|--------|
| Security | 8.0/10 | No account lockout, no password policy |
| Code Quality | 7.5/10 | TypeScript strict enabled |
| Testing | 5.0/10 | Low coverage |
| Dependencies | 7.5/10 | safe-qr on old SDK |
| **COMPLETE** | 5 | rez-app, do, rez-now, safe-qr-service, verify-qr-service |
| **PARTIAL** | 5 | rez-menu, go4food, safe-qr, verify-qr-dashboard, rez-driver |
| **STUB** | 13 | All REZ-* apps, verify-qr-mobile, go4food-api |

---

## PHASE-WISE PLAN

### Phase 1: Critical Security Fixes (This Week)
### Phase 2: Complete Partial Services (2 weeks)
### Phase 3: Implement High-Priority Stubs (2 weeks)
### Phase 4: Implement Medium-Priority Stubs (2 weeks)
### Phase 5: Testing & Documentation (1 week)

---

# PHASE 1: CRITICAL SECURITY FIXES

## 1.1 Account Lockout System

**Issue:** No account lockout after failed attempts

**Fix:** Add 5 attempts, 15-minute lockout

**Files to modify:**
- safe-qr-service/src/middleware/auth.ts
- verify-qr-service/src/middleware/auth.ts
- do-backend/src/api/middleware/auth.ts

**Implementation:**
```typescript
// Add to auth middleware
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

// In-memory lockout store (use Redis in production)
const lockoutStore = new Map<string, { attempts: number; lockedUntil: Date | null }>();

function isLocked(userId: string): boolean {
  const lockout = lockoutStore.get(userId);
  if (!lockout || !lockout.lockedUntil) return false;
  if (new Date() > lockout.lockedUntil) {
    lockoutStore.delete(userId);
    return false;
  }
  return true;
}
```

---

## 1.2 Password Policy Enforcement

**Issue:** No password complexity requirements

**Fix:** Add minimum 8 chars, 1 uppercase, 1 number, 1 special char

**Files to modify:**
- All auth services

**Implementation:**
```typescript
const passwordSchema = z.object({
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain 1 uppercase letter')
    .regex(/[0-9]/, 'Password must contain 1 number')
    .regex(/[!@#$%^&*]/, 'Password must contain 1 special character')
});
```

---

## 1.3 Upgrade safe-qr from SDK 50 to SDK 53

**Issue:** Using old Expo SDK 50

**Fix:** Upgrade to SDK 53

**Steps:**
1. Update package.json
2. Update all dependencies
3. Fix any breaking changes
4. Test on iOS and Android

---

## 1.4 Session Expiry for Web Apps

**Issue:** No sliding window session expiry

**Fix:** Implement 24-hour sliding window

**Files to modify:**
- verify-qr-dashboard
- rez-now

---

# PHASE 2: COMPLETE PARTIAL SERVICES

## 2.1 verify-qr-mobile (HIGH PRIORITY)

**Current:** Only 1 file (App.tsx placeholder)

**Required:**
- QR scanning functionality
- Warranty check
- Serial lookup
- Product verification

**Files to create:**
```
verify-qr-mobile/
├── app/
│   ├── _layout.tsx
│   ├── index.tsx
│   ├── scan.tsx
│   ├── verify/[serial].tsx
│   └── warranty/[serial].tsx
├── components/
├── services/
├── hooks/
├── package.json
├── tsconfig.json
└── app.json
```

---

## 2.2 go4food + go4food-api

**Current:** Basic UI, no API

**Required:**
- Restaurant search
- Menu browsing
- Price comparison
- AI recommendations

**Files to create for go4food-api:**
```
go4food-api/
├── src/
│   ├── index.ts
│   ├── routes/
│   │   ├── restaurants.ts
│   │   ├── menu.ts
│   │   └── compare.ts
│   ├── services/
│   │   └── foodAggregator.ts
│   └── middleware/
├── package.json
└── tsconfig.json
```

---

## 2.3 verify-qr-dashboard

**Current:** Basic UI (19 files)

**Required:**
- OEM dashboard
- Serial management
- Analytics
- Fraud detection view

---

## 2.4 rez-driver

**Current:** Basic structure (30 files)

**Required:**
- Login/Auth
- Ride acceptance
- Navigation
- Earnings tracking

---

## 2.5 rez-menu (Monorepo)

**Current:** Shell with 11 workspaces

**Required:**
- Complete all 11 services
- Database migrations
- API integration

---

# PHASE 3: HIGH-PRIORITY STUBS

## 3.1 REZ-inbox (HIGH PRIORITY)

**Current:** 5 files (minimal)

**Required:**
- Email receipt import
- Unified inbox
- Message threading

**Implementation:**
```
REZ-inbox/
├── src/
│   ├── index.ts
│   ├── routes/
│   │   ├── messages.ts
│   │   ├── threads.ts
│   │   └── import.ts
│   ├── services/
│   │   └── emailImporter.ts
│   └── integrations/
├── package.json
└── tsconfig.json
```

---

## 3.2 REZ-assistant (HIGH PRIORITY)

**Current:** 5 files (minimal)

**Required:**
- AI chat interface
- Intent detection
- REZ Mind integration

**Implementation:**
```
REZ-assistant/
├── src/
│   ├── index.ts
│   ├── routes/
│   │   ├── chat.ts
│   │   └── intents.ts
│   ├── services/
│   │   └── intentProcessor.ts
│   └── integrations/
├── package.json
└── tsconfig.json
```

---

## 3.3 REZ-nearby (HIGH PRIORITY)

**Current:** 2 files (minimal)

**Required:**
- Location-based search
- Place discovery
- Category browsing

---

## 3.4 REZ-scan (HIGH PRIORITY)

**Current:** 3 files (minimal)

**Required:**
- QR/Barcode scanning
- Scan history
- Deep linking

---

# PHASE 4: MEDIUM-PRIORITY STUBS

## 4.1 REZ-bills

**Current:** 3 files

**Required:**
- Bill payment
- Bill reminders
- Payment history

---

## 4.2 REZ-expense + REZ-expense-ui

**Current:** 2 + 11 files

**Required:**
- Expense tracking
- Receipt scanning
- Reports

---

## 4.3 REZ-save

**Current:** 2 files

**Required:**
- Wishlist
- Price alerts
- Savings goals

---

## 4.4 REZ-menu-qr

**Current:** 1 file

**Required:**
- Menu QR generation
- Table management

---

# PHASE 5: TESTING & DOCUMENTATION

## 5.1 Increase Test Coverage

**Target:** 50% overall

| Service | Current | Target |
|---------|---------|--------|
| rez-app | 20% | 50% |
| do | 15% | 50% |
| rez-now | 30% | 70% |
| safe-qr-service | 15% | 50% |
| verify-qr-service | 25% | 50% |

---

## 5.2 Add E2E Tests

**Services to add E2E:**
- rez-app (Detox)
- do (Detox)
- rez-now (Playwright)

---

## 5.3 Update Documentation

**Files to update:**
- All README.md files
- API documentation
- Deployment guides

---

## TIMELINE

```
Week 1:     Phase 1 - Security Fixes
            ├── Account lockout
            ├── Password policy
            └── SDK upgrade (safe-qr)

Week 2-3:   Phase 2 - Complete Partial Services
            ├── verify-qr-mobile
            ├── go4food-api
            └── go4food

Week 4-5:   Phase 3 - High-Priority Stubs
            ├── REZ-inbox
            ├── REZ-assistant
            └── REZ-nearby

Week 6-7:   Phase 4 - Medium-Priority Stubs
            ├── REZ-bills
            ├── REZ-expense
            └── Others

Week 8:     Phase 5 - Testing & Docs
            ├── Test coverage
            └── Documentation
```

---

## PRIORITY MATRIX

| Service | Impact | Effort | Priority |
|---------|--------|--------|----------|
| verify-qr-mobile | HIGH | MEDIUM | 1 |
| go4food-api | HIGH | HIGH | 2 |
| REZ-inbox | HIGH | MEDIUM | 3 |
| REZ-assistant | HIGH | MEDIUM | 4 |
| REZ-nearby | MEDIUM | MEDIUM | 5 |
| Account lockout | HIGH | LOW | 1 |
| Password policy | HIGH | LOW | 1 |
| SDK upgrade | MEDIUM | MEDIUM | 2 |

---

## EXECUTION NOTES

1. **Security fixes first** - Non-negotiable
2. **Partial services second** - Revenue generating
3. **Stubs last** - Future features
4. **Test as you go** - Don't skip testing
5. **Document progress** - Update audit after each phase

---

**Ready to Execute: YES**
