# Sequence Automation

Multi-step sequence automation service for managing drip campaigns and automated workflows.

## Features

- Create multi-step sequences (email, SMS, notifications, webhooks, delays)
- Enroll contacts in sequences
- Track enrollment progress and analytics
- Pause/resume enrollments
- Entry and exit criteria
- Step-level analytics and funnel tracking
- Template support

## Quick Start

```bash
cd sequence-automation
npm install
npm run dev
```

## Environment Variables

```env
PORT=5055
MONGODB_URI=mongodb://localhost:27017/sequence-automation
REDIS_URL=redis://localhost:6379
```

## API Endpoints

### Sequences

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/sequences | Create sequence |
| GET | /api/sequences | List all sequences |
| GET | /api/sequences/:id | Get sequence by ID |
| PUT | /api/sequences/:id | Update sequence |
| POST | /api/sequences/:id/activate | Activate sequence |
| POST | /api/sequences/:id/pause | Pause sequence |
| POST | /api/sequences/:id/enroll | Enroll contact |
| GET | /api/sequences/:id/analytics | Get sequence analytics |
| GET | /api/sequences/:id/enrollments | Get enrollments |
| DELETE | /api/sequences/:id | Delete sequence |
| POST | /api/sequences/:id/duplicate | Duplicate sequence |

### Enrollments

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/enrollments/:id | Get enrollment by ID |
| POST | /api/enrollments/:id/pause | Pause enrollment |
| POST | /api/enrollments/:id/resume | Resume enrollment |
| POST | /api/enrollments/:id/drop | Drop enrollment |
| GET | /api/enrollments | List user enrollments |

## Step Types

| Type | Description |
|------|-------------|
| email | Send email message |
| notification | Send push notification |
| sms | Send SMS message |
| delay | Wait for specified time |
| condition | Conditional branching |
| webhook | Trigger external webhook |
| task | Create task/action |

## Health Check

```bash
curl http://localhost:5055/health
```

## Metrics

```bash
curl http://localhost:5055/metrics
```