# AI Banner Generator Service

AI-powered banner generation service for AdBazaar - creates ad banners from text descriptions or images.

## Features

- **Text-to-Banner Generation**: Generate banners from natural language descriptions
- **Multiple Formats**: Support for static, animated, and video banners
- **Style Options**: Modern, classic, bold, and minimal styles
- **Brand Guidelines**: Enforce brand colors, fonts, and logos
- **Multi-Size Variants**: Generate multiple sizes from a single banner
- **Template Library**: Save and reuse banner layouts
- **A/B Testing**: Generate variants for testing
- **Performance Prediction**: AI-powered CTR and conversion predictions
- **Prometheus Metrics**: Full observability with metrics endpoint

## Port

**4840**

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Cache**: Redis
- **Authentication**: JWT
- **Validation**: Zod
- **Metrics**: Prometheus (prom-client)
- **Language**: TypeScript

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB running on localhost:27017
- Redis running on localhost:6379 (optional)

### Installation

```bash
cd ai-banner-generator
npm install
```

### Configuration

Create a `.env` file or set environment variables:

```env
PORT=4840
MONGODB_URI=mongodb://localhost:27017/ai-banner-generator
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secure-jwt-secret
OPENAI_API_KEY=your-openai-key
IMAGE_CDN_URL=https://cdn.adbazaar.com
```

### Running

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

### Health Check

```bash
curl http://localhost:4840/health
```

## API Endpoints

### Banner Generation

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/generate/banner` | Generate a new banner |
| POST | `/api/generate/variant` | Generate banner variants |
| GET | `/api/banners/:id` | Get banner by ID |
| POST | `/api/banners/:id/regenerate` | Regenerate with changes |
| GET | `/api/banners` | List banners |
| GET | `/api/banners/:id/performance` | Predict performance |
| GET | `/api/banners/stats` | Get statistics |

### Templates

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/templates` | List templates |
| POST | `/api/templates` | Create template |
| GET | `/api/templates/:id` | Get template |
| PUT | `/api/templates/:id` | Update template |
| DELETE | `/api/templates/:id` | Delete template |
| GET | `/api/templates/categories` | Get categories |
| GET | `/api/templates/popular` | Get popular templates |

### System

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/ready` | Readiness check |
| GET | `/metrics` | Prometheus metrics |

## API Examples

### Generate Banner

```bash
curl -X POST http://localhost:4840/api/generate/banner \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "description": "Summer sale banner with beach theme",
    "dimensions": { "width": 728, "height": 90 },
    "format": "static",
    "style": "modern",
    "colors": ["#FF6B6B", "#4ECDC4"],
    "brandGuidelines": {
      "primaryColor": "#FF6B6B",
      "secondaryColor": "#4ECDC4",
      "font": "Inter"
    }
  }'
```

### Generate Variants

```bash
curl -X POST http://localhost:4840/api/generate/variant \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "baseGenerationId": "gen-abc123",
    "count": 3,
    "variations": [
      { "style": "bold" },
      { "style": "minimal" },
      { "colors": ["#1A1A2E", "#E94560"] }
    ]
  }'
```

### Create Template

```bash
curl -X POST http://localhost:4840/api/templates \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "Summer Sale Banner",
    "category": "promotion",
    "dimensions": { "width": 728, "height": 90 },
    "layout": {
      "elements": [
        {
          "type": "text",
          "position": { "x": 10, "y": 20 },
          "style": { "fontSize": 24, "fontWeight": "bold" }
        },
        {
          "type": "cta",
          "position": { "x": 500, "y": 30 },
          "style": { "backgroundColor": "#FF6B6B", "padding": "10px 20px" }
        }
      ]
    },
    "isPublic": true
  }'
```

### List Templates

```bash
curl http://localhost:4840/api/templates?category=promotion&page=1&limit=20
```

## Standard Banner Sizes

| Name | Dimensions | Description |
|------|------------|-------------|
| leaderboard | 728x90 | Top of page |
| mediumRectangle | 300x250 | Sidebar/inset |
| wideSkyscraper | 160x600 | Side banner |
| halfPage | 300x600 | Large sidebar |
| largeRectangle | 336x280 | Content inset |
| mobileLeaderboard | 320x50 | Mobile top |
| largeMobileBanner | 320x100 | Mobile featured |
| billboard | 970x250 | Feature banner |
| square | 1080x1080 | Social/Instagram |
| story | 1080x1920 | Mobile story |
| portrait | 768x1024 | Print-ready |

## Authentication

All protected endpoints require JWT Bearer token:

```bash
Authorization: Bearer <token>
```

JWT payload structure:
```json
{
  "userId": "user-123",
  "advertiserId": "adv-456",
  "role": "advertiser"
}
```

## Response Format

### Success

```json
{
  "success": true,
  "data": { ... }
}
```

### Error

```json
{
  "success": false,
  "error": "Error message",
  "details": [ ... ] // optional
}
```

## Metrics

Prometheus metrics available at `/metrics`:

- `http_request_duration_seconds` - Request latency histogram
- `http_requests_total` - Total requests counter
- `banner_generations_total` - Total generations by status/format/style
- `banner_generation_duration_seconds` - Generation time histogram
- `template_usage_total` - Template usage counter
- `cache_hits_total` - Cache hit counter
- `cache_misses_total` - Cache miss counter

## Project Structure

```
ai-banner-generator/
├── package.json
├── tsconfig.json
├── README.md
└── src/
    ├── index.ts              # Entry point
    ├── config/
    │   └── index.ts          # Environment config
    ├── types/
    │   └── index.ts          # TypeScript interfaces
    ├── models/
    │   ├── BannerGeneration.ts
    │   ├── BannerTemplate.ts
    │   └── index.ts
    ├── services/
    │   ├── banner.service.ts
    │   ├── template.service.ts
    │   ├── redis.service.ts
    │   └── index.ts
    ├── middleware/
    │   ├── auth.ts
    │   ├── validation.ts
    │   ├── metrics.ts
    │   ├── errorHandler.ts
    │   └── index.ts
    ├── routes/
    │   ├── generation.routes.ts
    │   ├── template.routes.ts
    │   └── index.ts
    └── utils/
        └── logger.ts
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 4840 | Server port |
| NODE_ENV | development | Environment mode |
| MONGODB_URI | mongodb://localhost:27017/ai-banner-generator | MongoDB connection string |
| REDIS_URL | redis://localhost:6379 | Redis connection string |
| REDIS_ENABLED | true | Enable/disable Redis |
| JWT_SECRET | your-jwt-secret | JWT signing secret |
| JWT_EXPIRES_IN | 24h | Token expiration |
| OPENAI_API_KEY | - | OpenAI API key |
| OPENAI_ENABLED | false | Use real AI generation |
| IMAGE_CDN_URL | https://cdn.adbazaar.com | CDN base URL |
| RATE_LIMIT_WINDOW_MS | 900000 | Rate limit window (15 min) |
| RATE_LIMIT_MAX_REQUESTS | 100 | Max requests per window |
| LOG_LEVEL | info | Logging level |

## License

Proprietary - AdBazaar
