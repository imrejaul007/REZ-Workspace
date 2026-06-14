# CLAUDE.md

---

## Service Discovery

This service is registered in REZ-Master/services.json.

To discover related services:
```bash
# From REZ-Master directory
node rez-cli find <service-name>  # Find specific service
node rez-cli list --category <category>  # List by category
node rez-cli stats  # Platform statistics
```

Quick search:
- `node rez-cli list --search payment` - Find payment services
- `node rez-cli list --search auth` - Find auth services
- `node rez-cli list --search kds` - Find KDS services
- `node rez-cli list --search ai` - Find AI services

---



RestoPapa is a B2B/B2C SaaS platform for restaurants. Claude Code uses this file for guidance when working with code in this repository.

---

## Project Overview

**Version**: 1.1.0 | **Last Updated**: May 2026

### Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 14.x, React, TypeScript, TailwindCSS, shadcn/ui |
| **Backend** | NestJS, TypeScript, Prisma ORM |
| **Database** | PostgreSQL (90+ Prisma models) |
| **Real-time** | Socket.io (KDS) |
| **Cache/Queue** | Redis, BullMQ |
| **Payments** | Stripe, Razorpay |
| **Monitoring** | Prometheus, Grafana |

---

## Build & Test Commands

```bash
# Development
npm run dev              # Start all services
cd apps/web && npm run dev     # Frontend: localhost:3000
cd apps/api && npm run dev     # Backend: localhost:3001

# Build
npm run build           # Build all apps
npm run lint           # Lint all

# Testing
npm run test           # Run tests
npm run test:e2e       # Integration tests
npm run perf:all       # Performance tests

# Database
npm run db:migrate     # Run migrations
npm run db:seed       # Seed database

# Docker
npm run docker:up     # Start infrastructure
npm run monitoring:up # Start monitoring stack
```

---

## Project Structure

```
restauranthub/
├── apps/
│   ├── web/                    # Next.js Frontend
│   │   ├── app/               # App Router pages
│   │   ├── components/        # UI components
│   │   └── lib/              # Hooks, utils, API clients
│   ├── api/                    # NestJS Backend
│   │   └── src/modules/       # 19 Feature modules
│   │       ├── admin/         # Admin operations
│   │       ├── analytics/     # Reporting
│   │       ├── auth/          # Auth + ReZ SSO
│   │       ├── community/     # Forum
│   │       ├── fintech/       # Payments
│   │       ├── inventory/     # Stock management
│   │       ├── jobs/          # Job postings
│   │       ├── kds/           # Kitchen Display System
│   │       ├── marketplace/   # B2B marketplace
│   │       ├── menu/          # Menu management
│   │       ├── orders/        # Order management
│   │       ├── reservations/   # Table bookings
│   │       ├── reviews/       # Restaurant reviews
│   │       ├── staff/         # Employee management
│   │       └── training/      # Staff training
│   ├── auth-service/           # Auth microservice
│   ├── notification-service/  # Notifications
│   ├── order-service/         # Orders
│   └── restaurant-service/    # Restaurants
├── packages/
│   └── db/                    # Shared Prisma schema
├── docs/                       # Documentation
└── monitoring/                 # Prometheus/Grafana
```

---

## Key Features

### POS & Orders
- Order management (dine-in, takeaway, delivery)
- Real-time Kitchen Display System (KDS) via WebSocket
- POS payments (cash, card, UPI, wallet)
- Customer loyalty programs

### Inventory Management
- Batch tracking with expiry dates
- Stock movements (in/out)
- Reorder requests (auto/manual)
- Low stock alerts via webhooks

### Menu Management
- Categories, items, modifiers, variants
- Allergen and tag support
- Real-time menu updates

### Staff & Reservations
- Employee management with designations
- Shift scheduling and attendance
- Leave management
- Table management with QR codes

### Financial
- Stripe + Razorpay payments
- Invoice generation
- Refund processing
- Double-entry bookkeeping

---

## Integrations

### ReZ SSO Bridge (`apps/api/src/modules/auth/rez-bridge/`)
Single sign-on via ReZ platform:
1. Exchange ReZ JWT for RestoPapa JWT
2. Merchant profile synced via `rezMerchantId`
3. Access granted to linked restaurant

**Environment Variables**:
```bash
REZ_JWT_SECRET=shared-signing-secret
REZ_BACKEND_URL=https://api.rezplatform.com
REZ_INTERNAL_TOKEN=internal-service-token
```

### NextaBizz Sync (`/nextabizz/services/integrations/restopapa/`)
Bidirectional inventory sync with NextaBizz.

**Webhook Events**:
- `inventory.low_stock`, `inventory.out_of_stock`
- `order.status_changed`, `order.created`
- `maintenance.request_created`

---

## Database Models

**90+ Prisma models** in `apps/api/prisma/schema.prisma`:

| Category | Models |
|----------|--------|
| **Core** | User, Profile, Restaurant, Branch |
| **Menu** | MenuCategory, MenuItem, MenuModifier, MenuVariant |
| **Orders** | Order, OrderItem, OrderStatusHistory, PosOrder, PosPayment |
| **Inventory** | Product, InventoryBatch, StockMovement, ReorderRequest |
| **Staff** | Employee, Shift, Attendance, Leave |
| **Reservations** | Table, TableReservation |
| **Financial** | Invoice, Payment, Refund, Account, JournalEntry, Expense |
| **Loyalty** | LoyaltyProgram, LoyaltyTransaction |
| **Community** | CommunityPost, Comment, Review, Job, JobApplication |

---

## Authentication

### Demo Credentials
| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@restopapa.com` | `admin123` |
| Restaurant | `restaurant@restopapa.com` | `restaurant123` |

### Security Features
- JWT access tokens (15min) + refresh tokens (7 days)
- Token blacklisting on logout
- Password reset with secure tokens
- Email verification
- TOTP-based 2FA
- Rate limiting

---

## API Endpoints

### Access Points
- **Frontend**: http://localhost:3000
- **API**: http://localhost:3001/api/v1
- **Swagger**: http://localhost:3001/docs

### Key Endpoints
```
POST /api/v1/auth/signin           # Login
POST /api/v1/auth/signup           # Register
POST /api/v1/auth/rez-bridge      # ReZ SSO

GET  /api/v1/orders                # List orders
POST /api/v1/orders               # Create order
PUT  /api/v1/orders/:id/status    # Update status

GET  /api/v1/inventory/batches    # List inventory
GET  /api/v1/menu/categories      # List menu categories

POST /api/v1/staff                # Create employee
GET  /api/v1/staff/:id/shifts    # Get shifts

GET  /api/v1/reservations/tables  # List tables
POST /api/v1/reservations/bookings # Book table

POST /api/v1/fintech/payments     # Process payment
```

### WebSocket (KDS)
```
Namespace: /kds
Events: join-store, get-current-orders, order-status-changed
Server: merchant:new_order, order:status_updated
```

---

## Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/db

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret
JWT_REFRESH_SECRET=your-refresh-secret

# Payments
STRIPE_SECRET_KEY=sk_...
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...

# ReZ Integration
REZ_JWT_SECRET=...
REZ_BACKEND_URL=...
REZ_INTERNAL_TOKEN=...
```

---

## Development Patterns

### Adding a New API Module
1. Create module in `apps/api/src/modules/[module-name]/`
2. Add controller, service, DTOs
3. Register in `app.module.ts`
4. Add routes to module
5. Add tests

### Adding a New Frontend Page
1. Create route in `apps/web/app/[route]/page.tsx`
2. Use existing components from `components/`
3. Call API via `lib/api.ts` client
4. Add auth checks for protected routes

### Database Migrations
```bash
cd apps/api
npx prisma migrate dev --name add_new_feature
npx prisma generate
```

---

## Security Rules

- NEVER commit `.env` files or secrets
- ALWAYS validate input with DTOs/class-validator
- Use parameterized queries (Prisma handles this)
- Verify webhook signatures
- Log authentication failures with context

---

## Testing

```bash
# Run all tests
npm run test

# Single test file
cd apps/api && npx jest test/[module].test.ts

# Performance testing
npm run perf:k6:load
npm run perf:k6:stress
```

---

## RESTAURANT VERTICAL MODULES

**Full documentation:** [SOT-RESTAURANT.md](SOT-RESTAURANT.md)

### Module Overview

| Module | Location | Purpose |
|--------|----------|---------|
| **CRM** | `src/modules/crm/` | Customer profiles, segmentation, campaigns |
| **Reputation** | `src/modules/reputation/` | Reviews, ratings, sentiment |
| **Recipe** | `src/modules/recipe/` | Menu → inventory mapping |
| **Merchant Loans** | `src/modules/merchant-loans/` | Credit scoring, RidZa integration |
| **WhatsApp** | `src/modules/restaurant-whatsapp/` | Customer notifications |
| **Retry Queue** | `src/modules/retry-queue/` | Database-backed retries |
| **Procurement** | `src/modules/procurement/` | NexaBizz RFQ creation |

### Key Integrations

```
POS Order → KDS (WebSocket) → Kitchen AI (HOJAI) → WhatsApp (confirmation)
                                              ↓
                                    Inventory (auto-deduct)
                                              ↓
                                    CRM (update profile)
                                              ↓
                                    Loyalty (cashback)
```

### Retry Queue (Database-Backed)

Replaces setTimeout-based retries with database persistence:

```typescript
// Job Types
enum RetryJobType {
  KDS_NOTIFY,      // Kitchen display notification
  CASHBACK_CREDIT, // Loyalty cashback
  LOW_STOCK_ALERT, // Procurement trigger
  WEBHOOK_DELIVERY,// External webhooks
  NOTIFICATION      // SMS/Email/Push
}

// Backoff: 2s → 8s → 32s → 128s → 512s
```

### Customer Segmentation

| Segment | Criteria |
|---------|----------|
| NEW | First order < 30 days |
| REGULAR | 2-5 orders/month |
| VIP | >5 orders/month + >₹2000 avg |
| AT_RISK | No order 30-60 days |
| CHURNED | No order > 60 days |

### Kitchen AI (8 Methods)

Located in `src/modules/kds/kitchen-ai.connector.ts`:

1. `predictPrepTime(order)` - Estimate prep time
2. `suggestStation(order)` - Route to best station
3. `detectBottleneck(kitchenState)` - Identify delays
4. `suggestParallelPrep(order)` - Parallel cooking suggestions
5. `getPriorityScore(order)` - Order urgency
6. `estimateCompletionTime(order)` - Real-time ETA
7. `analyzeTicketTime(trends)` - Performance trends
8. `recommendStationConfig(kitchen)` - Optimal layout

### Offline Queue

For POS connectivity loss, orders are persisted to `PendingOrder` table:

```typescript
// Flow
Network Error → Save to PendingOrder → Show "Order Queued"
                ↓
Connection Restored → Process queued orders → Delete from table
```

### Credit Scoring (Merchant Loans)

Score range: 300-850 (like CIBIL)

| Factor | Weight |
|--------|--------|
| Monthly Revenue | 30% |
| Transaction Velocity | 25% |
| Avg Order Value | 20% |
| Weekend/Weekday Ratio | 10% |
| Revenue Volatility | 15% |

---

## Version History

See `CHANGELOG.md` for full history.

**v1.2.0** (June 2026): Restaurant vertical modules (CRM, Reputation, Recipe, Merchant Loans, WhatsApp, Retry Queue, Procurement), Kitchen AI connector, Offline queue, Credit scoring

**v1.1.0** (May 2026): ReZ SSO Bridge, NextaBizz sync, Security audit fixes, Password reset, 2FA, Community @mentions
