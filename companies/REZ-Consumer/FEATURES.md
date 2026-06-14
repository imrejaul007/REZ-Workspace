# REZ-Consumer - Consumer App & Services

**Location:** `companies/REZ-Consumer/`  
**Purpose:** Consumer-facing mobile app, Genie AI assistant, DO delivery, and REZ Mart  
**Status:** ✅ **34+ SERVICES BUILT** | **June 14, 2026**

---

## REZ-Consumer Overview

REZ-Consumer is the consumer-facing platform of RTMN, providing a unified app experience with Genie AI assistant, delivery services (DO), and the REZ Mart grocery platform.

### REZ-Consumer vs Generic Consumer Apps

| Feature | Generic App | REZ-Consumer |
|---------|-----------|--------------|
| AI Assistant | ❌ | ✅ Genie AI |
| WhatsApp Integration | ❌ | ✅ |
| Multi-service | ❌ | ✅ All-in-one |
| Cross-platform | Limited | ✅ |
| Personalized | Basic | ✅ AI-powered |
| Universal Identity | ❌ | ✅ CorpID |
| Karma Rewards | ❌ | ✅ |

---

## Core Services (34+)

| Category | Services | Description |
|----------|----------|-------------|
| **App** | REZ App, DO App | Mobile applications |
| **AI** | Genie, Memory, Briefing | AI assistant |
| **Commerce** | REZ Mart, Cart, Order | Shopping |
| **Delivery** | Driver, Tracking | Delivery services |
| **Identity** | Auth, QR, Verification | Identity services |

---

## Key Features

### REZ App
| Feature | Description |
|---------|-------------|
| Multi-service | Restaurant, Grocery, Delivery, etc. |
| Genie AI | Conversational shopping assistant |
| REZ QR | Universal QR payments |
| Karma | Loyalty rewards |
| WhatsApp | Chat-based ordering |
| Health | Healthcare services |
| Financial | Payments, wallet |

### DO App (Delivery)
| Feature | Description |
|---------|-------------|
| Instant Delivery | Quick delivery service |
| Live Tracking | Real-time driver tracking |
| Multiple Categories | Food, grocery, pharmacy |
| Schedule | Pre-order for later |
| Group Order | Split bills |

### Genie AI Assistant
| Feature | Description |
|---------|-------------|
| Natural Language | Conversational interface |
| Memory | Remembers preferences |
| Recommendations | Personalized suggestions |
| Task Automation | Book, order, pay |
| Cross-platform | Works with all services |

### REZ Mart (Grocery)
| Feature | Description |
|---------|-------------|
| Smart Cart | AI-powered cart |
| Auto-replenishment | Subscription orders |
| Delivery Slots | Scheduled delivery |
| Store Selection | Multiple stores |
| Price Comparison | Find best prices |

---

## API Endpoints

```
# App
GET  /api/services                # List all services
GET  /api/profile                # User profile

# Orders
POST /api/orders                 # Create order
GET  /api/orders/:id            # Get order
GET  /api/orders/history         # Order history

# Cart
GET  /api/cart                   # Get cart
POST /api/cart/items             # Add item
PATCH /api/cart/items/:id        # Update item
DELETE /api/cart/items/:id       # Remove item

# Delivery
GET  /api/delivery/:orderId     # Track delivery
POST /api/delivery/schedule      # Schedule delivery
```

---

## File Structure

```
companies/REZ-Consumer/
├── rez-app/                     # Main REZ App
│   ├── app/
│   │   ├── home/               # Home screen
│   │   ├── restaurant/          # Restaurant ordering
│   │   ├── grocery/             # REZ Mart
│   │   ├── healthcare/          # Health services
│   │   └── profile/             # User profile
│   └── components/             # Shared components
├── do/                          # DO Delivery App
├── REZ-Mart/                    # Grocery platform
│   ├── rez-mart-gateway/        # API Gateway (4100)
│   ├── rez-mart-order-service/  # Orders (4105)
│   ├── rez-mart-cart-service/   # Cart (4108)
│   ├── rez-mart-delivery-service/ # Delivery (4106)
│   ├── rez-mart-product-service/ # Products (4112)
│   └── rez-mart-suggestion-service/ # AI suggestions (4118)
└── genie/                       # Genie AI
```

---

## Integration with RTMN

| Service | Integration | Purpose |
|---------|-------------|---------|
| RABTUL | Auth, Payment | User auth, payments |
| HOJAI Genie | Memory, Briefing | AI features |
| BuzzLocal | Discovery | Local business search |
| REZ-Merchant | Orders | Restaurant, store orders |
| Karma | Rewards | Loyalty points |

---

## Quick Start

```bash
# Install
cd companies/REZ-Consumer && npm install

# Start app
cd rez-app && npm install && npm run dev

# Start DO app
cd do && npm install && npm start

# Health check
curl http://localhost:3000/health
```
