# Hashtag Research Engine

**Port:** 5090  
**Company:** AdBazaar  
**Purpose:** Discover trending hashtags with analytics

## Features

- **Trending Hashtag Discovery** - Find trending hashtags with velocity and change rate metrics
- **Hashtag Suggestions** - Get AI-powered hashtag suggestions based on content
- **Content Analysis** - Analyze content to extract keywords, sentiment, and category
- **Banned Hashtag Check** - Verify if hashtags are banned or safe to use
- **Hashtag Sets** - Save and manage favorite hashtag combinations
- **Hashtag Mixing** - Create balanced mixes of high, medium, and niche hashtags
- **Reach Estimation** - Estimate potential reach for each hashtag
- **Related Hashtags** - Discover related hashtags based on relationships

## API Endpoints

### Hashtags

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/hashtags/search` | Search hashtags by keyword |
| POST | `/api/hashtags/suggest` | Suggest hashtags for content |
| GET | `/api/hashtags/:tag` | Get hashtag details |
| POST | `/api/hashtags/trending` | Get trending hashtags |
| POST | `/api/hashtags/check` | Check if hashtags are banned |
| POST | `/api/hashtags/analyze` | Analyze content for suggestions |
| POST | `/api/hashtags/mix` | Create hashtag mix (high/medium/niche) |

### Hashtag Sets

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/hashtags/sets` | List saved hashtag sets |
| GET | `/api/hashtags/sets/popular` | Get popular hashtag sets |
| GET | `/api/hashtags/sets/search?q=` | Search hashtag sets |
| GET | `/api/hashtags/sets/:id` | Get hashtag set by ID |
| POST | `/api/hashtags/sets` | Create hashtag set |
| PUT | `/api/hashtags/sets/:id` | Update hashtag set |
| DELETE | `/api/hashtags/sets/:id` | Delete hashtag set |

### System

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/metrics` | Prometheus metrics |

## Quick Start

```bash
# Install dependencies
cd hashtag-research-engine
npm install

# Start in development
npm run dev

# Build for production
npm run build
npm start
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```env
PORT=5090
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/hashtag-research-engine
LOG_LEVEL=info
INTERNAL_SERVICE_TOKEN=your-token-here
```

## Data Models

### Hashtag

```typescript
{
  tag: string;              // Hashtag name (lowercase)
  usageCount: number;       // Total usage count
  trending: boolean;         // Is currently trending
  trendingDirection: 'up' | 'down' | 'stable';
  category?: string;         // Category (food, fashion, travel, etc.)
  avgEngagement: number;     // Average engagement
  topPosts?: string[];      // Top performing posts
  relatedTags: string[];     // Related hashtag tags
  banned: boolean;           // Is banned
  lastUpdated: Date;
}
```

### HashtagSet

```typescript
{
  id: string;               // Unique ID
  name: string;             // Set name
  tags: string[];           // List of hashtags
  createdAt: Date;
  usageCount: number;       // Usage count
  createdBy?: string;       // Creator ID
  isPublic: boolean;        // Is publicly available
  category?: string;
}
```

## Hashtag Categories

- food
- fashion
- travel
- fitness
- tech
- beauty
- business
- lifestyle

## Template Sets

Pre-built hashtag sets available:
- food-blogger
- fashion-influencer
- travel-adventure
- fitness-coach
- tech-startup
- beauty-guru
- business-mindset
- lifestyle-daily

## Authentication

Protected routes require either:
- `X-Internal-Token` header (internal services)
- `X-API-Key` header (external API)

Public endpoints:
- `/health`
- `/metrics`
- `/api/hashtags/trending`

## Metrics

Prometheus metrics available at `/metrics`:
- `http_request_duration_seconds` - Request duration histogram
- `http_requests_total` - Total request counter
- `hashtag_search_total` - Hashtag search counter
- `hashtag_cache_hits_total` - Cache hit counter
- `trending_hashtags_count` - Gauge of trending hashtags
- `hashtag_sets_created_total` - Counter of created sets
