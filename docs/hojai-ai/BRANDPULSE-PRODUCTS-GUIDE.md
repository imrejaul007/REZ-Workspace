# HOJAI BrandPulse - Products & Features Guide

**Version:** 1.0.0 | **Date:** June 13, 2026

---

## Products

### BrandPulse API (Port 4770)

**Description:** Real-time brand intelligence and sentiment analysis API

**Features:**
- Sentiment Analysis (AFINN + OpenAI)
- Review Management
- Multi-source aggregation
- Real-time WebSocket updates
- RTNM Gateway integration

**Tech Stack:**
- Node.js + Express
- MongoDB
- Redis (optional)
- WebSocket (ws)
- TypeScript

---

## Features Breakdown

### 1. Sentiment Analysis

| Feature | Description | API |
|---------|-------------|-----|
| AFINN Analysis | Fast local sentiment scoring | `/api/v1/sentiment/analyze` |
| OpenAI Analysis | GPT-powered deep analysis | `useAI: true` flag |
| Aspect Extraction | Identifies: service, food, ambiance, value, cleanliness, location | In response |
| Keyword Detection | Extracts significant sentiment words | In response |
| Trend Detection | Identifies improving/declining/stable | `/api/v1/sentiment/trend` |
| Batch Analysis | Process up to 100 texts | `/api/v1/sentiment/analyze/batch` |

### 2. Review Management

| Feature | Description | API |
|---------|-------------|-----|
| Create Review | Add single review | POST `/api/v1/reviews` |
| Bulk Import | Import up to 100 reviews | POST `/api/v1/reviews/bulk` |
| List Reviews | Paginated with filters | GET `/api/v1/reviews/brand/:id` |
| Moderate | Approve/reject/flag | PATCH `/api/v1/reviews/:id/moderate` |
| Add Response | Owner response tracking | POST `/api/v1/reviews/:id/responses` |
| Multi-source | Google, Yelp, TripAdvisor, Facebook, Direct | `source` field |

### 3. Analytics

| Feature | Description | API |
|---------|-------------|-----|
| Brand Overview | Stats, trends, alerts | GET `/api/v1/analytics/brand/:id/overview` |
| Sentiment Trend | Day/Week/Month analysis | GET `/api/v1/analytics/brand/:id/sentiment` |
| Volume Trend | Review frequency | GET `/api/v1/analytics/brand/:id/volume` |
| Rating Distribution | 1-5 star breakdown | GET `/api/v1/analytics/brand/:id/ratings` |
| Source Breakdown | Performance by platform | GET `/api/v1/analytics/brand/:id/sources` |
| Aspect Analysis | What customers talk about | GET `/api/v1/analytics/brand/:id/aspects` |

### 4. Alert System

| Feature | Description | API |
|---------|-------------|-----|
| Get Alerts | List active alerts | GET `/api/v1/analytics/brand/:id/alerts` |
| Acknowledge | Mark as seen | PATCH `/api/v1/analytics/alerts/:id/acknowledge` |
| Resolve | Mark as resolved | PATCH `/api/v1/analytics/alerts/:id/resolve` |

**Alert Types:**
| Type | Severity | Trigger |
|------|----------|---------|
| negative_review | Medium/High | Sentiment < -0.1, confidence > 0.7 |
| low_rating | High/Critical | Rating <= 2 |
| negative_spike | High | Sudden increase in negatives |
| trend_change | Medium | Significant sentiment shift |

### 5. Real-time Updates

| Feature | Description | Endpoint |
|---------|-------------|----------|
| WebSocket | Real-time connection | `/ws` |
| Subscribe | Subscribe to brand | `subscribe` message |
| Unsubscribe | Unsubscribe | `unsubscribe` message |
| Heartbeat | Keep-alive | Automatic |

**Events:**
- `new_review` - New review created
- `review_updated` - Review modified
- `alert` - New alert triggered
- `sentiment_changed` - Sentiment updated

### 6. RTNM Integration

| Feature | Description |
|---------|-------------|
| Signal Emission | Emit sentiment signals to RTNM |
| Brand Sync | Sync brand data with RTNM |
| Alert Distribution | Send alerts via RTNM channels |
| Loyalty Rewards | Enroll in sentiment rewards |

---

## Dashboard (Port 4780)

**Description:** React dashboard for brand analytics

**Features:**
- Stats overview (reviews, rating, sentiment, alerts)
- Interactive sentiment chart (30D/12W/12M)
- Rating distribution bar chart
- Aspect analysis visualization
- Alert management
- Review feed with moderation

**Tech Stack:**
- React 18
- TypeScript
- Vite
- TailwindCSS
- Recharts

---

## Data Models

### Brand
```typescript
{
  brandId: string;
  tenantId: string;
  name: string;
  slug: string;
  industry?: string;
  stats: {
    totalReviews: number;
    averageRating: number;
    sentimentScore: number; // -1 to 1
    positivePercent: number;
    neutralPercent: number;
    negativePercent: number;
  };
}
```

### Review
```typescript
{
  reviewId: string;
  brandId: string;
  source: 'google' | 'yelp' | 'tripadvisor' | 'facebook' | 'direct' | 'internal';
  content: string;
  rating: number; // 1-5
  author: { name: string; isVerified: boolean; };
  sentiment: {
    score: number;
    label: 'positive' | 'neutral' | 'negative';
    confidence: number;
    aspects: { name: string; score: number; mentions: number }[];
  };
}
```

---

## Getting Started

### 1. Install
```bash
cd products/brandpulse
npm install
```

### 2. Configure
```bash
cp .env.example .env
# Edit .env with your settings
```

### 3. Run
```bash
npm run dev
```

### 4. Generate Demo Data
```bash
curl -X POST http://localhost:4770/api/v1/demo/generate \
  -H "Content-Type: application/json" \
  -d '{"brandName":"Demo Hotel","industry":"hotel"}'
```

### 5. Open Dashboard
```
http://localhost:4780/?brandId=demo-brand
```

---

## Related Documents

- [BRANDPULSE.md](./BRANDPULSE.md) - Full documentation
- [CLAUDE.md](./CLAUDE.md) - Developer guide
