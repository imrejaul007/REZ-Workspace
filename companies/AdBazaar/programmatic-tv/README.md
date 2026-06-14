# Programmatic TV Service

OpenRTB 2.6 interface for CTV (Connected TV) programmatic buying. ClearLine equivalent.

## Overview

This service provides a programmatic advertising interface for CTV inventory using the OpenRTB 2.6 protocol with CTV-specific extensions.

## Features

- **OpenRTB 2.6 Compliance** - Full support for OpenRTB 2.6 bid requests and responses
- **CTV Extensions** - Native support for Smart TV, Set-Top Box, Gaming Console, and Streaming Device categories
- **Private Marketplace (PMP)** - Support for programmatic guaranteed, preferred deals, and private marketplace
- **Deal Management** - Create, update, and manage private deals with targeting rules
- **Bidder Seat Management** - Register and manage bidder seats with bid limits
- **Floor Price Rules** - Dynamic floor price rules based on geo, device, content, and time
- **Prometheus Metrics** - Built-in metrics for monitoring bid performance
- **JWT Authentication** - Secure API access with JWT tokens

## Tech Stack

- **Express.js** - Web framework
- **MongoDB** - Primary database for deals, seats, and rules
- **Redis** - Caching and rate limiting
- **Zod** - Request validation
- **JWT** - Authentication
- **Prom-client** - Prometheus metrics

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB 6+
- Redis 7+

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your settings
```

### Running the Service

```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start

# Run tests
npm test
```

## API Endpoints

### Bid Requests

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/bid` | Process OpenRTB bid request |
| POST | `/api/bid/batch` | Process batch bid requests |
| GET | `/api/bid/health` | Bid service health check |

### Deals

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/deals` | List available deals |
| POST | `/api/deals` | Create private deal |
| GET | `/api/deals/:id` | Get deal details |
| PUT | `/api/deals/:id` | Update deal |
| DELETE | `/api/deals/:id` | Delete deal |

### Seats

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/seats` | List bidder seats |
| POST | `/api/seats` | Register bidder seat |
| GET | `/api/seats/:id` | Get seat details |
| PUT | `/api/seats/:id` | Update seat |
| DELETE | `/api/seats/:id` | Delete seat |

### Floors

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/floors` | List floor price rules |
| POST | `/api/floors` | Create floor rule |
| GET | `/api/floors/:id` | Get floor rule details |
| PUT | `/api/floors/:id` | Update floor rule |
| DELETE | `/api/floors/:id` | Delete floor rule |
| GET | `/api/floors/calculate` | Calculate floor price |

### Health & Metrics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Service health check |
| GET | `/api/ready` | Readiness check |
| GET | `/api` | API info |
| GET | `/metrics` | Prometheus metrics |

## OpenRTB 2.6 Extensions

### CTV Device Categories

```typescript
enum CTVDeviceCategory {
  SMART_TV = 'smarttv',
  SET_TOP_BOX = 'settop',
  GAMING_CONSOLE = 'gaming',
  STREAMING_DEVICE = 'streaming'
}
```

### CTV Video Extension

```typescript
interface CTVVideoExtension {
  deviceCategory: CTVDeviceCategory;
  appBundle: string;
  isLivingRoom: boolean;
  screenSize?: { width: number; height: number };
  drmSupport?: string[];
}
```

### Private Deal Types

```typescript
enum DealType {
  PROGRAMMATIC_GUARANTEED = 'programmatic-guaranteed',
  PREFERRED_DEAL = 'preferred-deal',
  PRIVATE_MARKETPLACE = 'private-marketplace'
}
```

## Configuration

Environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 4700 | Service port |
| `MONGODB_URI` | mongodb://localhost:27017/programmatic-tv | MongoDB connection string |
| `REDIS_URL` | redis://localhost:6379 | Redis connection URL |
| `JWT_SECRET` | (required) | JWT signing secret |
| `OPENRTB_VERSION` | 2.6 | OpenRTB protocol version |
| `NODE_ENV` | development | Environment mode |

## Example Bid Request

```json
{
  "id": "req-123",
  "at": 2,
  "tmax": 2000,
  "imp": [
    {
      "id": "imp-1",
      "bidfloor": 1.5,
      "bidfloorcur": "USD",
      "video": {
        "mimes": ["video/mp4"],
        "minduration": 5,
        "maxduration": 60,
        "linearity": 1,
        "skip": 1,
        "skipmin": 5,
        "ctv": {
          "deviceCategory": "smarttv",
          "appBundle": "com.example.app",
          "isLivingRoom": true
        }
      },
      "pmp": {
        "private_auction": 1,
        "deals": [
          {
            "id": "deal-123",
            "bidfloor": 2.0,
            "bidfloorcur": "USD"
          }
        ]
      }
    }
  ],
  "device": {
    "devicetype": 3,
    "make": "Samsung",
    "model": "Smart TV",
    "os": "Tizen",
    "connectiontype": 1,
    "geo": {
      "country": "US",
      "region": "CA"
    }
  },
  "app": {
    "id": "app-123",
    "name": "Test App",
    "bundle": "com.example.app"
  },
  "user": {
    "id": "user-123"
  }
}
```

## Authentication

All API endpoints (except `/api/bid/*` and `/api/health`) require JWT authentication:

```
Authorization: Bearer <token>
```

For service-to-service calls:

```
Authorization: Bearer <service-token>
```

## Metrics

Prometheus metrics available at `/metrics`:

- `ptv_http_requests_total` - HTTP request counter
- `ptv_http_request_duration_seconds` - Request duration histogram
- `ptv_bid_requests_total` - Bid request counter
- `ptv_bid_response_time_seconds` - Bid response time
- `ptv_deals_total` - Deals created counter
- `ptv_active_deals` - Active deals gauge
- `ptv_seats_total` - Seats created counter
- `ptv_active_seats` - Active seats gauge

## Project Structure

```
programmatic-tv/
├── src/
│   ├── config/        # Configuration
│   ├── models/        # MongoDB models
│   ├── services/      # Business logic
│   ├── routes/        # API routes
│   ├── middleware/    # Express middleware
│   ├── types/         # TypeScript types
│   ├── utils/         # Utilities (metrics, logger)
│   └── index.ts       # Application entry point
├── tests/             # Test files
├── package.json
├── tsconfig.json
├── jest.config.js
└── README.md
```

## License

Proprietary - AdBazaar