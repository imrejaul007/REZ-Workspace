# Atlas Engage Conversation

**Port:** 5270 | **Company:** REZ-Merchant | **Version:** 1.0.0

## Overview

Unified messaging engine for WhatsApp, SMS, and Email. Handle incoming messages and send outbound communications.

## Features

- **WhatsApp Business** - Template messages, rich media
- **SMS Gateway** - High delivery rate
- **Email** - Professional emails with tracking
- **Conversation View** - Unified inbox
- **Webhook Support** - Real-time notifications

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/send` | Send message |
| GET | `/api/conversations` | List conversations |
| GET | `/api/conversations/:id` | Get conversation details |

## Quick Start

```bash
cd atlas-engage-conversation
npm install
npm run dev
```

## Health Check

```bash
curl http://localhost:5270/health
```

## Example Request

```bash
curl -X POST http://localhost:5270/api/send \
  -H "Content-Type: application/json" \
  -d '{
    "channel": "whatsapp",
    "to": "+91-9876543210",
    "message": "Hi! Welcome to our platform."
  }'
```

## Ecosystem Integration

- **RABTUL WhatsApp** - WhatsApp Business API
- **RABTUL SMS** - SMS gateway
- **RABTUL Email** - Email service
