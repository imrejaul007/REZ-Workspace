# Email Campaign Service

Email marketing campaigns service for AdBazaar.

## Features

- Email campaign creation and management
- Template management with personalization
- Automated email sending
- Real-time analytics and tracking
- A/B testing support

## Port

**5030**

## API Endpoints

### Campaigns
- `POST /api/campaigns` - Create campaign
- `GET /api/campaigns` - List campaigns
- `GET /api/campaigns/:id` - Get campaign details
- `PUT /api/campaigns/:id` - Update campaign
- `DELETE /api/campaigns/:id` - Delete campaign
- `POST /api/campaigns/:id/send` - Send campaign
- `GET /api/campaigns/:id/analytics` - Get campaign analytics

### Templates
- `POST /api/templates` - Create template
- `GET /api/templates` - List templates
- `GET /api/templates/:id` - Get template details
- `PUT /api/templates/:id` - Update template
- `DELETE /api/templates/:id` - Delete template

### Sends
- `GET /api/sends` - List all sends
- `GET /api/sends/:id` - Get send details

## Models

### Campaign
- name: string
- subject: string
- templateId: string
- status: draft | scheduled | sending | sent | paused
- scheduledAt: Date
- sentAt: Date
- audience: { filter: object, count: number }
- settings: { trackOpens, trackClicks, replyTo }

### Template
- name: string
- subject: string
- htmlContent: string
- textContent: string
- variables: string[]
- status: active | archived
- createdBy: string

### Send
- campaignId: string
- contactId: string
- email: string
- status: pending | sent | delivered | opened | clicked | bounced | failed
- sentAt: Date
- deliveredAt: Date
- openedAt: Date
- clickedAt: Date
- error: string

### Analytics
- campaignId: string
- sent: number
- delivered: number
- opened: number
- clicked: number
- bounced: number
- failed: number
- openRate: number
- clickRate: number
- revenue: number

## Quick Start

```bash
cd email-campaign-service
npm install
npm run dev
```

## Health Check

```bash
curl http://localhost:5030/health
```

## Environment Variables

```
PORT=5030
MONGODB_URI=mongodb://localhost:27017/email_campaign
REDIS_URL=redis://localhost:6379
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user
SMTP_PASS=pass
INTERNAL_SERVICE_TOKEN=your-token
```