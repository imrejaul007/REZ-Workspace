# SHOPFLOW - State of Technology

**Version:** 1.0.0
**Date:** June 3, 2026
**Industry:** Retail
**Tagline:** "Smart Retail, Smarter Sales"

---

## 1. PRODUCT OVERVIEW

SHOPFLOW is an AI-powered operating system for retail stores and shops. It combines AI agents (workers), automated workers, voice agents, and a complete backend to manage retail operations.

### Target Customers
- Standalone retail stores (HOJAI AI clients)
- REZ ecosystem retail clients

### Pricing
- ₹4,999/month (HOJAI AI)
- Included in REZ-Merchant OS (REZ ecosystem)

---

## 2. AI EMPLOYEES (AGENTS)

AI Agents are specialized workers that interact with customers and staff.

### 2.1 Inventory AI
- **Purpose:** Stock management, reorder
- **Interactions:** Stock queries, reorder suggestions, inventory reports
- **Skills:**
  - Stock level monitoring
  - Reorder point calculation
  - SKU management
  - Supplier coordination

### 2.2 Merchandising AI
- **Purpose:** Product placement, displays
- **Interactions:** Planogram suggestions, promotional displays
- **Skills:**
  - Product placement optimization
  - Visual merchandising
  - Promotional planning
  - Category management

### 2.3 Customer AI
- **Purpose:** Customer service, queries
- **Interactions:** Product queries, availability checks, returns
- **Skills:**
  - Product recommendations
  - Availability checking
  - Return processing
  - Complaint handling

### 2.4 Loyalty AI
- **Purpose:** Loyalty program management
- **Interactions:** Points tracking, rewards, member communications
- **Skills:**
  - Points calculation
  - Reward suggestions
  - Member segmentation
  - Campaign targeting

---

## 3. AI WORKERS (AUTOMATED TASKS)

AI Workers run automated background processes.

### 3.1 Stock Worker
- **Purpose:** Inventory tracking, reconciliation
- **Tasks:**
  - Stock count tracking
  - Discrepancy detection
  - Stock takes scheduling
  - Damage tracking

### 3.2 Pricing Worker
- **Purpose:** Price management, markdowns
- **Tasks:**
  - Price updates
  - Markdown automation
  - Competitor monitoring
  - Margin optimization

### 3.3 Report Worker
- **Purpose:** Daily/weekly/monthly reports
- **Tasks:**
  - Sales reports
  - Inventory reports
  - Customer analytics
  - Staff performance

---

## 4. VOICE AGENTS

### 4.1 Phone Receptionist
- **Capabilities:**
  - Answer calls 24/7
  - Check product availability
  - Handle orders
  - Process returns
- **Languages:** Hindi, English, Tamil, Telugu, Bengali, Marathi

### 4.2 WhatsApp AI
- **Capabilities:**
  - Text/voice conversations
  - Order placement
  - Stock inquiries
  - Promotional updates

---

## 5. BACKEND SERVICES

### 5.1 POS Service (`/services/pos-service/`)
- Point of sale
- Payment processing
- Receipt generation
- Shift management

### 5.2 Inventory Service (`/services/inventory-service/`)
- Product catalog
- Stock management
- Supplier integration
- Warehouse management

### 5.3 Demand Forecast Service (`/services/demand-forecast-service/`)
- Sales prediction
- Seasonal analysis
- Reorder recommendations
- Trend detection

---

## 6. INTEGRATION POINTS

### 6.1 HOJAI Core
- Intent Graph
- Memory System
- Trust Engine
- Agent Marketplace

### 6.2 Merchant OS
- POS integration
- Payment processing
- Customer database
- Reporting

### 6.3 REZ Merchant OS (for REZ clients)
- Full ecosystem sync
- Cross-product insights
- Unified reporting

---

## 7. API ENDPOINTS

### AI Agent APIs
```
POST /api/ai/inventory/check
POST /api/ai/merchandising/planogram
POST /api/ai/customer/query
POST /api/ai/loyalty/points
```

### Worker APIs
```
GET  /api/workers/stock/reconcile
POST /api/workers/pricing/update
GET  /api/workers/reports/weekly
```

### Service APIs
```
GET  /api/services/pos/:shiftId
POST /api/services/pos/sale
GET  /api/services/inventory/:sku
POST /api/services/inventory/reorder
GET  /api/services/forecast/demand
```

### Voice Agent APIs
```
POST /api/voice/call/incoming
POST /api/voice/whatsapp/webhook
```

---

## 8. TECHNOLOGY STACK

| Layer | Technology |
|-------|------------|
| Runtime | Node.js / TypeScript |
| Framework | Express.js |
| Database | PostgreSQL (Merchant OS) |
| Cache | Redis |
| AI/ML | HOJAI Core / OpenAI |
| Voice | Twilio / Exotel |
| Storage | S3 / Local |
| Monitoring | Prometheus / Grafana |
| Container | Docker |
| Orchestration | Kubernetes |

---

## 9. DEPLOYMENT

### Ports
- **Main Service:** 4830
- **Voice Agents:** 4850-4860

### Environment Variables
```bash
PORT=4830
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
HOJAI_CORE_URL=http://localhost:4100
MERCHANT_OS_URL=http://localhost:4000
VOICE_PROVIDER=twilio
```

### Health Checks
```bash
GET /health      # Service health
GET /ai/status   # AI employee status
```

---

## 10. CURRENT STATUS

| Component | Status | Notes |
|-----------|--------|-------|
| Inventory AI | ⏳ Pending | Employee folder exists but empty |
| Merchandising AI | ⏳ Pending | Employee folder exists but empty |
| Customer AI | ⏳ Pending | Employee folder exists but empty |
| Loyalty AI | ⏳ Pending | Employee folder exists but empty |
| Stock Worker | ⏳ Pending | Needs implementation |
| Pricing Worker | ⏳ Pending | Needs implementation |
| Report Worker | ⏳ Pending | Needs implementation |
| Phone Receptionist | ⏳ Pending | Needs voice agent setup |
| WhatsApp AI | ⏳ Pending | Needs WhatsApp integration |
| POS Service | ✅ Ready | Service folder exists |
| Inventory Service | ✅ Ready | Service folder exists |
| Demand Forecast Service | ✅ Ready | Service folder exists |

---

## 11. MISSING ITEMS (TODO)

1. **src/index.ts** - Main entry point with all routes
2. **AI employee implementations** - Inventory, Merchandising, Customer, Loyalty
3. **Worker implementations** - Stock, Pricing, Report
4. **Voice agent implementations** - Phone, WhatsApp
5. **CLAUDE.md** - Developer documentation
6. **README.md** - Needs creation
7. **Dockerfile** - Container configuration
8. **package.json** - Dependencies
9. **tsconfig.json** - TypeScript configuration

---

**Last Updated:** June 3, 2026
**Maintainer:** HOJAI AI Team
