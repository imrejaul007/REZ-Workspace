# GENIE Telegram Service

Telegram bot integration for **GENIE Personal Intelligence OS** - Your personal AI that actually knows you.

## Tagline

> "You don't use Genie. You talk to Genie."

## Overview

The GENIE Telegram Service connects your Telegram bot to the GENIE Personal Intelligence OS, enabling:

- **Unified AI Companion** - Same AI, same memory across all platforms
- **Memory Sync** - Conversations stored and recalled
- **Relationship Tracking** - Track interactions with contacts
- **Proactive Notifications** - GENIE nudges you when it matters
- **Context Preservation** - Maintains conversation history and context

## Features

### Core Features

| Feature | Description |
|---------|-------------|
| Telegram Bot Integration | Connect a Telegram bot to GENIE |
| Account Linking | Securely link Telegram to REZ accounts |
| Message Storage | Store all Telegram messages for memory |
| Conversation History | Retrieve past conversations |
| Context Tracking | Track conversation topics and pending actions |
| Multi-user Support | Handle multiple linked accounts |

### GENIE Integration

| Integration | Purpose |
|-------------|---------|
| Memory Service | Store conversations as memories |
| Relationship Service | Track contact interactions |
| Briefing Service | Daily briefings via Telegram |
| Auth Service | Verify and link user accounts |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Telegram Platform                        │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│               GENIE Telegram Service (4710)                 │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ Webhook     │  │ Message     │  │ Bot Commands         │ │
│  │ Handler     │  │ Processor   │  │ /start, /link, etc.  │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ Telegram    │  │ Genie       │  │ MongoDB Models      │ │
│  │ API Client  │  │ Service     │  │ Users, Messages,    │ │
│  │             │  │             │  │ Sessions, Context   │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────┬───────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          │               │               │
          ▼               ▼               ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ Memory      │  │ Relationship│  │ Briefing   │
│ Service     │  │ Service     │  │ Service    │
│ (4703)      │  │ (4702)      │  │ (4704)     │
└─────────────┘  └─────────────┘  └─────────────┘
```

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB 6+
- Telegram Bot Token (from @BotFather)

### Installation

```bash
cd hojai-ai/genie-telegram-service
npm install
```

### Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Edit `.env`:
```env
PORT=4710
MONGODB_URI=mongodb://localhost:27017/genie-telegram
TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather
TELEGRAM_WEBHOOK_URL=https://your-public-domain.com
WEBHOOK_SECRET_TOKEN=generate_a_random_secret
```

### Development

```bash
npm run dev
```

### Production

```bash
npm run build
npm start
```

## API Endpoints

### User Endpoints (Authenticated)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/telegram/stats` | Get user statistics |
| GET | `/api/telegram/sessions` | Get active Telegram sessions |
| POST | `/api/telegram/link` | Generate verification code |
| POST | `/api/telegram/verify` | Verify Telegram linkage |
| DELETE | `/api/telegram/unlink` | Unlink Telegram account |
| GET | `/api/telegram/history` | Get conversation history |
| DELETE | `/api/telegram/history/:chatId` | Clear conversation history |
| POST | `/api/telegram/search` | Search messages |
| GET | `/api/telegram/context` | Get conversation context |

### Webhook Endpoint

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/telegram/webhook/:token` | Telegram webhook receiver |

### Health Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Basic health check |
| GET | `/health/live` | Kubernetes liveness probe |
| GET | `/health/ready` | Kubernetes readiness probe |

## Bot Commands

When users interact with your Telegram bot, these commands are available:

| Command | Description |
|---------|-------------|
| `/start` | Start interacting with GENIE |
| `/help` | Get help with GENIE commands |
| `/link` | Link your REZ account |
| `/unlink` | Unlink your REZ account |
| `/briefing` | Get your daily briefing |
| `/memory` | Search your memories |
| `/context` | Get current conversation context |

## Data Models

### TelegramUser
- `telegram_user_id` - Telegram user ID
- `telegram_username` - Telegram username
- `first_name`, `last_name` - User's name
- `linked_user_id` - REZ user ID (when linked)
- `status` - active, inactive, blocked, pending_verification

### TelegramMessage
- `telegram_message_id` - Telegram message ID
- `user_id` - REZ user ID
- `chat_id` - Telegram chat ID
- `content` - Message text
- `direction` - incoming or outgoing
- `has_media` - Whether message has media
- `timestamp` - Message timestamp

### TelegramSession
- `user_id` - REZ user ID
- `telegram_chat_id` - Telegram chat ID
- `started_at` - When session started
- `message_count` - Messages in session
- `is_active` - Session status

### TelegramConversationContext
- `user_id` - REZ user ID
- `chat_id` - Telegram chat ID
- `recent_topics` - Detected topics
- `pending_actions` - Actions awaiting completion
- `conversation_turns` - Number of exchanges

## Security

- **Webhook Verification**: All webhook requests validated with secret token
- **Tenant Isolation**: Data separated by tenant ID
- **Rate Limiting**: 100 requests/min global, 30 writes/min
- **Input Validation**: Zod schemas for all inputs
- **HTTPS Only**: Webhook requires HTTPS endpoint

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: 4710) |
| `MONGODB_URI` | Yes | MongoDB connection string |
| `TELEGRAM_BOT_TOKEN` | Yes | Telegram bot API token |
| `TELEGRAM_WEBHOOK_URL` | No | Public URL for webhooks |
| `WEBHOOK_SECRET_TOKEN` | Yes | Secret for webhook auth |
| `GENIE_MEMORY_SERVICE_URL` | No | Memory service URL |
| `GENIE_RELATIONSHIP_SERVICE_URL` | No | Relationship service URL |
| `GENIE_BRIEFING_SERVICE_URL` | No | Briefing service URL |

## Contributing

Follow the REZ ecosystem conventions:

- TypeScript with strict mode
- Zod for validation
- Express for HTTP
- Mongoose for MongoDB
- Structured logging with timestamps

## License

Part of the REZ Ecosystem - RTNM Group
