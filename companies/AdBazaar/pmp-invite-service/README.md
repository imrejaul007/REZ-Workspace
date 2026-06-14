# PMP Invite Service

Private Marketplace (PMP) invite management service for AdBazaar SSP.

## Overview

The PMP Invite Service manages private marketplace deals between publishers and advertisers. It provides endpoints for creating, managing, and tracking PMP invites and accepted deals.

## Features

- Create PMP invites with targeting criteria
- Accept or decline invites
- List invites with filtering and pagination
- Track accepted deals
- Prometheus metrics for monitoring
- JWT authentication
- Rate limiting

## Tech Stack

- **Runtime:** Node.js 18+
- **Language:** TypeScript 5.3+
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose
- **Cache:** Redis (ioredis)
- **Validation:** Zod
- **Metrics:** Prometheus (prom-client)
- **Auth:** JWT (jsonwebtoken)

## Port Configuration

| Service | Port |
|---------|------|
| PMP Invite Service | **4601** |

## API Endpoints

### PMP Invites

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/pmp/invite` | Create a new PMP invite | Admin, Publisher |
| GET | `/api/pmp/invites` | List all invites | All authenticated |
| GET | `/api/pmp/invites/:id` | Get invite details | All authenticated |
| POST | `/api/pmp/invites/:id/accept` | Accept an invite | Admin, Advertiser |
| POST | `/api/pmp/invites/:id/decline` | Decline an invite | Admin, Advertiser |
| GET | `/api/pmp/deals` | List accepted deals | All authenticated |
| GET | `/api/pmp/metrics` | Get invite metrics | Admin only |

### System

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/metrics` | Prometheus metrics |

## API Reference

### Create Invite

```http
POST /api/pmp/invite
Authorization: Bearer <token>
Content-Type: application/json

{
  "publisherId": "pub_abc123",
  "advertiserId": "adv_xyz789",
  "dealType": "private_marketplace",
  "dealDetails": {
    "name": "Premium Display Inventory",
    "floorPrice": 2.50,
    "currency": "USD",
    "targeting": {
      "geo": ["US", "CA"],
      "deviceTypes": ["mobile", "desktop"],
      "contentCategories": ["news", "sports"]
    },
    "startDate": "2026-07-01",
    "endDate": "2026-12-31"
  },
  "expiresInDays": 14
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "inviteId": "PMP-ABC12345-XYZ789",
    "publisherId": "pub_abc123",
    "advertiserId": "adv_xyz789",
    "dealType": "private_marketplace",
    "status": "pending",
    "expiresAt": "2026-06-21T00:00:00.000Z",
    "..."
  },
  "message": "PMP invite created successfully",
  "timestamp": "2026-06-07T00:00:00.000Z"
}
```

### List Invites

```http
GET /api/pmp/invites?status=pending&publisherId=pub_abc123&page=1&limit=20
Authorization: Bearer <token>
```

**Query Parameters:**
- `status` - Filter by status: `pending`, `accepted`, `declined`, `expired`
- `publisherId` - Filter by publisher
- `advertiserId` - Filter by advertiser
- `dealType` - Filter by type: `preferred_deal`, `private_marketplace`, `programmatic_guaranteed`
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)

### Accept Invite

```http
POST /api/pmp/invites/:id/accept
Authorization: Bearer <token>
```

### Decline Invite

```http
POST /api/pmp/invites/:id/decline
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "declined",
  "message": "Budget constraints prevent us from accepting this deal"
}
```

### List Deals

```http
GET /api/pmp/deals?publisherId=pub_abc123&page=1&limit=20
Authorization: Bearer <token>
```

## Data Models

### PMPInvite

```typescript
interface PMPInvite {
  inviteId: string;           // Unique invite ID (e.g., PMP-ABC12345-XYZ789)
  publisherId: string;        // Publisher identifier
  advertiserId?: string;      // Advertiser identifier
  dealType: 'preferred_deal' | 'private_marketplace' | 'programmatic_guaranteed';
  dealDetails: {
    name: string;
    floorPrice: number;
    currency: string;         // Default: USD
    targeting?: {
      geo?: string[];
      deviceTypes?: string[];
      contentCategories?: string[];
    };
    startDate: Date;
    endDate: Date;
  };
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  acceptedAt?: Date;
  declinedAt?: Date;
  declinedMessage?: string;
  createdBy: string;
}
```

## Deal Types

| Type | Description |
|------|-------------|
| `preferred_deal` | Non-binding agreement with priority access |
| `private_marketplace` | Invite-only auction with select inventory |
| `programmatic_guaranteed` | Binding guaranteed delivery agreement |

## Authentication

The service uses JWT tokens for authentication. Include the token in the Authorization header:

```http
Authorization: Bearer <token>
```

**JWT Payload:**
```typescript
{
  userId: string;
  role: 'publisher' | 'advertiser' | 'admin';
  companyId: string;
  companyType: 'publisher' | 'advertiser';
}
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 4601 | Service port |
| `NODE_ENV` | development | Environment mode |
| `MONGODB_URI` | mongodb://localhost:27017/adbazzaar_pmp | MongoDB connection string |
| `REDIS_HOST` | localhost | Redis host |
| `REDIS_PORT` | 6379 | Redis port |
| `JWT_SECRET` | (required) | JWT signing secret |
| `JWT_EXPIRES_IN` | 24h | Token expiration |
| `INVITE_EXPIRY_DAYS` | 7 | Default invite expiry |
| `METRICS_ENABLED` | true | Enable Prometheus metrics |

## Installation

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Start in development mode
npm run dev

# Start in production mode
npm start

# Run tests
npm test
```

## Development

```bash
# Start with tsx watch (auto-reload)
npm run dev

# Run type checking
npm run typecheck

# Run linting
npm run lint
```

## Metrics

Prometheus metrics available at `/api/metrics`:

- `pmp_invite_http_requests_total` - Total HTTP requests
- `pmp_invite_http_request_duration_seconds` - Request duration histogram
- `pmp_invite_invites_total` - Total invites created by deal type
- `pmp_invite_invites_accepted_total` - Total invites accepted
- `pmp_invite_invites_declined_total` - Total invites declined
- `pmp_invite_invites_expired_total` - Total invites expired
- `pmp_invite_active_invites` - Current pending invites by deal type
- `pmp_invite_deals_total` - Total accepted deals by deal type

## Health Check

```bash
curl http://localhost:4601/api/health
```

**Response:**
```json
{
  "status": "healthy",
  "service": "pmp-invite-service",
  "version": "1.0.0",
  "timestamp": "2026-06-07T00:00:00.000Z"
}
```

## Project Structure

```
pmp-invite-service/
├── src/
│   ├── config/
│   │   └── index.ts           # Configuration
│   ├── controllers/
│   │   ├── index.ts
│   │   └── pmpInviteController.ts
│   ├── middleware/
│   │   ├── auth.ts             # JWT authentication
│   │   ├── errorHandler.ts     # Error handling
│   │   ├── metrics.ts         # Prometheus metrics
│   │   ├── validation.ts      # Zod validation
│   │   └── index.ts
│   ├── models/
│   │   ├── index.ts
│   │   └── PMPInvite.ts       # Mongoose model
│   ├── routes/
│   │   ├── index.ts
│   │   └── pmpRoutes.ts
│   ├── services/
│   │   ├── database.ts         # MongoDB & Redis
│   │   ├── pmpInviteService.ts # Business logic
│   │   └── index.ts
│   ├── types/
│   │   ├── index.ts            # Type definitions
│   │   └── schemas.ts          # Zod schemas
│   └── index.ts                # Entry point
├── tests/
│   ├── setup.ts
│   └── unit/
│       ├── pmpInviteService.test.ts
│       └── validation.test.ts
├── package.json
├── tsconfig.json
├── jest.config.js
└── README.md
```

## License

MIT