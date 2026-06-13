# Retail OS - Features

**Status:** ✅ BUILT | **Port:** 5030 | **Updated:** June 14, 2026

---

## Digital Twins

### Customer Twin
- Shopping behavior analysis
- Purchase history
- Preference profiling
- Loyalty tier tracking
- Demographic data
- Cross-channel identity

### Product Twin
- SKU management
- Pricing optimization
- Category hierarchy
- Variant tracking
- Seasonal rotation
- Supplier linkage

### Inventory Twin
- Real-time stock levels
- Multi-location tracking
- Safety stock alerts
- Reorder point optimization
- ABC analysis
- Stock history

### Order Twin
- Order lifecycle tracking
- Fulfillment status
- Returns management
- Order history
- Split shipping

### Revenue Twin
- Sales analytics
- Margin tracking
- Revenue forecasting
- Trend analysis
- KPI dashboards

---

## AI Agents

### Shopping Agent
- Product discovery
- Search optimization
- Category navigation
- Filter assistance

### Checkout Agent
- Cart management
- Promo code application
- Payment processing
- Address validation

### Loyalty Agent
- Points accrual
- Tier progression
- Reward redemption
- Birthday rewards

### Inventory Agent
- Stock alerts
- Reorder automation
- Supplier coordination
- Stock transfers

### VisualSearch Agent
- Image-based search
- Style matching
- Similar products
- Visual merchandising

### Recommendation Agent
- Cross-sell suggestions
- "Frequently bought together"
- Personalized recommendations
- New arrival alerts

---

## API Endpoints

### Core
- `GET /health` - Health check
- `GET /api/twins` - List all twins
- `GET /api/agents` - List all agents

### Products
- `POST /api/products` - Add product
- `GET /api/products/:id` - Get product
- `PUT /api/products/:id` - Update product
- `GET /api/products/search?q=` - Search products
- `GET /api/products/category/:cat` - Category filter

### Inventory
- `POST /api/inventory` - Update inventory
- `GET /api/inventory/:productId` - Stock level
- `GET /api/inventory/alerts` - Low stock
- `POST /api/inventory/transfer` - Stock transfer

### Customers
- `GET /api/customers` - List customers
- `GET /api/customers/:id` - Get customer
- `PUT /api/customers/:id` - Update customer
- `GET /api/customers/:id/orders` - Customer orders

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders/:id` - Get order
- `PUT /api/orders/:id/status` - Update status
- `POST /api/orders/:id/return` - Initiate return

---

## Integrations

| Service | Integration Type | Purpose |
|---------|-----------------|---------|
| RTMN Hub | HTTP | Central orchestration |
| AgentOS | HTTP | Agent invocation |
| Restaurant OS | Event | Food retail |
| Fashion OS | Event | Apparel |
| RABTUL | Payment | Transactions |

---

## Quick Start

```bash
cd industries/retail-os
npm install
node src/index.js
# Runs on http://localhost:5030
```
