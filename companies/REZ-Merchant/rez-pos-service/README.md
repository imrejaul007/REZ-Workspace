# ReZ POS Service

Restaurant Point of Sale Service for order management, billing, and payments.

## Quick Start

```bash
cd /Users/rejaulkarim/Documents/ReZ\ Full\ App/rez-pos-service
npm install
npm run dev
```

Server runs on **port 4013**.

## API Endpoints

### Health Check
- `GET /api/pos/health` - Service health status

### Orders
- `POST /api/pos/orders` - Create new order
- `GET /api/pos/orders` - Get all active orders
- `GET /api/pos/orders/:id` - Get order by ID
- `PUT /api/pos/orders/:id/status` - Update order status
- `POST /api/pos/orders/:id/confirm` - Confirm order
- `POST /api/pos/orders/:id/start-preparing` - Start preparing
- `POST /api/pos/orders/:id/ready` - Mark ready
- `POST /api/pos/orders/:id/served` - Mark served

### Order Items
- `POST /api/pos/orders/:id/items` - Add item
- `PUT /api/pos/orders/:id/items/:itemId` - Update quantity
- `DELETE /api/pos/orders/:id/items/:itemId` - Remove item

### Discounts
- `POST /api/pos/orders/:id/discount` - Apply discount
- `DELETE /api/pos/orders/:id/discount` - Remove discount

### Billing
- `GET /api/pos/orders/:id/bill` - Get bill calculation
- `GET /api/pos/orders/:id/tips` - Get tip suggestions
- `POST /api/pos/orders/:id/split` - Split bill

### Payments
- `POST /api/pos/orders/:id/payment` - Process payment
- `POST /api/pos/orders/:id/refund` - Refund payment

### Receipts
- `POST /api/pos/orders/:id/receipt` - Print receipt

### Void
- `POST /api/pos/orders/:id/void` - Void order

### Menu
- `GET /api/pos/menu` - Get all menu items
- `GET /api/pos/menu/:id` - Get menu item

### Statistics
- `GET /api/pos/stats` - Order statistics
- `GET /api/pos/revenue` - Revenue summary

## Features

- Create and manage orders
- Add/remove/update items
- Apply percentage or fixed discounts
- Split bills (equal, by items, by amounts)
- Multiple payment methods (cash, card, mobile)
- Process refunds
- Generate receipts
- Void orders
- Order status workflow (pending -> confirmed -> preparing -> ready -> served -> paid)
- Real-time bill calculation with tax
- Tip suggestions (15%, 18%, 20%)
- Daily order tracking
- Revenue reporting
