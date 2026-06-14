# 🏨 Hotel Services CONSOLIDATION PLAN

**Date:** June 13, 2026  
**Status:** READY TO EXECUTE

---

## 🎯 OBJECTIVE

Consolidate all hotel services into **REZ-Merchant** and deprecate **StayOwn-Hospitality** as a separate company.

---

## 📋 PHASE 1: AUDIT & PREPARATION (COMPLETED)

### ✅ Audit Completed

| Item | Status |
|------|--------|
| StayOwn PMS Audit | ✅ Complete |
| REZ-Merchant Hotel Audit | ✅ Complete |
| Feature Comparison | ✅ Complete |
| Duplicate Detection | ✅ Complete |

### Findings Summary

| Aspect | Result |
|-------|--------|
| StayOwn Services | 35 (18 production-ready) |
| REZ-Merchant Hotel | 10 (2 production-ready) |
| Duplicates | 8 |
| Missing in REZ-Merchant | 22 services |

---

## 📋 PHASE 2: MIGRATION PLAN

### Step 1: Create Hotel Directory Structure

```
REZ-Merchant/
├── industry-os/
│   └── hotel-os/
│       ├── core/                    # Core hotel services
│       │   ├── rez-pms/           # Main PMS (from StayOwn)
│       │   ├── rez-booking/       # Booking engine (from StayOwn)
│       │   ├── rez-guest-service/ # Guest management
│       │   └── rez-rate-manager/  # Rate plans
│       │
│       ├── guest-experience/        # Guest-facing services
│       │   ├── rez-mobile-guest/  # Guest app (from StayOwn)
│       │   ├── rez-pre-arrival/   # Pre-arrival (from StayOwn)
│       │   ├── rez-digital-checkin/
│       │   ├── rez-digital-key/   # Smart lock
│       │   └── rez-self-checkout/ # Express checkout
│       │
│       ├── room-services/          # F&B & services
│       │   ├── rez-room-service/   # Room service
│       │   ├── rez-minibar/       # Minibar (from StayOwn)
│       │   ├── rez-restaurant-hotel/ # Hotel restaurant
│       │   ├── rez-spa/           # Spa booking (from StayOwn)
│       │   └── rez-concierge/     # Concierge
│       │
│       ├── operations/              # Hotel operations
│       │   ├── rez-housekeeping/   # HK (merge both)
│       │   ├── rez-maintenance/   # Maintenance
│       │   ├── rez-parking/       # Parking (from StayOwn)
│       │   ├── rez-lost-found/    # Lost & found (from StayOwn)
│       │   └── rez-room-controls/  # Room controls
│       │
│       ├── ai/                    # AI services
│       │   ├── rez-staybot/       # AI Concierge (from StayOwn)
│       │   ├── rez-voice-agent/   # Voice (from StayOwn)
│       │   ├── rez-ai-frontdesk/  # Front desk AI
│       │   └── rez-hotel-genie/   # AI assistant
│       │
│       ├── intelligence/           # Data & insights
│       │   ├── rez-guest-memory/  # Guest preferences
│       │   ├── rez-guest-twin/    # Guest digital twin
│       │   ├── rez-business-twin/ # Hotel twin
│       │   └── rez-hotel-analytics/
│       │
│       ├── payments/               # Finance
│       │   ├── rez-hotel-payment/  # Better payment (from StayOwn)
│       │   ├── rez-hotel-wallet/
│       │   └── rez-hotel-loyalty/
│       │
│       ├── feedback/              # Guest feedback
│       │   ├── rez-reviews/        # Reviews (from StayOwn)
│       │   ├── rez-surveys/       # Surveys (from StayOwn)
│       │   └── rez-upsell/        # Upsell engine
│       │
│       ├── integrations/          # External integrations
│       │   ├── rez-channel-manager/ # Channel manager (keep REZ version)
│       │   ├── rez-ota-booking/    # OTA connections
│       │   ├── rez-google-hotel/
│       │   ├── rez-corp-integration/ # CorpPerks
│       │   └── rez-stayown-bridge/  # KHAIRMOVE
│       │
│       └── shared/                 # Shared utilities
│           ├── rez-hotel-sdk/     # SDK
│           └── rez-hotel-utils/
```

### Step 2: Service Mapping

| From | To | Status |
|------|----|--------|
| **STAYOWN → REZ-MERCHANT** | | |
| `rez-stayown-service` | `industry-os/hotel-os/core/rez-booking` | ✅ Migrate |
| `hojai-staybot` | `industry-os/hotel-os/ai/rez-staybot` | ✅ Migrate |
| `pre-arrival-service` | `industry-os/hotel-os/guest-experience/rez-pre-arrival` | ✅ Migrate |
| `zero-checkout-automation` | `industry-os/hotel-os/guest-experience/rez-self-checkout` | ✅ Migrate |
| `minibar-service` | `industry-os/hotel-os/room-services/rez-minibar` | ✅ Migrate |
| `hotel-restaurant-booking` | `industry-os/hotel-os/room-services/rez-restaurant-hotel` | ✅ Migrate |
| `hotel-spa-booking` | `industry-os/hotel-os/room-services/rez-spa` | ✅ Migrate |
| `concierge-desk` | `industry-os/hotel-os/room-services/rez-concierge` | ✅ Migrate |
| `predictive-housekeeping` | `industry-os/hotel-os/operations/rez-housekeeping` | ✅ Migrate |
| `parking-service` | `industry-os/hotel-os/operations/rez-parking` | ✅ Migrate |
| `lost-found` | `industry-os/hotel-os/operations/rez-lost-found` | ✅ Migrate |
| `smart-lock-service` | `industry-os/hotel-os/guest-experience/rez-digital-key` | ✅ Migrate |
| `room-controls` | `industry-os/hotel-os/operations/rez-room-controls` | ✅ Migrate |
| `voice-hotel-agent` | `industry-os/hotel-os/ai/rez-voice-agent` | ✅ Migrate |
| `ai-front-desk` | `industry-os/hotel-os/ai/rez-ai-frontdesk` | ✅ Migrate |
| `hojai-genie` | `industry-os/hotel-os/ai/rez-hotel-genie` | ✅ Migrate |
| `staybot-service-router` | `industry-os/hotel-os/ai/rez-staybot-router` | ✅ Migrate |
| `hojai-memory` | `industry-os/hotel-os/intelligence/rez-guest-memory` | ✅ Migrate |
| `hojai-memory-hotel` | `industry-os/hotel-os/intelligence/rez-guest-memory-hotel` | ✅ Migrate |
| `guest-twin-service` | `industry-os/hotel-os/intelligence/rez-guest-twin` | ✅ Migrate |
| `hotel-business-twin` | `industry-os/hotel-os/intelligence/rez-business-twin` | ✅ Migrate |
| `rez-payment` | `industry-os/hotel-os/payments/rez-hotel-payment` | ✅ Migrate |
| `review-manager` | `industry-os/hotel-os/feedback/rez-reviews` | ✅ Migrate |
| `feedback-survey` | `industry-os/hotel-os/feedback/rez-surveys` | ✅ Migrate |
| `upsell-engine` | `industry-os/hotel-os/feedback/rez-upsell` | ✅ Migrate |
| `stayown-corp-integration` | `industry-os/hotel-os/integrations/rez-corp-integration` | ✅ Migrate |
| `stayown-airzy-bridge` | `industry-os/hotel-os/integrations/rez-airzy-bridge` | ✅ Migrate |
| `hotel-os-integration` | `industry-os/hotel-os/integrations/rez-stayown-bridge` | ✅ Migrate |
| `StayOwn-Mobile` | `industry-os/hotel-os/guest-experience/rez-mobile-guest` | ✅ Migrate |
| `StayOwn-Staff-App` | `industry-os/hotel-os/operations/rez-staff-app` | ✅ Migrate |
| `integration-gateway` | `industry-os/hotel-os/shared/rez-hotel-gateway` | ✅ Migrate |
| **REZ-KEEP** | | |
| `rez-hotel-channel-integration-service` | `industry-os/hotel-os/integrations/rez-channel-manager` | ✅ Keep |
| `rez-hotel-maintenance-service` | `industry-os/hotel-os/operations/rez-maintenance` | ✅ Keep |
| **STAYOWN DEPRECATE** | | |
| `rez-pms` | (use rez-booking) | ❌ Deprecated |
| `rez-booking` | (use rez-booking) | ❌ Deprecated |
| `rez-housekeeping` | (use rez-housekeeping) | ❌ Deprecated |
| `rez-wallet` | (use rez-hotel-payment) | ❌ Deprecated |

### Step 3: Migration Commands

```bash
# Create directory structure
mkdir -p REZ-Merchant/industry-os/hotel-os/{core,guest-experience,room-services,operations,ai,intelligence,payments,feedback,integrations,shared}

# Migrate StayOwn services
# Example:
cp -r StayOwn-Hospitality/rez-stayown-service REZ-Merchant/industry-os/hotel-os/core/rez-booking
cp -r StayOwn-Hospitality/hojai-staybot REZ-Merchant/industry-os/hotel-os/ai/rez-staybot
# ... continue for all services

# Update package.json names
find REZ-Merchant/industry-os/hotel-os -name "package.json" -exec sed -i '' 's/stayown-hotel/rez-hotel/g' {} \;
```

---

## 📋 PHASE 3: UPDATE DEPENDENCIES

### Update in Each Service:

1. **Update package.json name**
   ```json
   {
     "name": "@rez/hotel-booking",
     "version": "1.0.0"
   }
   ```

2. **Update imports**
   ```typescript
   // Before
   import { StayOwnService } from '@stayown/service';
   
   // After
   import { HotelService } from '@rez/hotel-sdk';
   ```

3. **Update environment variables**
   ```env
   # Before
   STAYOWN_SERVICE_URL=http://localhost:3000
   
   # After
   REZ_HOTEL_SERVICE_URL=http://localhost:4031
   ```

4. **Update ports** (avoid conflicts)
   ```
   rez-booking: 4031
   rez-staybot: 4840
   rez-pre-arrival: 4828
   rez-minibar: 4810
   rez-spa: 4812
   rez-concierge: 4821
   rez-housekeeping: 4826
   rez-parking: 4815
   rez-digital-key: 4825
   rez-room-controls: 4814
   ```

---

## 📋 PHASE 4: INTEGRATION UPDATES

### Update RABTUL Integration
```typescript
// Before (StayOwn)
const RABTUL_SERVICES = {
  auth: 'http://localhost:4002',
  payment: 'http://localhost:4001',
  wallet: 'http://localhost:4004',
};

// After (REZ-Merchant)
const RABTUL_SERVICES = {
  auth: process.env.REZ_AUTH_URL || 'http://localhost:4002',
  payment: process.env.REZ_PAYMENT_URL || 'http://localhost:4001',
  wallet: process.env.REZ_WALLET_URL || 'http://localhost:4004',
};
```

### Update HOJAI Integration
```typescript
// Before
const HOJAI_BRAIN_URL = process.env.STAYOWN_HOJAI_URL || 'http://localhost:4530';

// After
const HOJAI_BRAIN_URL = process.env.HOJAI_BRAIN_URL || 'http://localhost:4630';
```

---

## 📋 PHASE 5: DATABASE MIGRATION

### Merge MongoDB Collections

```javascript
// Merge hotels collection
db.hotels_stayown.aggregate([
  { $merge: { into: "hotels", whenMatched: "merge" } }
]);

// Merge bookings
db.bookings_stayown.aggregate([
  { $merge: { into: "bookings", whenMatched: "keepExisting" } }
]);

// Migrate guests
db.guests_stayown.aggregate([
  { $merge: { into: "guests", whenMatched: "merge" } }
]);
```

---

## 📋 PHASE 6: TESTING

### Test Checklist

| Test | Status |
|------|--------|
| Unit Tests | ⏳ Pending |
| Integration Tests | ⏳ Pending |
| E2E Tests | ⏳ Pending |
| Load Tests | ⏳ Pending |
| Security Audit | ⏳ Pending |

---

## 📋 PHASE 7: DEPRECATION

### StayOwn-Hospitality Deprecation

1. **Archive repository** (don't delete)
2. **Update README.md** with redirect notice
3. **Update CLAUDE.md** with migration info
4. **Update all docs** pointing to REZ-Merchant
5. **Keep git history** for audit

### Deprecation Notice Template

```markdown
# ⚠️ DEPRECATED

This repository is deprecated and will be archived on **December 31, 2026**.

All hotel services have been consolidated into **REZ-Merchant**:

👉 https://github.com/imrejaul007/REZ-Merchant/tree/main/industry-os/hotel-os

For support, contact: support@rez.in
```

---

## 📋 PHASE 8: DEPLOYMENT

### Port Assignments

| Service | Port | Status |
|---------|------|--------|
| rez-booking | 4031 | ✅ |
| rez-staybot | 4840 | ✅ |
| rez-pre-arrival | 4828 | ✅ |
| rez-digital-checkin | 4829 | ✅ |
| rez-digital-key | 4825 | ✅ |
| rez-minibar | 4810 | ✅ |
| rez-restaurant-hotel | 4811 | ✅ |
| rez-spa | 4812 | ✅ |
| rez-concierge | 4821 | ✅ |
| rez-housekeeping | 4826 | ✅ |
| rez-maintenance | 4820 | ✅ |
| rez-parking | 4815 | ✅ |
| rez-lost-found | 4816 | ✅ |
| rez-room-controls | 4814 | ✅ |
| rez-voice-agent | 4841 | ✅ |
| rez-analytics | 4818 | ✅ |
| rez-reviews | 4819 | ✅ |
| rez-upsell | 4822 | ✅ |

---

## ✅ DELIVERABLES

| Item | Status |
|------|--------|
| Service Map | ✅ Complete |
| Directory Structure | ✅ Designed |
| Migration Commands | ✅ Ready |
| Port Registry | ✅ Ready |
| Deprecation Plan | ✅ Ready |

---

## 📅 TIMELINE

| Phase | Duration | Start | End |
|-------|----------|-------|-----|
| Phase 1: Audit | 1 day | June 13 | June 13 |
| Phase 2: Migrate Services | 3 days | June 14 | June 16 |
| Phase 3: Update Dependencies | 2 days | June 17 | June 18 |
| Phase 4: Integration Updates | 2 days | June 19 | June 20 |
| Phase 5: Database Migration | 1 day | June 21 | June 21 |
| Phase 6: Testing | 3 days | June 22 | June 24 |
| Phase 7: Deprecation | 1 day | June 25 | June 25 |
| Phase 8: Deployment | 2 days | June 26 | June 27 |

**Total: ~15 days**

---

## 🚀 READY TO EXECUTE

Execute consolidation with:
```bash
# This script will be created
./scripts/consolidate-hotel-services.sh
```

---
