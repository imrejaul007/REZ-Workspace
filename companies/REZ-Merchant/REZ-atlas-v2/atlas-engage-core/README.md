# Atlas Engage Core

**Port:** 5250 | **Company:** REZ-Merchant | **Version:** 1.0.0

## Overview

Unified customer engagement hub. Manage campaigns, contacts, and multi-channel orchestration from one platform.

## Features

- **Campaign Management** - Create, schedule, and track campaigns
- **Contact Database** - Centralized contact management
- **Multi-Channel Orchestration** - Coordinate WhatsApp, SMS, Email, Push
- **Analytics Dashboard** - Real-time engagement metrics

## API Endpoints

### Campaigns

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/campaigns` | List campaigns |
| GET | `/api/campaigns/:id` | Get campaign details |
| POST | `/api/campaigns` | Create campaign |
| PUT | `/api/campaigns/:id` | Update campaign |
| POST | `/api/campaigns/:id/send` | Launch campaign |

### Contacts

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/contacts` | List contacts |
| POST | `/api/contacts` | Add contact |

### Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics` | Get engagement analytics |

## Quick Start

```bash
cd atlas-engage-core
npm install
npm run dev
```

## Health Check

```bash
curl http://localhost:5250/health
```

## Example Request

```bash
# Create campaign
curl -X POST http://localhost:5250/api/campaigns \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Summer Sale",
    "type": "promotional",
    "channels": ["whatsapp", "sms"]
  }'
```

## Ecosystem Integration

- **RABTUL Notifications** - Push/SMS delivery
- **HOJAI AI** - Content personalization
- **atlas-engage-campaign** - Campaign execution
- **atlas-engage-conversation** - Message delivery
