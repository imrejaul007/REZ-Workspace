# Pinterest Integration Service

**Port:** 5095

Pinterest API integration service for AdBazaar - provides OAuth authentication, board management, pin creation, analytics, and audience insights.

## Features

- OAuth 2.0 authentication with Pinterest
- Board management (create, update, delete, sync)
- Pin creation (image, video, Idea Pins)
- Pin scheduling
- Rich pin optimization
- Shopping integration (Buyable Pins)
- Comment management
- Pinterest Analytics
- Audience insights
- Shop the Look pins

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB 6+
- Pinterest App credentials

### Installation

```bash
cd pinterest-integration
npm install
```

### Configuration

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Required environment variables:
- `PINTEREST_APP_ID` - Your Pinterest App ID
- `PINTEREST_APP_SECRET` - Your Pinterest App Secret
- `PINTEREST_REDIRECT_URI` - OAuth callback URL
- `MONGODB_URI` - MongoDB connection string

### Running the Service

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

### Health Check

```bash
curl http://localhost:5095/api/health
```

### Metrics

```bash
curl http://localhost:5095/metrics
```

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/oauth` | Initiate OAuth flow |
| GET | `/api/auth/callback` | OAuth callback handler |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/verify` | Verify token validity |

### Accounts

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/accounts` | List connected accounts |
| GET | `/api/accounts/:id` | Get account details |
| POST | `/api/accounts/connect` | Connect Pinterest account |
| POST | `/api/accounts/:id/disconnect` | Disconnect account |
| POST | `/api/accounts/:id/sync` | Sync account data |

### Boards

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/boards` | List boards |
| GET | `/api/boards/:id` | Get board details |
| POST | `/api/boards` | Create board |
| PATCH | `/api/boards/:id` | Update board |
| DELETE | `/api/boards/:id` | Delete board |
| POST | `/api/boards/:id/sync` | Sync board pins |

### Pins

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/pins` | List pins |
| GET | `/api/pins/:id` | Get pin details |
| POST | `/api/pins` | Create pin |
| PATCH | `/api/pins/:id` | Update pin |
| DELETE | `/api/pins/:id` | Delete pin |
| POST | `/api/pins/:id/schedule` | Schedule pin |
| POST | `/api/idea-pins` | Create Idea Pin |
| POST | `/api/pins/:id/buyable` | Add buyable functionality |
| POST | `/api/pins/:id/rich-pin` | Configure rich pin |

### Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics` | Overall analytics |
| GET | `/api/analytics/audience` | Audience insights |
| GET | `/api/analytics/pins/:id` | Pin analytics |
| GET | `/api/analytics/boards/:id` | Board analytics |
| GET | `/api/analytics/export` | Export analytics data |

### Comments

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/comments` | List comments |
| GET | `/api/comments/:id` | Get comment details |
| POST | `/api/comments/:id/hide` | Hide comment |
| POST | `/api/comments/:id/unhide` | Unhide comment |
| DELETE | `/api/comments/:id` | Delete comment |

## Authentication

Most API endpoints require authentication using Bearer token:

```
Authorization: Bearer <access_token>
X-Pinterest-User-Id: <pinterest_user_id>
```

## Data Models

### PinterestAccount
- Pinterest user information
- OAuth tokens
- Connection status

### PinterestBoard
- Board metadata
- Pin counts
- Privacy settings

### PinterestPin
- Pin content and media
- Engagement metrics
- Scheduling information

### PinterestComment
- Comment text and author
- Visibility status

### PinterestAnalytics
- Daily analytics snapshots
- Audience insights

## Docker Support

```bash
# Build
docker build -t pinterest-integration .

# Run
docker run -p 5095:5095 --env-file .env pinterest-integration
```

## License

Proprietary - AdBazaar
