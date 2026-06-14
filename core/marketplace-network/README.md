# Marketplace Network - RTMN Unified Marketplace

Unified marketplace across all 24 industries with listings, providers, and search.

## Quick Start

```bash
cd core/marketplace-network
npm install
npm start
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/listings` | List listings |
| POST | `/api/listings` | Create listing |
| GET | `/api/orders` | List orders |
| GET | `/api/providers` | List providers |
| POST | `/api/providers` | Register provider |
| GET | `/api/search` | Unified search |
| GET | `/api/search/suggestions` | Search suggestions |

## Example

```bash
# Create listing
curl -X POST http://localhost:3031/api/listings \
  -H "Content-Type: application/json" \
  -d '{"title": "POS System", "industry": "retail", "price": 999}'

# Search
curl "http://localhost:3031/api/search?q=POS&industry=retail"
```

## Docker

```bash
docker build -t rtmn-marketplace-network core/marketplace-network
docker run -p 3031:3031 rtmn-marketplace-network
```
