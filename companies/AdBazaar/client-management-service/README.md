# Client Management Service

**Port:** 5011 | **Company:** AdBazaar | **Part of:** Agency OS

Complete client management service for AdBazaar's Agency OS platform. Manages client profiles, contacts, campaigns, spend analytics, and performance tracking.

---

## Overview

The Client Management Service provides a comprehensive solution for managing advertising agency clients. It enables agencies to:

- **Client Profiles:** Create and manage detailed client profiles with industry classification, budget tracking, and metadata
- **Contact Management:** Maintain multiple contacts per client with primary contact designation
- **Campaign Linking:** Link advertising campaigns to clients and track performance
- **Spend Analytics:** Analyze spending patterns, budget utilization, and ROI
- **Performance Tracking:** Monitor impressions, clicks, conversions, CTR, CPC, and ROAS
- **Notes & Collaboration:** Add notes, meeting summaries, and strategy documents

---

## Tech Stack

- **Runtime:** Node.js 18+
- **Framework:** Express.js with TypeScript
- **Database:** MongoDB with Mongoose ODM
- **Cache:** Redis with ioredis
- **Logging:** Winston with file rotation
- **Metrics:** Prometheus client (prom-client)
- **Validation:** Zod schemas

---

## Quick Start

### Installation

```bash
cd /Users/rejaulkarim/Documents/ReZ\ Full\ App/AdBazaar/client-management-service
npm install
```

### Development

```bash
npm run dev
```

### Production

```bash
npm run build
npm start
```

### Health Check

```bash
curl http://localhost:5011/health
```

### Metrics

```bash
curl http://localhost:5011/metrics
```

---

## API Endpoints

### Client Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/clients` | Create new client |
| GET | `/api/clients` | List all clients (paginated) |
| GET | `/api/clients/stats` | Get client statistics |
| GET | `/api/clients/:id` | Get client by ID |
| PUT | `/api/clients/:id` | Update client |
| DELETE | `/api/clients/:id` | Delete client |
| GET | `/api/clients/:id/dashboard` | Get client dashboard |

### Contact Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/clients/:id/contacts` | Add contact to client |
| GET | `/api/clients/:id/contacts` | List client contacts |
| GET | `/api/clients/:id/contacts/:contactId` | Get specific contact |
| PUT | `/api/clients/:id/contacts/:contactId` | Update contact |
| DELETE | `/api/clients/:id/contacts/:contactId` | Delete contact |

### Campaign Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/clients/:id/campaigns` | Link campaign to client |
| GET | `/api/clients/:id/campaigns` | List client campaigns |
| GET | `/api/clients/:id/campaigns/:campaignId` | Get specific campaign |
| PUT | `/api/clients/:id/campaigns/:campaignId` | Update campaign |

### Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/clients/:id/spend` | Get spend analytics |
| GET | `/api/clients/:id/performance` | Get performance analytics |
| GET | `/api/clients/:id/budget` | Get budget utilization |
| GET | `/api/clients/:id/roi` | Get ROI analysis |

### Notes

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/clients/:id/notes` | Add note to client |
| GET | `/api/clients/:id/notes` | List client notes |
| GET | `/api/clients/:id/notes/:noteId` | Get specific note |
| PUT | `/api/clients/:id/notes/:noteId` | Update note |
| DELETE | `/api/clients/:id/notes/:noteId` | Delete note |

---

## API Examples

### Create Client

```bash
curl -X POST http://localhost:5011/api/clients \
  -H "Content-Type: application/json" \
  -H "X-Internal-Service-Token: dev-internal-token" \
  -H "X-Agency-Id: agency_123" \
  -d '{
    "name": "Acme Corporation",
    "industry": "Technology",
    "budget": {
      "monthly": 50000,
      "quarterly": 150000,
      "yearly": 600000,
      "currency": "INR"
    },
    "metadata": {
      "website": "https://acme.com",
      "address": {
        "city": "Mumbai",
        "state": "Maharashtra",
        "country": "India"
      }
    },
    "tags": ["enterprise", "tech", "premium"]
  }'
```

### Add Contact

```bash
curl -X POST http://localhost:5011/api/clients/client_abc123/contacts \
  -H "Content-Type: application/json" \
  -H "X-Internal-Service-Token: dev-internal-token" \
  -H "X-Agency-Id: agency_123" \
  -d '{
    "name": "John Smith",
    "email": "john.smith@acme.com",
    "phone": "+91-9876543210",
    "role": "Marketing Director",
    "department": "Marketing",
    "isPrimary": true,
    "metadata": {
      "linkedin": "https://linkedin.com/in/johnsmith",
      "timezone": "Asia/Kolkata"
    }
  }'
```

### Link Campaign

```bash
curl -X POST http://localhost:5011/api/clients/client_abc123/campaigns \
  -H "Content-Type: application/json" \
  -H "X-Internal-Service-Token: dev-internal-token" \
  -H "X-Agency-Id: agency_123" \
  -d '{
    "campaignId": "camp_xyz789",
    "name": "Summer Sale 2026",
    "budget": 100000,
    "startDate": "2026-06-01T00:00:00Z",
    "endDate": "2026-08-31T23:59:59Z"
  }'
```

### Get Spend Analytics

```bash
curl "http://localhost:5011/api/clients/client_abc123/spend?period=monthly" \
  -H "X-Internal-Service-Token: dev-internal-token" \
  -H "X-Agency-Id: agency_123"
```

### Add Note

```bash
curl -X POST http://localhost:5011/api/clients/client_abc123/notes \
  -H "Content-Type: application/json" \
  -H "X-Internal-Service-Token: dev-internal-token" \
  -H "X-Agency-Id: agency_123" \
  -H "X-User-Id: user_456" \
  -H "X-User-Name: Jane Doe" \
  -H "X-User-Role: account-manager" \
  -d '{
    "content": "Discussed Q3 campaign strategy. Client wants to focus on DOOH screens in metro cities.",
    "type": "strategy",
    "isPinned": true,
    "tags": ["strategy", "q3", "dooh"],
    "mentions": ["user_789"]
  }'
```

### Get Client Dashboard

```bash
curl http://localhost:5011/api/clients/client_abc123/dashboard \
  -H "X-Internal-Service-Token: dev-internal-token" \
  -H "X-Agency-Id: agency_123"
```

---

## Features

### Client Profiles

- **Status Tracking:** active, inactive, prospect, churned
- **Industry Classification:** Segment clients by industry vertical
- **Budget Management:** Monthly, quarterly, and yearly budget tracking
- **Spending Analytics:** Track total, current month, last month, and YTD spending
- **Performance Metrics:** Impressions, clicks, conversions, CTR, CPC, ROAS
- **Custom Metadata:** Website, address, social profiles
- **Tagging:** Organize clients with custom tags

### Contact Management

- **Multiple Contacts:** Support unlimited contacts per client
- **Primary Contact:** Designate one contact as primary
- **Department & Role:** Track organizational hierarchy
- **Activity Tracking:** Active/inactive status
- **Metadata:** Birthday, LinkedIn, timezone, preferences

### Campaign Linking

- **Budget Allocation:** Track allocated vs spent budget per campaign
- **Performance Tracking:** Real-time metrics updates
- **Date Management:** Start and end dates with status tracking
- **Targeting Data:** Demographics, locations, interests

### Spend Analytics

- **Period Analysis:** Daily, weekly, monthly, quarterly, yearly
- **Channel Breakdown:** Spend by advertising channel
- **Campaign Breakdown:** Spend by individual campaign
- **Projections:** End-of-period spend forecasting
- **Benchmarks:** Industry comparison and percentile ranking

### Performance Analytics

- **Aggregate Metrics:** Total impressions, clicks, conversions
- **Per-Campaign Analysis:** Individual campaign performance
- **Trend Analysis:** Increasing, stable, decreasing patterns
- **ROI Calculation:** Return on investment by campaign

### Notes & Collaboration

- **Note Types:** General, meeting, strategy, issue, update
- **Pinning:** Pin important notes to top
- **Attachments:** Support file attachments
- **Mentions:** Tag team members in notes
- **Tags:** Organize notes with custom tags

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 5011 | Service port |
| NODE_ENV | development | Environment mode |
| MONGODB_URI | mongodb://localhost:27017/adbazaar-clients | MongoDB connection string |
| MONGODB_POOL_SIZE | 10 | Connection pool size |
| REDIS_URL | redis://localhost:6379 | Redis connection URL |
| INTERNAL_SERVICE_TOKEN | dev-internal-token | Internal service authentication |
| CORS_ORIGIN | * | CORS allowed origins |
| LOG_LEVEL | info | Logging level |

---

## Response Format

All API responses follow this format:

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": { ... }
  }
}
```

---

## Database Models

### Client

```typescript
{
  clientId: string;          // Unique client identifier
  name: string;              // Client name
  industry: string;          // Industry vertical
  agencyId: string;          // Agency identifier
  status: string;            // active|inactive|prospect|churned
  budget: {
    monthly: number;
    quarterly: number;
    yearly: number;
    currency: string;
  };
  spending: {
    total: number;
    currentMonth: number;
    lastMonth: number;
    ytd: number;
  };
  performance: {
    totalImpressions: number;
    totalClicks: number;
    totalConversions: number;
    avgCTR: number;
    avgCPC: number;
    avgROAS: number;
  };
}
```

### Contact

```typescript
{
  contactId: string;
  clientId: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  department?: string;
  isPrimary: boolean;
  isActive: boolean;
}
```

### ClientCampaign

```typescript
{
  campaignId: string;
  clientId: string;
  name: string;
  status: string;           // active|paused|completed|draft|archived
  budget: {
    allocated: number;
    spent: number;
    remaining: number;
  };
  dates: {
    start: Date;
    end?: Date;
  };
  performance: {
    impressions: number;
    clicks: number;
    conversions: number;
    ctr: number;
    cpc: number;
    roas: number;
  };
}
```

---

## Prometheus Metrics

| Metric | Type | Description |
|--------|------|-------------|
| http_request_duration_seconds | Histogram | HTTP request latency |
| http_requests_total | Counter | Total HTTP requests |
| client_operations_total | Counter | Client CRUD operations |
| contact_operations_total | Counter | Contact CRUD operations |
| campaign_operations_total | Counter | Campaign operations |
| db_operation_duration_seconds | Histogram | Database operation latency |
| cache_hits_total | Counter | Redis cache hits |
| cache_misses_total | Counter | Redis cache misses |
| active_clients_total | Gauge | Active client count |
| total_client_budget | Gauge | Total client budgets |
| total_client_spend | Gauge | Total client spend |
| average_roas | Gauge | Average ROAS |
| errors_total | Counter | Error count |

---

## Project Structure

```
client-management-service/
├── package.json
├── tsconfig.json
├── README.md
└── src/
    ├── index.ts              # Main entry point
    ├── config/
    │   └── index.ts          # Environment configuration
    ├── models/
    │   ├── client.model.ts   # Client schema
    │   ├── contact.model.ts  # Contact schema
    │   ├── campaign.model.ts # Campaign schema
    │   ├── note.model.ts     # Note schema
    │   ├── spend-analytics.model.ts # Analytics schema
    │   └── index.ts          # Model exports
    ├── services/
    │   ├── client.service.ts     # Client business logic
    │   ├── contact.service.ts    # Contact business logic
    │   ├── campaign-link.service.ts # Campaign linking
    │   ├── analytics.service.ts  # Analytics calculations
    │   ├── note.service.ts       # Note management
    │   └── index.ts              # Service exports
    ├── middleware/
    │   └── auth.ts           # Auth & validation middleware
    ├── routes/
    │   ├── client.routes.ts  # API route handlers
    │   └── index.ts          # Route exports
    ├── utils/
    │   ├── logger.ts         # Winston logger
    │   ├── metrics.ts        # Prometheus metrics
    │   ├── redis.ts          # Redis client & cache utilities
    │   └── index.ts          # Utility exports
    └── types/
        └── index.ts          # TypeScript interfaces & Zod schemas
```

---

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

---

## Related Services

| Service | Port | Purpose |
|---------|------|---------|
| adBazaar-backend | 4000 | Main advertising backend |
| creator-qr-service | 3005 | Creator QR management |
| adsqr-service | 4068 | QR ad campaigns |
| rez-shelf-qr | 3031 | Retail shelf QR |

---

**Version:** 1.0.0
**Last Updated:** June 2026
**Company:** AdBazaar