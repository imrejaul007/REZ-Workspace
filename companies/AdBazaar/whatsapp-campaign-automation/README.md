# WhatsApp Campaign Automation Service

AI-powered WhatsApp campaign automation service for targeted messaging.

**Port:** 4861

## Features

- Campaign creation and management
- Multiple template types (promotional, transactional, reengagement, welcome)
- Audience segmentation and targeting
- Scheduled and automated sending
- Real-time metrics and analytics
- WhatsApp webhook integration
- Redis-based message tracking

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## Environment Variables

```env
PORT=4861
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/whatsapp_campaigns
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-jwt-secret
WHATSAPP_API_URL=https://graph.facebook.com/v18.0
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
WHATSAPP_ACCESS_TOKEN=your-access-token
WHATSAPP_VERIFY_TOKEN=your-verify-token
ALLOWED_ORIGINS=https://rez.money,https://admin.rez.money
```

## API Endpoints

### Campaigns

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/whatsapp/campaign` | Create campaign |
| GET | `/api/whatsapp/campaigns` | List campaigns |
| GET | `/api/whatsapp/campaigns/:id` | Get campaign |
| PATCH | `/api/whatsapp/campaigns/:id` | Update campaign |
| DELETE | `/api/whatsapp/campaigns/:id` | Delete campaign |
| POST | `/api/whatsapp/campaigns/:id/send` | Send campaign |
| POST | `/api/whatsapp/campaigns/:id/pause` | Pause campaign |
| POST | `/api/whatsapp/campaigns/:id/resume` | Resume campaign |
| GET | `/api/whatsapp/campaigns/:id/stats` | Get stats |

### Webhook

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/whatsapp/webhook` | WhatsApp webhook |
| GET | `/api/whatsapp/webhook` | Webhook verification |

### Health & Metrics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/ready` | Readiness check |
| GET | `/metrics` | Prometheus metrics |

## Campaign Schema

```typescript
interface WhatsAppCampaign {
  campaignId: string;
  merchantId: string;
  name: string;
  template: {
    type: 'promotional' | 'transactional' | 'reengagement' | 'welcome';
    header?: string;
    body: string;
    footer?: string;
    buttons?: { text: string; action: string }[];
    mediaUrl?: string;
  };
  audience: {
    type: 'all_customers' | 'segment' | 'custom';
    segmentId?: string;
    userIds?: string[];
    filters?: { lastPurchaseDays?: number; cartAbandoners?: boolean };
  };
  scheduling: {
    type: 'immediate' | 'scheduled' | 'automated';
    scheduledTime?: Date;
    optimalTimeEnabled: boolean;
  };
  metrics: {
    sent: number;
    delivered: number;
    read: number;
    clicked: number;
    responded: number;
    optOut: number;
  };
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'paused';
  createdAt: Date;
}
```

## Authentication

All API endpoints require JWT Bearer token authentication:

```
Authorization: Bearer <token>
```

JWT payload:
```json
{
  "userId": "user-123",
  "merchantId": "merchant-456",
  "role": "admin"
}
```

## Example Usage

### Create Campaign

```bash
curl -X POST http://localhost:4861/api/whatsapp/campaign \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "Summer Sale",
    "merchantId": "merchant-123",
    "template": {
      "type": "promotional",
      "header": "Summer Sale!",
      "body": "Get 50% off with code SUMMER50",
      "footer": "Valid till June 30"
    },
    "audience": {
      "type": "segment",
      "segmentId": "summer-shoppers"
    },
    "scheduling": {
      "type": "scheduled",
      "scheduledTime": "2024-06-15T10:00:00Z",
      "optimalTimeEnabled": true
    }
  }'
```

### Get Campaign Stats

```bash
curl http://localhost:4861/api/whatsapp/campaigns/wa-abc123/stats \
  -H "Authorization: Bearer <token>"
```

### Send Campaign

```bash
curl -X POST http://localhost:4861/api/whatsapp/campaigns/wa-abc123/send \
  -H "Authorization: Bearer <token>"
```

## Tech Stack

- Express.js - Web framework
- MongoDB - Primary database
- Redis - Caching and real-time metrics
- Zod - Schema validation
- JWT - Authentication
- Prometheus - Metrics
- TypeScript - Type safety

## Project Structure

```
whatsapp-campaign-automation/
├── src/
│   ├── config/          # Configuration
│   ├── middleware/       # Express middleware
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── types/           # TypeScript types
│   ├── utils/           # Utilities
│   ├── validators/      # Zod schemas
│   └── index.ts         # Entry point
├── tests/               # Unit tests
├── package.json
├── tsconfig.json
└── jest.config.js
```

## Health Checks

```bash
# Health check
curl http://localhost:4861/health

# Readiness check
curl http://localhost:4861/ready

# Prometheus metrics
curl http://localhost:4861/metrics
```

## License

Proprietary - All rights reserved