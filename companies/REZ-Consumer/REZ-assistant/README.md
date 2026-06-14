# REZ-assistant

**AI Chat Assistant Backend for REZ Consumer**

A powerful AI-powered conversational assistant service that provides intent tracking, preference learning, and need prediction. Built with Express, TypeScript, and integrated with Claude AI.

## Overview

REZ-assistant is the backend brain for conversational AI in the REZ ecosystem. It processes user messages, detects intents, learns preferences, and generates personalized recommendations.

## Features

- **AI Chat with Context**: Conversational AI powered by Claude with full conversation context
- **Intent Detection**: Real-time analysis of user needs and intentions
- **Preference Learning**: Builds user profiles based on conversation history
- **Personalized Recommendations**: Context-aware suggestions based on learned preferences
- **Multi-turn Conversations**: Maintains conversation state across interactions
- **Rate Limiting**: Built-in protection against abuse
- **Request Logging**: Comprehensive logging with Winston

## Status

**COMPLETE** - Built June 2026

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript (ES Modules)
- **AI**: Anthropic Claude SDK
- **Validation**: Zod
- **Logging**: Winston
- **Security**: Helmet, CORS, Compression, Rate Limiting

## Project Structure

```
REZ-assistant/
├── src/
│   ├── index.ts              # Express app entry point
│   ├── service.ts            # Core business logic
│   ├── routes/
│   │   ├── chat.ts           # Chat endpoints
│   │   ├── intents.ts        # Intent tracking
│   │   ├── recommendations.ts # Recommendations
│   │   └── assistant.ts      # General assistant
│   ├── services/            # Business logic services
│   ├── models/              # Data models
│   ├── middleware/
│   │   └── errorHandler.ts  # Error handling
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

**Default Port: 3011**

The service runs on `PORT=3011` (configurable via environment variable).

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone and navigate
cd REZ-assistant

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server (with hot reload)
npm run dev
```

### Production Build

```bash
npm run build
npm start
```

## API Endpoints

### Chat

| Endpoint | Method | Description |
|----------|--------|-------------|
| `POST /api/chat/message` | POST | Send chat message |
| `GET /api/chat/history/:userId` | GET | Get conversation history |

### Intents

| Endpoint | Method | Description |
|----------|--------|-------------|
| `GET /api/intents/:userId` | GET | Get detected intents |
| `POST /api/intents/track` | POST | Track new intent |

### Recommendations

| Endpoint | Method | Description |
|----------|--------|-------------|
| `GET /api/recommendations/:userId` | GET | Get personalized recommendations |

### Assistant

| Endpoint | Method | Description |
|----------|--------|-------------|
| `POST /api/assistant/query` | POST | General AI query |
| `GET /api/assistant/context/:userId` | GET | Get conversation context |

### Health

| Endpoint | Method | Description |
|----------|--------|-------------|
| `GET /health` | GET | Service health check |

## API Examples

### Send Chat Message

```bash
curl -X POST http://localhost:3011/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "message": "I want to order pizza tonight",
    "context": {
      "location": "Bangalore",
      "time": "7:30 PM"
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "response": "I found some great pizza places near you...",
  "intents": ["food_order", "restaurant_search"],
  "recommendations": [...]
}
```

### Get Conversation History

```bash
curl http://localhost:3011/api/chat/history/user123?limit=20
```

### Get User Intents

```bash
curl http://localhost:3011/api/intents/user123
```

### Get Recommendations

```bash
curl http://localhost:3011/api/recommendations/user123?limit=10
```

## Environment Variables

### Required

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Service port | 3011 |
| `ANTHROPIC_API_KEY` | Anthropic Claude API key | - |
| `INTERNAL_SERVICE_TOKEN` | Internal API authentication | - |

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

### Security

| Variable | Description | Default |
|----------|-------------|---------|
| `ALLOWED_ORIGINS` | CORS allowed origins (comma-separated) | * |

## RABTUL Integration

REZ-assistant integrates with the following RABTUL services:

1. **Authentication** (`AUTH_SERVICE_URL`): Validates user tokens before processing
2. **Analytics** (`ANALYTICS_SERVICE_URL`): Tracks conversation patterns and AI usage
3. **Event Bus** (`EVENT_BUS_URL`): Publishes intent detection events

### Event Types Published

```typescript
interface ChatEvent {
  type: 'chat.message' | 'chat.intent.detected';
  userId: string;
  messageId: string;
  timestamp: Date;
  metadata: {
    messageLength: number;
    detectedIntents: string[];
    confidence: number;
  };
}
```

## Intent Categories

| Category | Description | Examples |
|----------|-------------|----------|
| `food_order` | Food ordering intent | "order biryani", "get pizza delivered" |
| `travel` | Travel planning | "book flight to Delhi", "hotel near airport" |
| `shopping` | Product discovery | "find running shoes", "buy headphones" |
| `bill_payment` | Payment utility | "pay electricity bill", "recharge phone" |
| `support` | Customer support | "track order", "refund issue" |

## Rate Limiting

Built-in rate limiting protects the service from abuse:

- **Default**: 100 requests per 15 minutes per IP
- **AI Endpoints**: 20 requests per 15 minutes per user
- Configurable via `RATE_LIMIT_*` environment variables

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
docker build -t rez-assistant .

# Run container
docker run -p 3011:3011 --env-file .env rez-assistant
```

### Environment-Specific Deployment

For production, ensure:
- `NODE_ENV=production`
- `ANTHROPIC_API_KEY` set with production key
- `INTERNAL_SERVICE_TOKEN` (secure random string)
- Production RABTUL service URLs
- CORS origins restricted to REZ domains

## Monitoring

### Health Check

```bash
curl http://localhost:3011/health
```

Response:
```json
{
  "status": "ok",
  "service": "rez-assistant",
  "version": "1.0.0",
  "timestamp": "2026-06-04T10:00:00.000Z"
}
```

## Related Services

| Service | Port | Description |
|---------|------|-------------|
| REZ-inbox | 3003 | Smart inbox |
| REZ-expense | 3013 | Expense tracking |
| REZ-nearby | 3015 | Location discovery |

## License

Private - REZ Consumer Application
