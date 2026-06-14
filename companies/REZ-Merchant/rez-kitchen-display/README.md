# ReZ Kitchen Display System

A real-time Kitchen Display System (KDS) for restaurant order management, built with Node.js, Express, and Socket.IO.

## Features

- **Real-time Order Updates** - WebSocket-based instant order notifications
- **Priority Queue** - Intelligent ordering based on priority, age, and item count
- **Cooking Time Tracking** - Automatic timer tracking with delay detection
- **Delay Alerts** - Automatic warnings for orders exceeding time thresholds
- **Sound Notifications** - Audio alerts for new orders and delays
- **Status Management** - Track orders through pending, preparing, ready, completed states
- **Item-Level Tracking** - Toggle individual item completion

## Quick Start

### Installation

```bash
cd /Users/rejaulkarim/Documents/ReZ\ Full\ App/rez-kitchen-display
npm install
```

### Run the Server

```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

The server will start on **port 4012**.

## API Endpoints

### Orders

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/orders` | Get all active orders (priority queue) |
| GET | `/api/orders/all` | Get all orders including completed |
| GET | `/api/orders/:id` | Get order by ID |
| GET | `/api/orders/stats` | Get order statistics |
| GET | `/api/orders/next` | Get next order in queue |
| GET | `/api/orders/delayed` | Get all delayed orders |
| POST | `/api/orders` | Create new order |
| PATCH | `/api/orders/:id/status` | Update order status |
| PATCH | `/api/orders/:id/items/:itemId/toggle` | Toggle item completion |
| POST | `/api/orders/clear-completed` | Clear completed orders |

### Sounds

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sounds/:type` | Get sound configuration |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |

## API Examples

### Create Order

```bash
curl -X POST http://localhost:4012/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "orderNumber": "ORD-001",
    "tableNumber": "T5",
    "customerName": "John Doe",
    "priority": "high",
    "estimatedTime": 10,
    "items": [
      { "name": "Margherita Pizza", "quantity": 1, "notes": "Extra cheese" },
      { "name": "Caesar Salad", "quantity": 1 }
    ]
  }'
```

### Update Order Status

```bash
curl -X PATCH http://localhost:4012/api/orders/{orderId}/status \
  -H "Content-Type: application/json" \
  -d '{ "status": "preparing" }'
```

### Get Statistics

```bash
curl http://localhost:4012/api/orders/stats
```

## WebSocket Events

### Server Events (Listen)

| Event | Payload | Description |
|-------|---------|-------------|
| `orders_update` | `KitchenOrder[]` | All active orders |
| `new_order` | `KitchenOrder` | New order created |
| `order_updated` | `KitchenOrder` | Order updated |
| `order_cancelled` | `KitchenOrder` | Order cancelled |
| `delay_alert` | `KitchenOrder` | Order is delayed |

### Client Events (Emit)

| Event | Payload | Description |
|-------|---------|-------------|
| `update_status` | `{ orderId, status }` | Update order status |
| `toggle_item` | `{ orderId, itemId }` | Toggle item completion |
| `new_order` | `CreateOrderRequest` | Create new order |
| `play_sound` | `{ type }` | Play notification sound |

## Socket.IO Client Example

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:4012');

// Listen for order updates
socket.on('orders_update', (orders) => {
  console.log('Orders updated:', orders);
});

// Listen for new orders
socket.on('new_order', (order) => {
  console.log('New order:', order);
  // Show notification, play sound, etc.
});

// Update order status
socket.emit('update_status', { orderId: '...', status: 'preparing' });

// Toggle item completion
socket.emit('toggle_item', { orderId: '...', itemId: '...' });
```

## Order Status Flow

```
PENDING → PREPARING → READY → COMPLETED
    ↓         ↓         ↓
CANCELLED  CANCELLED  CANCELLED
```

## Priority Levels

| Priority | Weight | Badge |
|----------|--------|-------|
| urgent | 4 | 🔥 |
| high | 3 | ⚡ |
| normal | 2 | 📋 |
| low | 1 | 📝 |

## Configuration

Environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 4012 | Server port |
| DELAY_THRESHOLD_MS | 900000 (15 min) | Delay warning threshold |

## Demo Script

```bash
# Create sample orders
npx ts-node demo.ts create

# List all orders
npx ts-node demo.ts list

# Get statistics
npx ts-node demo.ts stats

# Run all
npx ts-node demo.ts
```

## File Structure

```
rez-kitchen-display/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts              # Main server entry
│   ├── types/
│   │   └── index.ts          # TypeScript types
│   ├── models/
│   │   └── Order.ts          # Order model & logic
│   ├── routes/
│   │   └── kitchen.routes.ts  # API routes
│   ├── services/
│   │   └── kitchenService.ts  # Order management service
│   ├── workers/
│   │   └── orderTimer.ts     # Cooking time tracking
│   └── utils/
│       └── soundPlayer.ts     # Sound notifications
└── demo.ts                   # Demo script
```

## Sound Notifications

The system provides sound notifications for:

- **New Order** - Double beep
- **Delay Alert** - Triple alert beep
- **Order Ready** - Confirmation beep
- **Order Complete** - Soft confirmation

Sounds can be triggered via WebSocket or API.

## License

MIT
