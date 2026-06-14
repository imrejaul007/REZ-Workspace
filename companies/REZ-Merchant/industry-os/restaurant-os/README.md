# 🍽️ REZ Restaurant OS

**Unified Restaurant Management Platform**  
**Version:** 1.0 | **Date:** June 13, 2026

---

## 📁 Structure

```
restaurant-os/
├── .env.example              ← Environment template
├── core/
│   ├── rez-restaurant/      ← Main service (4101)
│   ├── rez-ai-restaurant/   ← AI waiter/chatbot (4105)
│   └── restauranthub/        ← Monorepo (Go4Food, etc.)
├── pos/
│   └── rez-restaurant-pos/  ← POS system (4102)
├── kitchen/
│   └── rez-kds/              ← Kitchen Display (4103)
├── orders/
│   └── rez-reservations/    ← Table booking (4104)
├── analytics/
│   └── rez-analytics/       ← Restaurant analytics (4106)
└── integrations/
    ├── rez-loyalty/         ← Loyalty program (4108)
    ├── rez-scheduling/       ← Staff scheduling (4109)
    └── rez-inventory/        ← Inventory (4110)
```

---

## 🔌 Ports

| Service | Port | Description |
|---------|------|-------------|
| rez-restaurant | 4101 | Main API |
| rez-restaurant-pos | 4102 | POS |
| rez-kds | 4103 | Kitchen Display |
| rez-reservations | 4104 | Reservations |
| rez-ai-restaurant | 4105 | AI Chatbot |
| rez-analytics | 4106 | Analytics |
| rez-loyalty | 4108 | Loyalty |
| rez-scheduling | 4109 | Scheduling |
| rez-inventory | 4110 | Inventory |

---

## 🚀 Quick Start

```bash
cd core/rez-restaurant
npm install
npm run dev  # Port 4101
```

---

## 📦 SDK

```typescript
import { createRestaurantSDK } from '../../shared/rez-restaurant-sdk';

const restaurant = createRestaurantSDK({ baseURL: 'http://localhost:4101' });

// Create order
const order = await restaurant.pos.createOrder({
  tableId: 'T1',
  items: [{ menuItemId: 'M1', name: 'Biryani', quantity: 2, price: 250 }]
});

// Get kitchen tickets
const tickets = await restaurant.kds.getTickets('pending');
```

---

## 🔗 Dependencies

- RABTUL Auth: 4002
- RABTUL Payment: 4001
- RABTUL Wallet: 4004

---

**Version:** 1.0 | **Updated:** June 13, 2026
