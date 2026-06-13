# Fashion OS - Features

**Status:** ✅ BUILT | **Port:** 5100 | **Updated:** June 14, 2026

---

## Digital Twins

### Product Twin
- SKU management
- Size/color variants
- Material composition
- Care instructions
- Seasonal classification

### Collection Twin
- Season management
- Lookbook integration
- Theme tracking
- Designer attribution
- Launch calendar

### Inventory Twin
- Stock by location
- Size distribution
- Reorder tracking
- Safety stock
- Transfer management

### Trend Twin
- Trend monitoring
- Social listening
- Fashion week coverage
- Consumer sentiment
- Competitive analysis

---

## AI Agents

### StyleAdvisor Agent
- Outfit recommendations
- Occasion matching
- Body type styling
- Color matching

### SizeAdvisor Agent
- Size prediction
- Fit recommendations
- Brand sizing differences
- Measurement guidance

### TrendAnalyst Agent
- Trend identification
- Forecasting
- Viral prediction
- Influencer impact

### InventoryMgmt Agent
- Stock optimization
- Markdown timing
- Allocation planning
- Demand planning

### VisualMerch Agent
- Store layout
- Product placement
- Window display
- Digital merchandising

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

### Collections
- `POST /api/collections` - Create collection
- `GET /api/collections/:id` - Get collection
- `GET /api/collections/:id/products` - Collection products

### Inventory
- `GET /api/inventory` - List inventory
- `PUT /api/inventory/:productId` - Update stock
- `GET /api/inventory/alerts` - Low stock

---

## Integrations

| Service | Integration Type | Purpose |
|---------|-----------------|---------|
| RTMN Hub | HTTP | Central orchestration |
| AgentOS | HTTP | Agent invocation |
| Manufacturing OS | Event | Production |
| Supplier Systems | External | Sourcing |

---

## Quick Start

```bash
cd industries/fashion-os
npm install
node src/index.js
# Runs on http://localhost:5100
```