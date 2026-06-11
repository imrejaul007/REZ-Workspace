# GLAMAI - State of Technology

**Version:** 1.0.0
**Date:** June 6, 2026
**Industry:** Salon & Spa
**Port:** 4860
**Company:** HOJAI-AI
**Status:** PRODUCTION READY

---

## 1. PRODUCT OVERVIEW

GLAMAI is an AI-powered operating system for salons and spas. It combines 4 AI employees, automated scheduling, loyalty management, and comprehensive analytics.

### Target Customers
- Standalone salons and spas (HOJAI AI clients)
- REZ ecosystem salon clients (via REZ-Merchant)

### Pricing
- 4,999/month (HOJAI AI standalone)
- Included in REZ-Merchant OS (REZ ecosystem)

---

## 2. AI EMPLOYEES

### 2.1 Beauty Advisor AI
- **File:** `src/services/beautyAdvisor.ts`
- **Endpoint:** `POST /api/ai/beauty-advisor/recommend`
- **Capabilities:**
  - Service recommendations based on occasion (wedding, party, interview, etc.)
  - Budget-based filtering
  - Preference matching (Hair, Skin, Nails, Spa, Massage, Makeup)
  - Loyalty tier discounts
  - AI-generated recommendation reasons

### 2.2 Appointment Manager AI
- **File:** `src/services/appointmentManager.ts`
- **Endpoints:**
  - `POST /api/ai/appointment/schedule`
  - `POST /api/ai/appointment/reschedule`
  - `POST /api/ai/appointment/cancel`
  - `GET /api/ai/appointment/slots`
- **Capabilities:**
  - Smart scheduling with conflict detection
  - Slot availability calculation
  - Stylist assignment
  - Auto customer visit tracking

### 2.3 Campaign Agent AI
- **File:** `src/services/campaignAgent.ts`
- **Endpoints:**
  - `POST /api/ai/campaign/create`
  - `GET /api/ai/campaign/active`
  - `GET /api/ai/campaign/:id/analytics`
- **Campaign Types:** birthday, loyalty, promotion, winback, seasonal, referral
- **Target Segments:** all, inactive, loyal, birthday, new, vip

### 2.4 Retention Agent AI
- **File:** `src/services/retentionAgent.ts`
- **Endpoints:**
  - `POST /api/ai/retention/analyze`
  - `GET /api/ai/retention/at-risk`
  - `GET /api/ai/retention/stats`
  - `GET /api/ai/retention/upgrade-eligible`
- **Capabilities:**
  - Risk scoring (0-100)
  - Risk levels: low, medium, high, critical
  - Churn probability calculation
  - Engagement score
  - Auto re-engagement recommendations

---

## 3. DATA MODELS

### 3.1 Customer
```typescript
{
  name: string;
  phone: string (unique);
  email?: string;
  birthday?: Date;
  preferences: string[];
  loyaltyTier: 'bronze' | 'silver' | 'gold' | 'platinum';
  totalSpent: number;
  visits: number;
  lastVisit?: Date;
}
```

### 3.2 Service
```typescript
{
  name: string (unique);
  category: 'Hair' | 'Skin' | 'Nails' | 'Spa' | 'Massage' | 'Makeup' | 'Other';
  price: number;
  duration: number; // minutes
  isActive: boolean;
}
```

### 3.3 Stylist
```typescript
{
  name: string;
  phone?: string;
  email?: string;
  specialties: string[];
  rating: number; // 0-5
  isActive: boolean;
}
```

### 3.4 Appointment
```typescript
{
  customerId: ObjectId;
  serviceId: ObjectId;
  stylistId?: ObjectId;
  date: Date;
  time: string; // HH:MM
  status: 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | 'no-show';
  notes?: string;
}
```

### 3.5 Payment
```typescript
{
  appointmentId?: ObjectId;
  amount: number;
  method: 'cash' | 'card' | 'upi' | 'wallet' | 'netbanking';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
}
```

### 3.6 Campaign
```typescript
{
  type: 'birthday' | 'loyalty' | 'promotion' | 'winback' | 'seasonal' | 'referral';
  subject: string;
  message: string;
  discount: number;
  validFrom: Date;
  validUntil: Date;
  targetSegment: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  sentCount: number;
}
```

---

## 4. LOYALTY PROGRAM

| Tier | Min Spent | Discount | Points Multiplier |
|------|-----------|----------|-------------------|
| Bronze | 0 | 0% | 1x |
| Silver | 2,000 | 5% | 1.25x |
| Gold | 5,000 | 10% | 1.5x |
| Platinum | 10,000 | 15% | 2x |

Auto-upgrade based on totalSpent.

---

## 5. API ENDPOINTS

### Health
- `GET /health` - Full health check
- `GET /health/live` - Liveness probe
- `GET /health/ready` - Readiness probe

### AI (4 endpoints)
- `POST /api/ai/beauty-advisor/recommend`
- `POST /api/ai/appointment/schedule`
- `POST /api/ai/campaign/create`
- `POST /api/ai/retention/analyze`

### Customers (5 endpoints)
- `POST /api/customers`
- `GET /api/customers`
- `GET /api/customers/:id`
- `PATCH /api/customers/:id`
- `DELETE /api/customers/:id`
- `GET /api/customers/:id/history`
- `GET /api/customers/:id/loyalty`

### Services (6 endpoints)
- `POST /api/services`
- `GET /api/services`
- `GET /api/services/categories`
- `GET /api/services/:id`
- `PATCH /api/services/:id`
- `DELETE /api/services/:id`

### Appointments (11 endpoints)
- `POST /api/appointments`
- `GET /api/appointments`
- `GET /api/appointments/slots`
- `GET /api/appointments/:id`
- `PATCH /api/appointments/:id`
- `POST /api/appointments/:id/confirm`
- `POST /api/appointments/:id/start`
- `POST /api/appointments/:id/complete`
- `POST /api/appointments/:id/cancel`
- `POST /api/appointments/:id/reschedule`
- `POST /api/appointments/:id/no-show`

### Stylists (6 endpoints)
- `POST /api/stylists`
- `GET /api/stylists`
- `GET /api/stylists/specialties`
- `GET /api/stylists/:id`
- `PATCH /api/stylists/:id`
- `DELETE /api/stylists/:id`

### Analytics (5 endpoints)
- `GET /api/analytics/dashboard`
- `GET /api/analytics/revenue`
- `GET /api/analytics/customers`
- `GET /api/analytics/services`
- `GET /api/analytics/stylists`

---

## 6. TECHNOLOGY STACK

| Layer | Technology |
|-------|------------|
| Runtime | Node.js 18+ |
| Language | TypeScript 5 |
| Framework | Express.js 4 |
| Database | MongoDB (Mongoose 8) |
| Validation | Zod |
| Logging | Winston |
| Security | Helmet, CORS, Rate Limit |
| Auth | JWT |

---

## 7. DEPLOYMENT

### Port
- **Main Service:** 4860

### Environment Variables
```bash
PORT=4860
MONGO_URL=mongodb://localhost:27017/glamai
JWT_SECRET=your-secret
INTERNAL_TOKEN=your-internal-token
HOJAI_URL=http://localhost:4800
```

### Commands
```bash
npm install
npm run dev    # Development
npm run build  # Production build
npm start      # Production start
```

### Health Check
```bash
curl http://localhost:4860/health
```

---

## 8. FEATURES

### Core Features
- [x] Customer registration with phone unique constraint
- [x] Loyalty tier auto-upgrade
- [x] Service catalog with categories
- [x] Appointment scheduling with conflict detection
- [x] Stylist management with specialties
- [x] Slot availability calculation
- [x] Payment recording on appointment completion

### AI Features
- [x] Occasion-based recommendations
- [x] Budget filtering
- [x] Loyalty tier discounts
- [x] Risk scoring algorithm
- [x] Campaign template generation
- [x] Re-engagement recommendations

### Security Features
- [x] JWT authentication
- [x] Internal service token support
- [x] Rate limiting (API, Auth, AI)
- [x] Helmet security headers
- [x] CORS configuration
- [x] Input validation (Zod)

### Operations Features
- [x] Winston logging
- [x] Request ID tracking
- [x] Health checks (liveness, readiness)
- [x] Graceful shutdown
- [x] MongoDB connection with retry
- [x] Auto seeding of default data

---

## 9. INTEGRATIONS

### HOJAI Ecosystem
- HOJAI Enterprise Brain (port 4600)
- Webhook Service (port 4090)
- Notification Service (port 4095)
- Auth Service (port 4002)

### REZ Ecosystem
- REZ Mind (port 4300) - AI recommendations
- REZ Intent Graph (port 4301) - Intent tracking

---

## 10. CURRENT STATUS

| Component | Status | Notes |
|-----------|--------|-------|
| Main Server | ✅ Ready | Express with all middleware |
| Beauty Advisor | ✅ Ready | Full recommendation logic |
| Appointment Manager | ✅ Ready | Scheduling + conflict detection |
| Campaign Agent | ✅ Ready | All campaign types |
| Retention Agent | ✅ Ready | Risk scoring + recommendations |
| Customer CRUD | ✅ Ready | Full with history + loyalty |
| Service CRUD | ✅ Ready | Categories + soft delete |
| Appointment CRUD | ✅ Ready | All status transitions |
| Stylist CRUD | ✅ Ready | Specialties + ratings |
| Analytics | ✅ Ready | Dashboard + revenue + segments |
| Documentation | ✅ Ready | API.md + README + CLAUDE.md |

---

## 11. FILE STRUCTURE

```
glamai/
├── src/
│   ├── index.ts              # Main entry point
│   ├── config.ts             # All configuration
│   ├── types/
│   │   └── index.ts          # Types + Zod schemas
│   ├── models/
│   │   └── index.ts          # Mongoose schemas
│   ├── middleware/
│   │   ├── auth.ts           # JWT auth
│   │   ├── logger.ts         # Winston logging
│   │   └── error.ts          # Error handling
│   ├── services/
│   │   ├── beautyAdvisor.ts  # AI Employee 1
│   │   ├── appointmentManager.ts # AI Employee 2
│   │   ├── campaignAgent.ts # AI Employee 3
│   │   └── retentionAgent.ts # AI Employee 4
│   └── routes/
│       ├── index.ts          # Route mounting
│       ├── customers.ts
│       ├── services.ts
│       ├── appointments.ts
│       ├── stylists.ts
│       ├── ai.ts
│       └── analytics.ts
├── package.json
├── tsconfig.json
├── API.md
├── README.md
├── CLAUDE.md
├── SOT.md
└── PRODUCT.md
```

---

**Last Updated:** June 6, 2026
**Maintainer:** HOJAI AI Team