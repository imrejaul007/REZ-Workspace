# REZ Notifications Hub

A unified notifications service for the REZ Platform that handles multi-channel messaging through WhatsApp, SMS, Email, and Push notifications.

## Features

- **Single API for All Channels**: Unified interface for sending notifications across multiple channels
- **Multi-Channel Support**:
  - Email (SMTP)
  - SMS (Twilio)
  - WhatsApp (Twilio)
  - Push Notifications (Firebase Cloud Messaging)
- **Template Management**: Create and manage notification templates with Handlebars templating
- **User Preferences**: Granular control over notification preferences per channel
- **Opt-out Handling**: Automatic opt-out management for GDPR compliance
- **Rate Limiting**: Built-in rate limiting to prevent abuse
- **Analytics**: Track notification delivery and engagement metrics
- **Idempotency**: Prevent duplicate notifications with idempotency keys

## Quick Start

### Prerequisites

- Node.js 18+
- Docker and Docker Compose (for local development)
- PostgreSQL 15+
- Redis 7+

### Local Development

1. Clone the repository:
```bash
git clone https://github.com/REZ-platform/REZ-notifications-hub.git
cd REZ-notifications-hub
```

2. Copy environment configuration:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Start with Docker Compose:
```bash
docker-compose up -d
```

4. Or run locally:
```bash
npm install
npm run dev
```

### Deploy to Render

1. Fork this repository to GitHub

2. Connect to Render:
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New" > "Blueprint"
   - Connect your GitHub account
   - Select the repository
   - Render will automatically detect `render.yaml`

3. Add environment variables in Render dashboard:
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `SMTP_USER`
   - `SMTP_PASS`
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_PRIVATE_KEY`
   - `FIREBASE_CLIENT_EMAIL`
   - `DATABASE_URL` (auto-configured from PostgreSQL)
   - `REDIS_URL` (auto-configured from Redis)

4. Deploy!

## API Reference

Base URL: `https://your-app.onrender.com/v1`

### Send Notification

```http
POST /notifications/send
Content-Type: application/json

{
  "templateId": "welcome-email",
  "recipient": {
    "userId": "user-123",
    "email": "user@example.com",
    "channels": ["email"]
  },
  "variables": {
    "name": "John",
    "actionUrl": "https://rezplatform.com/verify"
  },
  "priority": "normal"
}
```

### Send to Multiple Channels

```http
POST /notifications/send-all
Content-Type: application/json

{
  "templateId": "order-update",
  "recipient": {
    "userId": "user-123",
    "email": "user@example.com",
    "phone": "+1234567890",
    "channels": ["email", "sms"]
  },
  "variables": {
    "orderId": "ORD-12345",
    "status": "Shipped"
  }
}
```

### Batch Notifications

```http
POST /notifications/batch
Content-Type: application/json

{
  "notifications": [
    {
      "templateId": "promo-email",
      "recipient": { "email": "user1@example.com", "channels": ["email"] },
      "variables": { "code": "SAVE20" }
    },
    {
      "templateId": "promo-email",
      "recipient": { "email": "user2@example.com", "channels": ["email"] },
      "variables": { "code": "SAVE20" }
    }
  ],
  "options": {
    "parallel": true,
    "stopOnError": false
  }
}
```

### Create Template

```http
POST /templates
Content-Type: application/json

{
  "name": "welcome-email",
  "description": "Welcome email for new users",
  "channel": "email",
  "category": "onboarding",
  "content": {
    "subject": "Welcome to REZ, {{name}}!",
    "body": "Hi {{name}},\n\nWelcome to REZ Platform! We're excited to have you.\n\nGet started: {{actionUrl}}",
    "htmlBody": "<h1>Welcome {{name}}!</h1><p>Get started now!</p>"
  },
  "variables": [
    { "name": "name", "required": true, "type": "string" },
    { "name": "actionUrl", "required": true, "type": "string" }
  ]
}
```

### Update Preferences

```http
PATCH /preferences/user-123
Content-Type: application/json

{
  "email": {
    "enabled": true,
    "quietHoursStart": "22:00",
    "quietHoursEnd": "08:00"
  },
  "marketingEnabled": false
}
```

### Opt-out

```http
POST /opt-out
Content-Type: application/json

{
  "userId": "user-123",
  "channel": "email",
  "reason": "User requested unsubscribe"
}
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      API Layer                              │
│  ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌─────────────┐   │
│  │Notif.   │ │Template  │ │Prefs     │ │Analytics    │   │
│  │Routes   │ │Routes    │ │Routes    │ │Routes       │   │
│  └────┬────┘ └────┬─────┘ └────┬─────┘ └──────┬──────┘   │
└───────┼────────────┼───────────┼───────────────┼──────────┘
        │            │           │               │
┌───────▼────────────▼───────────▼───────────────▼──────────┐
│                    Service Layer                             │
│  ┌──────────────┐ ┌───────────┐ ┌────────────────────┐   │
│  │Notification  │ │Template   │ │Preferences         │   │
│  │Service       │ │Service    │ │Service             │   │
│  └──────────────┘ └───────────┘ └────────────────────┘   │
│  ┌──────────────┐ ┌───────────┐                          │
│  │OptOut        │ │Analytics  │                          │
│  │Service       │ │Service    │                          │
│  └──────────────┘ └───────────┘                          │
└───────────────────────────────────────────────────────────┘
        │
┌───────▼───────────────────────────────────────────────────┐
│                   Adapter Layer                             │
│  ┌────────┐ ┌────────┐ ┌──────────┐ ┌────────┐          │
│  │ Email  │ │  SMS   │ │ WhatsApp │ │  Push  │          │
│  │Adapter │ │Adapter │ │ Adapter  │ │Adapter │          │
│  └────────┘ └────────┘ └──────────┘ └────────┘          │
└───────────────────────────────────────────────────────────┘
        │
┌───────▼───────────────────────────────────────────────────┐
│                   Infrastructure                            │
│  ┌──────────────┐ ┌───────────────┐ ┌────────────────┐  │
│  │ PostgreSQL    │ │    Redis      │ │  External      │  │
│  │  Database     │ │    Cache      │ │  Services      │  │
│  └──────────────┘ └───────────────┘ └────────────────┘  │
└───────────────────────────────────────────────────────────┘
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NODE_ENV` | Environment (development/production) | Yes |
| `PORT` | Server port | No (default: 3000) |
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `REDIS_URL` | Redis connection string | No |
| `TWILIO_ACCOUNT_SID` | Twilio Account SID | For SMS/WhatsApp |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token | For SMS/WhatsApp |
| `TWILIO_PHONE_NUMBER` | Twilio phone number | For SMS |
| `WHATSAPP_FROM_NUMBER` | WhatsApp sender number | For WhatsApp |
| `SMTP_HOST` | SMTP server host | For Email |
| `SMTP_PORT` | SMTP server port | For Email |
| `SMTP_USER` | SMTP username | For Email |
| `SMTP_PASS` | SMTP password | For Email |
| `EMAIL_FROM` | Default sender email | For Email |
| `FIREBASE_PROJECT_ID` | Firebase project ID | For Push |
| `FIREBASE_PRIVATE_KEY` | Firebase private key | For Push |
| `FIREBASE_CLIENT_EMAIL` | Firebase client email | For Push |

## License

MIT
