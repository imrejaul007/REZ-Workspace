# YouTube Integration Service

YouTube API integration service for video publishing and management in AdBazaar.

## Features

- OAuth 2.0 authentication with YouTube
- Video upload (shorts, long-form)
- Thumbnail selection
- Title and description optimization
- Tags management
- Playlist management
- Comment moderation
- Live streaming support
- Community post publishing
- Analytics and insights
- Caption/subtitle management

## Tech Stack

- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose
- **Language:** TypeScript
- **API:** REST

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

# Start production
npm start
```

## Configuration

Create a `.env` file with the following variables:

```env
# YouTube API Configuration
YOUTUBE_CLIENT_ID=your_client_id_here
YOUTUBE_CLIENT_SECRET=your_client_secret_here
YOUTUBE_API_KEY=your_api_key_here
YOUTUBE_REDIRECT_URI=http://localhost:5094/api/auth/callback

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/youtube-integration

# Service Configuration
PORT=5094
NODE_ENV=development

# Internal Service Token (for inter-service communication)
INTERNAL_SERVICE_TOKEN=your_internal_service_token_here

# Logging
LOG_LEVEL=info
```

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/oauth` | Initiate OAuth flow |
| GET | `/api/auth/callback` | OAuth callback handler |
| POST | `/api/auth/connect` | Connect YouTube channel |

### Channels

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/channels` | List connected channels |
| GET | `/api/channels/:id` | Get channel by ID |
| POST | `/api/channels/connect` | Connect YouTube channel |
| POST | `/api/channels/:id/refresh` | Refresh channel stats |
| DELETE | `/api/channels/:id` | Disconnect channel |

### Videos

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/videos` | Upload video |
| GET | `/api/videos` | List videos |
| GET | `/api/videos/:id` | Get video details |
| PATCH | `/api/videos/:id` | Update video metadata |
| DELETE | `/api/videos/:id` | Delete video |
| GET | `/api/videos/:id/analytics` | Get video analytics |
| POST | `/api/videos/:id/thumbnail` | Set video thumbnail |
| POST | `/api/videos/:id/captions` | Add caption/subtitle |

### Playlists

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/playlists` | Create playlist |
| GET | `/api/playlists` | List playlists |
| GET | `/api/playlists/:id` | Get playlist by ID |
| POST | `/api/playlists/:id/videos` | Add video to playlist |
| DELETE | `/api/playlists/:id/videos/:videoId` | Remove video from playlist |
| DELETE | `/api/playlists/:id` | Delete playlist |

### Comments

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/comments` | Get comments |
| GET | `/api/comments/stats` | Get comment statistics |
| POST | `/api/comments/moderate` | Moderate a comment |
| POST | `/api/comments/moderate/batch` | Moderate multiple comments |
| POST | `/api/comments/sync/:videoId` | Sync comments from YouTube |

### Live Streaming

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/live/create` | Create live stream |
| POST | `/api/live/start` | Start live stream |
| POST | `/api/live/end` | End live stream |
| GET | `/api/live/stats` | Get live stream stats |
| GET | `/api/live/current` | Get current live stream |
| GET | `/api/live` | List live streams |
| GET | `/api/live/:id` | Get live stream by ID |
| DELETE | `/api/live/:id` | Delete live stream |

### Monitoring

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/metrics` | Prometheus metrics |

## Authentication

### Internal Service Token

For inter-service communication, use the `X-Internal-Token` header:

```bash
curl -H "X-Internal-Token: your_internal_service_token" \
  http://localhost:5094/api/channels
```

### OAuth Flow

1. Redirect user to `/api/auth/oauth`
2. User authorizes the application
3. YouTube redirects to `/api/auth/callback` with authorization code
4. Exchange code for tokens using `/api/auth/callback`
5. Use tokens to connect channel via `/api/auth/connect`

## Prometheus Metrics

The service exposes Prometheus metrics at `/metrics`:

- `youtube_integration_http_requests_total` - Total HTTP requests
- `youtube_integration_http_request_duration_seconds` - Request duration
- `youtube_integration_active_connections` - Active connections
- `youtube_integration_videos_uploaded_total` - Videos uploaded
- `youtube_integration_channels_connected` - Connected channels
- `youtube_integration_live_streams_active` - Active live streams

## Project Structure

```
youtube-integration/
├── src/
│   ├── config/           # Configuration files
│   ├── middleware/       # Express middleware
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   ├── services/       # Business logic
│   └── index.ts         # Application entry point
├── package.json
├── tsconfig.json
└── .env.example
```

## License

Internal - AdBazaar
