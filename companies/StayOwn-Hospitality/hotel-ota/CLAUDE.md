# Hotel OTA - Developer Guide

**Version:** 1.0.0 | **Date:** June 4, 2026

---

## OVERVIEW

Hotel OTA is a comprehensive hotel booking platform with QR-based guest services. Part of the StayOwn-Hospitality ecosystem.

### Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Database:** Supabase (PostgreSQL)
- **Payments:** Razorpay
- **Hotel Search:** MakCorps API
- **Language:** TypeScript
- **Styling:** Tailwind CSS

---

## PROJECT STRUCTURE

```
Hotel OTA/
├── apps/                          # Monorepo apps
│   ├── api/                       # API gateway
│   ├── hotel-panel/               # Hotel management panel
│   ├── admin/                     # Admin dashboard
│   ├── corporate-panel/           # Corporate booking panel
│   ├── mobile/                    # Mobile app
│   └── ota-web/                   # Public OTA website
│
├── packages/
│   ├── database/                  # Prisma schema & client
│   └── merchant-sdk/              # SDK for merchant integration
│
├── hotel-pms/                     # Property Management System
│   └── hotel-management-master/
│
├── infrastructure/                # K8s/Istio configs
├── docs/                          # Documentation
└── package.json                   # Workspace root
```

---

## SERVICES & PORTS

| App | Port | Description |
|-----|------|-------------|
| ota-web | 3000 | Public hotel booking website |
| hotel-panel | 3001 | Hotel management interface |
| admin | 3002 | Admin dashboard |
| corporate-panel | 3003 | Corporate booking portal |
| api | 4000 | API gateway |
| mobile | 3004 | Mobile app |

---

## KEY MODULES

### Booking Module

| Feature | Description |
|---------|-------------|
| Hotel Search | Location, dates, guests, filters |
| Hotel Details | Photos, amenities, reviews, maps |
| Room Selection | Multiple room types, pricing tiers |
| Booking Flow | Guest info → Payment → Confirmation |
| Booking Management | View, modify, cancel bookings |

### Guest Services (Room QR)

| Feature | Description |
|---------|-------------|
| Service Requests | Housekeeping, maintenance, room service |
| Minibar Charges | Add charges to room bill |
| Checkout | Pay all charges at once |
| Digital Key | Room access via QR (future) |

### Restaurant Module

| Feature | Description |
|---------|-------------|
| Table QR | Scan to view digital menu |
| Kitchen Display | KDS for restaurant orders |

---

## ENVIRONMENT VARIABLES

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Razorpay
NEXT_PUBLIC_RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

# MakCorps (Hotel Search)
MAKCORPS_API_KEY=

# REZ Services Integration
REZ_AUTH_URL=http://localhost:4002
REZ_WALLET_URL=http://localhost:4004
REZ_PAYMENT_URL=http://localhost:4001
REZ_MERCHANT_URL=http://localhost:4007

# Internal
INTERNAL_SERVICE_TOKEN=
```

---

## QUICK START

```bash
# Install dependencies
npm install

# Run all apps
npm run dev

# Or run individual apps
cd apps/ota-web && npm run dev
cd apps/hotel-panel && npm run dev
cd apps/api && npm run dev
```

---

## TESTING

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Integration tests
npx tsx ../scripts/test-qr-integration.ts
```

---

## DEPLOYMENT

### Docker

```bash
docker build -t hotel-ota .
docker run -p 3000:3000 hotel-ota
```

### Vercel (OTA Web)

```bash
vercel --prod
```

### Render

```bash
render deploy --config render.yaml
```

---

## REZ INTEGRATION

Hotel OTA integrates with these RABTUL services:

| Service | Port | Purpose |
|---------|------|---------|
| rez-auth-service | 4002 | User authentication |
| rez-wallet-service | 4004 | ReZ Coins, balance |
| rez-payment-service | 4001 | Payments, refunds |

---

## QR CODE FORMATS

```bash
# Table QR (Restaurant Menu)
rez://menu/{merchantId}?table={tableId}

# Room QR (Guest Services)
rez://room/{roomId}?token={encryptedToken}

# Booking QR
rez://booking/{bookingId}
```

---

## TROUBLESHOOTING

### Common Issues

| Issue | Solution |
|-------|----------|
| Supabase connection failed | Check `.env.local` credentials |
| Razorpay webhook failing | Verify webhook secret |
| MakCorps API error | Check API key validity |
| Build fails | Run `npm install` first |

---

## ARCHITECTURE DECISIONS

1. **Monorepo with workspaces** - Shared packages, atomic commits
2. **Supabase for database** - Real-time subscriptions, auth built-in
3. **Razorpay for payments** - UPI, cards, wallets support
4. **QR-based services** - No app download needed for guests

---

## LAST UPDATED

**Date:** June 4, 2026
**Version:** 1.0.0
