# REZ Restaurant POS Service

Complete Point of Sale system for restaurants with KDS integration, printer support, and billing.

## Features

- **Order Management** - Create, modify, and complete orders
- **Kitchen Display System (KDS)** - Real-time order routing to kitchen stations
- **Printer Support** - ESC/POS receipt and KOT printing
- **Split Bill** - Divide bills by items, percentages, or custom amounts
- **GST Invoice** - Automatic tax calculation and invoice generation
- **Multi-Outlet Support** - Centralized management for chain restaurants
- **Staff Management** - Shifts, attendance, and role-based access
- **Inventory Tracking** - Real-time stock monitoring with alerts
- **Aggregator Integration** - Sync with Swiggy/Zomato

## Quick Start

### Prerequisites

- Node.js 20+
- MongoDB 7+
- Redis 7+ (optional, for caching)

### Installation

```bash
# Install dependencies
npm install

# Copy environment config
cp .env.example .env

# Start development server
npm run dev

# Production build
npm run build
npm start
```

### Docker

```bash
# Start with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f rez-restaurant-pos
```

## Environment Variables

See `.env.example` for all configuration options.

### Key Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `4010` |
| `MONGODB_URI` | MongoDB connection | `mongodb://localhost:27017/rez_restaurant_pos` |
| `KDS_SERVICE_URL` | KDS service URL | `http://localhost:4014` |
| `AUTH_SERVICE_URL` | RABTUL Auth URL | `http://localhost:4002` |

## API Endpoints

### Orders

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/orders` | List orders |
| POST | `/api/orders` | Create order |
| GET | `/api/orders/:id` | Get order |
| PATCH | `/api/orders/:id` | Update order |
| DELETE | `/api/orders/:id` | Cancel order |

### Billing

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/billing/calculate` | Calculate totals |
| POST | `/api/billing/split` | Split bill |
| POST | `/api/billing/invoice` | Generate invoice |

### KDS

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/kds/orders` | Create KDS order |
| PATCH | `/api/kds/orders/:id/items/:itemId` | Update item status |
| POST | `/api/kds/orders/:id/bump` | Bump order |

### Printers

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/printers` | List printers |
| POST | `/api/printers/test` | Test printer |
| POST | `/api/printers/receipt` | Print receipt |
| POST | `/api/printers/kot` | Print KOT |

### Inventory

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/inventory` | List items |
| POST | `/api/inventory/check` | Check availability |
| POST | `/api/inventory/alerts` | Configure alerts |

### Staff

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/staff` | List staff |
| POST | `/api/staff/clock-in` | Clock in |
| POST | `/api/staff/clock-out` | Clock out |

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      REZ Restaurant POS                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    │
│  │   Billing    │    │   Printer    │    │     KDS      │    │
│  │   Service    │    │   Service    │    │  Integration │    │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘    │
│         │                   │                   │              │
│  ┌──────▼───────┐    ┌──────▼───────┐    ┌──────▼───────┐    │
│  │    Split     │    │   Config     │    │  Station     │    │
│  │    Bill      │    │   Manager     │    │   Router     │    │
│  └──────────────┘    └──────────────┘    └──────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│   RABTUL     │  │     KDS       │  │   Printer     │
│   Services   │  │   Service     │  │   Network     │
│  (Auth, etc) │  │   (4014)     │  │   (TCP/IP)   │
└───────────────┘  └───────────────┘  └───────────────┘
```

## WebSocket Events

Connect to `/ws` for real-time updates:

```typescript
// Client → Server
{ type: 'join-store', storeId: 'store-123' }
{ type: 'leave-store', storeId: 'store-123' }

// Server → Client
{ type: 'order:created', data: { order } }
{ type: 'order:updated', data: { order } }
{ type: 'item:status', data: { orderId, itemId, status } }
```

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage
```

## Service Ports

| Service | Port | Description |
|---------|------|-------------|
| POS Service | 4010 | This service |
| KDS Service | 4014 | Kitchen Display |
| Auth Service | 4002 | RABTUL Auth |
| Order Service | 4006 | RABTUL Orders |
| Catalog Service | 4007 | RABTUL Products |

## License

MIT
