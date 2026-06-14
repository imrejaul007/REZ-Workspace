# REZ Hotel Messaging Service

Guest Messaging System for Hotel Ecosystem

**Port:** 4018

## Features

- In-app guest chat
- Pre-stay messaging (confirmations, requests)
- In-stay messaging (room service, housekeeping)
- Post-stay messaging (reviews, re-engagement)
- Staff-guest communication
- WhatsApp integration ready
- Push notifications ready
- Message templates
- Bulk messaging for announcements
- Read receipts and delivery status

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| POST | /api/conversations | Create new conversation |
| GET | /api/conversations | List conversations |
| GET | /api/conversations/:conversationId | Get conversation details |
| PUT | /api/conversations/:conversationId | Update conversation |
| POST | /api/messages/send | Send a message |
| GET | /api/messages/conversation/:conversationId | Get messages for conversation |
| PUT | /api/messages/read | Mark messages as read |
| POST | /api/messages/bulk | Send bulk messages |
| GET | /api/templates | List message templates |
| POST | /api/templates | Create message template |
| POST | /api/templates/:templateId/send | Send templated message |

## Quick Start

```bash
# Install dependencies
npm install

# Start the service
npm start

# Development mode with hot reload
npm run dev
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 4018 | Service port |
| MONGO_URL | mongodb://localhost:27017/rez_hotel_messaging | MongoDB connection string |
| REDIS_URL | redis://localhost:6379 | Redis connection string |
| NOTIFICATION_SERVICE_URL | http://localhost:4011 | Notification service URL |
| AUTH_SERVICE_URL | http://localhost:4002 | Auth service URL |
| INTERNAL_SERVICE_TOKEN | - | Internal service authentication token |
| ALLOWED_ORIGINS | - | Allowed CORS origins (comma-separated) |
