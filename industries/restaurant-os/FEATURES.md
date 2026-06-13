# Restaurant OS - Features

**Status:** ✅ BUILT | **Port:** 5010 | **Updated:** June 14, 2026

---

## Digital Twins

### Order Twin
- Real-time order state tracking
- Order history and analytics
- Predictive order timing
- Multi-channel order aggregation (dine-in, takeout, delivery)

### Menu Twin
- Dynamic pricing management
- Item availability sync
- Seasonal menu rotation
- Ingredient-level inventory tracking
- Dietary information (vegan, gluten-free, allergens)

### Kitchen Twin
- Kitchen display system integration
- Prep time estimation
- Workflow optimization
- Equipment utilization tracking
- Queue management

### Table Twin
- Real-time table status
- Reservation management
- Waitlist tracking
- Seating optimization
- Turnover analytics

### Inventory Twin
- Real-time stock levels
- Low-stock alerts
- Waste tracking
- Supplier integration
- Cost analysis

---

## AI Agents

### Host Agent
- Smart greeting and seating
- Waitlist management
- Customer recognition
- Preference recall

### Order Agent
- Menu recommendations
- Upselling and cross-selling
- Special requests handling
- Order modification

### Kitchen Agent
- Order routing optimization
- Prep time estimation
- Quality control triggers
- Rush hour management

### Upsell Agent
- Premium item suggestions
- Combo deals
- Beverage pairing
- Dessert recommendations

### Delivery Agent
- Driver assignment
- Route optimization
- ETA tracking
- Status updates

### Inventory Agent
- Reorder suggestions
- Supplier negotiation
- Waste reduction
- Seasonal forecasting

---

## API Endpoints

### Core
- `GET /health` - Health check
- `GET /api/twins` - List all twins
- `GET /api/agents` - List all agents

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders/:id` - Get order
- `PUT /api/orders/:id` - Update order
- `DELETE /api/orders/:id` - Cancel order
- `GET /api/orders/table/:tableId` - Get table orders
- `GET /api/orders/status/:status` - Filter by status

### Menu
- `GET /api/menu` - Get full menu
- `GET /api/menu/:category` - Get category
- `POST /api/menu` - Add item
- `PUT /api/menu/:id` - Update item
- `DELETE /api/menu/:id` - Remove item

### Tables
- `GET /api/tables` - List tables
- `POST /api/tables` - Add table
- `PUT /api/tables/:id` - Update table
- `POST /api/tables/:id/reserve` - Reserve table
- `GET /api/tables/available` - Available tables

### Inventory
- `GET /api/inventory` - List inventory
- `POST /api/inventory` - Add item
- `PUT /api/inventory/:id` - Update quantity
- `GET /api/inventory/alerts` - Low stock alerts

### Kitchen
- `GET /api/kitchen/queue` - Current queue
- `GET /api/kitchen/stats` - Kitchen stats
- `PUT /api/kitchen/order/:id/status` - Update status

---

## Integrations

| Service | Integration Type | Purpose |
|---------|-----------------|---------|
| RTMN Hub | HTTP | Central orchestration |
| AgentOS | HTTP | Agent invocation |
| Retail OS | Event | Food supply |
| Hospitality OS | Event | Guest dining |
| RABTUL | Payment | Transactions |

---

## Quick Start

```bash
cd industries/restaurant-os
npm install
node src/index.js
# Runs on http://localhost:5010
```
