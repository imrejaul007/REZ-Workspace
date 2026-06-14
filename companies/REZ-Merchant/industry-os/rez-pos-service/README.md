# Restaurant POS Service

**Part of:** HOJAI Restaurant OS
**Port:** To be assigned

---

## Overview

Complete Point of Sale system for restaurants with AI integration.

---

## Features

### Order Management
- [x] Order creation
- [x] Order modification
- [x] Order cancellation
- [x] Order status tracking
- [x] Split bill
- [x] Merge orders

### Menu Management
- [x] Category management
- [x] Item management
- [x] Modifier groups
- [x] Combo/sets
- [x] Item variants (size, toppings)
- [x] Tax configuration

### Table Management
- [x] Floor plan
- [x] Table status
- [x] Table transfer
- [x] QR code generation

### Payment
- [x] Cash payments
- [x] Card payments
- [x] UPI payments
- [x] Split payment
- [x] Partial payment
- [x] Refunds

### Kitchen Display (KDS)
- [x] Order display
- [x] Priority orders
- [x] Bump orders
- [x] Timer alerts
- [x] Station routing

### AI Integration
- [ ] AI Waiter integration
- [ ] Voice ordering
- [ ] Smart suggestions

---

## API Endpoints

### Orders
```
POST   /api/orders          - Create order
GET    /api/orders          - List orders
GET    /api/orders/:id     - Get order
PUT    /api/orders/:id     - Update order
DELETE /api/orders/:id     - Cancel order
POST   /api/orders/:id/split - Split bill
```

### Tables
```
POST   /api/tables          - Create table
GET    /api/tables          - List tables
PUT    /api/tables/:id      - Update table
POST   /api/tables/:id/qr   - Generate QR
```

### Menu
```
POST   /api/menu/categories - Create category
GET    /api/menu/categories - List categories
POST   /api/menu/items      - Create item
GET    /api/menu/items      - List items
```

### Payments
```
POST   /api/payments        - Process payment
GET    /api/payments/:id    - Get payment
POST   /api/payments/:id/refund - Refund
```

### Kitchen
```
GET    /api/kds/orders      - Active kitchen orders
POST   /api/kds/orders/:id/bump - Mark done
```

---

## Models

### Order
```typescript
interface Order {
  id: string;
  restaurantId: string;
  tableId?: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'open' | 'pending' | 'preparing' | 'ready' | 'served' | 'paid' | 'cancelled';
  paymentStatus: 'pending' | 'partial' | 'paid';
  payments: Payment[];
  createdAt: Date;
  updatedAt: Date;
}
```

### OrderItem
```typescript
interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  modifiers: Modifier[];
  notes?: string;
  status: 'pending' | 'preparing' | 'ready' | 'served';
}
```

### Payment
```typescript
interface Payment {
  id: string;
  orderId: string;
  method: 'cash' | 'card' | 'upi' | 'wallet';
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  transactionId?: string;
}
```

---

## Integration

### With AI Waiter
```typescript
// AI Waiter creates order via POS API
const order = await fetch('/api/orders', {
  method: 'POST',
  body: JSON.stringify({
    tableId: 'table-5',
    items: [{ menuItemId: 'pizza-1', quantity: 1 }]
  })
});

// POS notifies KDS
await kdsService.sendOrder(order);
```

### With WhatsApp
```typescript
// Customer pays via WhatsApp
const paymentLink = await paymentsService.createUPI(order.total);
await whatsappService.sendMessage(customerPhone, `Pay here: ${paymentLink}`);
```

---

## Deployment

```bash
# Build
npm run build

# Run
npm start

# Docker
docker build -t rez-pos-service .
docker run -p 3000:3000 rez-pos-service
```

---

**Last Updated:** June 3, 2026
