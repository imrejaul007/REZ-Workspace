# GLAMAI - Developer Guide

## Project Context

GLAMAI is a production-ready Salon AI Operating System with 4 AI employees.

**Parent:** HOJAI AI (`/hojai-ai/`)
**Category:** Industry AI
**Industry:** Salon& Spa
**Port:** 4860
**Status:** Production Ready

## Architecture

```
glamai/
├── src/
│   ├── index.ts              # Main entry point with Express server
│   ├── config.ts             # All configuration (env vars, constants)
│   ├── types/
│   │   └── index.ts          # TypeScript types and Zod schemas
│   ├── models/
│   │   └── index.ts          # MongoDB Mongoose schemas
│   ├── middleware/
│   │   ├── auth.ts           # JWT authentication
│   │   ├── logger.ts         # Winston logging
│   │   └── error.ts          # Error handling
│   ├── services/
│   │   ├── beautyAdvisor.ts  # Beauty Advisor AI employee
│   │   ├── appointmentManager.ts # Appointment Manager AI
│   │   ├── campaignAgent.ts  # Campaign Agent AI
│   │   └── retentionAgent.ts # Retention Agent AI
│   └── routes/
│       ├── index.ts          # Route mounting
│       ├── customers.ts       # Customer CRUD
│       ├── services.ts       # Service CRUD
│       ├── appointments.ts   # Appointment CRUD
│       ├── stylists.ts       # Stylist CRUD
│       ├── ai.ts             # AI employee endpoints
│       └── analytics.ts      # Analytics endpoints
├── package.json
├── tsconfig.json
├── API.md                    # API documentation
├── README.md                 # User documentation
├── SOT.md                    # State of Technology
└── PRODUCT.md                # Product requirements
```

## AI Employees

| Employee | File | Purpose |
|----------|------|---------|
| Beauty Advisor | `services/beautyAdvisor.ts` | Service recommendations based on occasion, budget, preferences |
| Appointment Manager | `services/appointmentManager.ts` | Scheduling, rescheduling, cancellations, slot availability |
| Campaign Agent | `services/campaignAgent.ts` | Marketing campaigns, promotions, loyalty programs |
| Retention Agent | `services/retentionAgent.ts` | Churn prediction, re-engagement, loyalty upgrades |

## Key Files

| File | Purpose |
|------|---------|
| `src/config.ts` | All configuration (ports, URLs, limits, loyalty tiers) |
| `src/types/index.ts` | TypeScript interfaces + Zod validation schemas |
| `src/models/index.ts` | Mongoose schemas (Customer, Service, Stylist, Appointment, Payment, Campaign) |
| `src/middleware/auth.ts` | JWT validation, internal token support |
| `src/services/*.ts` | Business logic for each AI employee |

## Configuration

All configuration is in `src/config.ts`:

```typescript
// Server
PORT = 4860

// MongoDB
MONGODB_URI = mongodb://localhost:27017/glamai

// Authentication
JWT_SECRET = process.env.JWT_SECRET
INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_TOKEN

// Rate Limits
RATE_LIMITS.API.max = 100 (per 15 min)
RATE_LIMITS.AUTH.max = 10 (per min)
RATE_LIMITS.AI.max = 30 (per min)

// Loyalty Tiers
LOYALTY.TIERS.bronze.minSpent = 0
LOYALTY.TIERS.silver.minSpent = 2000
LOYALTY.TIERS.gold.minSpent = 5000
LOYALTY.TIERS.platinum.minSpent = 10000
```

## Commands

```bash
# Install dependencies
npm install

# Start development
npm run dev

# Build for production
npm run build

# Start production
npm start
```

## API Base URL

```
http://localhost:4860
```

## Key Endpoints

### AI Employees
```bash
POST /api/ai/beauty-advisor/recommend
POST /api/ai/appointment/schedule
POST /api/ai/campaign/create
POST /api/ai/retention/analyze
```

### CRUD
```bash
POST/GET/PATCH/DELETE /api/customers
POST/GET/PATCH/DELETE /api/services
POST/GET/PATCH /api/appointments
POST/GET/PATCH/DELETE /api/stylists
```

### Analytics
```bash
GET /api/analytics/dashboard
GET /api/analytics/revenue
GET /api/analytics/customers
```

## Database Models

| Model | Fields |
|-------|--------|
| Customer | name, phone, email, birthday, preferences, loyaltyTier, totalSpent, visits, lastVisit |
| Service | name, category, price, duration, isActive |
| Stylist | name, phone, specialties[], rating, isActive |
| Appointment | customerId, serviceId, stylistId, date, time, status, notes |
| Payment | appointmentId, amount, method, status |
| Campaign | type, subject, message, discount, validFrom, validUntil, targetSegment, status |

## MongoDB Indexes

```javascript
// Customer
{ phone: 1 }         // unique
{ email: 1 }
{ loyaltyTier: 1 }
{ lastVisit: -1 }

// Service
{ category: 1 }
{ isActive: 1 }
{ price: 1 }

// Stylist
{ specialties: 1 }
{ isActive: 1 }
{ rating: -1 }

// Appointment
{ customerId: 1 }
{ serviceId: 1 }
{ stylistId: 1 }
{ date: 1 }
{ status: 1 }
```

## Adding New Features

1. **New Model**: Add schema to `src/models/index.ts`
2. **New Service**: Create business logic in `src/services/`
3. **New Routes**: Add endpoints in `src/routes/`
4. **Mount Routes**: Add to `src/routes/index.ts`
5. **Update Types**: Add types to `src/types/index.ts`
6. **Update Config**: Add config to `src/config.ts`

## Error Handling

Use the `errors` helper from middleware:

```typescript
import { errors } from '../middleware/error';

// In route handlers
throw errors.notFound('Customer');
throw errors.conflict('Phone already registered');
throw errors.validation({ field: 'error message' });
```

## Logging

Use Winston logger:

```typescript
import { logger } from '../middleware/logger';

logger.info('Event description', { metadata });
logger.error('Error occurred', { error: err.message });
```

## Testing

```bash
# Health check
curl http://localhost:4860/health

# Create customer
curl -X POST http://localhost:4860/api/customers \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","phone":"9876543210"}'

# Get recommendations
curl -X POST http://localhost:4860/api/ai/beauty-advisor/recommend \
  -H "Content-Type: application/json" \
  -d '{"occasion":"wedding","budget":5000}'
```

## HOJAI Integration

The service connects to:
- **HOJAI Core** (port 4800) - Enterprise brain
- **Webhook Service** (port 4090) - Event publishing
- **Notification Service** (port 4095) - SMS/WhatsApp

Configure via environment variables:
```bash
HOJAI_URL=http://localhost:4800
WEBHOOK_SERVICE_URL=http://localhost:4090
NOTIFICATION_SERVICE_URL=http://localhost:4095
```

## Status

- [x] Production-ready server with MongoDB
- [x] 4 AI employees fully implemented
- [x] JWT authentication
- [x] Rate limiting
- [x] Comprehensive error handling
- [x] Winston logging
- [x] Health checks
- [x] Graceful shutdown
- [x] API documentation
- [x] Zod validation
- [x] Loyalty program
- [x] Analytics dashboard

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | June 6, 2026 | Initial production-ready release |