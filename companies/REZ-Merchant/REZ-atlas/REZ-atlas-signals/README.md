# REZ Atlas Signals
**Port:** 5155 | **Type:** AI Opportunity Detection

---

## Overview

AI-powered opportunity detection service that automatically finds sales opportunities:

- **No QR** - Restaurants without digital ordering
- **No Loyalty** - Businesses without customer retention
- **Poor Reviews** - Low ratings or poor response
- **Competitor Gap** - Uses competitor products
- **Growth Signals** - Expansion opportunities

---

## Quick Start

```bash
npm install
npm run dev
```

---

## API Endpoints

### Opportunities
- `GET /api/opportunities` - List opportunities
- `GET /api/opportunities/stats` - Opportunity statistics

### Competitors
- `GET /api/competitors` - Competitor data
- `GET /api/competitors/web/:merchantId` - Web-based competitor intelligence

### Dashboard
- `GET /api/dashboard` - Opportunity dashboard

### Web Intelligence (NEW)
- `POST /api/signals/web-intelligence` - Generate signals from web data
- `POST /api/enrich` - Enrich merchant with web intelligence

---

## Opportunity Types

### Internal Detection (Built-in)

| Type | Severity | Suggested Product | Detection Rule |
|------|----------|-------------------|----------------|
| no_qr | high | REZ Menu QR | Restaurant category, no QR |
| no_loyalty | medium | REZ Loyalty | >50 reviews, no loyalty |
| poor_reviews | high | REZ Reviews | Rating <3.5 OR response <50% |
| competitor_gap | medium | REZ Pay | Uses competitor POS |
| expansion | high | REZ Capital | New hiring OR expansion |

### Web Intelligence Detection (Port 4595)

| Type | Severity | Suggested Product | Detection Rule |
|------|----------|-------------------|----------------|
| no_website | high | REZ Website | Website not found |
| no_social_media | medium | REZ Marketing | No social profiles |
| no_food_delivery | medium | REZ Delivery | No Zomato/Swiggy |
| has_news_coverage | positive | Upsell | News found |
| low_visibility | high | REZ SEO | Web presence <30 |

---

## Data Model

```typescript
interface Opportunity {
  id: string
  merchantId: string
  type: 'no_qr' | 'no_loyalty' | 'poor_reviews' | 'competitor_gap' | 'expansion'
  title: string
  description: string
  severity: 'high' | 'medium' | 'low'
  suggestedProduct: string
  potentialRevenue: number
  status: 'open' | 'converted' | 'dismissed'
  createdAt: Date
}

interface Competitor {
  id: string
  merchantId: string
  competitorName: string
  product: string
  marketShare: number
  lastSeen: string
}
```

---

## Environment Variables

```env
PORT=5155
WEB_INTELLIGENCE_URL=http://localhost:4595
```

## Web Intelligence Integration

REZ Atlas Signals connects to HOJAI Web Intelligence (Port 4595) for:

- **Website detection** - Check if merchant has a website
- **Social media presence** - Detect Facebook, Instagram, Twitter, LinkedIn
- **Competitor monitoring** - Track nearby competitors via news
- **News coverage** - Track company news and press
- **Food delivery** - Detect Zomato/Swiggy presence

```
REZ Atlas Signals (5155)
    │
    ├──► POST /api/signals/web-intelligence
    │        │
    │        ▼
    │    HOJAI Web Intelligence (4595)
    │        │
    │        ├──► Cheerio scrape → Website check
    │        ├──► GDELT news → Company news
    │        └──► Content extract → Social links
    │
    ▼
Signals Generated: NO_WEBSITE, NO_SOCIAL_MEDIA, HAS_NEWS_COVERAGE, etc.
```