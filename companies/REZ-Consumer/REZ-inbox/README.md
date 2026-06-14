# REZ-inbox

**Smart Inbox Service for REZ Consumer**

A comprehensive email receipt import service that automatically parses travel confirmations, food receipts, invoices, and subscriptions. Built with Express, TypeScript, and integrated with RABTUL services.

## Overview

REZ-inbox provides intelligent email parsing and categorization for expense tracking. It automatically extracts relevant information from forwarded emails and organizes them into actionable categories.

## Features

- **Email Parsing with AI**: Uses Claude AI to intelligently extract data from emails
- **Category Detection**: Automatically categorizes receipts as travel, food, invoice, or subscription
- **Receipt Extraction**: Extracts merchant name, amount, date, and line items
- **Message Threading**: Groups related emails into conversation threads
- **Tax Record Generation**: Creates consolidated tax records for expense reporting
- **Webhook Integration**: Receives emails via webhook from email providers

## Status

**COMPLETE** - Built June 2026

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **AI**: Anthropic Claude SDK
- **Validation**: Zod
- **HTTP Client**: Axios

## Project Structure

```
REZ-inbox/
├── src/
│   ├── index.ts              # Express app entry point
│   ├── service.ts            # Core business logic
│   ├── routes/
│   │   ├── messages.ts       # Message CRUD endpoints
│   │   ├── threads.ts        # Thread management
│   │   └── import.ts         # Email import endpoints
│   ├── services/
│   │   ├── emailParser.ts    # AI-powered email parsing
│   │   └── messages.ts       # Message service
│   ├── models/              # Data models
│   ├── middleware/           # Express middleware
│   ├── integrations/        # RABTUL integrations
│   ├── types/               # TypeScript types
│   └── utils/
│       └── logger.ts        # Winston logger
├── .env.example
├── package.json
├── tsconfig.json
└── Dockerfile
```

## Port Configuration

**Default Port: 3003**

The service runs on `PORT=3003` (configurable via environment variable).

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone and navigate
cd REZ-inbox

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server
npm run dev
```

### Production Build

```bash
npm run build
npm start
```

## API Endpoints

### Messages

| Endpoint | Method | Description |
|----------|--------|-------------|
| `GET /api/messages` | GET | List all messages |
| `GET /api/messages/:id` | GET | Get message by ID |
| `POST /api/messages` | POST | Create new message |
| `DELETE /api/messages/:id` | DELETE | Delete message |

### Threads

| Endpoint | Method | Description |
|----------|--------|-------------|
| `GET /api/threads` | GET | List all threads |
| `GET /api/threads/:id` | GET | Get thread by ID |

### Import

| Endpoint | Method | Description |
|----------|--------|-------------|
| `POST /api/import/email` | POST | Import email content |
| `POST /webhook/email` | POST | Email webhook receiver |

### Health

| Endpoint | Method | Description |
|----------|--------|-------------|
| `GET /health` | GET | Service health check |

## API Examples

### Import Email

```bash
curl -X POST http://localhost:3003/api/import/email \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "from": "orders@swiggy.com",
    "subject": "Order Confirmed - #SWIGGY12345",
    "body": "Your order from Pizza Hut has been confirmed...",
    "timestamp": "2026-06-04T10:00:00Z"
  }'
```

### Get Messages

```bash
curl http://localhost:3003/api/messages?userId=user123&category=food
```

### Get Threads

```bash
curl http://localhost:3003/api/threads?userId=user123
```

## Environment Variables

### Required

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Service port | 3003 |
| `INTERNAL_SERVICE_TOKEN` | Internal API authentication token | - |

### RABTUL Services

| Variable | Description | Default |
|----------|-------------|---------|
| `AUTH_SERVICE_URL` | RABTUL Authentication service | http://localhost:4002 |
| `WALLET_SERVICE_URL` | RABTUL Wallet service | http://localhost:4004 |
| `ANALYTICS_SERVICE_URL` | RABTUL Analytics service | http://localhost:4016 |
| `NOTIFICATION_SERVICE_URL` | RABTUL Notification service | http://localhost:4011 |
| `EVENT_BUS_URL` | Event bus for pub/sub | http://localhost:4025 |

### REZ Intelligence

| Variable | Description | Default |
|----------|-------------|---------|
| `INTENT_SERVICE_URL` | Intent tracking service | http://localhost:4018 |
| `PREDICTIVE_SERVICE_URL` | Predictive analytics | http://localhost:4123 |
| `SIGNAL_SERVICE_URL` | Signal processing | http://localhost:4121 |

### AI Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude | - |
| `OPENAI_API_KEY` | OpenAI API key (fallback) | - |

## RABTUL Integration

REZ-inbox integrates with the following RABTUL services:

1. **Authentication** (`AUTH_SERVICE_URL`): Validates user tokens and extracts user context
2. **Analytics** (`ANALYTICS_SERVICE_URL`): Tracks email parsing events and category distributions
3. **Event Bus** (`EVENT_BUS_URL`): Publishes email import events for downstream services

### Event Types Published

```typescript
interface EmailImportedEvent {
  type: 'email.imported';
  userId: string;
  messageId: string;
  category: 'travel' | 'food' | 'invoice' | 'subscription';
  timestamp: Date;
  metadata: {
    merchantName?: string;
    amount?: number;
    hasReceipt: boolean;
  };
}
```

## Email Categories

| Category | Keywords | Examples |
|----------|----------|----------|
| `travel` | flight, hotel, booking, reservation | OYO, MakeMyTrip, Airbnb |
| `food` | order, delivery, restaurant, zomato, swiggy | Swiggy, Zomato, Domino's |
| `invoice` | invoice, bill, receipt, payment due | Utility bills, subscriptions |
| `subscription` | subscription, membership, renewal | Netflix, Spotify, Amazon Prime |

## Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test -- --coverage
```

## Deployment

### Docker

```bash
# Build image
docker build -t rez-inbox .

# Run container
docker run -p 3003:3003 --env-file .env rez-inbox
```

### Environment-Specific Deployment

For production, ensure the following environment variables are set:
- `NODE_ENV=production`
- `INTERNAL_SERVICE_TOKEN` (secure random string)
- `ANTHROPIC_API_KEY` (for production AI parsing)
- Production RABTUL service URLs

## Monitoring

### Health Check

```bash
curl http://localhost:3003/health
```

Response:
```json
{
  "status": "ok",
  "service": "rez-inbox",
  "version": "1.0.0",
  "timestamp": "2026-06-04T10:00:00.000Z"
}
```

## Related Services

| Service | Port | Description |
|---------|------|-------------|
| REZ-assistant | 3010 | AI chat and recommendations |
| REZ-expense | 3013 | Expense tracking |
| REZ-nearby | 3015 | Location discovery |

## License

Private - REZ Consumer Application
