# RestoPapa SaaS Platform

A comprehensive B2B/B2C SaaS platform for restaurants with multi-role support (Admin, Restaurant, Employee, Vendor, Customer) including POS, inventory, KDS, marketplace, job portal, community forum, messaging, analytics, and payment systems.

**Version**: 1.1.0 | **Last Updated**: May 2026

---

## 🏗️ Architecture

### Frontend
- **Framework**: Next.js 14.x with TypeScript
- **UI**: TailwindCSS + shadcn/ui components
- **State Management**: React hooks + Context API + React Query
- **Real-time**: Socket.io client for KDS
- **Forms**: React Hook Form + Zod validation

### Backend
- **Framework**: NestJS + TypeScript
- **Database**: Prisma ORM with PostgreSQL (Mock database for development)
- **ORM**: Prisma with 90+ database models
- **Authentication**: JWT with refresh tokens + RBAC
- **Real-time**: Socket.io for Kitchen Display System (KDS)
- **Queue**: BullMQ for async job processing
- **API Documentation**: Swagger/OpenAPI at `/docs`

### Infrastructure
- **Cache/Real-time**: Redis + Socket.io
- **File Storage**: AWS S3 (LocalStack for development)
- **Payments**: Stripe + Razorpay integration
- **Monitoring**: Prometheus + Grafana
- **Performance Testing**: Artillery + k6

---

## 📦 Modules Overview

### Backend API Modules (`apps/api/src/modules/`)

| Module | Description |
|--------|-------------|
| **admin** | Admin operations, user management, platform controls |
| **analytics** | Reporting and metrics dashboards |
| **auth** | Authentication, JWT tokens, **ReZ SSO Bridge** |
| **community** | Forum, posts, comments, engagement |
| **fintech** | Payments (Stripe/Razorpay), invoices, refunds, accounting |
| **inventory** | Stock batches, movements, reorder requests |
| **jobs** | Job postings, applications, hiring workflow |
| **kds** | Kitchen Display System (WebSocket real-time) |
| **marketplace** | B2B supplier marketplace, vendor catalogs |
| **menu** | Categories, items, modifiers, variants |
| **messages** | User-to-user messaging |
| **notifications** | Push/email notifications |
| **orders** | Order management, POS, status tracking |
| **reservations** | Table bookings, table management with QR codes |
| **reviews** | Restaurant reviews and ratings |
| **staff** | Employees, shifts, attendance, leaves |
| **training** | Staff training modules |
| **users** | User profiles, settings, stats |
| **vendor-products** | Vendor product catalog management |

### Frontend Routes (`apps/web/app/`)

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/auth` | Login, register, password reset |
| `/restaurant/*` | Restaurant dashboard hub |
| `/restaurant/dashboard` | Overview with revenue, orders |
| `/restaurant/menu` | Menu management |
| `/restaurant/employees` | Staff management |
| `/restaurant/orders` | Order management |
| `/restaurant/kds` | Kitchen Display System |
| `/restaurant/marketplace` | B2B marketplace |
| `/restaurant/analytics` | Reports and metrics |
| `/restaurant/jobs` | Job postings |
| `/restaurant/reservations` | Table reservations |
| `/restaurant/inventory` | Stock management |
| `/restaurant/community` | Forum |
| `/cart` | Shopping cart |
| `/checkout` | Checkout flow |
| `/admin/*` | Admin panel |
| `/profile` | User profile |
| `/wallet` | Wallet/credits |
| `/notifications` | Notifications center |

---

## 🔌 Integrations

### ReZ Platform SSO (RezBridge)

Single sign-on integration with the ReZ platform ecosystem.

**Location**: `apps/api/src/modules/auth/rez-bridge/`

**Flow**:
1. User authenticates via ReZ platform
2. ReZ JWT exchanged for RestoPapa JWT
3. Merchant profile synced via `rezMerchantId`
4. Access granted to linked restaurant

**Endpoints**:
- `POST /api/v1/auth/rez-bridge` - Exchange ReZ JWT for RestoPapa JWT

**Environment Variables**:
```bash
REZ_JWT_SECRET=shared-signing-secret
REZ_BACKEND_URL=https://api.rezplatform.com
REZ_INTERNAL_TOKEN=internal-service-token
```

### NextaBizz Sync

Bidirectional sync between RestoPapa and NextaBizz inventory management.

**Location**: `/nextabizz/services/integrations/restopapa/`

**Capabilities**:
- Fetch low stock items → Generate RFQs
- Sync order statuses
- Import maintenance requests
- Track sync history

**Webhook Events**:
- `inventory.signal.received`
- `inventory.low_stock`
- `inventory.out_of_stock`
- `order.status_changed`
- `order.created`
- `maintenance.request_created`

---

## 🗄️ Database Models (Prisma Schema)

**90+ models** covering all business domains:

### Core
- `User` - Authentication with roles (ADMIN, RESTAURANT, EMPLOYEE, VENDOR, CUSTOMER)
- `Profile` - Extended profile with `rezMerchantId`, `rezVerified`, `rezStoreId`
- `Restaurant` - Multi-branch support
- `Branch` - Branch/location management

### Menu & Ordering
- `MenuCategory` - Menu categories
- `MenuItem` - Items with prices, allergens, tags
- `MenuModifier` - Add-ons, customizations
- `MenuVariant` - Size/option variants
- `Order` - Customer orders
- `OrderItem` - Order line items
- `OrderStatusHistory` - Status change audit

### POS & Billing
- `PosOrder` - POS orders (dine-in, takeaway, delivery)
- `MenuOrderItem` - POS order items
- `PosPayment` - Payment records (cash, card, UPI, wallet)
- `Customer` - Customer profiles
- `LoyaltyProgram` - Loyalty schemes
- `LoyaltyTransaction` - Points earning/redemption

### Inventory
- `Product` - Inventory items
- `InventoryBatch` - Batch records with expiry
- `StockMovement` - In/out tracking
- `ReorderRequest` - Auto/manual reorder triggers

### Reservations
- `Table` - Restaurant tables with QR codes
- `TableReservation` - Booking records

### Staff
- `Employee` - Staff records with designations
- `Shift` - Work shifts
- `Attendance` - Attendance records
- `Leave` - Leave management

### Financial
- `Invoice` - Billing invoices
- `Payment` - Payment transactions
- `Refund` - Refund records
- `TaxEntry` - Tax calculations
- `Account` - Chart of accounts
- `JournalEntry` - Double-entry bookkeeping
- `Expense` - Expense tracking

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Docker & Docker Compose (optional)

### Development Setup

```bash
# Clone and install dependencies
cd restauranthub
npm install

# Copy environment file
cp .env.example .env

# Start development (mock database by default)
npm run dev

# Or start individually:
cd apps/web && npm run dev     # Frontend: localhost:3000
cd apps/api && npm run dev     # Backend: localhost:3001
```

### 🌐 Access Points
- **Frontend**: http://localhost:3000
- **API**: http://localhost:3001/api/v1
- **API Documentation**: http://localhost:3001/docs
- **Health Check**: http://localhost:3001/api/v1/auth/health

---

## 🔐 Authentication & Authorization

### Demo Credentials
| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@restopapa.com` | `admin123` |
| Restaurant | `restaurant@restopapa.com` | `restaurant123` |

### Supported Roles
1. **ADMIN** - Platform administration and verification
2. **RESTAURANT** - Restaurant owners and managers
3. **EMPLOYEE** - Restaurant staff and job seekers
4. **VENDOR** - Product suppliers and service providers
5. **CUSTOMER** - End users placing orders

### Security Features
- JWT access tokens (15min) + refresh tokens (7 days)
- Argon2 password hashing
- Token blacklisting on logout
- Rate limiting on API endpoints
- Input validation and sanitization
- Password reset with secure tokens
- Email verification with TOTP-based 2FA

---

## 📱 Key API Endpoints

### Authentication
```
POST /api/v1/auth/signin        - User login
POST /api/v1/auth/signup        - User registration
POST /api/v1/auth/refresh       - Refresh access token
POST /api/v1/auth/logout        - Logout (token blacklisting)
POST /api/v1/auth/rez-bridge    - ReZ SSO exchange
POST /api/v1/auth/password-reset/request    - Request password reset
POST /api/v1/auth/password-reset/confirm     - Confirm password reset
POST /api/v1/auth/email-verification/send   - Send verification email
POST /api/v1/auth/email-verification/verify - Verify email
POST /api/v1/auth/2fa/setup     - Setup 2FA
POST /api/v1/auth/2fa/verify    - Verify 2FA
```

### Orders & POS
```
POST /api/v1/orders                      - Create order
GET  /api/v1/orders                       - List orders
GET  /api/v1/orders/:id                  - Get order details
PUT  /api/v1/orders/:id/status           - Update order status
GET  /api/v1/orders/:id/track            - Track order
```

### Inventory
```
GET  /api/v1/inventory/batches           - List inventory batches
GET  /api/v1/inventory/movements         - Stock movements
POST /api/v1/inventory/movements         - Record movement
GET  /api/v1/inventory/low-stock         - Low stock alerts
POST /api/v1/inventory/reorder           - Create reorder request
```

### Menu
```
GET  /api/v1/menu/categories             - List categories
POST /api/v1/menu/categories             - Create category
PUT  /api/v1/menu/categories/:id         - Update category
GET  /api/v1/menu/items                   - List menu items
POST /api/v1/menu/items                   - Create item
PUT  /api/v1/menu/items/:id              - Update item
GET  /api/v1/menu/modifiers              - List modifiers
POST /api/v1/menu/modifiers              - Create modifier
```

### Staff
```
GET  /api/v1/staff                        - List employees
POST /api/v1/staff                        - Create employee
PUT  /api/v1/staff/:id                   - Update employee
POST /api/v1/staff/:id/shifts            - Create shift
GET  /api/v1/staff/:id/attendance        - Attendance records
POST /api/v1/staff/:id/leave             - Request leave
```

### Reservations
```
GET  /api/v1/reservations/tables          - List tables
POST /api/v1/reservations/tables          - Create table
POST /api/v1/reservations/bookings        - Book table
GET  /api/v1/reservations/bookings        - List bookings
PUT  /api/v1/reservations/bookings/:id   - Update booking
```

### KDS (Kitchen Display System - WebSocket)
```
Namespace: /kds

Client → Server:
  join-store          - Join store room
  get-current-orders  - Get active orders
  order-status-changed - Broadcast status update
  item-status-changed  - Broadcast item update

Server → Client:
  merchant:new_order         - New order notification
  order:status_updated       - Status broadcast
  order:item_status_updated  - Item status broadcast
```

### Fintech
```
POST /api/v1/fintech/payments            - Process payment
GET  /api/v1/fintech/payments/:id       - Get payment
POST /api/v1/fintech/refunds             - Process refund
GET  /api/v1/fintech/invoices           - List invoices
POST /api/v1/fintech/invoices           - Create invoice
```

---

## 🗂️ Project Structure

```
restauranthub/
├── apps/
│   ├── web/                    # Next.js Frontend
│   │   ├── app/               # App Router pages
│   │   ├── components/        # Reusable components
│   │   ├── lib/               # Utilities, API clients, hooks
│   │   └── public/            # Static assets
│   ├── api/                    # NestJS Backend
│   │   ├── src/
│   │   │   ├── modules/       # Feature modules (19 modules)
│   │   │   └── prisma/        # Database schema
│   │   └── prisma/
│   │       └── schema.prisma   # 90+ database models
│   ├── auth-service/           # Auth microservice
│   ├── notification-service/   # Notification microservice
│   ├── order-service/          # Order microservice
│   └── restaurant-service/     # Restaurant microservice
├── packages/
│   └── db/                     # Shared database schema
├── docs/                       # Documentation
├── scripts/                    # Utility scripts
├── tests/                     # Test suites
├── monitoring/                 # Prometheus/Grafana configs
├── kubernetes/                # K8s manifests
└── docker/                    # Docker configs
```

---

## 🧪 Testing

```bash
# All tests
npm run test

# Integration tests
npm run test:e2e

# Performance tests
npm run perf:all
npm run perf:k6:load
npm run perf:k6:stress

# Load testing
npm run perf:artillery
```

---

## 📦 Production Deployment

### Docker
```bash
# Build and deploy
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# Start infrastructure only
npm run docker:up

# Start monitoring stack
npm run monitoring:up
```

### Environment Variables (Production)
```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/db

# Redis
REDIS_URL=redis://user:pass@host:6379

# Authentication
JWT_SECRET=your-production-secret
JWT_REFRESH_SECRET=your-refresh-secret

# Payments
STRIPE_SECRET_KEY=sk_live_...
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...

# ReZ Integration
REZ_JWT_SECRET=...
REZ_BACKEND_URL=...
REZ_INTERNAL_TOKEN=...

# AWS S3
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
S3_BUCKET=...
```

---

## 📋 Documentation

| Document | Description |
|----------|-------------|
| `README.md` | This overview |
| `CHANGELOG.md` | Version history and updates |
| `DEPLOYMENT_GUIDE.md` | Production deployment |
| `SECURITY_IMPLEMENTATION.md` | Security details |
| `TESTING.md` | Testing standards |
| `MONITORING_DEPLOYMENT_GUIDE.md` | Monitoring setup |
| `docs/README.md` | Detailed documentation index |
| `docs/SCREEN_TO_ENDPOINT_MAPPING.md` | UI to API mapping |

---

## ✅ Current Features

### Core Platform
- [x] Multi-role authentication (5 roles)
- [x] User profile management
- [x] Restaurant registration with verification
- [x] Multi-branch support
- [x] Admin dashboard and controls

### POS & Orders
- [x] Order management (dine-in, takeaway, delivery)
- [x] Real-time Kitchen Display System (KDS)
- [x] Order status tracking with audit history
- [x] POS payments (cash, card, UPI, wallet)
- [x] Customer loyalty programs

### Menu & Inventory
- [x] Menu categories, items, modifiers, variants
- [x] Inventory batch tracking with expiry
- [x] Stock movements (in/out)
- [x] Reorder requests (auto/manual)
- [x] Low stock alerts via webhooks

### Staff & Reservations
- [x] Employee management with designations
- [x] Shift scheduling
- [x] Attendance tracking
- [x] Leave management
- [x] Table management with QR codes
- [x] Table reservations

### Financial
- [x] Stripe + Razorpay payments
- [x] Invoice generation
- [x] Refund processing
- [x] Chart of accounts
- [x] Journal entries (double-entry)
- [x] Expense tracking
- [x] Tax calculations

### Marketplace & Community
- [x] B2B vendor marketplace
- [x] Vendor product catalog
- [x] Community forums with @mentions
- [x] Restaurant reviews
- [x] Job postings and applications

### Integrations
- [x] ReZ SSO Bridge (RezBridge)
- [x] NextaBizz inventory sync
- [x] Webhook system for external events

### Technical
- [x] 90+ Prisma database models
- [x] JWT with token blacklisting
- [x] Password reset with secure tokens
- [x] Email verification
- [x] TOTP-based 2FA
- [x] BullMQ job processing
- [x] Redis caching
- [x] Prometheus + Grafana monitoring
- [x] Production-ready Docker configs
- [x] Comprehensive test coverage

---

## 🎯 System Status

**✅ PRODUCTION READY**

- Zero compilation errors
- Complete feature implementation
- Comprehensive security measures
- Performance optimizations
- Full documentation

---

## 📄 License

MIT License

**Version**: 1.1.0
**Last Updated**: May 2026
