# Retail OS - Commerce Platform

**Status:** ✅ BUILT - June 14, 2026  
**Port:** 5030  
**Location:** `industries/retail-os/`

## Overview

Retail OS is the unified commerce platform connecting customers, products, inventory, orders, and revenue analytics with AI-powered shopping experiences.

## Digital Twins

| Twin | Description | Capabilities |
|------|-------------|--------------|
| **Customer Twin** | Shopping behavior, preferences | Personalization, loyalty |
| **Product Twin** | Product catalog, pricing | Inventory sync, trends |
| **Inventory Twin** | Stock management | Real-time counts, alerts |
| **Order Twin** | Transaction tracking | Status, returns, history |
| **Revenue Twin** | Financial analytics | Forecasting, margins |

## AI Agents

| Agent | Purpose |
|-------|---------|
| **Shopping Agent** | Product discovery, recommendations |
| **Checkout Agent** | Cart management, payment processing |
| **Loyalty Agent** | Points, rewards, tier management |
| **Inventory Agent** | Stock alerts, reorder automation |
| **VisualSearch Agent** | Image-based product search |
| **Recommendation Agent** | Cross-sell, upsell suggestions |

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `GET /health` | - | Health check |
| `GET /api/twins` | GET | List all twins |
| `GET /api/twins/customer/:id` | GET | Get customer twin |
| `GET /api/twins/product/:id` | GET | Get product twin |
| `GET /api/twins/inventory/:id` | GET | Get inventory twin |
| `GET /api/agents` | GET | List all agents |
| `POST /api/products` | POST | Add product |
| `GET /api/products/:id` | GET | Get product |
| `POST /api/inventory` | POST | Update inventory |
| `GET /api/customers` | GET | Get customers |
| `POST /api/orders` | POST | Create order |

## Quick Start

```bash
cd industries/retail-os && npm install && node src/index.js

# Health check
curl http://localhost:5030/health

# Add product
curl -X POST http://localhost:5030/api/products \
  -H "Content-Type: application/json" \
  -d '{"name": "Running Shoes", "price": 99.99, "stock": 50}'

# Create order
curl -X POST http://localhost:5030/api/orders \
  -H "Content-Type: application/json" \
  -d '{"customerId": "cust_123", "items": [{"productId": "prod_456", "qty": 1}]}'
```

## Integration

- Connected to RTMN Hub at `http://localhost:8000`
- Retail Agent available via AgentOS
- Inventory syncs with Restaurant OS (food items)
- Payment processing via RABTUL
