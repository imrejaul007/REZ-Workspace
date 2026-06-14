# REZ Verify QR Service

**Enterprise Product Trust & Warranty Infrastructure Platform**

> **Version 2.0** - Post-Purchase Trust + Warranty OS + Service Lifecycle

---

## Overview

REZ Verify QR is a comprehensive product verification, warranty management, and service lifecycle platform that has evolved beyond traditional QR verification into a complete **Post-Purchase Trust Infrastructure**.

### What We Built

| Category | Features |
|----------|----------|
| **Trust Infrastructure** | Serial Registry, QR Verification, Fraud Detection |
| **Warranty OS** | Activation, Claims, Extended Warranties, Insurance |
| **Service Lifecycle** | Booking, Service Centers, Express Replacement |
| **Ownership Platform** | Passports, Certificates, Transfer, Resale Safety |
| **Enterprise OEM** | Analytics, Counterfeit Detection, Regional Heatmaps, Predictive AI |
| **Integrations** | WhatsApp Bot, Payments, Push Notifications |

---

## Quick Start

### Option 1: Docker (Recommended)

```bash
cd verify-qr-service
./deploy.sh
```

This starts MongoDB, Redis, and the API with one command.

### Option 2: Manual

```bash
npm install
npm run dev
```

Service runs on **Port 4003**.

### Option 3: Docker Compose

```bash
docker compose up -d
```

### Run Tests

```bash
./test-api.sh
```

### Docs

See [QUICKSTART.md](QUICKSTART.md) for detailed instructions.

---

## API Reference

### Core Verification APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/verify` | Verify product authenticity |
| POST | `/api/activate-warranty` | Activate warranty + 1% cashback |
| POST | `/api/claim` | File warranty claim |

### Ownership APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/passport/create` | Create ownership passport |
| GET | `/api/passport/:serial` | Get passport details |
| POST | `/api/passport/:serial/transfer` | Transfer ownership |
| GET | `/api/resale/buyer-check/:serial` | Resale risk check |

### Warranty & Subscription APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/warranty-plans` | List warranty plans |
| POST | `/api/subscribe` | Subscribe to plan |
| POST | `/api/insurance/policy` | Create insurance policy |

### Express Replacement APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/express-replacement` | Request replacement |
| GET | `/api/express-replacement/:id/track` | Live tracking |

### OEM Dashboard APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/oem/:brand_id/dashboard` | Main dashboard |
| GET | `/oem/:brand_id/counterfeit-analytics` | Counterfeit detection |
| GET | `/oem/:brand_id/regional-analytics` | Regional heatmaps |
| GET | `/oem/:brand_id/fraud-maps` | Fraud patterns |
| POST | `/oem/:brand_id/recall` | Create recall |

### Integration APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/whatsapp/send` | Send WhatsApp message |
| POST | `/api/payments/create-link` | Create payment link |
| POST | `/api/notifications/push` | Send push notification |
| POST | `/api/notifications/sms` | Send SMS |

---

## Features

### Phase 1: Post-Purchase Trust Platform ✅

- [x] Serial Registry with batch management
- [x] QR verification with fraud detection
- [x] Warranty activation with 1% cashback
- [x] Claim management lifecycle
- [x] Service booking with slot scheduling
- [x] **Ownership Passport** - Complete product identity
- [x] **Service History** - Portable records
- [x] **Resale Verification** - Buyer risk assessment

### Phase 2: Ownership Infrastructure ✅

- [x] **Transfer Mechanism** - Sale/gift/inheritance
- [x] **Ownership Certificate** - Shareable
- [x] **Resale Safety Flow** - Buyer protection
- [x] **Insurance Layer** - Theft, accidental damage
- [x] **Extended Warranty Plans** - 4 tiers
- [x] **Warranty Subscriptions** - Auto-renew

### Phase 3: Enterprise OEM Platform ✅

- [x] **OEM Dashboard** - Key metrics & alerts
- [x] **Counterfeit Analytics** - Detection & trends
- [x] **Regional Heatmaps** - Location intelligence
- [x] **Fraud Maps** - Pattern detection
- [x] **Predictive Analytics** - 30-day forecasts
- [x] **Recall Campaigns** - Bulk notifications

### Integrations ✅

- [x] **WhatsApp Bot** - Message templates
- [x] **Razorpay** - Payment links & orders
- [x] **Push Notifications** - FCM
- [x] **SMS** - Via REZ Notifications

---

## Files Structure

```
verify-qr-service/
├── src/
│   ├── index.ts              # Main entry
│   ├── service.ts            # Core APIs
│   ├── merchant.ts           # Merchant APIs
│   ├── ownershipPassport.ts  # Passport & resale
│   ├── extendedWarranty.ts  # Plans & subscriptions
│   ├── expressReplacement.ts # Replacement
│   ├── oemDashboard.ts      # OEM analytics
│   ├── whatsappBot.ts        # WhatsApp integration
│   ├── paymentIntegration.ts # Razorpay
│   └── notificationService.ts # Push/SMS/Email
├── tests/                    # Tests
├── docs/                     # API docs
└── package.json
```

---

## Environment Variables

```bash
# Service
PORT=4003
MONGODB_URI=mongodb://localhost:27017/verify-qr

# WhatsApp
WHATSAPP_PHONE_NUMBER_ID=xxx
WHATSAPP_ACCESS_TOKEN=xxx
WHATSAPP_WEBHOOK_VERIFY_TOKEN=xxx

# Razorpay
RAZORPAY_KEY_ID=xxx
RAZORPAY_KEY_SECRET=xxx
RAZORPAY_WEBHOOK_SECRET=xxx

# Firebase
FIREBASE_API_KEY=xxx

# External Services
WALLET_API=https://rez-wallet.onrender.com
INTELLIGENCE_API=https://rez-intelligence.onrender.com
NOTIF_API=https://rez-notifications.onrender.com
```

---

## Related Services

| Service | Port | Location |
|---------|------|----------|
| verify-qr-service | 4003 | `verify-qr-service/` |
| verify-qr-dashboard | 3000 | `verify-qr-dashboard/` |
| verify-qr-mobile | Expo | `verify-qr-mobile/` |

---

## Support

- **Email:** api-support@rez.money
- **Docs:** https://docs.verify-qr.rezapp.com
