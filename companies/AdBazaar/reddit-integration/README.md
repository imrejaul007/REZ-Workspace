# Reddit Integration Service

**Port:** 5110  
**Company:** AdBazaar  
**Purpose:** Reddit API integration for marketing and content management

## Overview

This service provides a comprehensive Reddit API integration for AdBazaar's marketing platform. It enables posting, commenting, analytics, and scheduling capabilities across Reddit communities.

## Features

- **OAuth Authentication** - Secure Reddit OAuth flow for account linking
- **Multi-Account Support** - Manage multiple Reddit accounts
- **Post Management** - Create, update, delete, and schedule posts
- **Comment System** - Post comments, reply to threads, manage discussions
- **Voting** - Upvote/downvote posts and comments
- **Subreddit Tracking** - Track and monitor subreddits
- **Analytics** - Engagement metrics, trending posts, performance analytics
- **Scheduling** - Schedule posts for future publication
- **Rate Limiting** - Built-in rate limiting to prevent API throttling

## Tech Stack

- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose
- **Language:** TypeScript
- **Monitoring:** Prometheus metrics
- **Logging:** Winston

## Quick Start

```bash
# Install dependencies
cd reddit-integration
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your credentials
# - REDDIT_CLIENT_ID
# - REDDIT_CLIENT_SECRET
# - REDDIT_REDIRECT_URI
# - MONGODB_URI

# Start development server
npm run dev

# Or build and run production
npm run build
npm start
```

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/oauth` | Initiate OAuth flow |
| GET | `/api/auth/callback` | OAuth callback |
| GET | `/api/auth/accounts` | List linked accounts |
| DELETE | `/api/auth/accounts/:id` | Unlink account |
| POST | `/api/auth/refresh/:id` | Refresh tokens |

### Subreddits

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/subreddits` | List tracked subreddits |
| POST | `/api/subreddits` | Add subreddit to track |
| GET | `/api/subreddits/:name` | Get subreddit details |
| DELETE | `/api/subreddits/:name` | Remove subreddit |

### Posts

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/posts` | Create a new post |
| GET | `/api/posts` | List posts |
| GET | `/api/posts/:id` | Get single post |
| PATCH | `/api/posts/:id` | Update post |
| DELETE | `/api/posts/:id` | Delete post |

### Comments

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/comments` | Post a comment |
| GET | `/api/comments` | Get comments |
| GET | `/api/comments/:id` | Get single comment |
| DELETE | `/api/comments/:id` | Delete comment |
| POST | `/api/comments/vote` | Vote on post/comment |

### Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics` | Overall analytics |
| GET | `/api/analytics/subreddit` | Subreddit analytics |
| GET | `/api/analytics/trending` | Trending posts |
| GET | `/api/analytics/subreddits` | All subreddits summary |
| GET | `/api/analytics/engagement` | Engagement over time |

### Scheduling

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/schedule` | Schedule a post |
| GET | `/api/schedule` | List scheduled posts |
| GET | `/api/schedule/:id` | Get scheduled post |
| DELETE | `/api/schedule/:id` | Cancel scheduled post |
| POST | `/api/schedule/:id/retry` | Retry failed post |
| GET | `/api/schedule/stats` | Scheduler statistics |

### System

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/metrics` | Prometheus metrics |

## Authentication

All protected endpoints require authentication via one of:

1. **Internal Service Token:**
   ```bash
   curl -H "X-Internal-Token: your-token" \
        -H "X-Account-Id: account-id" \
        https://api.example.com/api/posts
   ```

2. **JWT Bearer Token:**
   ```bash
   curl -H "Authorization: Bearer your-jwt-token" \
        https://api.example.com/api/posts
   ```

## Data Models

### RedditAccount
- `redditUserId` - Reddit user ID
- `username` - Reddit username
- `karma` - Total karma
- `linked` - OAuth link status
- `accessToken` - OAuth access token
- `refreshToken` - OAuth refresh token
- `tokenExpiresAt` - Token expiration time

### RedditPost
- `redditPostId` - Reddit post ID
- `subreddit` - Target subreddit
- `title` - Post title
- `content` - Post body text
- `url` - Link URL (optional)
- `mediaUrls` - Image/video URLs
- `postedAt` - Publication timestamp
- `metrics` - Score, upvotes, downvotes, comments, awards
- `flair` - Post flair
- `archived` - Archive status

### RedditComment
- `redditCommentId` - Reddit comment ID
- `postId` - Parent post ID
- `parentId` - Parent comment ID
- `content` - Comment text
- `postedAt` - Publication timestamp
- `metrics` - Score, upvotes, downvotes, awards
- `depth` - Comment depth (0-8)
- `removed` - Removal status

### RedditSubreddit
- `subredditName` - Subreddit name (lowercase)
- `displayName` - Display title
- `members` - Subscriber count
- `online` - Online users
- `category` - Subreddit type
- `rules` - Community rules
- `nsfw` - NSFW flag
- `quarantined` - Quarantine status

### ScheduledPost
- `title` - Post title
- `content` - Post body
- `subreddit` - Target subreddit
- `scheduledFor` - Scheduled time
- `status` - pending/published/failed/cancelled
- `retryCount` - Retry attempts
- `maxRetries` - Maximum retries (default: 3)

## Environment Variables

```env
# Reddit OAuth
REDDIT_CLIENT_ID=your_client_id
REDDIT_CLIENT_SECRET=your_client_secret
REDDIT_REDIRECT_URI=http://localhost:5110/api/auth/callback

# Application
PORT=5110
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/reddit-integration

# Security
JWT_SECRET=your_jwt_secret
INTERNAL_SERVICE_TOKEN=internal_token

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

## Rate Limits

Reddit API has built-in rate limits. The service implements:

- **In-memory rate limiting** - 100 requests per minute per client
- **Automatic retry** - Exponential backoff on 429 responses
- **Token refresh** - Automatic token refresh before expiration

## Metrics

Prometheus metrics available at `/metrics`:

- `http_requests_total` - Total HTTP requests
- `http_request_duration_seconds` - Request latency
- `reddit_api_calls_total` - Reddit API calls
- `reddit_api_latency_seconds` - Reddit API latency
- `reddit_posts_created_total` - Posts created
- `reddit_comments_posted_total` - Comments posted
- `reddit_scheduled_posts_count` - Pending scheduled posts

## Error Handling

All errors return consistent JSON:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

## Development

```bash
# Run in development mode with hot reload
npm run dev

# Run tests
npm test

# Lint code
npm run lint
```

## Production

```bash
# Build for production
npm run build

# Run with PM2
pm2 start dist/index.js --name reddit-integration

# Or with Docker
docker build -t reddit-integration .
docker run -p 5110:5110 reddit-integration
```

## License

Internal use only - AdBazaar
