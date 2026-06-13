# Restaurant OS - Food Service Industry Platform

**Status:** ✅ BUILT - June 14, 2026  
**Port:** 5010  
**Location:** `industries/restaurant-os/`

## Overview

Restaurant OS is the unified platform for the food service industry, connecting restaurants with digital twins for orders, menus, kitchen operations, table management, and inventory tracking.

## Digital Twins

| Twin | Description | Capabilities |
|------|-------------|--------------|
| **Order Twin** | Real-time order tracking | State sync, history, prediction |
| **Menu Twin** | Menu management | Pricing, availability, seasonal |
| **Kitchen Twin** | Kitchen operations | Timing, workflow, queue |
| **Table Twin** | Table management | Reservations, seating, turnover |
| **Inventory Twin** | Stock management | Alerts, reorder, waste tracking |

## AI Agents

| Agent | Purpose |
|-------|---------|
| **Host Agent** | Greeting, seating, waitlist management |
| **Order Agent** | Order taking, modifications, suggestions |
| **Kitchen Agent** | Kitchen coordination, timing optimization |
| **Upsell Agent** | Menu recommendations, upgrades |
| **Delivery Agent** | Delivery tracking, driver assignment |
| **Inventory Agent** | Stock alerts, reorder suggestions |

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `GET /health` | - | Health check |
| `GET /api/twins` | GET | List all twins |
| `GET /api/twins/order/:id` | GET | Get order twin |
| `GET /api/twins/menu/:id` | GET | Get menu twin |
| `GET /api/twins/kitchen/:id` | GET | Get kitchen twin |
| `GET /api/twins/table/:id` | GET | Get table twin |
| `GET /api/twins/inventory/:id` | GET | Get inventory twin |
| `GET /api/agents` | GET | List all agents |
| `POST /api/agents/:id/invoke` | POST | Invoke agent |
| `POST /api/orders` | POST | Create order |
| `GET /api/orders/:id` | GET | Get order |
| `PUT /api/orders/:id` | PUT | Update order |
| `GET /api/menu` | GET | Get menu |
| `POST /api/menu` | POST | Add menu item |
| `GET /api/tables` | GET | Get tables |
| `POST /api/tables` | POST | Reserve table |

## Quick Start

```bash
cd industries/restaurant-os && npm install && node src/index.js

# Health check
curl http://localhost:5010/health

# Get all twins
curl http://localhost:5010/api/twins

# Create order
curl -X POST http://localhost:5010/api/orders \
  -H "Content-Type: application/json" \
  -d '{"items": [{"name": "Burger", "qty": 2}], "tableId": "table_5"}'
```

## Integration

- Connected to RTMN Hub at `http://localhost:8000`
- Restaurant Agent available via AgentOS
- Menu data syncs with Retail OS inventory
- Kitchen operations integrate with Hospitality OS
