# Atlas Workforce Agent

**Port:** 5210 | **Company:** REZ-Merchant | **Version:** 1.0.0

## Overview

AI Sales Agent for autonomous merchant outreach and engagement. Handles lead qualification, personalized messaging, and conversation management.

## Features

- **Autonomous Outreach** - AI-powered cold outreach via WhatsApp, SMS, Email
- **Lead Qualification** - Automatic qualification based on engagement signals
- **Conversation Handling** - Natural language responses to common queries
- **Personalized Messaging** - Dynamic content based on merchant profile

## API Endpoints

### Agents

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/agents` | List all AI agents and their status |
| GET | `/api/agents/:id` | Get agent details |

### Outreach

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/outreach` | Send outreach message |
| GET | `/api/conversations/:merchantId` | Get conversation history |

### AI Responses

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/respond` | Generate AI response to query |

## Quick Start

```bash
cd atlas-workforce-agent
npm install
npm run dev
```

## Health Check

```bash
curl http://localhost:5210/health
```

## Example Request

```bash
# Send outreach
curl -X POST http://localhost:5210/api/outreach \
  -H "Content-Type: application/json" \
  -d '{
    "merchantId": "merch-123",
    "channel": "whatsapp",
    "template": "welcome",
    "personalized": true
  }'

# Get AI response
curl -X POST http://localhost:5210/api/respond \
  -H "Content-Type: application/json" \
  -d '{
    "context": "merchant_interested",
    "intent": "pricing"
  }'
```

## Supported Channels

- **WhatsApp** - Primary channel for Indian merchants
- **SMS** - Fallback for non-responsive leads
- **Email** - Formal communications

## Response Templates

| Intent | Response |
|--------|----------|
| greeting | "Hi! Thanks for reaching out..." |
| pricing | "Our pricing starts at ₹999/month..." |
| demo | "I'd be happy to schedule a demo..." |
| support | "I understand your concern..." |

## Ecosystem Integration

- **RABTUL Notifications** - Send messages via RABTUL
- **HOJAI AI** - GPT-powered response generation
- **atlas-workforce-core** - Agent configuration

## Related Services

- [atlas-workforce-core](../atlas-workforce-core) - Employee management
- [atlas-engage-conversation](../atlas-engage-conversation) - Multi-channel messaging
