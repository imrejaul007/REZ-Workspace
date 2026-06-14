# AdBazaar Email Automation Service

Email drip campaigns and sequences for AdBazaar.

## Features

- Create and manage email drip sequences
- Multi-step email campaigns with delays
- User enrollment and tracking
- Automated email sending via SendGrid/SES
- Action tracking (opens, clicks, bounces)
- Analytics and engagement metrics
- Variable interpolation in emails

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Service port | 5042 |
| MONGODB_URI | MongoDB connection string | mongodb://localhost:27017/adbazaar_email_automation |
| REDIS_URL | Redis connection string | redis://localhost:6379 |
| EMAIL_PROVIDER | Email provider (sendgrid/ses) | sendgrid |
| SENDGRID_API_KEY | SendGrid API key | - |
| EMAIL_FROM_ADDRESS | Default from email | noreply@adbazaar.com |
| INTERNAL_SERVICE_TOKEN | Service-to-service auth token | - |

## API Endpoints

### Sequences

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/sequences | Create a new sequence |
| GET | /api/sequences | List all sequences |
| GET | /api/sequences/:id | Get sequence by ID |
| PUT | /api/sequences/:id | Update sequence |
| DELETE | /api/sequences/:id | Delete sequence |
| POST | /api/sequences/:id/steps | Add step to sequence |
| PUT | /api/sequences/:id/steps/reorder | Reorder steps |
| POST | /api/sequences/:id/enroll | Enroll user in sequence |
| GET | /api/sequences/:id/enrollments | Get enrollments |
| GET | /api/sequences/:id/analytics | Get sequence analytics |

### Tracking

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/track/:enrollmentId/:action | Track email action |

### System

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| GET | /metrics | Prometheus metrics |

## Trigger Types

- `campaign_signup` - Triggered when user signs up for campaign
- `trial_start` - Triggered when trial starts
- `purchase` - Triggered after purchase
- `manual` - Manually triggered
- `segment` - Based on user segment membership

## Email Variables

Use `{{variableName}}` syntax in email subject and body:

```html
<h1>Welcome, {{firstName}}!</h1>
<p>Thanks for joining {{companyName}}.</p>
```

## Request/Response Examples

### Create Sequence

```bash
curl -X POST http://localhost:5042/api/sequences \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "Welcome Series",
    "description": "Onboarding email sequence",
    "trigger": { "type": "campaign_signup" },
    "tags": ["onboarding", "welcome"]
  }'
```

### Add Step

```bash
curl -X POST http://localhost:5042/api/sequences/seq123/steps \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "Day 1 Email",
    "emailSubject": "Welcome to AdBazaar, {{firstName}}!",
    "emailBody": "<h1>Welcome!</h1><p>We are excited to have you.</p>",
    "delayDays": 0
  }'
```

### Enroll User

```bash
curl -X POST http://localhost:5042/api/sequences/seq123/enroll \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "userId": "user123",
    "email": "user@example.com",
    "variables": {
      "firstName": "John",
      "companyName": "Acme Corp"
    }
  }'
```

## License

MIT