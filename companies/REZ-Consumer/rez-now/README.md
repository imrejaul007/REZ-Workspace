# REZ NOW

> **Digital Mini Store for Any Merchant**

**URL:** `now.rez.money/{businessSlug}`

---

## What is REZ NOW?

**REZ NOW** is a **digital mini store for any merchant**.

It's a mix of:
- **Linktree** - Social links & profile
- **Shopify** - Online store & checkout
- **Google My Business** - Business profile & map
- **Google Maps** - Location & directions
- **Payment gateway** - Direct pay to merchant

**Key Feature:** Customers can pay directly to the merchant via **"Pay Store"**.

**Core Principle:** "Turn every business QR into a growth engine."

---

## What Merchants Get

| Feature | Description |
|---------|-------------|
| Digital Store | Online presence in minutes |
| Business Profile | Logo, banner, description, hours |
| Contact Info | Phone, email, WhatsApp |
| Social Links | Instagram, Facebook, website |
| Map & Directions | Google Maps integration |
| Products/Services | Catalog with pricing |
| Online Ordering | Cart & checkout |
| Direct Payments | Pay Store (UPI, Razorpay) |
| QR Code | Universal QR for the business |
| Analytics | Views, clicks, conversions |

---

## Quick Comparison

| Traditional QR | REZ NOW QR |
|---------------|------------|
| Collects money only | Collects money + builds customer database |
| No loyalty | Automatic loyalty & REZ Coins |
| No retention | Automated marketing & offers |
| Isolated transactions | CRM + analytics |

---

## Industries Supported

| Industry | Features |
|----------|----------|
| **Restaurants** | Menu, ordering, table management, pay bill |
| **Retail** | Product catalog, cart, checkout |
| **Salons/Spas** | Services, appointments, packages |
| **Hotels** | Room hub, room service, checkout, billing |
| **Professional** | Services, appointment booking |

---

## Customer Features

### Ordering System
- Browse menu with dietary filters
- Item customization & add-ons
- Coupon code application
- Group ordering

### Payments
- QR pay (UPI deep links)
- Razorpay integration
- NFC tap-to-pay
- Manual amount entry
- Split bills (by total, by item, GST division)

### Loyalty & Rewards
- REZ Coins cashback
- Loyalty tiers (Bronze, Silver, Gold, Platinum)
- One-tap reorder from history

### Receipts & Tracking
- Printable receipts
- Downloadable receipts
- Live order tracking (Socket.IO)
- Offline support (IndexedDB queue)

---

## Merchant Features

### Payment Kiosk
- Live payment notifications
- Daily revenue tracking
- Reconciliation dashboard

### Staff Tools
- Kitchen display system (KDS)
- Waiter call queue
- Timer tracking

### Merchant CRM
- Customer lifetime value tracking
- VIP customer identification
- At-risk customer alerts
- Repeat visit tracking

### Analytics
- QR scan analytics
- Page views & link clicks
- Device breakdown
- Timeline data

---

## Offer Automation Engine

| Trigger | Action |
|---------|--------|
| Dormant Customer (14+ days) | Send cashback offer |
| Birthday | Send special reward |
| Happy Hour (3-5 PM) | Auto-create discount |
| Low Footfall | Trigger promo |
| Weather (rain) | Push delivery offers |

---

## Room Hub (Hotels)

| Feature | Description |
|---------|-------------|
| Service Requests | Housekeeping, room service, laundry |
| Minibar Billing | Track & bill consumption |
| Express Checkout | Itemized bill with all charges |
| Guest Preferences | Remember pillow, temperature, dietary |
| Voice Commands | Natural language requests |
| Multilingual | 10 languages supported |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14, Tailwind CSS |
| PWA | Service worker, offline support |
| Real-time | Socket.IO + polling fallback |
| Payments | Razorpay, UPI |
| Auth | OTP login, JWT |
| Database | Supabase |

---

## Integration with RABTUL

```
REZ NOW ──────► ReZ Wallet (REZ coins)
         │
         ├─────────► ReZ Auth Service
         │
         ├─────────► ReZ Payment Service
         │
         └─────────► Razorpay
```

---

## AI & Personalization

| Feature | Description |
|---------|-------------|
| Dish Recommendations | Based on taste profile |
| Weather Suggestions | Weather-aware menu recommendations |
| Taste Profile | Learning user preferences |
| Smart Bundles | AI-powered package suggestions |
| AI Chat Widget | Customer support chatbot |

---

## File Structure

```
rez-now/
├── app/
│ ├── scan/ # QR scanner
│ ├── safe-qr/ # Safe QR scanner
│ ├── [storeSlug]/ # Store pages
│ │ ├── cart/ # Shopping cart
│ │ ├── checkout/ # Payment
│ │ ├── room/ # Hotel room hub
│ │ └── reserve/ # Appointments
│ ├── wallet/ # REZ coins
│ └── orders/ # Order history
├── components/
│ ├── catalog/ # Menu, retail, services catalogs
│ ├── checkout/ # Payment components
│ ├── loyalty/ # Coins, badges, streaks
│ ├── merchant/ # Merchant dashboard, CRM
│ ├── menu/ # Menu components
│ ├── order/ # Order management
│ ├── room/ # Hotel room service
│ ├── table/ # Group ordering
│ └── web-qr-scanner/ # QR scanner
└── lib/
 ├── api/ # API clients
 └── services/ # AI services
```

---

## Pages

| Page | Purpose |
|------|---------|
| `/` | Home - how it works |
| `/scan` | Scan QR code |
| `/search` | Search businesses |
| `/[storeSlug]` | Business store page |
| `/[storeSlug]/cart` | Shopping cart |
| `/[storeSlug]/checkout` | Payment |
| `/[storeSlug]/reserve` | Book appointment |
| `/[storeSlug]/room/[id]` | Hotel room hub |
| `/wallet` | REZ coins wallet |
| `/orders` | Order history |

---

## Code Coverage

| Category | Coverage |
|----------|----------|
| Customer Ordering | 95% |
| Payments | 90% |
| Loyalty & Coins | 90% |
| Split Bills | 100% |
| Merchant CRM | 85% |
| Offer Automation | 90% |
| Room Hub | 95% |
| AI/Recommendations | 90% |

---

## Quick Start

```bash
npm install
npm run dev
```

---

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=xxx
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
REZ_AUTH_URL=https://rez-auth-service.onrender.com
REZ_WALLET_URL=https://rez-wallet-service.onrender.com
REZ_PAYMENT_URL=https://rez-payment-service.onrender.com
INTERNAL_SERVICE_TOKEN=xxx
```

---

## Launch Checklist

### Prerequisites

- [ ] `npm install` dependencies
- [ ] Configure production environment variables
- [ ] Connect to backend services (Supabase, Razorpay, REZ services)

### Production Build

```bash
npm run build
npm start
```

### Pre-Launch Testing

- [ ] QR scan → store page
- [ ] Add to cart → checkout
- [ ] UPI/Razorpay payment flow
- [ ] Split bill functionality
- [ ] REZ Coins earn/redeem
- [ ] Order history & reorder
- [ ] PWA install prompt
- [ ] Offline mode (service worker)

### Post-Launch (v1.1)

- [ ] WhatsApp receipts
- [ ] Thermal printing
- [ ] Audio notifications for merchant

---

## Issues Fixed

| Issue | Status |
|-------|--------|
| console.log in logger | Fixed - production-safe logging |
| scannerFeedback console.debug | Fixed - uses logger |
| Service Worker | Implemented (public/sw.js) |
| Thermal Printing | Added (components/order/ThermalPrinter.tsx) |

---

## Last Updated

May 15, 2026
