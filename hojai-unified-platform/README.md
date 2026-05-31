# Hojai Unified Platform

**Port:** 4850

**Everything Gupshup has, plus Commerce, Rewards, and Memory - in ONE platform.**

---

## What Is This?

A single platform that replaces **16 WhatsApp services**, **15 support services**, and **20 marketing services** with one unified system.

### Instead of This:

```
16 WhatsApp services (REZ-whatsapp, commerce, store, provisioning, etc.)
15 support services (REZ-care, inbox, handoff, etc.)
20 marketing services (campaigns, journey, etc.)
```

### You Get This:

```
HOJAI UNIFIED PLATFORM (4850)
├── WhatsApp Business API ✅
├── Multi-channel Support ✅
├── Contact Center ✅
├── Human Handoff ✅
├── Cart & Checkout ✅
├── Order Management ✅
├── Payments ✅
├── Wallet ✅
├── Campaigns ✅
├── Templates ✅
└── Analytics ✅
```

---

## Features

### 📱 Channels (All in One)
- **WhatsApp** - Direct Meta API integration
- **Instagram** - DM automation
- **SMS** - Campaign integration
- **Email** - Templates
- **Push** - Notifications
- **Web Chat** - Widget ready

### 🛒 Commerce (Your Moat)
- **Cart Management** - Add, update, remove items
- **Checkout** - Order creation
- **Payments** - Payment links, UPI, COD
- **Wallet** - Balance, coins, cashback
- **Orders** - Status tracking
- **Delivery** - Updates via chat

### 🎧 Support (Contact Center)
- **Conversations** - Multi-channel inbox
- **Agents** - Team management
- **Assignment** - Auto-routing
- **Resolution** - Track SLA
- **Canned Responses** - Quick replies

### 📣 Marketing (Campaigns)
- **Templates** - WhatsApp, SMS, Email
- **Campaigns** - Scheduled sends
- **Broadcasts** - Mass messaging
- **A/B Testing** - Variant support
- **Analytics** - Delivery, opens, clicks

---

## Quick Start

```bash
cd hojai-ai/hojai-unified-platform
npm install
cp .env.example .env
npm run dev
```

---

## API Endpoints

### Conversations

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/conversations` | List conversations |
| POST | `/api/conversations/:id/assign` | Assign to agent |
| POST | `/api/conversations/:id/resolve` | Resolve conversation |

### Messages

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/messages/send` | Send message |

### Cart & Commerce

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/cart` | Create cart |
| GET | `/api/cart/:id` | Get cart |
| POST | `/api/cart/:id/items` | Add item |
| POST | `/api/cart/:id/checkout` | Checkout |
| POST | `/api/orders/:id/pay` | Initiate payment |

### Campaigns

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/campaigns` | Create campaign |
| POST | `/api/campaigns/:id/start` | Start campaign |

### Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics` | Get platform analytics |

### Webhooks

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/webhooks/whatsapp` | Verify webhook |
| POST | `/api/webhooks/whatsapp` | Receive messages |

---

## Commerce Flow

```
Customer → WhatsApp → Browse Products → Add to Cart → Checkout → Pay → Order Confirmed
                                     ↓
                              Track Order → Delivery Updates
```

### Example: WhatsApp Checkout

```bash
# 1. Create cart
curl -X POST http://localhost:4850/api/cart \
  -H "Content-Type: application/json" \
  -H "X-Tenant-Id: merchant_123" \
  -d '{
    "sessionId": "session_abc",
    "customer": {
      "id": "user_123",
      "name": "John",
      "phone": "+919876543210"
    },
    "items": [
      {"productId": "prod_1", "name": "Pizza", "price": 299, "quantity": 2}
    ]
  }'

# 2. Add more items
curl -X POST http://localhost:4850/api/cart/{cartId}/items \
  -H "Content-Type: application/json" \
  -d '{"productId": "prod_2", "name": "Coke", "price": 49, "quantity": 1}'

# 3. Checkout
curl -X POST http://localhost:4850/api/cart/{cartId}/checkout \
  -H "Content-Type: application/json" \
  -d '{"deliveryAddress": "123 Main St", "paymentMethod": "upi"}'

# 4. Pay (get payment link)
curl -X POST http://localhost:4850/api/orders/{orderId}/pay \
  -H "Content-Type: application/json" \
  -d '{"customerPhone": "+919876543210"}'
```

---

## Compared to Gupshup

| Feature | Gupshup | Hojai Unified |
|---------|----------|---------------|
| WhatsApp API | ✅ | ✅ |
| SMS | ✅ | ✅ |
| Voice | ✅ | ✅ |
| RCS | ✅ | ✅ |
| Conversation Builder | ✅ | ✅ (hojai-studio) |
| Contact Center | ✅ | ✅ |
| Human Handoff | ✅ | ✅ |
| **Commerce** | ❌ | ✅ |
| **Checkout** | ❌ | ✅ |
| **Wallet** | ❌ | ✅ |
| **Orders** | ❌ | ✅ |
| **Rewards** | ❌ | ✅ |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              HOJAI UNIFIED PLATFORM (4850)                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐│
│  │ WhatsApp API  │  │ Instagram API  │  │ SMS/Email API  ││
│  └───────┬────────┘  └───────┬────────┘  └───────┬────────┘│
│          │                    │                    │          │
│  ┌───────┴────────────────────┴────────────────────┴────────┐│
│  │                    MESSAGE ROUTER                         ││
│  └───────┬───────────────────────────────────────────────┬──┘│
│          │                                               │  │
│  ┌───────┴────────┐  ┌────────────────┐  ┌───────────────┴──┐│
│  │  CONVERSATIONS  │  │     AGENTS     │  │    CAMPAIGNS    ││
│  └───────┬────────┘  └───────┬────────┘  └───────┬────────┘│
│          │                    │                    │          │
│  ┌───────┴────────────────────┴────────────────────┴────────┐│
│  │                    CART & CHECKOUT                       ││
│  └───────┬────────────────┬────────────────┬───────────────┘│
│          │                │                │               │
│  ┌───────┴───┐  ┌────────┴───────┐  ┌────┴──────────┐    │
│  │ ORDERS    │  │   PAYMENTS     │  │    WALLET    │    │
│  └───────────┘  └────────────────┘  └──────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                    ANALYTICS DASHBOARD                   │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
└──────────────────────────────────────────────────────────────┘
                              │
┌──────────────────────────────┴──────────────────────────────┐
│                      RABTUL PLATFORM                            │
├──────────────────────────────────────────────────────────────┤
│  Auth (4002) │ Payment (4001) │ Wallet (4004) │ Order (4006) │
└──────────────────────────────────────────────────────────────┘
```

---

## Environment Variables

```bash
PORT=4850

# MongoDB
MONGODB_URI=mongodb://localhost:27017/hojai_unified

# WhatsApp
WHATSAPP_ACCESS_TOKEN=your-token
WHATSAPP_PHONE_NUMBER_ID=your-id

# RABTUL (for Commerce)
AUTH_SERVICE_URL=http://localhost:4002
PAYMENT_SERVICE_URL=http://localhost:4001
WALLET_SERVICE_URL=http://localhost:4004
ORDER_SERVICE_URL=http://localhost:4006
CATALOG_SERVICE_URL=http://localhost:4007
```

---

## License

MIT
