# AdBazaar In-App Messaging Service

In-app messaging system for AdBazaar with real-time support.

## Features

- Real-time messaging with Socket.IO
- Direct, group, support, and campaign conversations
- Message types: text, image, file, system, action
- Notifications system with read tracking
- Typing indicators
- Read receipts
- Message history with pagination

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
| PORT | Service port | 5041 |
| MONGODB_URI | MongoDB connection string | mongodb://localhost:27017/adbazaar_messaging |
| REDIS_URL | Redis connection string | redis://localhost:6379 |
| INTERNAL_SERVICE_TOKEN | Service-to-service auth token | - |

## API Endpoints

### Conversations

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/conversations | Create a new conversation |
| GET | /api/conversations | List user's conversations |
| GET | /api/conversations/:id | Get conversation by ID |
| DELETE | /api/conversations/:id | Delete conversation |
| PUT | /api/conversations/:id/settings | Update participant settings |

### Messages

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/messages | Send a message |
| GET | /api/messages/:id | Get message by ID |
| GET | /api/messages/conversation/:id | Get messages for a conversation |
| POST | /api/messages/read | Mark messages as read |
| POST | /api/messages/broadcast | Broadcast message to multiple conversations |

### Notifications

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/notifications | Get user notifications |
| POST | /api/notifications | Create a notification |
| PUT | /api/notifications/:id/read | Mark notification as read |
| PUT | /api/notifications/read-all | Mark all notifications as read |

### System

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| GET | /metrics | Prometheus metrics |

## Socket.IO Events

### Client -> Server

| Event | Payload | Description |
|-------|---------|-------------|
| join | userId | Join user's room |
| join-conversation | conversationId | Join conversation room |
| leave-conversation | conversationId | Leave conversation room |
| typing | { conversationId, userId } | User is typing |

### Server -> Client

| Event | Payload | Description |
|-------|---------|-------------|
| new-message | Message | New message received |
| notification | Notification | New notification |
| user-typing | { conversationId, userId } | User typing indicator |

## Request/Response Examples

### Create Conversation

```bash
curl -X POST http://localhost:5041/api/conversations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "participants": [
      { "userId": "user1", "role": "owner" },
      { "userId": "user2" }
    ],
    "type": "direct",
    "title": "Chat with User 2"
  }'
```

### Send Message

```bash
curl -X POST http://localhost:5041/api/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "conversationId": "conv123",
    "content": "Hello, this is a test message!",
    "messageType": "text"
  }'
```

## License

MIT