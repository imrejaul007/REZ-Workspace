# Unified Social Inbox Service

Single inbox for all social DMs - Instagram, Facebook, Twitter, LinkedIn, WhatsApp.

## Features

- **Multi-platform aggregation**: Connect all social media DMs in one place
- **Real-time sync**: Socket.io for instant message updates
- **Smart routing**: Auto-assign conversations based on keywords
- **Quick replies**: Canned responses for faster replies
- **Team collaboration**: Assign, transfer, and track conversations
- **Sentiment analysis**: Auto-detect conversation sentiment
- **Priority sorting**: High priority conversations first
- **Snooze**: Temporarily hide conversations
- **SLA tracking**: Monitor response times
- **Full history**: Complete conversation archive

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your API keys

# Start in development
npm run dev

# Build for production
npm run build

# Start production
npm start
```

## API Endpoints

### Inbox

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/inbox` | Get all conversations |
| GET | `/api/inbox/:platform` | Get platform-specific conversations |
| GET | `/api/inbox/thread/:id` | Get conversation thread with messages |
| POST | `/api/inbox/message` | Send message |
| POST | `/api/inbox/reply/:id` | Reply to thread |
| POST | `/api/inbox/forward` | Forward message |
| POST | `/api/inbox/snooze` | Snooze conversation |
| POST | `/api/inbox/unsnooze` | Unsnooze conversation |
| PATCH | `/api/inbox/thread/:id/assign` | Assign conversation |
| PATCH | `/api/inbox/thread/:id/tags` | Update tags |
| PATCH | `/api/inbox/thread/:id/status` | Update status |
| GET | `/api/inbox/stats` | Get inbox statistics |

### Templates

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/templates` | Get all templates |
| POST | `/api/templates` | Create template |
| PATCH | `/api/templates/:id` | Update template |
| GET | `/api/templates/categories` | Get template categories |

### Settings

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/settings` | Get inbox settings |
| PATCH | `/api/settings` | Update settings |
| POST | `/api/settings/rules` | Add assignment rule |
| DELETE | `/api/settings/rules/:ruleId` | Remove assignment rule |

### Health & Metrics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/metrics` | Prometheus metrics |

## Socket.io Events

### Client → Server

- `account:join` - Join account room
- `conversation:join` - Join conversation room
- `typing:start` - Start typing indicator
- `typing:stop` - Stop typing indicator

### Server → Client

- `message:new` - New message received
- `message:read` - Message marked as read
- `conversation:updated` - Conversation updated
- `typing:start` - User typing indicator
- `typing:stop` - User stopped typing

## Environment Variables

```env
PORT=5102
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/unified_social_inbox

# Instagram
INSTAGRAM_ACCESS_TOKEN=your_token

# Twitter/X
TWITTER_API_KEY=your_key
TWITTER_BEARER_TOKEN=your_bearer_token

# LinkedIn
LINKEDIN_CLIENT_ID=your_client_id
LINKEDIN_CLIENT_SECRET=your_client_secret

# WhatsApp
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_verify_token

# Facebook
FACEBOOK_ACCESS_TOKEN=your_token
```

## Architecture

```
unified-social-inbox/
├── src/
│   ├── config/          # Configuration
│   ├── models/          # Mongoose models
│   ├── routes/          # Express routes
│   ├── services/        # Business logic
│   ├── middleware/      # Express middleware
│   ├── utils/           # Utilities
│   └── index.ts         # Entry point
├── package.json
└── tsconfig.json
```

## License

ISC
