# Instagram Publishing Service

**Port:** 5081

**Purpose:** Publish feed posts, Reels, and Stories to Instagram via the Instagram Graph API.

## Quick Start

```bash
# Install dependencies
cd instagram-publishing-service
npm install

# Copy environment file
cp .env.example .env

# Start in development mode
npm run dev

# Or with Docker
docker-compose up -d
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | Yes | Server port (default: 5081) |
| `MONGODB_URI` | Yes | MongoDB connection string |
| `INSTAGRAM_APP_ID` | Yes | Instagram App ID from Meta Developer |
| `INSTAGRAM_APP_SECRET` | Yes | Instagram App Secret |
| `INSTAGRAM_ACCESS_TOKEN` | Yes | Long-lived access token |
| `INSTAGRAM_BUSINESS_ACCOUNT_ID` | Yes | Instagram Business Account ID |
| `SCHEDULER_ENABLED` | No | Enable scheduled content publishing |
| `API_KEY` | Yes | API key for authentication |

## API Endpoints

### Publishing

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/publish` | Publish content immediately |
| POST | `/api/publish/schedule` | Schedule content for future |
| POST | `/api/publish/draft` | Save as draft |
| GET | `/api/publish/drafts` | List drafts |
| GET | `/api/content/:id` | Get content details |
| DELETE | `/api/content/:id` | Delete content |
| GET | `/api/accounts/:id/content` | Account content |

### Accounts

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/accounts` | List connected accounts |
| GET | `/api/accounts/:id` | Get account details |
| POST | `/api/accounts/:id/connect` | Connect Instagram account |
| POST | `/api/accounts/:id/disconnect` | Disconnect account |
| POST | `/api/accounts/:id/sync` | Sync account data |

### Webhooks

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/webhooks/instagram` | Webhook verification |
| POST | `/api/webhooks/instagram` | Webhook events |

### Monitoring

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/metrics` | Prometheus metrics |

## Content Types

- `feed_image` - Single image post
- `feed_album` - Multi-image carousel
- `feed_video` - Video post
- `reel` - Instagram Reel
- `story` - Instagram Story

## Example Usage

### Publish an image post

```bash
curl -X POST http://localhost:5081/api/publish \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "accountId": "account-123",
    "contentType": "feed_image",
    "mediaUrl": "https://example.com/image.jpg",
    "caption": "Check out our new product!",
    "hashtags": ["product", "launch", "new"],
    "firstComment": "Link in bio for more info"
  }'
```

### Schedule content

```bash
curl -X POST http://localhost:5081/api/publish/schedule \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "accountId": "account-123",
    "contentType": "feed_image",
    "mediaUrl": "https://example.com/image.jpg",
    "caption": "Scheduled post",
    "scheduledTime": "2026-06-15T10:00:00Z"
  }'
```

### Connect Instagram account

```bash
curl -X POST http://localhost:5081/api/accounts/account-123/connect \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "accessToken": "your-facebook-access-token",
    "pageId": "optional-page-id"
  }'
```

## Architecture

```
src/
├── index.ts          # Main entry point
├── config/           # Configuration
├── routes/           # API routes
├── services/         # Business logic
├── models/           # MongoDB models
├── middleware/       # Express middleware
└── utils/            # Utilities (logger)
```

## Health Checks

```bash
# Health check
curl http://localhost:5081/health

# Prometheus metrics
curl http://localhost:5081/metrics
```

## Docker

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f instagram-publishing-service

# Stop
docker-compose down
```