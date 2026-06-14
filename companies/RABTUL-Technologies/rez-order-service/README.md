# REZ Order Service

Order processing microservice managing the complete order lifecycle with state machine and BullMQ workers.

## Purpose

The Order Service handles:
- Order creation and lifecycle management
- Order state machine (pending -> confirmed -> preparing -> ready -> delivered)
- Integration with payment service
- Integration with merchant service for inventory
- Intent capture for analytics (ReZ Mind)
- Real-time order tracking

## Environment Variables

```env
# Core Service Config
NODE_ENV=development
PORT=3008
HEALTH_PORT=0
SERVICE_NAME=rez-order-service
LOG_LEVEL=info

# Database
MONGODB_URI=mongodb://localhost:27017/rez-order

# Cache
REDIS_URL=redis://localhost:6379
REDIS_TLS=false

# Authentication
JWT_SECRET=change-me-generate-with-openssl-rand-base64-64

# Internal Service Auth
INTERNAL_SERVICE_TOKENS_JSON={"order-service": "change-me-generate-with-openssl-rand-base64-64"}

# RTMN Commerce Memory
INTENT_CAPTURE_URL=https://rez-intent-graph.onrender.com
INTERNAL_SERVICE_TOKEN=change-me-generate-with-openssl-rand-base64-64

# Observability
SENTRY_DSN=
```

## Local Development

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server
npm run dev

# Production build
npm run build

# Start production server
npm start

# Run worker (separate process)
npm run worker
```

## API Endpoints

### Order Operations

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/orders | Create new order |
| GET | /api/orders/:orderId | Get order details |
| GET | /api/orders/user/:userId | Get user's orders |
| PUT | /api/orders/:orderId | Update order |
| DELETE | /api/orders/:orderId | Cancel order |

### Order Status

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/orders/:orderId/status | Get current status |
| POST | /api/orders/:orderId/confirm | Confirm order |
| POST | /api/orders/:orderId/preparing | Start preparing |
| POST | /api/orders/:orderId/ready | Mark ready |
| POST | /api/orders/:orderId/deliver | Mark delivered |
| POST | /api/orders/:orderId/cancel | Cancel order |

### Real-time Updates

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/orders/stream | SSE stream for real-time updates |

### Metrics

| Method | Path | Description |
|--------|------|-------------|
| GET | /metrics | Prometheus-compatible metrics |

### Health

| Method | Path | Description |
|--------|------|-------------|
| GET | /health | Health check |

## Order State Machine

```
CREATED ──▶ CONFIRMED ──▶ PREPARING ──▶ READY ──▶ DELIVERED
    │           │            │           │
    └───────────┴────────────┴───────────┴───▶ CANCELLED
```

### State Definitions

| State | Description |
|-------|-------------|
| CREATED | Order placed, awaiting payment confirmation |
| CONFIRMED | Payment confirmed, merchant notified |
| PREPARING | Merchant preparing the order |
| READY | Order ready for pickup/delivery |
| DELIVERED | Order completed |
| CANCELLED | Order cancelled (by user or system) |

## BullMQ Jobs

| Queue | Job | Description |
|-------|-----|-------------|
| order-processing | process-payment | Process payment for order |
| order-processing | notify-merchant | Send notification to merchant |
| order-processing | update-inventory | Update inventory in merchant service |
| order-cron | check-pending-orders | Check for stale pending orders |
| order-cron | send-reminders | Send order status reminders |

## Architecture

```
┌─────────────┐     ┌─────────────┐
│   Client    │────▶│   Order     │
│             │     │   Service   │
└─────────────┘     └─────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         ▼                 ▼                 ▼
┌─────────────┐     ┌─────────────┐   ┌─────────────┐
│   Payment   │     │  Merchant   │   │   Wallet    │
│   Service   │     │   Service   │   │   Service   │
└─────────────┘     └─────────────┘   └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │    BullMQ   │
                    │   Workers   │
                    └─────────────┘
```

## Data Models

### Order
```typescript
{
  orderId: string;
  userId: string;
  merchantId: string;
  items: OrderItem[];
  status: OrderStatus;
  totalAmount: number;
  paymentId: string;
  deliveryAddress?: Address;
  createdAt: Date;
  updatedAt: Date;
}
```

### OrderItem
```typescript
{
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}
```

## Deployment

### Render.com
1. Connect GitHub repository
2. Build command: `npm run build`
3. Start command: `npm start`
4. Configure Redis for BullMQ
5. Run worker: `npm run worker` (separate service)

### Docker
```bash
docker build -t rez-order-service .
docker run -p 3008:3008 --env-file .env rez-order-service
```

## Related Services

- **rez-payment-service** - Payment verification
- **rez-wallet-service** - Wallet deductions
- **rez-merchant-service** - Product inventory
- **rez-notification-events** - Order notifications

## License

MIT
