# Seat Management Service

Multi-tenant platform access management service for AdBazaar.

**Port:** 4962

## Overview

The Seat Management Service provides comprehensive multi-tenant access control, seat provisioning, permission management, usage tracking, and billing for the AdBazaar platform. It enables organizations to manage team members, control access to resources, and track API usage across their platform seats.

## Features

### Seat Provisioning
- Create, update, activate, and deactivate seats
- Role-based seat types: Owner, Admin, Manager, Member, Viewer, Guest
- Organization-based seat management
- Seat invitation system with email notifications

### Permission Management
- Granular resource-based permissions
- Action-level access control (Create, Read, Update, Delete, Export, Share, Approve, Manage)
- Permission constraints (ownOnly, teamOnly, organizationWide, time restrictions, country restrictions)
- Default permissions by role
- Permission inheritance and bulk operations

### Usage Tracking
- Real-time API call tracking per seat
- Data processed monitoring
- Feature usage analytics
- Session duration tracking
- Daily, weekly, and monthly usage reports

### Billing
- Plan-based seat limits (Free, Starter, Professional, Enterprise, Custom)
- Seat utilization tracking
- Billing cycle management (Monthly, Quarterly, Annual)
- Auto-renewal support

## Tech Stack

- **Runtime:** Node.js 18+
- **Framework:** Express.js with TypeScript
- **Database:** MongoDB with Mongoose
- **Cache:** Redis
- **Logging:** Winston
- **Metrics:** Prometheus (prom-client)
- **Validation:** Zod

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB 6+
- Redis 7+

### Installation

```bash
# Navigate to service directory
cd /Users/rejaulkarim/Documents/ReZ\ Full\ App/AdBazaar/seat-management-service

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
# Set MONGODB_URI, REDIS_URL, and INTERNAL_SERVICE_TOKEN
```

### Development

```bash
# Start in development mode with hot reload
npm run dev

# Or start with ts-node directly
npx ts-node-dev --respawn --transpile-only src/index.ts
```

### Production

```bash
# Build the project
npm run build

# Start production server
npm start
```

## API Endpoints

### Health & Metrics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/metrics` | Prometheus metrics |

### Seat Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/seats` | Create a new seat |
| GET | `/api/seats/:id` | Get seat by ID |
| GET | `/api/seats` | List seats (with filters) |
| PUT | `/api/seats/:id` | Update seat |
| POST | `/api/seats/:id/activate` | Activate seat |
| POST | `/api/seats/:id/deactivate` | Deactivate seat |
| GET | `/api/seats/:id/usage` | Get seat usage analytics |
| POST | `/api/seats/:id/invite` | Invite user to seat |
| GET | `/api/seats/:id/team` | Get team members |

### Permissions

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/seats/:id/permissions` | Set permissions for seat |
| GET | `/api/seats/:id/permissions` | Get permissions for seat |

### Organization

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/organizations` | Create organization |
| GET | `/api/organizations/:id` | Get organization |
| PUT | `/api/organizations/:id` | Update organization |
| GET | `/api/organization/:id/seats` | Get organization seat overview |
| GET | `/api/organization/:id/billing` | Get organization billing info |
| PUT | `/api/organizations/:id/billing` | Update billing |
| POST | `/api/organizations/:id/seats` | Add seats to organization |

### Invitations

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/invitations/accept` | Accept invitation |
| POST | `/api/invitations/:id/resend` | Resend invitation |
| DELETE | `/api/invitations/:id` | Cancel invitation |
| GET | `/api/organizations/:id/invitations` | Get pending invitations |

### Usage

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/usage/record` | Record usage |
| GET | `/api/organizations/:id/usage` | Get organization usage summary |
| GET | `/api/organizations/:id/usage/seats` | Get seat usage breakdown |

## API Examples

### Create Organization

```bash
curl -X POST http://localhost:4962/api/organizations \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: your-secure-token-here-min-32-chars" \
  -d '{
    "name": "Acme Corp",
    "slug": "acme-corp",
    "ownerId": "user-123",
    "plan": "professional"
  }'
```

### Create Seat

```bash
curl -X POST http://localhost:4962/api/seats \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: your-secure-token-here-min-32-chars" \
  -d '{
    "userId": "user-456",
    "organizationId": "org-123",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "member"
  }'
```

### Set Permissions

```bash
curl -X POST http://localhost:4962/api/seats/seat-123/permissions \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: your-secure-token-here-min-32-chars" \
  -d '{
    "organizationId": "org-123",
    "resource": "campaigns",
    "actions": ["create", "read", "update"],
    "constraints": {
      "ownOnly": true,
      "maxBudget": 10000
    }
  }'
```

### Record Usage

```bash
curl -X POST http://localhost:4962/api/usage/record \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: your-secure-token-here-min-32-chars" \
  -d '{
    "seatId": "seat-123",
    "apiCalls": 5,
    "dataProcessed": 1024,
    "feature": "campaign_builder"
  }'
```

## Seat Roles

| Role | Description | Permissions |
|------|-------------|-------------|
| Owner | Full access to organization | All permissions |
| Admin | Administrative access | Manage users, billing, settings |
| Manager | Team management | Create/manage campaigns |
| Member | Standard user | Basic access to resources |
| Viewer | Read-only access | View-only permissions |
| Guest | Limited access | Basic dashboard and campaign view |

## Permission Resources

- `dashboard` - Dashboard access
- `campaigns` - Campaign management
- `analytics` - Analytics and reports
- `audiences` - Audience management
- `creatives` - Creative assets
- `campaign_builder` - Campaign builder tool
- `reports` - Report generation
- `assets` - Asset management
- `teams` - Team management
- `billing` - Billing and payments
- `settings` - Organization settings
- `integrations` - Third-party integrations
- `api` - API access
- `dooh` - DOOH features
- `ssp` - SSP features
- `dsp` - DSP features

## Plans & Limits

| Plan | Seats | Price/Seat | Features |
|------|-------|------------|----------|
| Free | 1 | $0 | Basic features |
| Starter | 5 | $29/mo | Essential features |
| Professional | 25 | $49/mo | Full features |
| Enterprise | 100 | $79/mo | Advanced features + support |
| Custom | Unlimited | Custom | Tailored solution |

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Service port | 4962 |
| `NODE_ENV` | Environment | development |
| `MONGODB_URI` | MongoDB connection string | mongodb://localhost:27017/seat-management |
| `REDIS_URL` | Redis connection string | redis://localhost:6379 |
| `LOG_LEVEL` | Logging level | info |
| `INTERNAL_SERVICE_TOKEN` | Service authentication token | - |

## Prometheus Metrics

Available at `/metrics`:

- `seat_management_http_requests_total` - Total HTTP requests
- `seat_management_http_request_duration_seconds` - Request duration histogram
- `seat_management_active_seats` - Active seats gauge
- `seat_management_total_seats` - Total seats gauge
- `seat_management_seat_utilization_percent` - Seat utilization histogram
- `seat_management_api_calls_total` - API calls counter
- `seat_management_data_processed_bytes` - Data processed counter
- `seat_management_invitations_sent_total` - Invitations counter
- `seat_management_permission_changes_total` - Permission changes counter

## Error Handling

All API errors follow a consistent format:

```json
{
  "success": false,
  "error": "Error Type",
  "message": "Detailed error message"
}
```

## Health Check

```bash
curl http://localhost:4962/health
```

Response:

```json
{
  "status": "healthy",
  "service": "seat-management-service",
  "version": "1.0.0",
  "port": 4962,
  "timestamp": "2026-06-07T12:00:00.000Z",
  "dependencies": {
    "mongodb": "connected",
    "redis": "connected"
  }
}
```

## Project Structure

```
seat-management-service/
├── src/
│   ├── index.ts              # Main entry point
│   ├── models/                # Mongoose schemas
│   │   ├── seat.model.ts      # Seat schema
│   │   ├── organization.model.ts # Organization schema
│   │   ├── permission.model.ts   # Permission schema
│   │   ├── seat-usage.model.ts   # Usage tracking schema
│   │   └── index.ts
│   ├── services/             # Business logic
│   │   ├── seat.service.ts
│   │   ├── permission.service.ts
│   │   ├── organization.service.ts
│   │   ├── usage.service.ts
│   │   ├── invite.service.ts
│   │   └── index.ts
│   ├── middleware/            # Express middleware
│   │   ├── auth.ts
│   │   └── index.ts
│   ├── routes/               # API routes
│   │   └── index.ts
│   └── utils/                # Utilities
│       ├── logger.ts         # Winston logger
│       ├── metrics.ts        # Prometheus metrics
│       ├── validation.ts     # Zod schemas
│       └── index.ts
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

## License

Internal AdBazaar Service