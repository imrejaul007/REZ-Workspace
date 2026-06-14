# ReZ Delivery Service

A comprehensive delivery management service for the ReZ ecosystem, handling driver management, delivery tracking, route optimization, and real-time delivery status updates via WebSocket.

## Features

- **Driver Management**: Register, track, and manage delivery drivers with location updates
- **Delivery Lifecycle**: Create, assign, track, and complete delivery orders
- **Real-time Tracking**: Live location updates via Socket.IO integration
- **Route Optimization**: Calculate optimal routes with ETA predictions
- **Geo-spatial Queries**: Find nearby drivers using MongoDB geospatial indexes
- **Proof of Delivery**: Capture signatures, photos, and recipient information
- **Pricing Engine**: Calculate delivery fees with base, distance, and surge pricing
- **Event Sourcing**: Complete audit trail of all delivery events and status changes

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     ReZ Delivery Service                        │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  Express API │  │  Socket.IO   │  │    BullMQ Workers    │  │
│  │   (REST)     │  │  (Real-time) │  │  (Background Jobs)   │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘  │
│         │                 │                     │               │
│  ┌──────▼─────────────────▼─────────────────────▼───────────┐  │
│  │                    Service Layer                          │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────────┐  │  │
│  │  │ Delivery │ │  Driver  │ │  Route   │ │   Pricing   │  │  │
│  │  │ Service  │ │  Service │ │ Service  │ │   Service   │  │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └─────────────┘  │  │
│  └──────────────────────────┬────────────────────────────────┘  │
│                             │                                    │
│  ┌──────────────────────────▼────────────────────────────────┐  │
│  │                    Data Layer                              │  │
│  │  ┌──────────────────┐  ┌────────────────────────────────┐  │  │
│  │  │  MongoDB         │  │  Redis                         │  │  │
│  │  │  - deliveries    │  │  - Driver locations (Geo)       │  │  │
│  │  │  - drivers       │  │  - Active deliveries (Hash)     │  │  │
│  │  └──────────────────┘  └────────────────────────────────┘  │  │
│  └─────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Installation

```bash
npm install
```

## Configuration

Create a `.env` file based on `.env.example`:

```env
# Server Configuration
PORT=3005
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/rez_delivery
MONGODB_USER=
MONGODB_PASSWORD=

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Socket.IO Configuration
SOCKET_PORT=3006

# External Services
GOOGLE_MAPS_API_KEY=your_api_key

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

## Running the Service

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm run build
npm start
```

### Background Worker

```bash
npm run worker
```

## API Endpoints

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Service health check |
| GET | `/health/ready` | Readiness probe |
| GET | `/health/live` | Liveness probe |

### Delivery Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/deliveries` | Create a new delivery |
| GET | `/api/deliveries` | List all deliveries with filters |
| GET | `/api/deliveries/:id` | Get delivery by ID |
| PATCH | `/api/deliveries/:id` | Update delivery |
| DELETE | `/api/deliveries/:id` | Cancel delivery |
| POST | `/api/deliveries/:id/assign` | Assign driver to delivery |
| POST | `/api/deliveries/:id/pickup` | Mark delivery as picked up |
| POST | `/api/deliveries/:id/dropoff` | Complete delivery |
| POST | `/api/deliveries/:id/fail` | Mark delivery as failed |
| POST | `/api/deliveries/:id/proof` | Add proof of delivery |
| GET | `/api/deliveries/:id/route` | Get delivery route |
| GET | `/api/deliveries/:id/eta` | Get ETA for delivery |

### Driver Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/drivers` | Register a new driver |
| GET | `/api/drivers` | List all drivers |
| GET | `/api/drivers/:id` | Get driver by ID |
| PATCH | `/api/drivers/:id` | Update driver |
| DELETE | `/api/drivers/:id` | Remove driver |
| POST | `/api/drivers/:id/location` | Update driver location |
| GET | `/api/drivers/nearby` | Find nearby drivers |
| GET | `/api/drivers/available` | List available drivers |

### Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/summary` | Delivery statistics summary |
| GET | `/api/analytics/driver/:id` | Driver performance metrics |
| GET | `/api/analytics/merchant/:id` | Merchant delivery metrics |

## Data Models

### Delivery

```typescript
interface IDelivery {
  orderId: string;
  customerId: string;
  driverId?: string;
  status: DeliveryStatus;
  pickup: GeoLocation;
  dropoff: GeoLocation;
  route?: DeliveryRoute;
  eta?: ETACalculation;
  events: DeliveryEvent[];
  scheduledPickup?: Date;
  scheduledDropoff?: Date;
  actualPickup?: Date;
  actualDropoff?: Date;
  packageDetails: {
    weight?: number;
    dimensions: { length: number; width: number; height: number };
    description: string;
    specialInstructions?: string;
  };
  pricing: {
    basePrice: number;
    distanceFee: number;
    surgeFee?: number;
    totalPrice: number;
  };
  proofOfDelivery?: {
    signature?: string;
    photo?: string;
    recipientName?: string;
  };
}
```

### Driver

```typescript
interface IDriver {
  userId: string;
  name: string;
  email: string;
  phone: string;
  status: DriverStatus;
  currentLocation?: GeoLocation;
  vehicle: {
    type: 'motorcycle' | 'car' | 'van' | 'truck';
    licensePlate: string;
    model?: string;
    color?: string;
  };
  rating: number;
  totalDeliveries: number;
  completedDeliveries: number;
  failedDeliveries: number;
  currentDeliveryId?: string;
  availability: {
    isAvailable: boolean;
    maxRadius: number;
    workingHours: { start: string; end: string };
  };
}
```

### Delivery Status Enum

```typescript
enum DeliveryStatus {
  PENDING = 'pending',
  ASSIGNED = 'assigned',
  PICKED_UP = 'picked_up',
  IN_TRANSIT = 'in_transit',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}
```

### Driver Status Enum

```typescript
enum DriverStatus {
  AVAILABLE = 'available',
  BUSY = 'busy',
  OFFLINE = 'offline',
  ON_BREAK = 'on_break'
}
```

## WebSocket Events

### Server to Client

| Event | Payload | Description |
|-------|---------|-------------|
| `delivery:created` | Delivery | New delivery created |
| `delivery:assigned` | { deliveryId, driverId } | Driver assigned |
| `delivery:status` | { deliveryId, status, location } | Status update |
| `delivery:location` | { deliveryId, location, eta } | Location update |
| `driver:location` | { driverId, location } | Driver position |
| `delivery:completed` | Delivery | Delivery finished |
| `delivery:failed` | { deliveryId, reason } | Delivery failed |

### Client to Server

| Event | Payload | Description |
|-------|---------|-------------|
| `driver:join` | { driverId } | Driver joins room |
| `driver:leave` | { driverId } | Driver leaves room |
| `driver:location` | { driverId, location } | Location update |
| `delivery:subscribe` | { deliveryId } | Subscribe to delivery |
| `delivery:unsubscribe` | { deliveryId } | Unsubscribe from delivery |

## Error Responses

All API errors follow a consistent format:

```json
{
  "success": false,
  "error": {
    "code": "DELIVERY_NOT_FOUND",
    "message": "Delivery with ID xyz not found",
    "details": {}
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid request payload |
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `DELIVERY_NOT_FOUND` | 404 | Delivery does not exist |
| `DRIVER_NOT_FOUND` | 404 | Driver does not exist |
| `DELIVERY_ALREADY_ASSIGNED` | 409 | Delivery already has driver |
| `DRIVER_NOT_AVAILABLE` | 409 | Driver is busy/offline |
| `INVALID_STATUS_TRANSITION` | 422 | Invalid status change |
| `INTERNAL_ERROR` | 500 | Server error |

## Testing

```bash
# Run unit tests
npm test

# Run with coverage
npm test -- --coverage

# Run integration tests
npm run test:integration
```

## Deployment

### Docker

```bash
docker build -t rez-delivery-service .
docker run -p 3005:3005 --env-file .env rez-delivery-service
```

### Kubernetes

Helm charts available in the `k8s/` directory.

## License

MIT
