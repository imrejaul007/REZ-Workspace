# REZ-Consumer

**B2C Consumer Apps Platform**
**Last Updated:** June 12, 2026
**Status:** ✅ ALL 43 PRODUCTS/SERVICES PRODUCTION READY

---

## COMPANY OVERVIEW

REZ-Consumer is the B2C (Business-to-Consumer) division of RTNM, providing consumer-facing mobile apps, web applications, and backend microservices.

**Parent:** RTNM Group
**AI Provider:** HOJAI AI
**Tech Provider:** RABTUL Technologies

---

## PRODUCTS CATALOG

### 📱 Mobile Apps (6)

| App | Platform | Screens | Description | Status |
|-----|----------|---------|-------------|--------|
| **rez-app** | Expo SDK 53 | 738+ | Main super app (wallet, orders, QR, feed, AI) | ✅ |
| **do** | Expo SDK 53 | 20+ | AI chat with 38 agents | ✅ |
| **safe-qr** | Expo SDK 53 | 16 | Emergency QR & 15 safety modes | ✅ |
| **verify-qr-mobile** | Expo SDK 53 | 7 | QR verification | ✅ |
| **rez-driver** | Expo SDK 52 | 8 | Driver app | ✅ |
| **REZ-Home** | Expo SDK 53 | 9 | Home dashboard | ✅ |

### 🌐 Web Apps (3)

| App | Platform | Coverage | Description | Status |
|-----|----------|----------|-------------|--------|
| **rez-now** | Next.js 16 | 95% | Merchant OS, QR ordering, payments | ✅ |
| **verify-qr-dashboard** | Next.js 14 | 70% | QR management dashboard | ✅ |
| **go4food** | Next.js 14 | 30% | Food comparison platform | ✅ |

### 🛒 Standalone Apps (2)

| App | Type | Services | Description | Status |
|-----|------|----------|-------------|--------|
| **REZ-Mart** | Mobile + 12 services | 4100-4112 | Quick commerce (Blinkit/Zepto) | ✅ |
| **REZ-Invest** | Mobile + 5 services | 4800-4804 | Investment tracking | ✅ |

### ⚙️ Backend Services (11)

| Service | Port | Description | Status |
|---------|------|-------------|--------|
| verify-qr-service | 4003 | Product verification, warranty, OEM | ✅ |
| safe-qr-service | 4001 | QR generation, 15 emergency modes | ✅ |
| REZ-assistant | 3011 | AI chat, Claude AI | ✅ |
| REZ-inbox | 3003 | Email parser, receipts | ✅ |
| REZ-bills | 3012 | Receipt scanning, cashback | ✅ |
| REZ-expense | 3013 | AI expense tracking | ✅ |
| REZ-nearby | 3014 | Location-based classifieds | ✅ |
| REZ-save | 3016 | Wishlist, price alerts | ✅ |
| REZ-scan | 3017 | Universal QR scanner | ✅ |
| REZ-menu-qr | 3018 | Menu QR ordering | ✅ |
| go4food-api | 3002 | Food comparison | ✅ |

### 🎨 UI Services (5)

| Service | Port | Status |
|---------|------|--------|
| REZ-inbox-ui | 3010 | ✅ |
| REZ-assistant-ui | 3011 | ✅ |
| REZ-expense-ui | 3013 | ✅ |
| REZ-nearby-ui | 3015 | ✅ |
| REZ-scan-ui | 3017 | ✅ |

### 🔐 Security App (1)

| App | Port | Status |
|-----|------|--------|
| corpild-shield-app | 4716 | ✅ |

---

## ⚠️ IMPORTANT - COMPANY BOUNDARIES

This is **REZ-Consumer** - Consumer B2C apps and services.

### ❌ NOT REZ-Consumer

| Service | Belongs To | Location |
|---------|------------|----------|
| buzzlocal | **AXOM** | /Axom/buzzlocal |
| airzy | **KHAIRMOVE** | /KHAIRMOVE/airzy |
| rider-circle | **KHAIRMOVE** | /KHAIRMOVE/rider-circle |
| creator-qr | **AdBazaar** | /AdBazaar/creators |

---

## QUICK START

```bash
# Mobile Apps
cd rez-app && npx expo start        # Main app
cd do && npx expo start              # AI Chat
cd safe-qr && npx expo start        # Emergency QR
cd verify-qr-mobile && npx expo start
cd rez-driver && npx expo start
cd REZ-Home && npx expo start

# Web Apps
cd rez-now && npm run dev            # Merchant OS
cd verify-qr-dashboard && npm run dev
cd go4food && npm run dev

# Backend Services
cd verify-qr-service && npm run dev   # Port 4003
cd safe-qr-service && npm run dev     # Port 4001
cd REZ-assistant && npm run dev      # Port 3011
cd REZ-inbox && npm run dev          # Port 3003
cd REZ-bills && npm run dev          # Port 3012
cd REZ-expense && npm run dev        # Port 3013
```

---

## SECURITY

- ✅ Helmet.js (CSP, HSTS)
- ✅ CORS
- ✅ Rate Limiting
- ✅ JWT Authentication
- ✅ Account Lockout
- ✅ Winston Logging
- ✅ Health Checks

---

## DOCUMENTATION

- [CLAUDE.md](./CLAUDE.md) - Developer guide
- [RTNM-COMPANIES-AUDIT.md](./RTNM-COMPANIES-AUDIT.md) - Company audit
- [RTNM-PRODUCTS-FEATURES-AUDIT.md](./RTNM-PRODUCTS-FEATURES-AUDIT.md) - Features audit
- [INTEGRATION-STATUS.md](./INTEGRATION-STATUS.md) - External services integration status
- [REZ-Mart/FEATURES.md](./REZ-Mart/FEATURES.md) - Quick commerce features
- [safe-qr/FEATURES.md](./safe-qr/FEATURES.md) - Emergency QR features
- [verify-qr-service/FEATURES.md](./verify-qr-service/FEATURES.md) - QR verification features

---

## AUDIT HISTORY

| Date | Changes |
|------|---------|
| June 13, 2026 | Ecosystem audit completed, integration fixes applied |
| June 12, 2026 | All 43 products production ready |
| June 12, 2026 | Security fixes (JWT, CSP, HSTS) |
| June 12, 2026 | Rate limiting added |
| June 12, 2026 | Swagger documentation added |
| June 12, 2026 | Integration tests added |

---

**Version:** 9.0.0
**Last Updated:** June 13, 2026