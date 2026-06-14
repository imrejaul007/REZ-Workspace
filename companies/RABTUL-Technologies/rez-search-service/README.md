# REZ Search Service

Full-text search microservice for products, merchants, and content search with intent capture.

## Purpose

The Search Service provides:
- Full-text search across products and merchants
- Autocomplete suggestions
- Search analytics and trending
- Intent capture for ReZ Mind
- Personalized search results
- Fuzzy matching for typo tolerance

## Environment Variables

```env
# Service Configuration
NODE_ENV=development
PORT=4003
LOG_LEVEL=info

# Database
MONGODB_URI=mongodb://localhost:27017/rez-search

# Cache
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=change-me-generate-with-openssl-rand-base64-64

# CORS
CORS_ORIGIN=http://localhost:3000

# Trust Proxy (for rate limiting - only behind trusted proxy!)
TRUST_PROXY=false

# RTMN Commerce Memory
INTENT_CAPTURE_URL=https://rez-intent-graph.onrender.com
INTERNAL_SERVICE_TOKEN=change-me-generate-with-openssl-rand-base64-64

# Observability
SENTRY_DSN=
SENTRY_ENVIRONMENT=development
SENTRY_TRACES_SAMPLE_RATE=0.1
```

## Local Development

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server
npm run dev

# Production build
npm run build

# Start production server
npm start
```

## API Endpoints

### Search Operations

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/search | General search |
| GET | /api/search/products | Product search |
| GET | /api/search/merchants | Merchant search |
| GET | /api/search/suggestions | Autocomplete |
| GET | /api/search/trending | Trending searches |

### Search Filters

| Parameter | Type | Description |
|-----------|------|-------------|
| q | string | Search query |
| category | string | Filter by category |
| merchant | string | Filter by merchant |
| minPrice | number | Minimum price |
| maxPrice | number | Maximum price |
| sort | string | Sort order (relevance, price_asc, price_desc, rating) |
| page | number | Page number |
| limit | number | Results per page |

### Health

| Method | Path | Description |
|--------|------|-------------|
| GET | /health | Health check |

## Search Features

### Autocomplete
- Real-time suggestions as user types
- Recent searches remembered
- Trending terms shown when empty

### Fuzzy Matching
- Typo tolerance (1-2 character errors)
- Phonetic matching
- Synonym support

### Ranking Factors
- Text relevance score
- Product popularity
- Merchant rating
- Recency

### Intent Capture

Every search query is sent to ReZ Mind for:
- User intent tracking
- Search analytics
- Personalization
- Demand aggregation

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────▶│   Search    │────▶│   MongoDB   │
│             │     │   Service   │     │   (Search)  │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │    ReZ      │
                    │    Mind     │
                    │  (Intent)  │
                    └─────────────┘
```

## Security

1. **Rate Limiting** - 100 requests per 15 minutes per IP
2. **Query Validation** - Sanitize search input
3. **JWT Authentication** - Required for some endpoints

## Deployment

### Render.com
1. Connect GitHub repository
2. Build command: `npm run build`
3. Start command: `npm start`
4. Ensure MongoDB text indexes are created

### Docker
```bash
docker build -t rez-search-service .
docker run -p 4003:4003 --env-file .env rez-search-service
```

## MongoDB Indexes

```javascript
// Products text index
db.products.createIndex({ name: "text", description: "text", tags: "text" })

// Merchants text index
db.merchants.createIndex({ name: "text", description: "text" })

// Search analytics
db.searches.createIndex({ query: 1, createdAt: -1 })
db.searches.createIndex({ userId: 1, createdAt: -1 })
```

## Related Services

- **rez-catalog-service** - Product data source
- **rez-merchant-service** - Merchant data source
- **rez-intent-graph** - ReZ Mind intent capture

## License

MIT
