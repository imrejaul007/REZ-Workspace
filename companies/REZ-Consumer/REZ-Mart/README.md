# REZ-Mart — Quick Commerce Platform

> **Competitors:** Blinkit, BigBasket, Zepto, Swiggy Instamart  
> **Positioning:** "Everything delivered in minutes"

---

## Overview

REZ-Mart is a quick commerce platform for groceries, essentials, and daily needs. Built on the REZ ecosystem with AI-powered recommendations and real-time delivery tracking.

### Key Features

- 🛒 **10-minute delivery** - Hyperlocal micro-fulfillment
- 📱 **Smart cart** - AI-powered recommendations
- 🏪 **Multi-store** - Partner with local kiranas and modern trade
- 💰 **REZ Coins** - Unified loyalty across ecosystem
- 📍 **Real-time tracking** - Live delivery map
- 🔄 **Auto-replenishment** - Subscribe and save

---

## Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                        REZ-MART APP                            │
│                    (React Native / Expo)                       │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              REZ-MART API GATEWAY (Port 4100)            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            │                                   │
│  ┌─────────────────────────┼─────────────────────────────┐  │
│  │                         │                             │  │
│  ▼                         ▼                             ▼  │
│ ┌──────────┐    ┌──────────────────┐    ┌──────────────┐ │
│ │  RABTUL │    │  REZ-Intelligence │    │   KHAIRMOVE  │ │
│ ├──────────┤    ├──────────────────┤    ├──────────────┤ │
│ │Auth 4002│◄──►│Intent 3001      │◄──►│Delivery 4603 │ │
│ │Wallet 4004│◄──►│Recommendations │    │Driver 4101   │ │
│ │Payment 4001│◄──►│Personalization │    │Tracking 4102 │ │
│ └──────────┘    └──────────────────┘    └──────────────┘ │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   REZ-MART SERVICES                       │  │
│  ├──────────┬──────────┬──────────┬──────────┬────────────┤ │
│  │ Store   │ Product  │  Order   │ Delivery │ Inventory │ │
│  │ 4103    │  4104   │  4105    │  4106    │   4107    │ │
│  ├──────────┼──────────┼──────────┼──────────┼────────────┤ │
│  │  Cart   │  Offer   │  Subscri │  Payment │ Analytics  │ │
│  │  4108   │  4109   │  4110    │  4111    │   4112    │ │
│  └──────────┴──────────┴──────────┴──────────┴────────────┘ │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

---

## Services

| Service | Port | Description |
|---------|------|-------------|
| `rez-mart-gateway` | 4100 | API Gateway |
| `rez-mart-driver-service` | 4101 | Driver management |
| `rez-mart-tracking-service` | 4102 | Real-time tracking |
| `rez-mart-store-service` | 4103 | Store management |
| `rez-mart-product-service` | 4104 | Product catalog |
| `rez-mart-order-service` | 4105 | Order processing |
| `rez-mart-delivery-service` | 4106 | Delivery orchestration |
| `rez-mart-inventory-service` | 4107 | Inventory sync |
| `rez-mart-cart-service` | 4108 | Cart management |
| `rez-mart-offer-service` | 4109 | Offers & coupons |
| `rez-mart-subscription-service` | 4110 | Auto-replenishment |
| `rez-mart-analytics-service` | 4112 | Analytics |

---

## API Endpoints

### Products
```bash
GET    /api/products              # List products
GET    /api/products/:id         # Product details
GET    /api/products/search      # Search products
GET    /api/products/recommendations  # AI recommendations
POST   /api/products/:id/reviews # Add review
```

### Stores
```bash
GET    /api/stores               # Nearby stores
GET    /api/stores/:id           # Store details
GET    /api/stores/:id/inventory # Store inventory
```

### Orders
```bash
POST   /api/orders               # Create order
GET    /api/orders               # Order history
GET    /api/orders/:id           # Order details
PATCH  /api/orders/:id/cancel    # Cancel order
```

### Delivery
```bash
POST   /api/delivery/assign      # Assign driver
GET    /api/delivery/track/:id   # Track delivery
PATCH  /api/delivery/:id/status  # Update status
```

### Subscriptions
```bash
POST   /api/subscriptions        # Create subscription
GET    /api/subscriptions        # List subscriptions
PATCH  /api/subscriptions/:id    # Update schedule
DELETE /api/subscriptions/:id    # Cancel subscription
```

---

## Quick Start

```bash
cd /REZ-Consumer/REZ-Mart

# Install dependencies
npm install

# Start gateway
cd rez-mart-gateway && npm run dev

# Start services
cd ../rez-mart-product-service && npm run dev
cd ../rez-mart-order-service && npm run dev
cd ../rez-mart-delivery-service && npm run dev
```

---

## Integration

### RABTUL (Required)
- Auth (4002) - User login
- Wallet (4004) - REZ Coins payment
- Payment (4001) - UPI/Card

### REZ-Intelligence
- Intent Prediction (3001) - Purchase intent
- Recommendations - "Frequently bought together"
- Personalization - User preferences

### KHAIRMOVE
- Delivery Service - Last-mile delivery
- Driver App - Real-time tracking

---

## Environment Variables

```bash
# Services
GATEWAY_PORT=4100
DRIVER_SERVICE_PORT=4101
TRACKING_SERVICE_PORT=4102

# RABTUL
AUTH_SERVICE_URL=http://localhost:4002
WALLET_SERVICE_URL=http://localhost:4004
PAYMENT_SERVICE_URL=http://localhost:4001

# REZ Intelligence
INTENT_SERVICE_URL=http://localhost:3001
RECOMMENDATION_SERVICE_URL=http://localhost:3001

# KHAIRMOVE
DELIVERY_SERVICE_URL=http://localhost:4603
```

---

## Folder Structure

```
REZ-Mart/
├── README.md
├── package.json
├── docker-compose.yml
├── rez-mart-gateway/              # Port 4100
├── rez-mart-driver-service/       # Port 4101
├── rez-mart-tracking-service/     # Port 4102
├── rez-mart-store-service/        # Port 4103
├── rez-mart-product-service/      # Port 4104
├── rez-mart-order-service/        # Port 4105
├── rez-mart-delivery-service/     # Port 4106
├── rez-mart-inventory-service/    # Port 4107
├── rez-mart-cart-service/         # Port 4108
├── rez-mart-offer-service/        # Port 4109
├── rez-mart-subscription-service/ # Port 4110
├── rez-mart-analytics-service/    # Port 4112
├── apps/
│   ├── admin/                     # Store owner dashboard
│   └── app/                       # Consumer mobile app
└── integrations/
    └── grocery-integrations/
```

---

## Features Roadmap

- [ ] Hyperlocal fulfillment
- [ ] KiranKart partnership
- [ ] Auto-replenishment
- [ ] Recipe integration
- [ ] Nutritional info
- [ ] Carbon footprint tracking

---

**Built with:** REZ Ecosystem, RABTUL, REZ-Intelligence, KHAIRMOVE  
**Company:** REZ-Consumer
