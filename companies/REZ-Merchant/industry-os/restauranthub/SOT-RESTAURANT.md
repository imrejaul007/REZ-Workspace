# RESTAURANT VERTICAL - SOURCE OF TRUTH

**Document Version:** 1.0.0  
**Last Updated:** June 1, 2026  
**Owner:** RTNM Group / REZ-Commerce

---

## OVERVIEW

The Restaurant Vertical provides a complete POS and restaurant management ecosystem for two client types:
- **REZ Merchant**: Full ecosystem integration (POS, KDS, Inventory, CRM, etc.)
- **Non-REZ Merchant**: Via RestoPapa SaaS + NexaBizz (sold through RABTUL SaaS)

---

## ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────┐
│                        RESTAURANT VERTICAL                       │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │ POS System  │  │    KDS      │  │     Inventory           │ │
│  │ (Orders)    │──│ (Kitchen)   │──│ (Stock, Procurement)    │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
│         │                │                      │               │
│         ▼                ▼                      ▼               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │    CRM      │  │   WhatsApp  │  │     Merchant Loans      │ │
│  │ (Profiles)  │  │ (Notify)    │  │  (Credit Scoring)       │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
│         │                                               │       │
│         ▼                                               ▼       │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │              HOJAI AI (Revenue Intelligence)                 ││
│  │         • Dynamic Pricing  • Sentiment Analysis             ││
│  │         • Demand Forecast  • Kitchen AI                     ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

---

## MODULES

### 1. POS System (Orders Module)

**Location:** `src/modules/orders/`

**Purpose:** Core order management for dine-in, takeaway, and delivery.

**Key Features:**
- Order CRUD with real-time WebSocket updates
- Idempotency for network error handling
- Fire-and-forget KDS notification
- Automatic inventory deduction
- Cashback/loyalty processing
- Offline queue for network failures

**Key Files:**
- `orders.service.ts` - Core order logic
- `orders.controller.ts` - REST endpoints
- `orders.gateway.ts` - WebSocket events

**Endpoints:**
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/orders` | Create order |
| GET | `/orders/:id` | Get order |
| PATCH | `/orders/:id/status` | Update status |
| GET | `/orders/restaurant/:id` | List by restaurant |

### 2. Kitchen Display System (KDS)

**Location:** `src/modules/kds/`

**Purpose:** Real-time kitchen order display and routing.

**Key Features:**
- WebSocket-based order display
- Station routing (grill, fry, saute, salad)
- Kitchen AI connector for timing predictions
- Fire-and-forget notification (no blocking on failure)

**Key Files:**
- `kds.gateway.ts` - WebSocket server
- `kitchen-ai.connector.ts` - HOJAI AI integration

**8 Kitchen AI Methods:**
1. `predictPrepTime(order)` - Estimate prep time
2. `suggestStation(order)` - Route to best station
3. `detectBottleneck(kitchenState)` - Identify delays
4. `suggestParallelPrep(order)` - Parallel cooking suggestions
5. `getPriorityScore(order)` - Order urgency scoring
6. `estimateCompletionTime(order)` - Real-time ETA
7. `analyzeTicketTime(trends)` - Performance trends
8. `recommendStationConfig(kitchen)` - Optimal layout

### 3. Inventory Management

**Location:** `src/modules/inventory/`

**Purpose:** Stock tracking, auto-deduction, and low-stock alerts.

**Key Features:**
- Real-time stock tracking
- Automatic deduction on order
- Low-stock threshold alerts → NexaBizz RFQ
- Batch tracking with expiry

**Key Files:**
- `inventory.service.ts` - Core inventory logic
- `procurement.service.ts` - NexaBizz RFQ creation

**Procurement Flow:**
```
Low Stock Alert → ProcurementService.checkAndCreateProcurement()
    → NexaBizz.createRFQ() → Vendor bids → Purchase Order
```

### 4. CRM Module

**Location:** `src/modules/crm/`

**Purpose:** Customer profiles, segmentation, and campaign targeting.

**Key Features:**
- Customer profile creation on first order
- Segmentation (new, regular, VIP, at-risk, churned)
- Visit frequency tracking
- Campaign targeting

**Customer Segments:**
| Segment | Criteria |
|---------|----------|
| NEW | First order within 30 days |
| REGULAR | 2-5 orders/month |
| VIP | >5 orders/month + >₹2000 avg |
| AT-RISK | No order in 30-60 days |
| CHURNED | No order in >60 days |

### 5. Reputation Module

**Location:** `src/modules/reputation/`

**Purpose:** Reviews, ratings, and sentiment analysis.

**Key Features:**
- Review submission and moderation
- Sentiment analysis (positive/neutral/negative)
- Restaurant rating aggregation
- Rating trends

### 6. Recipe Module

**Location:** `src/modules/recipe/`

**Purpose:** Menu item → inventory ingredient mapping.

**Key Features:**
- Recipe creation with ingredient quantities
- Automatic inventory deduction on order
- Wastage percentage handling
- Unit conversion

**Schema:**
```prisma
model Recipe {
  id            String   @id @default(cuid())
  menuItemId    String
  name          String
  servings      Int
  ingredients   RecipeIngredient[]
  createdAt     DateTime @default(now())
}

model RecipeIngredient {
  id                 String  @id @default(cuid())
  recipeId           String
  ingredientId       String  // Product
  quantity           Float
  unit               String  // 'g', 'kg', 'ml', 'l'
  wastagePercentage  Float   @default(0)
}
```

### 7. Merchant Loans Module

**Location:** `src/modules/merchant-loans/`

**Purpose:** Credit scoring and RidZa loan integration.

**Key Features:**
- Financial snapshot aggregation
- Credit score calculation (300-850)
- Risk categorization
- RidZa loan eligibility

**Credit Score Factors:**
| Factor | Weight |
|--------|--------|
| Monthly Revenue | 30% |
| Transaction Velocity | 25% |
| Avg Order Value | 20% |
| Weekend/Weekday Ratio | 10% |
| Revenue Volatility | 15% |

### 8. WhatsApp Module

**Location:** `src/modules/restaurant-whatsapp/`

**Purpose:** Customer notifications via WhatsApp Business API.

**Key Features:**
- Order confirmations
- Status updates
- Reservation reminders
- Campaign delivery

### 9. Retry Queue Service

**Location:** `src/modules/retry-queue/`

**Purpose:** Database-backed retry with exponential backoff.

**Job Types:**
- `KDS_NOTIFY` - Kitchen display notification
- `CASHBACK_CREDIT` - Loyalty cashback
- `LOW_STOCK_ALERT` - Inventory alert
- `WEBHOOK_DELIVERY` - External webhook
- `NOTIFICATION` - SMS/Email/Push

**Backoff Schedule:** 2s → 8s → 32s → 128s → 512s

### 10. Offline Queue Service

**Location:** `src/services/offline-queue.service.ts`

**Purpose:** Persist orders when POS loses connectivity.

**Features:**
- Database persistence (survives server restart)
- Idempotency via client-generated order ID
- Background sync when connection restored

---

## DATABASE MODELS

### New Models (Restaurant Vertical)

```prisma
// Retry Queue
model RetryJob {
  id          String          @id @default(cuid())
  type        RetryJobType
  payload     Json
  status      RetryJobStatus  @default(PENDING)
  attempts    Int             @default(0)
  maxAttempts Int             @default(5)
  nextRetryAt DateTime?
  lastError   String?
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt
}

enum RetryJobType {
  KDS_NOTIFY
  CASHBACK_CREDIT
  LOW_STOCK_ALERT
  WEBHOOK_DELIVERY
  NOTIFICATION
}

enum RetryJobStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
  EXPIRED
}

// Customer Profile
model CustomerProfile {
  id              String   @id @default(cuid())
  restaurantId    String
  customerId      String
  segment         CustomerSegment @default(NEW)
  totalOrders     Int      @default(0)
  totalSpent      Float    @default(0)
  avgOrderValue   Float    @default(0)
  lastOrderAt     DateTime?
  firstOrderAt    DateTime?
  preferredItems  String[]
  dietaryPrefs    String[]
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

enum CustomerSegment {
  NEW
  REGULAR
  VIP
  AT_RISK
  CHURNED
}

// Recipe
model Recipe {
  id          String   @id @default(cuid())
  menuItemId  String
  name        String
  servings    Int
  ingredients RecipeIngredient[]
  createdAt   DateTime @default(now())
}

model RecipeIngredient {
  id                 String  @id @default(cuid())
  recipeId           String
  ingredientId       String  // Product.id
  quantity           Float
  unit               String
  wastagePercentage  Float   @default(0)
  recipe             Recipe  @relation(...)
  ingredient         Product @relation(...)
}

// Financial Snapshot
model FinancialSnapshot {
  id               String   @id @default(cuid())
  restaurantId     String
  periodStart      DateTime
  periodEnd        DateTime
  totalRevenue     Float
  avgDailyRevenue  Float
  transactionCount Int
  avgOrderValue    Float
  revenueVolatility Float
  weekendVsWeekday Float
}

// Notification Template
model NotificationTemplate {
  id           String   @id @default(cuid())
  restaurantId String?
  templateType String
  template     String
  variables    String[]
  isActive     Boolean  @default(true)
  isApproved   Boolean  @default(false)
  createdAt   DateTime @default(now())
}

// Offline Queue
model PendingOrder {
  id              String              @id @default(cuid())
  orderData       Json
  idempotencyKey  String?
  status          PendingOrderStatus  @default(PENDING)
  attempts        Int                 @default(0)
  maxAttempts     Int                 @default(5)
  restaurantId    String
  source          String?
  clientOrderId   String?
  createdAt       DateTime            @default(now())
}
```

---

## INTEGRATIONS

### 1. HOJAI AI (Revenue Intelligence)

**Port:** 4100-4299

| Service | Method | Purpose |
|---------|--------|---------|
| Dynamic Pricing | `calculatePrice(order, context)` | Time/menu/demand-based pricing |
| Sentiment Analysis | `analyzeSentiment(text)` | Review analysis |
| Kitchen AI | 8 methods (see KDS section) | Kitchen optimization |

### 2. NexaBizz (Procurement)

**Purpose:** Auto-purchase when inventory is low.

```typescript
// Flow
lowStockAlert() → procurementService.checkAndCreateProcurement()
  → nexaBizzClient.createRFQ()
  → vendors bid → purchase order created
```

### 3. RABTUL Notifications

**Port:** 4011

| Method | Purpose |
|--------|---------|
| `sendSMS(phone, message)` | OTP, order updates |
| `sendEmail(email, template)` | Receipts, reports |
| `sendPush(userId, payload)` | App notifications |

### 4. RABTUL Auth

**Port:** 4002

- JWT validation for API security
- Role-based access (owner, staff, delivery)

### 5. RidZa (Merchant Loans)

**Port:** 4900-4999

- Credit score calculation
- Loan eligibility check
- Application submission

---

## DATA FLOWS

### Order Flow
```
Customer → POS (create order)
    ↓
Inventory (deduct stock)
    ↓
KDS (notify kitchen) ──→ Kitchen AI (predict prep time)
    ↓
Customer (WhatsApp confirmation)
    ↓
CRM (update profile)
    ↓
Loyalty (calculate cashback)
```

### Offline Order Flow
```
POS loses connectivity
    ↓
Save to PendingOrder table
    ↓
Show "Order Queued" to customer
    ↓
Connection restored
    ↓
Process queued orders
    ↓
Delete from PendingOrder
```

---

## CLIENT TYPES

### REZ Merchant
- Full POS integration
- All modules wired
- HOJAI AI for revenue intelligence
- Direct database access

### Non-REZ Merchant (RestoPapa)
- SaaS-based POS
- Sold via RABTUL SaaS
- NexaBizz for procurement
- Standard integrations

---

## ENVIRONMENT VARIABLES

```bash
# Database
DATABASE_URL=postgresql://...

# HOJAI AI
HOJAI_API_URL=http://localhost:4100
HOJAI_API_KEY=...

# NexaBizz
NEXABIZZ_API_URL=https://nexabizz.rez.dev
NEXABIZZ_API_KEY=...

# RABTUL Services
RABTUL_AUTH_URL=http://localhost:4002
RABTUL_NOTIFY_URL=http://localhost:4011

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# WhatsApp
WHATSAPP_BUSINESS_API_URL=...
WHATSAPP_ACCESS_TOKEN=...
```

---

## TESTING

### Unit Tests
```bash
npm run test -- --testPathPattern=modules/orders
npm run test -- --testPathPattern=modules/crm
npm run test -- --testPathPattern=modules/inventory
```

### Integration Tests
```bash
npm run test:e2e
```

---

## DEPLOYMENT

### Prerequisites
- PostgreSQL 14+
- Redis 6+
- Node.js 20+

### Steps
1. `npx prisma migrate deploy`
2. `npm run build`
3. `npm run start:prod`

---

## MONITORING

### Health Endpoints
- `GET /health` - Overall health
- `GET /health/ready` - Readiness check
- `GET /health/live` - Liveness check

### Metrics
- Order creation rate
- KDS notification latency
- Inventory sync status
- Retry queue depth

---

## CHANGELOG

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | June 1, 2026 | Initial restaurant vertical documentation |

---

## CONTACTS

| Role | Team | Responsibility |
|------|------|----------------|
| Technical Lead | REZ-Commerce | Architecture, integrations |
| Product Manager | StayOwn | Hotel/restaurant vertical |
| AI Integration | HOJAI AI | Kitchen AI, pricing |
| Platform | RABTUL | Auth, notifications, payments |
