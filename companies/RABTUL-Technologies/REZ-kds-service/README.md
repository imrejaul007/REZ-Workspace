# REZ KDS Service

Kitchen Display System Backend API - Real-time order routing and kitchen display management.

## Features

- **Real-time Order Display** - Live updates via WebSocket
- **Station-based Routing** - Orders routed to appropriate stations (Grill, Fry, Sauté, etc.)
- **Item Status Tracking** - Track each item's preparation status
- **Bump & Recall** - Mark orders ready or recall for changes
- **Multi-store Support** - Isolated rooms per store
- **Priority Orders** - Rush order flagging
- **Order Notes** - Special instructions for kitchen staff

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Production build
npm run build
npm start
```

## Environment Variables

```bash
MONGODB_URI=mongodb://localhost:27017/rez-kds
PORT=4014
LOG_LEVEL=info
```

## API Endpoints

### Orders

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/kds/orders` | Get all orders (filter by storeId, status, station) |
| GET | `/api/v1/kds/orders/:orderId` | Get single order |
| POST | `/api/v1/kds/orders` | Create order |
| PATCH | `/api/v1/kds/orders/:orderId/items/:itemId/status` | Update item status (pending/preparing/ready) |
| POST | `/api/v1/kds/orders/:orderId/bump` | Bump order (mark ready) |
| POST | `/api/v1/kds/orders/:orderId/recall` | Recall order |
| POST | `/api/v1/kds/orders/:orderId/complete` | Complete order |
| POST | `/api/v1/kds/orders/:orderId/cancel` | Cancel order |
| POST | `/api/v1/kds/orders/:orderId/notes` | Add note to item |

### Stations

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/kds/stations/:station/orders` | Get orders by station |
| GET | `/api/v1/kds/stations` | Get all stations |

### Stats & Sync

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/kds/stats` | Get KDS statistics |
| GET | `/api/v1/kds/sync` | Sync orders since timestamp |

## WebSocket Events

Connect to the Socket.IO server at `ws://localhost:4014` for real-time updates.

### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `order:created` | `{ order }` | New order created |
| `order:updated` | `{ order }` | Order status changed |
| `item:status` | `{ orderId, itemId, status }` | Item status changed |
| `order:bumped` | `{ order }` | Order bumped (ready) |
| `order:completed` | `{ orderId }` | Order completed |
| `order:cancelled` | `{ orderId, reason }` | Order cancelled |
| `order:recalled` | `{ order }` | Order recalled |

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `join-store` | `{ storeId }` | Join store room for updates |
| `leave-store` | `{ storeId }` | Leave store room |

## Example Usage

### Create Order

```typescript
const response = await fetch('http://localhost:4014/api/v1/kds/orders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    merchantId: 'merchant-123',
    storeId: 'store-456',
    items: [
      { name: 'Burger', quantity: 2, station: 'grill', notes: 'No onions' }
    ],
    priority: 'normal',
    orderType: 'dine_in'
  })
})
```

### WebSocket Client

```typescript
import { io } from 'socket.io-client'

const socket = io('http://localhost:4014')

socket.on('connect', () => {
  console.log('Connected to KDS')
  socket.emit('join-store', { storeId: 'store-456' })
})

socket.on('order:created', (data) => {
  console.log('New order:', data.order)
})

socket.on('order:bumped', (data) => {
  console.log('Order ready:', data.order)
})
```

## Default Stations

| Station | Categories | Color |
|---------|------------|-------|
| Grill | grill, bbq, tandoor | #EF4444 (Red) |
| Fry | fry, fried, crispy | #F59E0B (Amber) |
| Sauté | curry, saute, gravy | #10B981 (Green) |
| Dessert | dessert, sweet, ice cream | #8B5CF6 (Purple) |
| Beverage | drink, beverage, shake | #3B82F6 (Blue) |

## Docker

```bash
# Build and run
docker build -t rez-kds .
docker run -p 4014:4014 rez-kds

# Or use docker-compose
docker-compose up -d
```

## Port

| Service | Port |
|---------|------|
| KDS Service | 4014 |

## Integrations

Connected to:
- **REZ Restaurant POS** (4010) - Order creation and management
- **REZ Merchant Dashboard** - Real-time display updates
- **REZ KDS Mobile** - Kitchen staff mobile app
