# REZ Ecosystem - CORRECT Architecture
**Date:** May 18, 2026

---

## Company Structure

### RTNM-Group (Parent)
```
RTNM-Group/
├── REZ-Merchant/        # Merchant services
├── StayOwn-Hospitality/  # Hotel/Hospitality
├── CorpPerks/           # Enterprise SaaS
├── REZ-Media/          # Advertising
└── REZ-Intelligence/   # AI/ML
```

### 1. CorpPerks Company (github.com/.../CorpPerks)
```
CorpPerks/
├── RestoPapa/          # Restaurant B2B SaaS
│ ├── NexTaBizz/        # Shared B2B commerce
│ └── industry-os/restauranthub/ # Restaurant services
│
├── PeopleOS/           # Workforce Management OS
│
└── REZ-Merchant-corpperks-bridge/ # Bridge service
```

### 2. StayOwn-Hospitality Company (github.com/.../StayOwn)
```
StayOwn-Hospitality/
├── rez-stayown-service/      # Hotel PMS (Property Management System)
├── Hotel-OTA/               # Hotel Online Travel Agency
├── rez-habixo-service/       # Hotel services
├── REZ-hotel-channel-bridge/ # Channel manager
└── hotel-ota-api/           # OTA API
```

### 3. REZ-Merchant (github.com/.../REZ-Merchant)
```
REZ-Merchant/
├── industry-os/              # Industry verticals
│ ├── restauranthub/         # RestoPapa (B2B for restaurants)
│ ├── rez-hotel-service/     # Hotel OS
│ ├── rez-hotel-pos-service/ # Hotel POS
│ ├── rez-salon-service/     # Salon OS
│ └── ...
│
├── NexTaBizz/               # Shared B2B commerce
├── REZ-merchant-corpperks-bridge/ # Bridge to CorpPerks
└── ...
```

---

## Service Connections Map

### Hotel Services Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        StayOwn-Hospitality                           │
│                         (Hotel Company)                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────┐         ┌─────────────────────┐          │
│  │   Hotel PMS         │         │    Hotel OTA        │          │
│  │ rez-stayown-service │         │    Hotel-OTA        │          │
│  │ (Property Mgmt)     │         │ (Online Travel)    │          │
│  └──────────┬──────────┘         └──────────┬──────────┘          │
│             │                                │                      │
│             └────────────┬───────────────────┘                      │
│                          ▼                                           │
│  ┌─────────────────────────────────────────────────────┐            │
│  │            Hotel Channel Bridge                     │            │
│  │         REZ-hotel-channel-bridge                   │            │
│  └──────────────────────┬──────────────────────────────┘            │
│                         │                                             │
└─────────────────────────┼───────────────────────────────────────────┘
                          │
                          │ Events & Webhooks
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         REZ-Merchant                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────┐         ┌─────────────────────┐          │
│  │   Hotel OS          │         │   Hotel POS         │          │
│  │ rez-hotel-service   │         │ rez-hotel-pos-service│         │
│  │ (Operations)        │         │ (Point of Sale)     │          │
│  └──────────┬──────────┘         └──────────┬──────────┘          │
│             │                                │                      │
│             └────────────┬───────────────────┘                      │
│                          ▼                                           │
│  ┌─────────────────────────────────────────────────────┐            │
│  │            Mind Hotel Service                       │            │
│  │         rez-mind-hotel-service                     │            │
│  │         (AI Insights from PMS events)              │            │
│  └─────────────────────────────────────────────────────┘            │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
                          │
                          │ RABTUL Integration
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         RABTUL Services                              │
│                    (Shared Infrastructure)                            │
├─────────────────────────────────────────────────────────────────────┤
│  rez-auth-service │ rez-payment-service │ rez-wallet-service       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Industry-OS Structure

### industry-os/ Contents

| Directory | Company | Purpose |
|----------|---------|---------|
| `restauranthub/` | CorpPerks (RestoPapa) | Restaurant B2B SaaS |
| `rez-hotel-*` | REZ-Merchant | Hotel operations |
| `rez-salon-*` | REZ-Merchant | Salon operations |
| `rez-fitness-*` | REZ-Merchant | Fitness/Gym operations |
| `rez-healthcare-*` | REZ-Merchant | Healthcare operations |
| `rez-pharmacy-*` | REZ-Merchant | Pharmacy operations |
| `rez-retail-*` | REZ-Merchant | Retail operations |

---

## Cross-Company Connections

### Hotel Connection (StayOwn ↔ REZ-Merchant)

| From | To | Purpose | Status |
|------|-----|---------|--------|
| StayOwn PMS | REZ-Merchant Hotel OS | Booking events | Via webhooks |
| StayOwn PMS | rez-mind-hotel-service | AI insights | Via data pipeline |
| REZ-Merchant Hotel OS | RABTUL | Auth, Payment | ✅ GOOD |
| rez-mind-hotel-service | RABTUL | AI services | ✅ GOOD |

### Restaurant Connection (CorpPerks ↔ REZ-Merchant)

| From | To | Purpose | Status |
|------|-----|---------|--------|
| RestoPapa | REZ-Merchant | POS, Orders | ✅ Via NexTaBizz |
| CorpPerks Bridge | CorpPerks | Employee benefits | ✅ GOOD |
| CorpPerks Bridge | RABTUL | Auth, Wallet | ✅ GOOD |

---

## RABTUL Integration Status

### Properly Integrated with RABTUL

| Service | Auth | Payment | Wallet | Status |
|---------|------|---------|--------|--------|
| StayOwn rez-stayown-service | ✅ | ✅ | ✅ | GOOD |
| REZ-Merchant rez-hotel-service | ✅ (FIXED) | - | - | FIXED |
| REZ-Merchant rez-hotel-pos-service | ✅ | ✅ | ✅ | GOOD |
| REZ-merchant-corpperks-bridge | ✅ (FIXED) | ✅ | ✅ | FIXED |
| RestoPapa apps/api | ✅ | ✅ | - | GOOD |
| rez-pharmacy-service | ✅ (NEW) | - | - | FIXED |
| rez-mind-healthcare-service | ✅ (NEW) | - | - | FIXED |

### Need RABTUL Integration

| Service | Auth | Payment | Wallet | Priority |
|---------|------|---------|--------|----------|
| rez-salon-* services | ❌ | ❌ | ❌ | HIGH |
| rez-fitness-service | ❌ | ❌ | ❌ | HIGH |
| rez-healthcare-service | ⚠️ Partial | ❌ | ❌ | HIGH |
| rez-mind-salon-service | ❌ | ❌ | ❌ | HIGH |

---

## Audit Summary

### Issues Found & Fixed

| # | Issue | Service | Severity | Status |
|---|-------|---------|----------|--------|
| 1 | JWT bypass | rez-hotel-service | CRITICAL | FIXED |
| 2 | CORS `*` | 4 services | CRITICAL | FIXED |
| 3 | Hardcoded secrets | 4 services | CRITICAL | FIXED |
| 4 | Token exposure | KDS mobile | CRITICAL | FIXED |
| 5 | No healthcare auth | Pharmacy, Mind-Health | CRITICAL | FIXED |
| 6 | No rate limiting | Pharmacy, CorpPerks Bridge | CRITICAL | FIXED |
| 7 | CORS `*` | CorpPerks Bridge | CRITICAL | FIXED |
| 8 | No .gitignore | CorpPerks Bridge | CRITICAL | FIXED |
| 9 | No auth | CorpPerks Bridge | CRITICAL | FIXED |

### Remaining Issues

| # | Issue | Service | Severity | Priority |
|---|-------|---------|----------|----------|
| 1 | No RABTUL auth | Salon services | HIGH | HIGH |
| 2 | No RABTUL auth | Fitness service | HIGH | HIGH |
| 3 | No RABTUL auth | Healthcare service | HIGH | HIGH |
| 4 | No RABTUL auth | Mind-salon | HIGH | HIGH |
| 5 | Hardcoded Redis password | RestoPapa | HIGH | MEDIUM |
| 6 | Mock auth in dev | RestoPapa web | MEDIUM | MEDIUM |

---

## Files Created/Modified This Session

### Critical Security Fixes
- `industry-os/rez-hotel-service/src/middleware/auth.ts` - JWT bypass fix
- `REZ-kds-mobile/src/services/api.ts` - Token exposure fix
- `industry-os/rez-restaurant-crm-service/src/index.ts` - CORS fix
- `industry-os/rez-fitness-service/src/index.ts` - CORS fix
- `industry-os/rez-pharmacy-service/src/index.ts` - CORS + Auth + Rate limit
- `industry-os/rez-mind-healthcare-service/src/index.ts` - CORS fix
- `industry-os/rez-salon-pos-service/src/config/index.ts` - Secret fix
- `industry-os/rez-salon-qr-service/src/services/QRService.ts` - Secret fix
- `industry-os/rez-mind-hotel-service/src/routes/event-routes.ts` - Secret fix
- `rez-merchant-intelligence-service/src/config/index.ts` - Secret fix
- `REZ-merchant-corpperks-bridge/` - Complete rewrite

### New Files
- `REZ-merchant-corpperks-bridge/src/middleware/auth.ts`
- `REZ-merchant-corpperks-bridge/.gitignore`
- `REZ-merchant-corpperks-bridge/.env.example`
- `industry-os/rez-pharmacy-service/src/middleware/auth.ts`
- `industry-os/rez-mind-healthcare-service/src/middleware/auth.ts`

---

## Next Steps

### Immediate (24 hours)
1. Audit StayOwn-Hospitality services for security
2. Audit restopapa (restauranthub) for security
3. Add RABTUL to salon/fitness/healthcare services

### Short Term (1 week)
1. Complete RABTUL integration for all industry services
2. Add rate limiting to remaining services
3. Create shared auth middleware package

### Long Term (1 month)
1. Unified service discovery
2. Centralized logging
3. Security scanning in CI/CD

---

**Last Updated:** May 18, 2026
**Next Audit:** June 18, 2026
