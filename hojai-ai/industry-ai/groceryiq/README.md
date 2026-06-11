# GroceryIQ — Grocery Retail AI

**Port:** 4131
**Industry:** Grocery / Quick Commerce
**Competitors:** Instacart AI, BigBasket Intelligence

---

## Overview

GroceryIQ is an AI operating system for grocery retailers, supermarkets, and quick commerce platforms. It provides inventory optimization, demand forecasting, shelf management, and customer insights.

### Key Features

- 📦 **Inventory Optimization** - Real-time stock management
- 📈 **Demand Forecasting** - ML-based demand prediction
- 🏷️ **Shelf Management** - Planogram optimization
- 🛒 **Basket Analysis** - Market basket insights
- 💰 **Dynamic Pricing** - Competitor-based pricing
- 🔄 **Auto-Replenishment** - Smart restocking

---

## Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                       GROCERYIQ (Port 4131)                       │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    GROCERYIQ BRAIN                        │  │
│  │  Intent │ Demand │ Inventory │ Pricing │ Basket │ Supply │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            │                                   │
│  ┌─────────────────────────┼─────────────────────────────┐  │
│  │                         │                             │  │
│  ▼                         ▼                             ▼  │
│ ┌──────────┐    ┌──────────────────┐    ┌──────────────┐ │
│ │  RABTUL │    │ REZ-Intelligence │    │ REZ-Commerce │ │
│ ├──────────┤    ├──────────────────┤    ├──────────────┤ │
│ │Auth 4002│◄──►│ Intent Graph    │◄──►│ POS 4050    │ │
│ │Wallet 4004│◄──►│ Recommendations │    │ Orders 4006 │ │
│ └──────────┘    └──────────────────┘    └──────────────┘ │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                  INTEGRATIONS                              │  │
│  ├──────────┬──────────┬──────────┬──────────┬────────────┤ │
│  │  POS    │ Supplier │  Cold    │  Waste   │  Customer  │ │
│  │ Systems │  Portal  │  Chain   │ Tracker │   CRM      │ │
│  └──────────┴──────────┴──────────┴──────────┴────────────┘ │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

---

## API Endpoints

### Inventory
```bash
GET    /api/inventory             # Current stock
GET    /api/inventory/:sku        # SKU details
POST   /api/inventory/adjust      # Stock adjustment
GET    /api/inventory/low-stock   # Low stock alerts
POST   /api/inventory/reorder     # Trigger reorder
```

### Demand Forecasting
```bash
GET    /api/demand/forecast       # Forecast demand
GET    /api/demand/seasonality   # Seasonal patterns
POST   /api/demand/simulate      # What-if scenarios
```

### Pricing
```bash
GET    /api/pricing/recommend    # Price recommendations
POST   /api/pricing/update       # Update prices
GET    /api/pricing/competitor   # Competitor prices
```

### Basket Analysis
```bash
POST   /api/basket/analyze       # Analyze cart
GET    /api/basket/patterns      # Common patterns
GET    /api/basket/affinity      # Product affinity
```

---

## Pricing Tiers

| Tier | Price | Features |
|------|-------|----------|
| Starter | ₹4,999/mo | 1 store, basic inventory |
| Growth | ₹14,999/mo | 5 stores, forecasting |
| Enterprise | ₹49,999/mo | Unlimited, full AI suite |

---

## Quick Start

```bash
cd /hojai-ai/industry-ai/groceryiq
npm install
npm run dev
# Server running on http://localhost:4131
```

---

## Integration

### REZ-Commerce
- Inventory sync
- Order processing
- POS integration

### REZ-Intelligence
- Intent prediction (demand)
- Recommendations (basket)
- Personalization (pricing)

---

**Built with:** HOJAI Core, REZ-Intelligence, RABTUL, REZ-Commerce  
**Company:** HOJAI-AI
