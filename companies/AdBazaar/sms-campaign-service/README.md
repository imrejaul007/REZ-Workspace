# SMS Campaign Service

SMS marketing campaigns service for AdBazaar.

## Features

- SMS campaign creation and management
- Template management with personalization
- Bulk SMS sending
- Delivery tracking and analytics
- Twilio integration

## Port

**5031**

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

### Contacts
- `POST /api/contacts` - Create contact
- `GET /api/contacts` - List contacts

### Sends
- `GET /api/sends` - List all sends
- `GET /api/sends/:id` - Get send details

## Quick Start

```bash
cd sms-campaign-service
npm install
npm run dev
```

## Health Check

```bash
curl http://localhost:5031/health
```

## Environment Variables

```
PORT=5031
MONGODB_URI=mongodb://localhost:27017/sms_campaign
TWILIO_ACCOUNT_SID=your-sid
TWILIO_AUTH_TOKEN=your-token
TWILIO_PHONE_NUMBER=+1234567890
INTERNAL_SERVICE_TOKEN=your-token
```