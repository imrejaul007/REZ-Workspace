# AI Marketing Manager

**AI Marketing Manager for Local/SMB Businesses**

Port: **4860**

An intelligent marketing automation service that helps local businesses and SMBs manage their marketing activities through AI-powered recommendations, automated campaigns, and performance analytics.

## Features

- **Business Profile Analysis** - Understands your business category, location, and competitive landscape
- **Automated Ad Creation** - Generate compelling ads for Facebook, Instagram, Google, and more
- **Review Management** - Monitor and respond to reviews across multiple platforms
- **Social Media Posting** - Schedule and automate social media content
- **WhatsApp Campaign Automation** - Send targeted broadcasts to customer segments
- **Local SEO Optimization** - Improve visibility in local search results
- **Marketing Calendar** - Visualize all scheduled content and campaigns
- **Performance Reporting** - Track ROAS, engagement, and conversions in real-time

## Tech Stack

- **Runtime:** Node.js 18+
- **Language:** TypeScript
- **Framework:** Express.js
- **Database:** MongoDB
- **Cache:** Redis
- **Validation:** Zod
- **Auth:** JWT
- **Metrics:** Prometheus
- **Logging:** Winston

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB 6+
- Redis 7+

### Installation

```bash
cd ai-marketing-manager
npm install
```

### Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Key environment variables:
- `PORT=4860` - Service port
- `MONGODB_URI` - MongoDB connection string
- `REDIS_HOST` - Redis host
- `JWT_SECRET` - JWT signing secret

### Run Development Server

```bash
npm run dev
```

### Build for Production

```bash
npm run build
npm start
```

## API Endpoints

### Initialize AI Marketing Manager

```
POST /api/ai/initialize
Authorization: Bearer <token>

{
  "merchantId": "merchant-123",
  "businessProfile": {
    "name": "My Restaurant",
    "category": "restaurant",
    "location": "123 Main St, City",
    "priceRange": "moderate"
  },
  "capabilities": {
    "adCreation": true,
    "reviewManagement": true,
    "whatsappCampaigns": true
  }
}
```

### Get Manager Status

```
GET /api/ai/manager/:merchantId
Authorization: Bearer <token>
```

### Get Marketing Recommendations

```
POST /api/ai/recommend
Authorization: Bearer <token>

{
  "merchantId": "merchant-123",
  "category": "social_media",
  "limit": 10
}
```

### Execute Marketing Action

```
POST /api/ai/execute
Authorization: Bearer <token>

{
  "merchantId": "merchant-123",
  "actionType": "create_campaign",
  "parameters": {
    "type": "facebook_ad",
    "name": "Summer Sale",
    "headline": "50% Off This Weekend!",
    "body": "Visit us for amazing deals...",
    "budget": 5000
  }
}
```

**Action Types:**
- `create_campaign` - Create a new marketing campaign
- `optimize_campaign` - Optimize existing campaign performance
- `respond_to_review` - Respond to a customer review
- `schedule_post` - Schedule a social media post
- `send_whatsapp` - Send WhatsApp broadcast
- `request_review` - Request customer review
- `update_seo` - Update local SEO settings

### Get Marketing Calendar

```
GET /api/ai/calendar?merchantId=merchant-123&startDate=2024-06-01&endDate=2024-06-30
Authorization: Bearer <token>
```

### Get Performance Report

```
GET /api/ai/performance?merchantId=merchant-123&startDate=2024-06-01&endDate=2024-06-30
Authorization: Bearer <token>
```

### Create Campaign

```
POST /api/ai/campaigns
Authorization: Bearer <token>

{
  "merchantId": "merchant-123",
  "type": "instagram_ad",
  "name": "New Collection Launch",
  "content": {
    "headline": "Check Out Our New Collection",
    "body": "Fresh arrivals just for you...",
    "callToAction": "Shop Now"
  },
  "budget": 3000,
  "schedule": {
    "startDate": "2024-06-15",
    "endDate": "2024-06-30",
    "frequency": "daily"
  }
}
```

### List Campaigns

```
GET /api/ai/campaigns?merchantId=merchant-123&status=active&limit=20
Authorization: Bearer <token>
```

### Update Campaign Status

```
PATCH /api/ai/campaigns/:campaignId/status
Authorization: Bearer <token>

{
  "status": "paused"
}
```

### Respond to Review

```
POST /api/ai/reviews/respond
Authorization: Bearer <token>

{
  "merchantId": "merchant-123",
  "reviewId": "rev-123",
  "response": "Thank you for your wonderful review!",
  "tone": "grateful"
}
```

### Get Reviews

```
GET /api/ai/reviews?merchantId=merchant-123&platform=google&sentiment=negative
Authorization: Bearer <token>
```

### Send WhatsApp Campaign

```
POST /api/ai/whatsapp
Authorization: Bearer <token>

{
  "merchantId": "merchant-123",
  "campaignName": "Weekend Offer",
  "message": "Hey! Don't miss our weekend special...",
  "segment": "recent_customers",
  "scheduledFor": "2024-06-20T10:00:00Z"
}
```

### Update SEO Settings

```
PUT /api/ai/seo
Authorization: Bearer <token>

{
  "merchantId": "merchant-123",
  "updates": {
    "title": "My Restaurant - Best Food in Town",
    "description": "Authentic cuisine served with love...",
    "keywords": ["restaurant", "food", "delivery"]
  }
}
```

### Refresh Recommendations

```
GET /api/ai/recommendations/refresh?merchantId=merchant-123
Authorization: Bearer <token>
```

## Health & Monitoring

### Health Check

```
GET /health
```

### Prometheus Metrics

```
GET /metrics
```

Metrics include:
- `http_requests_total` - Request counter by method, route, status
- `http_request_duration_seconds` - Request latency histogram
- `campaigns_created_total` - Campaign creation counter
- `recommendations_generated_total` - Recommendations counter
- `ai_marketing_managers_active` - Active managers gauge
- `campaign_performance_roas` - ROAS histogram

## Data Models

### AI Marketing Manager

```typescript
interface AIMarketingManager {
  managerId: string;
  merchantId: string;
  businessProfile: {
    name: string;
    category: string;
    location: string;
    hours?: string;
    priceRange?: 'budget' | 'moderate' | 'premium' | 'luxury';
    competitors?: string[];
  };
  capabilities: {
    adCreation: boolean;
    reviewManagement: boolean;
    socialPosting: boolean;
    whatsappCampaigns: boolean;
    localSEO: boolean;
    emailMarketing?: boolean;
    smsMarketing?: boolean;
    loyaltyPrograms?: boolean;
  };
  activeCampaigns: Campaign[];
  schedule: {
    recurringPosts: ScheduleItem[];
    adSchedules: ScheduleItem[];
    reviewRequests: ScheduleItem[];
  };
  recommendations: Recommendation[];
  performance: {
    totalReach: number;
    totalEngagement: number;
    totalConversions: number;
    roas: number;
  };
  status: 'active' | 'inactive' | 'suspended';
}
```

## Error Handling

All errors follow this format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {}
  }
}
```

### Error Codes

- `UNAUTHORIZED` - Missing or invalid authentication
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `VALIDATION_ERROR` - Request validation failed
- `INVALID_ACTION` - Unknown action type
- `CAPABILITY_NOT_ENABLED` - Feature not enabled for merchant

## Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## Project Structure

```
ai-marketing-manager/
├── src/
│   ├── config/          # Configuration
│   ├── middleware/      # Express middleware
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── types/           # TypeScript types & schemas
│   ├── utils/           # Utilities
│   └── index.ts         # Entry point
├── tests/               # Unit tests
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## Integration

### With Other AdBazaar Services

The AI Marketing Manager integrates with:

- **REZ Auth Service** - For merchant authentication
- **Ad Service** - For ad creation and management
- **Notification Service** - For sending notifications

### With HOJAI AI

The service can integrate with HOJAI AI services for:
- Advanced content generation
- Predictive analytics
- Customer segmentation

## License

MIT

## Version

1.0.0