# Campaign Copilot Service

Conversational AI copilot for managing advertising campaigns through natural language chat.

**Port:** 4823

## Features

- Conversational campaign management via natural language
- Action execution (create, pause, adjust budget)
- Proactive recommendations
- Contextual awareness of campaign performance
- Multi-campaign support
- JWT authentication
- Prometheus metrics

## Tech Stack

- Express.js - Web framework
- MongoDB - Data persistence
- Redis - Caching
- Zod - Request validation
- JWT - Authentication
- Prometheus - Metrics
- OpenAI - AI responses (optional)

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev

# Run tests
npm test
```

## API Endpoints

### Health Check

```
GET /health              - Basic health check
GET /health/ready       - Readiness check
GET /health/live        - Liveness check
GET /health/metrics     - Prometheus metrics
```

### Copilot Chat

```
POST /api/copilot/chat
     - Send message to copilot

GET /api/copilot/conversations
     - List all conversations

GET /api/copilot/conversations/:id
     - Get conversation by ID

POST /api/copilot/suggest
     - Get proactive suggestions

GET /api/copilot/campaigns/:id/context
     - Get campaign context for copilot
```

## Authentication

All API endpoints require JWT Bearer token authentication:

```
Authorization: Bearer <your-jwt-token>
```

Token payload must include:
```json
{
  "userId": "string",
  "advertiserId": "string",
  "email": "string",
  "role": "string"
}
```

## Natural Language Commands

The copilot understands these types of commands:

### Campaign Management
- "Show me my campaigns"
- "Pause my running campaigns"
- "Resume my paused campaigns"
- "How is my Summer Sale campaign doing?"

### Budget Adjustments
- "Increase budget by 20%"
- "Decrease budget for my campaign"
- "Set budget to 50000"

### Performance
- "Show me yesterday's performance"
- "What's my CTR this week?"
- "Generate a performance report"

### Recommendations
- "What do you recommend?"
- "Any suggestions for optimization?"

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 4823 |
| MONGODB_URI | MongoDB connection string | - |
| REDIS_URL | Redis connection string | - |
| JWT_SECRET | JWT signing secret | - |
| OPENAI_API_KEY | OpenAI API key (optional) | - |
| REZ_ADS_SERVICE_URL | REZ Ads service URL | http://localhost:4007 |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    API Layer (Express)                      │
│  POST /chat  GET /conversations  POST /suggest  GET /ctx  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Service Layer                            │
│  ConversationService  CampaignService  AIService  Intent  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Data Layer                               │
│  MongoDB (Conversations)  Redis (Cache)  REZ Ads Service  │
└─────────────────────────────────────────────────────────────┘
```

## Project Structure

```
campaign-copilot/
├── src/
│   ├── config/         # Configuration
│   ├── models/         # MongoDB models
│   ├── services/       # Business logic
│   ├── routes/        # API routes
│   ├── middleware/     # Express middleware
│   ├── types/         # TypeScript types
│   ├── tests/         # Jest tests
│   └── index.ts       # Entry point
├── package.json
├── tsconfig.json
├── jest.config.js
└── README.md
```

## Metrics

Prometheus metrics available at `/health/metrics`:

- `campaign_copilot_http_requests_total` - HTTP request counter
- `campaign_copilot_http_request_duration_seconds` - Request latency
- `campaign_copilot_conversations_total` - Conversations created
- `campaign_copilot_messages_total` - Messages processed
- `campaign_copilot_actions_executed_total` - Actions executed
- `campaign_copilot_suggestions_generated_total` - Suggestions generated
- `campaign_copilot_active_conversations` - Active conversations gauge
- `campaign_copilot_ai_response_duration_seconds` - AI response time

## License

Internal use only - AdBazaar
