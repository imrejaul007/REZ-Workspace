# Agency Workspace Service

**Version:** 1.0.0
**Port:** 5010
**Company:** AdBazaar
**Competitors:** Trade Desk, Amazon DSP, Google Display & Video 360

## Overview

The Agency Workspace Service is AdBazaar's enterprise-grade agency management platform that provides comprehensive tools for advertising agencies to manage clients, teams, campaigns, and performance analytics.

### Key Features

- **Agency Management** - Register, configure, and manage advertising agencies
- **Client Portfolio** - Manage multiple client accounts with budget tracking
- **Team Collaboration** - Role-based access control with granular permissions
- **Campaign Templates** - Reusable campaign structures and targeting configurations
- **Performance Analytics** - Real-time metrics, ROI tracking, and reporting
- **Revenue Analytics** - Revenue forecasting, client breakdown, growth tracking
- **Dashboard** - Unified view of agency health and KPIs

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Agency Workspace Service                     │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   Agency    │  │   Client   │  │    Team     │              │
│  │  Service    │  │  Service   │  │  Service   │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  Template   │  │Performance │  │   Redis     │              │
│  │  Service    │  │  Service   │  │   Cache     │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
├─────────────────────────────────────────────────────────────────┤
│                    MongoDB (Data Store)                         │
│                    Redis (Caching)                              │
│                    Prometheus (Metrics)                         │
└─────────────────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 18+ |
| Framework | Express.js |
| Language | TypeScript |
| Database | MongoDB + Mongoose |
| Cache | Redis |
| Validation | Zod |
| Logging | Winston |
| Metrics | Prometheus (prom-client) |
| Authentication | Internal Service Token |

## Quick Start

### Installation

```bash
# Navigate to service directory
cd /Users/rejaulkarim/Documents/ReZ\ Full\ App/AdBazaar/agency-workspace-service

# Install dependencies
npm install

# Build TypeScript
npm run build

# Start in development mode
npm run dev

# Or start production
npm start
```

### Environment Variables

```bash
# Server
PORT=5010
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/agency-workspace

# Redis
REDIS_URL=redis://localhost:6379

# Security
INTERNAL_SERVICE_TOKEN=agency-workspace-secret-token

# CORS
CORS_ORIGINS=http://localhost:3000,https://adBazaar.com
```

### Health Check

```bash
curl http://localhost:5010/health
```

### Prometheus Metrics

```bash
curl http://localhost:5010/metrics
```

## API Endpoints

### Health & Metrics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/metrics` | Prometheus metrics |

### Agency Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/agencies` | Register new agency |
| GET | `/api/agencies` | List all agencies |
| GET | `/api/agencies/:id` | Get agency by ID |
| PUT | `/api/agencies/:id` | Update agency |
| DELETE | `/api/agencies/:id` | Delete agency |

### Client Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/agencies/:id/clients` | Add client to agency |
| GET | `/api/agencies/:id/clients` | List agency clients |
| GET | `/api/agencies/:id/clients/:clientId` | Get client details |
| PUT | `/api/agencies/:id/clients/:clientId` | Update client |
| DELETE | `/api/agencies/:id/clients/:clientId` | Delete client |

### Team Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/agencies/:id/teams` | Add team member |
| GET | `/api/agencies/:id/teams` | List team members |
| GET | `/api/agencies/:id/teams/:memberId` | Get team member |
| PUT | `/api/agencies/:id/teams/:memberId` | Update team member |
| DELETE | `/api/agencies/:id/teams/:memberId` | Remove team member |

### Campaign Templates

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/agencies/:id/templates` | Create template |
| GET | `/api/agencies/:id/templates` | List templates |
| GET | `/api/agencies/:id/templates/:templateId` | Get template |
| PUT | `/api/agencies/:id/templates/:templateId` | Update template |
| DELETE | `/api/agencies/:id/templates/:templateId` | Delete template |

### Analytics & Dashboard

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/agencies/:id/performance` | Performance metrics |
| GET | `/api/agencies/:id/revenue` | Revenue analytics |
| GET | `/api/agencies/:id/campaigns` | List campaigns |
| GET | `/api/agencies/:id/dashboard` | Agency dashboard |

## Authentication

All API endpoints require internal service authentication via the `X-Internal-Token` header:

```bash
curl -H "X-Internal-Token: agency-workspace-secret-token" \
     http://localhost:5010/api/agencies
```

## API Examples

### Register Agency

```bash
curl -X POST http://localhost:5010/api/agencies \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: agency-workspace-secret-token" \
  -d '{
    "name": "Acme Advertising",
    "email": "contact@acme-advertising.com",
    "industry": "retail",
    "tier": "professional",
    "settings": {
      "defaultCurrency": "INR",
      "timezone": "Asia/Kolkata"
    }
  }'
```

### Add Client

```bash
curl -X POST http://localhost:5010/api/agencies/AGENCY_ID/clients \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: agency-workspace-secret-token" \
  -d '{
    "name": "TechCorp India",
    "email": "marketing@techcorp.in",
    "company": "TechCorp India Pvt Ltd",
    "industry": "technology",
    "budget": {
      "monthly": 500000,
      "total": 6000000,
      "currency": "INR"
    }
  }'
```

### Add Team Member

```bash
curl -X POST http://localhost:5010/api/agencies/AGENCY_ID/teams \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: agency-workspace-secret-token" \
  -d '{
    "name": "John Doe",
    "email": "john.doe@acme-advertising.com",
    "role": "campaign_manager",
    "permissions": [
      "view_clients",
      "edit_clients",
      "view_campaigns",
      "edit_campaigns",
      "view_analytics"
    ],
    "department": "Media Planning"
  }'
```

### Create Campaign Template

```bash
curl -X POST http://localhost:5010/api/agencies/AGENCY_ID/templates \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: agency-workspace-secret-token" \
  -d '{
    "name": "E-commerce Awareness",
    "description": "Standard awareness campaign for e-commerce brands",
    "type": "awareness",
    "structure": {
      "objectives": ["brand_awareness", "reach"],
      "keyMetrics": ["impressions", "reach", "cpv"],
      "budgetAllocation": {
        "social": 40,
        "display": 30,
        "video": 30
      },
      "biddingStrategy": "cpm",
      "targeting": {
        "locations": ["India"],
        "demographics": {
          "ageRanges": ["25-34", "35-44"],
          "gender": ["male", "female"]
        },
        "devices": ["mobile", "desktop"]
      }
    },
    "tags": ["e-commerce", "awareness", "standard"]
  }'
```

### Get Dashboard

```bash
curl http://localhost:5010/api/agencies/AGENCY_ID/dashboard \
  -H "X-Internal-Token: agency-workspace-secret-token"
```

## Data Models

### Agency

```typescript
{
  _id: ObjectId,
  name: string,
  email: string,
  phone?: string,
  address?: {
    street: string,
    city: string,
    state: string,
    country: string,
    pincode: string
  },
  industry: string,
  tier: 'starter' | 'professional' | 'enterprise',
  status: 'active' | 'suspended' | 'inactive',
  settings: {
    defaultCurrency: string,
    timezone: string,
    dateFormat: string,
    autoReporting: boolean,
    reportingFrequency: 'daily' | 'weekly' | 'monthly'
  },
  billing: {
    billingEmail: string,
    paymentTerms: 'prepaid' | 'postpaid',
    creditLimit: number,
    currentBalance: number,
    invoicingCycle: 'monthly' | 'quarterly'
  },
  stats: {
    totalClients: number,
    activeClients: number,
    totalCampaigns: number,
    activeCampaigns: number,
    totalSpend: number,
    totalRevenue: number
  },
  apiKeys: Array<{
    key: string,
    name: string,
    permissions: string[],
    createdAt: Date,
    lastUsed?: Date
  }>,
  createdAt: Date,
  updatedAt: Date
}
```

### Client

```typescript
{
  _id: ObjectId,
  agencyId: ObjectId,
  name: string,
  email: string,
  phone?: string,
  company?: string,
  industry?: string,
  contactPerson?: {
    name: string,
    email: string,
    phone: string
  },
  budget: {
    monthly: number,
    total: number,
    currency: string
  },
  spendingLimit: number,
  totalSpend: number,
  campaigns: Array<{
    campaignId: string,
    name: string,
    status: 'draft' | 'active' | 'paused' | 'completed',
    budget: number,
    spend: number,
    startDate: Date,
    endDate?: Date
  }>,
  status: 'active' | 'paused' | 'inactive',
  tags: string[],
  createdAt: Date,
  updatedAt: Date
}
```

### Team Member

```typescript
{
  _id: ObjectId,
  agencyId: ObjectId,
  name: string,
  email: string,
  role: 'admin' | 'manager' | 'analyst' | 'campaign_manager' | 'viewer',
  permissions: Permission[],
  department?: string,
  phone?: string,
  avatar?: string,
  status: 'active' | 'inactive' | 'pending',
  lastLogin?: Date,
  activityLog: Array<{
    action: string,
    timestamp: Date,
    details?: string
  }>,
  createdAt: Date,
  updatedAt: Date
}
```

## Permissions

| Permission | Description |
|------------|-------------|
| `view_agencies` | View agency information |
| `edit_agencies` | Edit agency settings |
| `view_clients` | View client list |
| `edit_clients` | Add/edit clients |
| `delete_clients` | Delete clients |
| `view_campaigns` | View campaigns |
| `edit_campaigns` | Create/edit campaigns |
| `delete_campaigns` | Delete campaigns |
| `view_analytics` | View analytics dashboards |
| `export_data` | Export reports and data |
| `manage_team` | Manage team members |
| `manage_billing` | View/manage billing |
| `manage_templates` | Manage campaign templates |
| `manage_settings` | Modify agency settings |

## Competitor Comparison

| Feature | Trade Desk | Amazon DSP | Google DV360 | **AdBazaar** |
|---------|------------|------------|--------------|--------------|
| Agency Management | Limited | Limited | Limited | **Full Suite** |
| Client Portfolio | Basic | Basic | Basic | **Advanced** |
| Team Collaboration | No | No | Limited | **Role-based** |
| Campaign Templates | No | No | No | **Yes** |
| Performance Analytics | Yes | Yes | Yes | **Yes** |
| Revenue Analytics | No | No | No | **Yes** |
| AI Integration | No | Amazon | Google | **HOJAI AI** |
| Indian Market Focus | No | Limited | Limited | **Primary** |

## Prometheus Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `http_request_duration_seconds` | Histogram | Request latency |
| `http_requests_total` | Counter | Total requests |
| `agency_created_total` | Counter | Agencies created |
| `client_added_total` | Counter | Clients added |
| `campaign_created_total` | Counter | Campaigns created |
| `active_agencies` | Gauge | Active agencies count |
| `active_campaigns` | Gauge | Active campaigns per agency |
| `cache_hits_total` | Counter | Redis cache hits |
| `cache_misses_total` | Counter | Redis cache misses |

## Project Structure

```
agency-workspace-service/
├── package.json
├── tsconfig.json
├── README.md
└── src/
    ├── index.ts              # Main entry point
    ├── models/
    │   ├── Agency.ts         # Agency schema
    │   ├── Client.ts         # Client schema
    │   ├── TeamMember.ts     # Team member schema
    │   ├── CampaignTemplate.ts
    │   └── index.ts
    ├── services/
    │   ├── agencyService.ts
    │   ├── clientService.ts
    │   ├── teamService.ts
    │   ├── templateService.ts
    │   ├── performanceService.ts
    │   └── index.ts
    ├── middleware/
    │   ├── auth.ts           # Authentication middleware
    │   └── index.ts
    ├── routes/
    │   ├── agencyRoutes.ts   # API routes
    │   └── index.ts
    └── utils/
        ├── logger.ts         # Winston logger
        ├── metrics.ts        # Prometheus metrics
        └── helpers.ts        # Zod schemas
```

## Ecosystem Integration

The Agency Workspace Service integrates with:

| Service | Purpose |
|---------|---------|
| **HOJAI AI** | AI-powered analytics and insights |
| **RABTUL Auth** | User authentication |
| **RABTUL Wallet** | Billing and payments |
| **RABTUL Notifications** | Email/push notifications |

## Support

For issues or feature requests, contact the AdBazaar engineering team.

---

**Last Updated:** June 7, 2026
**Status:** Production Ready