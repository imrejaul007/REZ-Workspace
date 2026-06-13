# RTMN Buyer Twin

Real estate buyer profiles and matching service for TwinOS.

## Overview

Buyer Twin manages buyer profiles, search criteria, financing information, and property interactions for the RTMN Real Estate OS platform. It provides:
- Buyer profile management
- Search criteria and matching
- Property interaction tracking
- Agent assignment
- Stage progression
- Golden Visa eligibility tracking
- Analytics and statistics

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

# Start in development mode
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test
```

### Docker

```bash
# Build and run with Docker Compose
docker-compose up -d

# Run tests
docker-compose run buyer-twin npm test
```

## API Endpoints

### Buyers

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/buyers` | Create a new buyer |
| GET | `/api/v1/buyers` | List buyers for tenant |
| GET | `/api/v1/buyers/:buyerId` | Get buyer by ID |
| PATCH | `/api/v1/buyers/:buyerId` | Update buyer |
| DELETE | `/api/v1/buyers/:buyerId` | Delete buyer (soft delete) |
| PATCH | `/api/v1/buyers/:buyerId/status` | Update buyer status |
| POST | `/api/v1/buyers/:buyerId/agent` | Assign agent to buyer |
| POST | `/api/v1/buyers/:buyerId/property` | Record property interaction |

### Matching

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/match/buyers` | Find matching buyers for property |

### Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/buyers/stats/by-stage` | Get buyer statistics |
| POST | `/api/v1/buyers/search` | Search buyers |

### Webhooks

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/webhook/twinos/buyer` | TwinOS buyer creation |
| PATCH | `/webhook/twinos/buyer/:buyerId` | TwinOS buyer update |
| POST | `/webhook/marketplace/interaction` | Property interaction |
| POST | `/webhook/lead/assign-agent` | Agent assignment |
| PATCH | `/webhook/agent/buyer-status/:buyerId` | Buyer status update |

## Configuration

Environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Service port | `8844` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/buyer-twin` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `API_KEY` | API authentication key | Required |
| `INTERNAL_SERVICE_TOKEN` | Internal service token | Required |
| `CORS_ORIGIN` | Allowed CORS origins | `http://localhost:3000,http://localhost:8844` |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Buyer Twin                             │
├─────────────────────────────────────────────────────────────┤
│  Express Server (Port 8844)                                │
│  ├── API Routes (/api/v1/*)                                │
│  ├── Webhooks (/webhook/*)                                 │
│  └── Health Check (/health)                                │
├─────────────────────────────────────────────────────────────┤
│  Services Layer                                             │
│  └── BuyerService                                           │
│      ├── createBuyer                                       │
│      ├── getBuyer                                          │
│      ├── listBuyers                                        │
│      ├── updateBuyer                                       │
│      ├── deleteBuyer                                       │
│      ├── assignAgent                                       │
│      ├── recordPropertyInteraction                         │
│      ├── findMatchingBuyers                                │
│      └── getBuyerStats                                     │
├─────────────────────────────────────────────────────────────┤
│  Data Layer                                                 │
│  └── MongoDB (Buyer Schema)                                 │
└─────────────────────────────────────────────────────────────┘
```

## Buyer Status Flow

```
searching → viewing → negotiating → under_contract → closed
    ↑           ↓           ↓              ↓
    └── paused ─┴───────────┴──────────────┘
```

## TwinOS Integration

Buyer Twin is part of the Real Estate OS and integrates with:

- **Property Twin** - Property data and listings
- **Agent Twin** - Agent profiles and assignments
- **Lead Management** - Lead routing and scoring
- **Virtual Tours** - Tour scheduling and tracking
- **Golden Visa** - Visa eligibility checking

## License

Proprietary - RTMN Architecture Team
