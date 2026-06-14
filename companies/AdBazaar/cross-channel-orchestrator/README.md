# Cross-Channel Orchestrator

**Port:** 4812

Unified DSP (Demand-Side Platform) for orchestrating campaigns across all communication channels - WhatsApp, SMS, Email, and Push notifications - from a single platform.

## Features

- **Multi-Channel Campaign Management**: Create and manage campaigns across WhatsApp, SMS, Email, and Push channels
- **Unified Budget Allocation**: Allocate and track budget across channels
- **A/B Testing**: Test different content variants across channels
- **Advanced Targeting**: Target audiences by segments, custom audiences, and demographics
- **Performance Analytics**: Real-time metrics for delivery, open, click, and conversion rates
- **Channel Health Monitoring**: Monitor the health and status of all connected channels
- **Scheduled Campaigns**: Schedule campaigns to launch at optimal times
- **Prometheus Metrics**: Built-in metrics endpoint for monitoring

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  Cross-Channel Orchestrator                  │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Campaign    │  │  Channel     │  │   Metrics    │      │
│  │  Service     │  │  Dispatcher  │  │   Service    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                   API Layer (Express)                 │  │
│  │  POST /api/campaigns  GET /api/campaigns/:id        │  │
│  │  PUT /api/campaigns/:id  POST /api/campaigns/:id/*  │  │
│  │  GET /api/channels  GET /api/channels/:channel       │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│   WhatsApp    │   │     SMS       │   │    Email      │
│   Service     │   │    Service    │   │   Service     │
│   (4071)      │   │    (4072)     │   │   (4073)      │
└───────────────┘   └───────────────┘   └───────────────┘
```

## API Endpoints

### Campaigns

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/campaigns` | Create cross-channel campaign |
| GET | `/api/campaigns` | List all campaigns |
| GET | `/api/campaigns/:id` | Get campaign details |
| PUT | `/api/campaigns/:id` | Update campaign |
| DELETE | `/api/campaigns/:id` | Delete draft campaign |
| POST | `/api/campaigns/:id/launch` | Launch campaign |
| POST | `/api/campaigns/:id/pause` | Pause active campaign |
| POST | `/api/campaigns/:id/resume` | Resume paused campaign |
| GET | `/api/campaigns/:id/stats` | Get campaign statistics |

### Channels

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/channels` | List all available channels |
| GET | `/api/channels/:channel` | Get channel details and status |
| GET | `/api/channels/:channel/health` | Get channel health |
| GET | `/api/channels/status` | Get all channels status |

### Health & Metrics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Basic health check |
| GET | `/health/detailed` | Detailed health with dependencies |
| GET | `/health/live` | Liveness probe |
| GET | `/health/ready` | Readiness probe |
| GET | `/metrics` | Prometheus metrics |
| GET | `/metrics/values` | Get metrics as JSON |

## Campaign Schema

```typescript
interface CrossChannelCampaign {
  campaignId: string;
  advertiserId: string;
  name: string;
  objective: 'awareness' | 'engagement' | 'conversion' | 'retention';
  channels: ('whatsapp' | 'sms' | 'email' | 'push')[];
  budget: {
    total: number;
    byChannel: Record<string, number>;
    spent: number;
  };
  targeting: {
    audienceIds: string[];
    segments: string[];
    customAudience?: object;
  };
  content: {
    whatsapp?: WhatsAppContent;
    sms?: SMSContent;
    email?: EmailContent;
    push?: PushContent;
  };
  scheduling: {
    startDate: Date;
    endDate: Date;
    frequency: 'once' | 'daily' | 'weekly';
    optimalTime?: string;
  };
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed';
  metrics: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    converted: number;
    revenue: number;
  };
}
```

## Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
nano .env

# Start in development mode
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Environment Variables

```env
# Application
PORT=4812
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/cross-channel-orchestrator

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-jwt-secret

# Channel Services
WHATSAPP_SERVICE_URL=http://localhost:4071
SMS_SERVICE_URL=http://localhost:4072
EMAIL_SERVICE_URL=http://localhost:4073
PUSH_SERVICE_URL=http://localhost:4074

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Authentication

All API endpoints (except health and metrics) require JWT authentication.

Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

JWT payload structure:
```typescript
interface JWTPayload {
  userId: string;
  advertiserId: string;
  role: 'admin' | 'advertiser' | 'viewer';
  permissions: string[];
}
```

## Example Usage

### Create a Campaign

```bash
curl -X POST http://localhost:4812/api/campaigns \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "Summer Sale Campaign",
    "objective": "conversion",
    "channels": ["whatsapp", "email"],
    "budget": {
      "total": 50000,
      "byChannel": {
        "whatsapp": 30000,
        "email": 20000
      }
    },
    "targeting": {
      "segments": ["high-value-customers"],
      "customAudience": {
        "demographics": {
          "ageRange": { "min": 25, "max": 45 },
          "location": ["Mumbai", "Delhi"]
        }
      }
    },
    "content": {
      "whatsapp": {
        "template": "summer_sale_template",
        "variables": { "discount": "30%" }
      },
      "email": {
        "subject": "Summer Sale - Get 30% Off!",
        "body": "<h1>Summer Sale</h1><p>Use code SUMMER30 for 30% off</p>"
      }
    },
    "scheduling": {
      "startDate": "2026-06-15T00:00:00Z",
      "endDate": "2026-06-30T23:59:59Z",
      "frequency": "once",
      "optimalTime": "10:00"
    }
  }'
```

### Launch Campaign

```bash
curl -X POST http://localhost:4812/api/campaigns/CCO-1234567890/launch \
  -H "Authorization: Bearer <token>"
```

### Get Campaign Stats

```bash
curl http://localhost:4812/api/campaigns/CCO-1234567890/stats \
  -H "Authorization: Bearer <token>"
```

### List Channels

```bash
curl http://localhost:4812/api/channels \
  -H "Authorization: Bearer <token>"
```

## Testing

```bash
# Run tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## Development

```bash
# Start with hot reload
npm run dev

# Debug mode
npm run dev:debug

# Type checking
npm run typecheck

# Linting
npm run lint
npm run lint:fix
```

## Docker

```bash
# Build image
npm run docker:build

# Build production image
npm run docker:build:prod

# Run container
npm run docker:run
```

## Health Checks

```bash
# Basic health
curl http://localhost:4812/health

# Detailed health
curl http://localhost:4812/health/detailed

# Liveness probe
curl http://localhost:4812/health/live

# Readiness probe
curl http://localhost:4812/health/ready
```

## Metrics

```bash
# Prometheus format
curl http://localhost:4812/metrics

# JSON format
curl http://localhost:4812/metrics/values
```

## Campaign Status Flow

```
┌─────────┐
│  DRAFT  │ ◄──────────────────────────┐
└────┬────┘                            │
     │                                 │
     ├────► ┌───────────┐              │
     │      │ SCHEDULED │              │
     │      └─────┬─────┘              │
     │            │                   │
     └───────────►│<──────────────────┘
                  │
                  ▼
            ┌─────────┐
            │ ACTIVE  │──────────┐
            └────┬────┘          │
                 │              │
        ┌────────┴────────┐     │
        ▼                 ▼     │
   ┌─────────┐      ┌───────────┐ │
   │ PAUSED  │─────►│ COMPLETED│◄┘
   └─────────┘      └───────────┘
```

## Channel Cost Matrix

| Channel | Cost per Message | Rate Limit | Daily Limit |
|---------|-----------------|------------|-------------|
| WhatsApp | ₹0.05 | 100/s | 100,000 |
| SMS | ₹0.15 | 200/s | 500,000 |
| Email | ₹0.01 | 50/s | 50,000 |
| Push | ₹0.02 | 500/s | 1,000,000 |

## License

MIT