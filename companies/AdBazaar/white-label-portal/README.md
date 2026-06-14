# White Label Portal

**Port:** 5012  
**Company:** AdBazaar  
**Description:** Customizable agency branding for white label advertising portals

## Overview

The White Label Portal enables AdBazaar agencies to create fully branded advertising platforms with custom domains, colors, logos, and analytics. Each agency can manage multiple client portals with complete white-label capabilities.

## Features

- **Portal Management** - Create and manage multiple white label portals
- **Custom Branding** - Full customization of colors, fonts, logos, and favicons
- **Custom Domains** - Connect your own domain with automatic SSL provisioning
- **Analytics Dashboard** - Real-time performance metrics and insights
- **Custom Reports** - Generate and schedule branded reports
- **Client Management** - Manage multiple clients under each portal

## Tech Stack

- **Runtime:** Node.js 18+
- **Framework:** Express.js with TypeScript
- **Database:** MongoDB with Mongoose
- **Cache:** Redis
- **Logging:** Winston
- **Metrics:** Prometheus (prom-client)
- **Validation:** Zod

## Quick Start

```bash
# Install dependencies
npm install

# Start in development mode
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Environment Variables

```env
# Server
PORT=5012
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/white-label-portal

# Redis
REDIS_URL=redis://localhost:6379

# Security
INTERNAL_SERVICE_TOKEN=your-service-token

# CORS
CORS_ORIGIN=*
```

## API Endpoints

### Health & Monitoring

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/metrics` | Prometheus metrics |

### Portal Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/portals` | Create portal |
| GET | `/api/portals` | List portals |
| GET | `/api/portals/:id` | Get portal |
| PUT | `/api/portals/:id` | Update portal |
| DELETE | `/api/portals/:id` | Delete (suspend) portal |

### Branding

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/portals/:id/branding` | Set branding |
| GET | `/api/portals/:id/branding` | Get branding |

### Domain

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/portals/:id/domain` | Set custom domain |

### Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/portals/:id/analytics` | Get portal analytics |
| GET | `/api/portals/:id/clients` | Get portal clients |
| GET | `/api/portals/:id/reports` | Get reports |
| POST | `/api/portals/:id/reports` | Create report |

## Authentication

All API requests require the following headers:

```
X-Internal-Service-Token: <token>
X-Agency-Id: <agency-id>
```

## Request/Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error type",
  "message": "Error description"
}
```

## Data Models

### WhiteLabelPortal
```typescript
{
  agencyId: string;
  name: string;
  slug: string;
  domain?: string;
  status: 'active' | 'inactive' | 'suspended';
  settings: {
    allowCustomDomain: boolean;
    allowSubdomains: boolean;
    maxClients: number;
    maxCampaigns: number;
    features: {
      analytics: boolean;
      reporting: boolean;
      whiteLabelReports: boolean;
      customBranding: boolean;
      apiAccess: boolean;
    };
    limits: { impressions, clicks, campaigns };
  };
  stats: {
    totalClients: number;
    activeCampaigns: number;
    totalImpressions: number;
    totalClicks: number;
  };
}
```

### Branding
```typescript
{
  portalId: string;
  logo: { url, alt, width, height };
  favicon: { url, type };
  colors: { primary, secondary, accent, background, text, success, warning, error };
  fonts: { primary, secondary, code };
  customCSS?: string;
  emailTemplate: { headerLogo, footerText, socialLinks };
}
```

### CustomDomain
```typescript
{
  portalId: string;
  domain: string;
  subdomain?: string;
  verification: { method, token, verifiedAt };
  ssl: { enabled, certificateId, issuedAt, expiresAt, autoRenew };
  status: 'pending' | 'verifying' | 'active' | 'expired' | 'failed';
}
```

### PortalAnalytics
```typescript
{
  portalId: string;
  date: Date;
  metrics: {
    impressions, clicks, conversions, spend, revenue,
    ctr, cpc, cpm, roas
  };
  clientMetrics: Array<{ clientId, impressions, clicks, conversions, spend, revenue }>;
  campaigns: Array<{ campaignId, name, impressions, clicks, conversions, spend }>;
  topLocations: Array<{ country, region?, city?, impressions, clicks }>;
  topDevices: Array<{ type, impressions, clicks }>;
}
```

## Metrics

Prometheus metrics available at `/metrics`:

- `white_label_portal_http_requests_total` - HTTP request counter
- `white_label_portal_http_request_duration_seconds` - Request duration histogram
- `white_label_portal_total` - Total portals by status
- `white_label_portal_clients_total` - Total clients
- `white_label_portal_custom_domains_total` - Custom domains by status
- `white_label_portal_analytics_*` - Analytics counters

## Project Structure

```
white-label-portal/
├── src/
│   ├── index.ts           # Main entry point
│   ├── models/            # Mongoose schemas
│   │   ├── WhiteLabelPortal.ts
│   │   ├── Branding.ts
│   │   ├── CustomDomain.ts
│   │   └── PortalAnalytics.ts
│   ├── services/          # Business logic
│   │   ├── portalService.ts
│   │   ├── brandingService.ts
│   │   ├── domainService.ts
│   │   ├── analyticsService.ts
│   │   └── reportService.ts
│   ├── middleware/       # Express middleware
│   │   └── auth.ts
│   ├── routes/           # API routes
│   │   └── portalRoutes.ts
│   └── utils/            # Utilities
│       ├── logger.ts
│       └── metrics.ts
├── package.json
├── tsconfig.json
└── README.md
```

## Example Usage

### Create a Portal

```bash
curl -X POST http://localhost:5012/api/portals \
  -H "Content-Type: application/json" \
  -H "X-Internal-Service-Token: your-token" \
  -H "X-Agency-Id: agency-123" \
  -d '{
    "agencyId": "agency-123",
    "name": "My Agency Portal",
    "slug": "my-agency",
    "domain": "ads.myagency.com"
  }'
```

### Set Branding

```bash
curl -X POST http://localhost:5012/api/portals/:id/branding \
  -H "Content-Type: application/json" \
  -H "X-Internal-Service-Token: your-token" \
  -H "X-Agency-Id: agency-123" \
  -d '{
    "logo": { "url": "https://myagency.com/logo.png" },
    "favicon": { "url": "https://myagency.com/favicon.ico" },
    "colors": {
      "primary": "#1e40af",
      "secondary": "#64748b",
      "accent": "#7c3aed"
    }
  }'
```

### Get Analytics

```bash
curl http://localhost:5012/api/portals/:id/analytics?days=30 \
  -H "X-Internal-Service-Token: your-token" \
  -H "X-Agency-Id: agency-123"
```

## License

Internal - AdBazaar