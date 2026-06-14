# AssetMind API Specification

**Version:** 1.0  
**Date:** June 5, 2026  
**Status:** Production Ready

---

## Overview

AssetMind provides a comprehensive REST API and WebSocket interface for financial intelligence. The API enables access to asset data, scores, predictions, knowledge graphs, and AI-powered insights.

## Base URLs

| Environment | URL |
|-------------|-----|
| Development | http://localhost:5260 |
| Staging | https://staging-api.assetmind.ai |
| Production | https://api.assetmind.ai |

## Authentication

### API Key Authentication

All API requests must include an API key in the `X-API-Key` header:

```bash
curl -H "X-API-Key: your-api-key" https://api.assetmind.ai/api/v1/assets/AAPL
```

### Obtaining an API Key

1. Sign up at https://app.assetmind.ai
2. Navigate to Settings > API Keys
3. Generate a new API key
4. Store securely - keys are shown only once

### API Key Tiers

| Tier | Price | Features |
|------|-------|----------|
| Free | $0 | 100 req/min, limited data |
| Pro | $99/mo | 1,000 req/min, full data |
| Enterprise | $499/mo | Unlimited, white-label |

---

## Request Format

### Headers

```http
Content-Type: application/json
X-API-Key: your-api-key
Accept: application/json
```

### Response Format

All responses follow a consistent structure:

```json
{
  "status": "success",
  "data": { ... },
  "meta": {
    "timestamp": "2026-06-05T12:00:00Z",
    "request_id": "req_abc123",
    "latency_ms": 45
  }
}
```

### Error Responses

```json
{
  "status": "error",
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Retry after 60 seconds.",
    "details": {
      "limit": 100,
      "remaining": 0,
      "reset_at": "2026-06-05T12:01:00Z"
    }
  },
  "meta": {
    "timestamp": "2026-06-05T12:00:00Z",
    "request_id": "req_abc123"
  }
}
```

---

## Endpoints

### Core Endpoints

#### GET /api/v1/assets

List all available assets with optional filters.

**Query Parameters:**
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| asset_class | string | Filter by asset class (STOCK, CRYPTO, FOREX, COMMODITY, BOND, ETF, INDEX) | all |
| sector | string | Filter by sector | all |
| country | string | Filter by country code (US, GB, JP, IN) | all |
| min_market_cap | integer | Minimum market cap in USD | none |
| max_market_cap | integer | Maximum market cap in USD | none |
| limit | integer | Number of results (max 100) | 50 |
| offset | integer | Pagination offset | 0 |

**Request Example:**
```bash
curl -H "X-API-Key: your-api-key" \
  "https://api.assetmind.ai/api/v1/assets?asset_class=STOCK&sector=Technology&limit=10"
```

**Response Example:**
```json
{
  "status": "success",
  "data": {
    "assets": [
      {
        "id": "uuid-1234",
        "symbol": "AAPL",
        "name": "Apple Inc",
        "asset_class": "STOCK",
        "exchange": "NASDAQ",
        "sector": "Technology",
        "industry": "Consumer Electronics",
        "country": "US",
        "currency": "USD",
        "market_cap": 2900000000000,
        "price": 189.50,
        "change_1d": 1.25,
        "status": "ACTIVE"
      }
    ],
    "pagination": {
      "total": 250,
      "limit": 10,
      "offset": 0,
      "has_more": true
    }
  }
}
```

---

#### GET /api/v1/assets/{symbol}

Get detailed information for a specific asset.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| symbol | string | Asset symbol (e.g., AAPL, BTC, EURUSD) |

**Request Example:**
```bash
curl -H "X-API-Key: your-api-key" \
  "https://api.assetmind.ai/api/v1/assets/NVDA"
```

**Response Example:**
```json
{
  "status": "success",
  "data": {
    "id": "uuid-5678",
    "symbol": "NVDA",
    "name": "NVIDIA Corporation",
    "asset_class": "STOCK",
    "exchange": "NASDAQ",
    "sector": "Technology",
    "industry": "Semiconductors",
    "country": "US",
    "currency": "USD",
    "market_cap": 2100000000000,
    "price": 850.25,
    "change_1d": 2.50,
    "change_1w": 5.75,
    "change_1m": 15.30,
    "volume": 45000000,
    "avg_volume_30d": 42000000,
    "pe_ratio": 65.5,
    "eps": 13.00,
    "dividend_yield": 0.04,
    "status": "ACTIVE",
    "twin_id": "twin-nvda-001",
    "metadata": {
      "cik": "0001045810",
      "founded": 1993,
      "hq": "Santa Clara, CA"
    },
    "updated_at": "2026-06-05T11:30:00Z"
  }
}
```

---

#### GET /api/v1/assets/{symbol}/prices

Get price history for an asset.

**Query Parameters:**
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| interval | string | Time interval (1m, 5m, 15m, 1h, 4h, 1d, 1w) | 1d |
| start | string | Start date (ISO 8601) | 30 days ago |
| end | string | End date (ISO 8601) | now |
| limit | integer | Number of candles (max 1000) | 100 |

**Request Example:**
```bash
curl -H "X-API-Key: your-api-key" \
  "https://api.assetmind.ai/api/v1/assets/NVDA/prices?interval=1h&limit=100"
```

**Response Example:**
```json
{
  "status": "success",
  "data": {
    "symbol": "NVDA",
    "interval": "1h",
    "candles": [
      {
        "time": "2026-06-05T10:00:00Z",
        "open": 845.50,
        "high": 852.00,
        "low": 844.00,
        "close": 850.25,
        "volume": 1250000
      }
    ]
  }
}
```

---

#### GET /api/v1/assets/{symbol}/news

Get news articles for an asset.

**Query Parameters:**
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| limit | integer | Number of articles (max 50) | 10 |
| sentiment | string | Filter by sentiment (positive, negative, neutral) | all |

**Request Example:**
```bash
curl -H "X-API-Key: your-api-key" \
  "https://api.assetmind.ai/api/v1/assets/NVDA/news?limit=5"
```

**Response Example:**
```json
{
  "status": "success",
  "data": {
    "symbol": "NVDA",
    "articles": [
      {
        "id": "news-1234",
        "title": "NVIDIA Announces Next-Generation AI Chips",
        "source": "Financial Times",
        "url": "https://example.com/nvidia-ai-chips",
        "published_at": "2026-06-05T08:00:00Z",
        "sentiment": "positive",
        "sentiment_score": 75,
        "summary": "NVIDIA unveiled its latest AI accelerator chips..."
      }
    ]
  }
}
```

---

### Scores Endpoints

#### GET /api/v1/scores/{symbol}

Get all scores for an asset.

**Request Example:**
```bash
curl -H "X-API-Key: your-api-key" \
  "https://api.assetmind.ai/api/v1/scores/NVDA"
```

**Response Example:**
```json
{
  "status": "success",
  "data": {
    "symbol": "NVDA",
    "scores": {
      "health": {
        "value": 85,
        "trend": "stable",
        "confidence": 92,
        "updated_at": "2026-06-05T11:00:00Z"
      },
      "opportunity": {
        "value": 78,
        "trend": "increasing",
        "confidence": 88,
        "updated_at": "2026-06-05T11:00:00Z"
      },
      "risk": {
        "value": 25,
        "trend": "decreasing",
        "confidence": 90,
        "updated_at": "2026-06-05T11:00:00Z"
      },
      "sentiment": {
        "value": 72,
        "trend": "increasing",
        "confidence": 85,
        "updated_at": "2026-06-05T11:00:00Z"
      },
      "conviction": {
        "value": 80,
        "trend": "stable",
        "confidence": 88,
        "updated_at": "2026-06-05T11:00:00Z"
      },
      "institutional": {
        "value": 90,
        "trend": "increasing",
        "confidence": 95,
        "updated_at": "2026-06-05T11:00:00Z"
      },
      "financial": {
        "value": 82,
        "trend": "stable",
        "confidence": 94,
        "updated_at": "2026-06-05T11:00:00Z"
      },
      "technical": {
        "value": 75,
        "trend": "increasing",
        "confidence": 80,
        "updated_at": "2026-06-05T11:00:00Z"
      },
      "momentum": {
        "value": 88,
        "trend": "increasing",
        "confidence": 82,
        "updated_at": "2026-06-05T11:00:00Z"
      }
    }
  }
}
```

---

#### GET /api/v1/scores/{symbol}/{score_type}

Get a specific score for an asset.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| symbol | string | Asset symbol |
| score_type | string | Score type (health, opportunity, risk, sentiment, conviction, institutional, financial, technical, momentum) |

**Request Example:**
```bash
curl -H "X-API-Key: your-api-key" \
  "https://api.assetmind.ai/api/v1/scores/NVDA/health"
```

**Response Example:**
```json
{
  "status": "success",
  "data": {
    "symbol": "NVDA",
    "score_type": "health",
    "value": 85,
    "trend": "stable",
    "confidence": 92,
    "factors": [
      {
        "name": "Revenue Growth",
        "contribution": 15
      },
      {
        "name": "Market Position",
        "contribution": 20
      },
      {
        "name": "AI Leadership",
        "contribution": 25
      }
    ],
    "updated_at": "2026-06-05T11:00:00Z"
  }
}
```

---

### Predictions Endpoints

#### GET /api/v1/predictions/{symbol}

Get AI prediction for an asset.

**Query Parameters:**
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| time_horizon | string | Prediction time horizon (1d, 1w, 1m, 3m, 6m, 1y) | 1m |

**Request Example:**
```bash
curl -H "X-API-Key: your-api-key" \
  "https://api.assetmind.ai/api/v1/predictions/NVDA?time_horizon=1m"
```

**Response Example:**
```json
{
  "status": "success",
  "data": {
    "symbol": "NVDA",
    "time_horizon": "1m",
    "probabilities": {
      "bullish": 62,
      "neutral": 24,
      "bearish": 14
    },
    "confidence": 78,
    "model": "ensemble_v2.5",
    "reasoning_chain": [
      "Strong AI chip demand continues",
      "Data center revenue up 400% YoY",
      "Competitor AMD gaining share but NVIDIA still dominant",
      "Institutional buying increased 15% this month"
    ],
    "supporting_factors": [
      "AI infrastructure spending accelerating",
      "New product launches ahead",
      "Strong analyst coverage with buy ratings"
    ],
    "contradicting_factors": [
      "Valuation stretched at 65x PE",
      "Geopolitical risks in Taiwan",
      "Potential market correction"
    ],
    "updated_at": "2026-06-05T11:00:00Z"
  }
}
```

---

### Intelligence Endpoints

#### GET /api/v1/intelligence/financial/{symbol}

Get financial intelligence for an asset.

**Request Example:**
```bash
curl -H "X-API-Key: your-api-key" \
  "https://api.assetmind.ai/api/v1/intelligence/financial/AAPL"
```

**Response Example:**
```json
{
  "status": "success",
  "data": {
    "symbol": "AAPL",
    "income_statement": {
      "revenue": 383285000000,
      "gross_profit": 169115000000,
      "operating_income": 119437000000,
      "net_income": 97099000000,
      "eps": 6.13
    },
    "balance_sheet": {
      "total_assets": 352755000000,
      "total_liabilities": 290437000000,
      "total_equity": 62318000000,
      "cash": 62639000000
    },
    "ratios": {
      "pe_ratio": 28.5,
      "pb_ratio": 45.2,
      "debt_to_equity": 1.8,
      "current_ratio": 0.99,
      "quick_ratio": 0.92
    },
    "metrics": {
      "revenue_growth_yoy": 4.3,
      "earnings_growth_yoy": 11.2,
      "profit_margin": 25.3,
      "roe": 147.5,
      "roa": 27.5
    },
    "updated_at": "2026-06-05T11:00:00Z"
  }
}
```

---

#### GET /api/v1/intelligence/sentiment/{symbol}

Get sentiment intelligence for an asset.

**Request Example:**
```bash
curl -H "X-API-Key: your-api-key" \
  "https://api.assetmind.ai/api/v1/intelligence/sentiment/NVDA"
```

**Response Example:**
```json
{
  "status": "success",
  "data": {
    "symbol": "NVDA",
    "overall_sentiment": {
      "value": 72,
      "label": "positive",
      "confidence": 88
    },
    "sources": {
      "social": {
        "value": 75,
        "volume": 15000,
        "trend": "increasing"
      },
      "news": {
        "value": 78,
        "volume": 120,
        "trend": "stable"
      },
      "institutional": {
        "value": 85,
        "volume": 45,
        "trend": "increasing"
      },
      "analyst": {
        "value": 80,
        "volume": 25,
        "trend": "stable"
      }
    },
    "key_themes": [
      "AI chip demand",
      "Data center growth",
      "Gaming recovery"
    ],
    "updated_at": "2026-06-05T11:00:00Z"
  }
}
```

---

#### GET /api/v1/intelligence/risk/{symbol}

Get risk intelligence for an asset.

**Request Example:**
```bash
curl -H "X-API-Key: your-api-key" \
  "https://api.assetmind.ai/api/v1/intelligence/risk/NVDA"
```

**Response Example:**
```json
{
  "status": "success",
  "data": {
    "symbol": "NVDA",
    "overall_risk_score": 25,
    "risk_factors": [
      {
        "type": "geopolitical",
        "name": "Taiwan Strait Tensions",
        "severity": "high",
        "impact": 15,
        "description": "Concentration of manufacturing in Taiwan"
      },
      {
        "type": "market",
        "name": "Valuation Risk",
        "severity": "medium",
        "impact": 8,
        "description": "PE ratio above historical average"
      },
      {
        "type": "operational",
        "name": "Competition",
        "severity": "medium",
        "impact": 5,
        "description": "AMD gaining GPU market share"
      }
    ],
    "mitigation_factors": [
      "Strong cash position",
      "Diversified customer base",
      "Technology leadership"
    ],
    "updated_at": "2026-06-05T11:00:00Z"
  }
}
```

---

### Twin Endpoints

#### GET /api/v1/twin/{symbol}

Get complete digital twin for an asset.

**Request Example:**
```bash
curl -H "X-API-Key: your-api-key" \
  "https://api.assetmind.ai/api/v1/twin/NVDA"
```

**Response Example:**
```json
{
  "status": "success",
  "data": {
    "symbol": "NVDA",
    "identity": {
      "name": "NVIDIA Corporation",
      "sector": "Technology",
      "industry": "Semiconductors",
      "hq": "Santa Clara, CA",
      "founded": 1993
    },
    "market": {
      "price": 850.25,
      "market_cap": 2100000000000,
      "volume": 45000000,
      "pe_ratio": 65.5
    },
    "financial": {
      "revenue": 60922000000,
      "net_income": 29760000000,
      "eps": 12.09
    },
    "scores": { ... },
    "predictions": { ... },
    "relationships": [ ... ],
    "events": [ ... ],
    "updated_at": "2026-06-05T11:00:00Z"
  }
}
```

---

### Knowledge Graph Endpoints

#### GET /api/v1/knowledge-graph/{symbol}/relationships

Get relationships for an asset.

**Request Example:**
```bash
curl -H "X-API-Key: your-api-key" \
  "https://api.assetmind.ai/api/v1/knowledge-graph/NVDA/relationships"
```

**Response Example:**
```json
{
  "status": "success",
  "data": {
    "symbol": "NVDA",
    "relationships": [
      {
        "type": "SUPPLIES_TO",
        "target": "TSMC",
        "strength": 85,
        "description": "TSMC manufactures NVIDIA chips"
      },
      {
        "type": "COMPETES_WITH",
        "target": "AMD",
        "strength": 80,
        "description": "GPU market competition"
      },
      {
        "type": "CUSTOMER_OF",
        "target": "AAPL",
        "strength": 12,
        "description": "Apple uses NVIDIA chips"
      },
      {
        "type": "LEADS_THEME",
        "target": "AI",
        "strength": 90,
        "description": "Leading AI infrastructure"
      }
    ]
  }
}
```

---

### Portfolio Endpoints

#### GET /api/v1/portfolio

Get user's portfolio.

**Request Example:**
```bash
curl -H "X-API-Key: your-api-key" \
  "https://api.assetmind.ai/api/v1/portfolio"
```

**Response Example:**
```json
{
  "status": "success",
  "data": {
    "user_id": "user-123",
    "total_value": 250000,
    "cash": 10000,
    "holdings": [
      {
        "symbol": "NVDA",
        "quantity": 50,
        "avg_entry_price": 750.00,
        "current_price": 850.25,
        "current_value": 42512.50,
        "gain_loss": 5012.50,
        "gain_loss_pct": 13.37
      }
    ],
    "analytics": {
      "total_return": 25000,
      "return_pct": 11.11,
      "beta": 1.35,
      "sharpe_ratio": 1.25,
      "volatility": 0.28
    }
  }
}
```

---

### Daily Briefing Endpoints

#### GET /api/v1/briefing/morning

Get morning briefing.

**Request Example:**
```bash
curl -H "X-API-Key: your-api-key" \
  "https://api.assetmind.ai/api/v1/briefing/morning"
```

**Response Example:**
```json
{
  "status": "success",
  "data": {
    "date": "2026-06-05",
    "market_briefing": {
      "indices": [
        { "name": "S&P 500", "change": 0.85 },
        { "name": "NASDAQ", "change": 1.20 }
      ],
      "sentiment": "bullish",
      "key_events": [
        "Fed meeting minutes at 2 PM",
        "NVDA earnings after close"
      ]
    },
    "watchlist_briefing": { ... },
    "portfolio_briefing": { ... },
    "opportunities": [ ... ],
    "risks": [ ... ]
  }
}
```

---

### Agent Endpoints

#### POST /api/v1/agents/analyze

Run AI agent analysis.

**Request Body:**
```json
{
  "agent_type": "asset",
  "symbol": "NVDA",
  "query": "Provide a comprehensive analysis of NVIDIA's investment potential",
  "options": {
    "depth": "detailed",
    "include_predictions": true,
    "include_comparison": true
  }
}
```

**Response Example:**
```json
{
  "status": "success",
  "data": {
    "agent_type": "asset",
    "analysis": {
      "summary": "NVIDIA shows strong investment potential...",
      "key_points": [ ... ],
      "scores": { ... },
      "predictions": { ... },
      "recommendation": "OUTPERFORM"
    },
    "sources": [ ... ],
    "confidence": 85,
    "reasoning_chain": [ ... ],
    "processing_time_ms": 2500
  }
}
```

---

## WebSocket API

### Connection

```javascript
const socket = io('wss://api.assetmind.ai', {
  auth: { apiKey: 'your-api-key' }
});
```

### Channels

| Channel | Description |
|---------|-------------|
| price:{symbol} | Real-time price updates |
| scores:{symbol} | Score change notifications |
| news:{symbol} | Breaking news alerts |
| market | Global market updates |

### Subscribe

```javascript
// Subscribe to price updates
socket.emit('subscribe', { channel: 'price:AAPL' });

// Subscribe to multiple symbols
socket.emit('subscribe', { channel: 'price:NVDA,MSFT,GOOGL' });

// Subscribe to market updates
socket.emit('subscribe', { channel: 'market' });
```

### Events

```javascript
// Price update
socket.on('price:AAPL', (data) => {
  console.log('Price:', data.price, data.change);
});

// Score update
socket.on('scores:NVDA', (data) => {
  console.log('Health score changed:', data.health);
});

// News alert
socket.on('news:NVDA', (data) => {
  console.log('Breaking news:', data.title);
});
```

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| UNAUTHORIZED | 401 | Invalid or missing API key |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| RATE_LIMIT_EXCEEDED | 429 | Rate limit exceeded |
| VALIDATION_ERROR | 400 | Invalid request parameters |
| INTERNAL_ERROR | 500 | Server error |
| SERVICE_UNAVAILABLE | 503 | Service temporarily unavailable |

---

## Rate Limits

| Tier | Requests/Minute | WebSocket Connections | Concurrent Requests |
|------|-----------------|----------------------|---------------------|
| Free | 100 | 5 | 5 |
| Pro | 1,000 | 25 | 25 |
| Enterprise | Unlimited | 100 | 100 |

### Rate Limit Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1717588800
```

---

## SDK Examples

### Python

```python
from assetmind import AssetMindClient

client = AssetMindClient(api_key="your-api-key")
asset = client.assets.get("NVDA")
scores = client.scores.get("NVDA")
prediction = client.predictions.get("NVDA")
```

### TypeScript

```typescript
import { AssetMindClient } from '@assetmind/sdk';

const client = new AssetMindClient({ apiKey: 'your-api-key' });
const asset = await client.assets.get('NVDA');
const scores = await client.scores.get('NVDA');
const prediction = await client.predictions.get('NVDA');
```

---

## Support

- Documentation: https://docs.assetmind.ai
- API Status: https://status.assetmind.ai
- Email: api@assetmind.ai