# REZ-Home

**Version:** 1.0.0  
**Date:** June 4, 2026  
**Status:** Active Development

---

## Overview

REZ-Home is a home services marketplace that connects users with verified service professionals for Plumber, Electrician, AC Service, Cleaning, Pest Control, and Carpentry services. The platform provides real-time booking, provider matching, payment settlement, and review management.

---

## Competitor Comparison

| Feature | REZ-Home | Urban Company | TaskRabbit |
|---------|----------|---------------|------------|
| **Categories** | 6 (Extensible to 15) | 50+ | 50+ |
| **AI Provider Matching** | Yes (HOJAI Brain) | Basic | Basic |
| **Real-time Tracking** | Yes | Yes | Yes |
| **Payment Settlement** | Auto (24hr) | Auto (48hr) | Manual |
| **Review System** | AI-powered | Standard | Standard |
| **Emergency Services** | Yes | Limited | No |
| **Price Estimation** | AI quotes | Fixed | Hourly |
| **Platform Fee** | 10% | 20-25% | 15-23% |
| **Provider Verification** | Multi-layer | Standard | Basic |
| **Multi-city** | 50+ cities | 30+ cities | 40+ cities |

### Competitive Advantages

1. **HOJAI AI Integration** - Smart provider matching based on skills, location, ratings
2. **Faster Settlement** - 24-hour payment cycle vs competitor's 48-72 hours
3. **Lower Platform Fee** - 10% vs 15-25% for better provider economics
4. **Unified Ecosystem** - Connects to REZ-Wallet, REZ-Auth, REZ-Notification
5. **Real-time Updates** - WebSocket-based tracking and notifications

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         REZ-HOME ARCHITECTURE                       │
└─────────────────────────────────────────────────────────────────────┘

                              ┌──────────────────┐
                              │   USER APPS      │
                              │  (REZ-Consumer)  │
                              │  rez-app, do     │
                              └────────┬─────────┘
                                       │
                                       ▼
┌──────────────────────────────────────────────────────────────────────┐
│                     REZ-HOME GATEWAY (4700)                         │
│              Express + Rate Limiter + JWT Auth                      │
└────────────────────────────┬─────────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┬──────────────────┐
        │                  │                  │                  │
        ▼                  ▼                  ▼                  ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│   BOOKING     │  │   SERVICE     │  │   PROVIDER    │  │   PAYMENT     │
│   (4701)      │  │   (4702)      │  │   (4703)      │  │   (4704)      │
├───────────────┤  ├───────────────┤  ├───────────────┤  ├───────────────┤
│ • Create      │  │ • Catalog     │  │ • Registration│  │ • Settlement  │
│ • Cancel      │  │ • Categories  │  │ • Availability│  │ • Refunds     │
│ • Track       │  │ • Search      │  │ • Ratings     │  │ • Disputes    │
│ • Reschedule  │  │ • Pricing     │  │ • Earnings    │  │ • Wallets     │
└───────────────┘  └───────────────┘  └───────────────┘  └───────────────┘
        │                  │                  │                  │
        └──────────────────┴────────┬────────┴──────────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │      RABTUL-TECHNOLOGIES     │
                    ├──────────────────────────────┤
                    │  REZ-auth-service (4001)     │
                    │  REZ-wallet-service (4002)   │
                    │  REZ-notification-service    │
                    └──────────────────────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │        HOJAI-AI              │
                    ├──────────────────────────────┤
                    │  REZ-Mind (Intent)           │
                    │  Provider Matching Engine    │
                    │  Price Optimization          │
                    └──────────────────────────────┘
```

---

## Services

| # | Service | Port | Description |
|---|---------|------|-------------|
| 1 | rez-home-gateway | 4700 | API Gateway with auth, rate limiting |
| 2 | rez-home-booking | 4701 | Booking lifecycle management |
| 3 | rez-home-service | 4702 | Service catalog and categories |
| 4 | rez-home-provider | 4703 | Provider management |
| 5 | rez-home-payment | 4704 | Payment settlement and wallets |

---

## Service Categories

### 1. Plumber
- Pipe repair
- Leak fixing
- Drain cleaning
- Water heater installation
- Bathroom fitting

### 2. Electrician
- Wiring
- Switch/panel repair
- Fan installation
- AC wiring
- UPS/inverter service

### 3. AC Service
- AC installation
- AC repair
- Gas refilling
- Annual maintenance
- Water servicing

### 4. Cleaning
- Home deep cleaning
- Office cleaning
- Carpet cleaning
- Sofa cleaning
- Window cleaning

### 5. Pest Control
- General pest control
- Cockroach treatment
- Termite control
- Bed bug treatment
- Rodent control

### 6. Carpentry
- Furniture repair
- Modular kitchen
- Wardrobe installation
- Door/window repair
- Custom furniture

---

## API Endpoints

### Gateway (4700)
```
GET  /health                    - Health check
GET  /api/v1/health             - API health
POST /api/v1/auth/verify        - Verify JWT token
```

### Booking Service (4701)
```
POST   /api/v1/bookings                    - Create booking
GET    /api/v1/bookings                    - List user bookings
GET    /api/v1/bookings/:id                - Get booking details
PATCH  /api/v1/bookings/:id                - Update booking
DELETE /api/v1/bookings/:id                - Cancel booking
POST   /api/v1/bookings/:id/track          - Track provider location
POST   /api/v1/bookings/:id/reschedule     - Reschedule booking
POST   /api/v1/bookings/:id/complete       - Mark complete
```

### Service Catalog (4702)
```
GET  /api/v1/services                      - List all services
GET  /api/v1/services/:id                  - Get service details
GET  /api/v1/services/categories           - List categories
GET  /api/v1/services/categories/:id       - Category details
GET  /api/v1/services/search               - Search services
GET  /api/v1/services/:id/pricing           - Get pricing
POST /api/v1/services/estimate              - Price estimation
```

### Provider Service (4703)
```
POST   /api/v1/providers/register           - Register provider
GET    /api/v1/providers/:id                - Get provider profile
PATCH  /api/v1/providers/:id                - Update profile
GET    /api/v1/providers/:id/availability   - Get availability
POST   /api/v1/providers/:id/availability  - Set availability
GET    /api/v1/providers/:id/earnings       - Get earnings
GET    /api/v1/providers/:id/reviews        - Get reviews
POST   /api/v1/providers/:id/reviews       - Add review
GET    /api/v1/providers/nearby             - Find nearby providers
```

### Payment Service (4704)
```
POST   /api/v1/payments/initiate            - Initiate payment
GET    /api/v1/payments/:id                - Get payment status
POST   /api/v1/payments/:id/refund         - Request refund
GET    /api/v1/payments/settlement         - Provider settlement
POST   /api/v1/payments/dispute             - Raise dispute
GET    /api/v1/payments/wallet/:providerId  - Provider wallet
```

---

## Integration Requirements

### RABTUL-TECHNOLOGIES
| Service | Integration | Purpose |
|---------|-------------|---------|
| REZ-auth-service | REST/gRPC | User authentication |
| REZ-wallet-service | REST | Provider payments |
| REZ-notification-service | Event | Push/SMS notifications |

### HOJAI-AI
| Service | Integration | Purpose |
|---------|-------------|---------|
| REZ-Mind | REST | Intent prediction |
| Price Optimization | REST | Dynamic pricing |
| Provider Matching | REST | AI-based matching |

### Internal Services
| Service | Purpose |
|---------|---------|
| rez-home-gateway | API gateway |
| rez-home-booking | Booking management |
| rez-home-service | Service catalog |
| rez-home-provider | Provider management |
| rez-home-payment | Payment settlement |

---

## Data Models

### Booking
```typescript
interface Booking {
  id: string;
  userId: string;
  providerId: string;
  serviceId: string;
  category: ServiceCategory;
  scheduledDate: Date;
  scheduledTime: string;
  address: Address;
  status: BookingStatus;
  price: PriceBreakdown;
  providerLocation?: GeoLocation;
  createdAt: Date;
  updatedAt: Date;
}

enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}
```

### Provider
```typescript
interface Provider {
  id: string;
  userId: string;
  name: string;
  phone: string;
  categories: ServiceCategory[];
  skills: string[];
  rating: number;
  totalJobs: number;
  verified: boolean;
  documents: Document[];
  availability: AvailabilitySlot[];
  earnings: WalletBalance;
  createdAt: Date;
}
```

---

## Environment Variables

```env
# Service
NODE_ENV=development
PORT=4700

# RABTUL Integration
RABTUL_AUTH_URL=http://localhost:4001
RABTUL_WALLET_URL=http://localhost:4002
RABTUL_NOTIFICATION_URL=http://localhost:4004

# HOJAI Integration
HOJAI_MIND_URL=http://localhost:4100
HOJAI_PRICING_URL=http://localhost:4101

# JWT
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=7d

# Database
DATABASE_URL=postgresql://localhost:5432/rez_home

# Redis
REDIS_URL=redis://localhost:6379
```

---

## Quick Start

```bash
# Install dependencies
npm install

# Start all services
npm run dev

# Or start individual services
cd rez-home-gateway && npm run dev
cd rez-home-booking && npm run dev
cd rez-home-service && npm run dev
cd rez-home-provider && npm run dev
cd rez-home-payment && npm run dev

# Run tests
npm test

# Health check
curl http://localhost:4700/health
```

---

## Project Structure

```
REZ-Home/
├── README.md
├── package.json
├── rez-home-gateway/
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       └── index.ts
├── rez-home-booking/
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts
│       └── routes/
│           └── bookings.ts
├── rez-home-service/
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts
│       └── routes/
│           └── services.ts
├── rez-home-provider/
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts
│       └── routes/
│           └── providers.ts
└── rez-home-payment/
    ├── package.json
    ├── tsconfig.json
    └── src/
        ├── index.ts
        └── routes/
            └── payments.ts
```

---

## License

Proprietary - REZ Ecosystem (HOJAI-AI)
