# REZ Atlas Web Intelligence Bridge

Connects REZ Atlas to HOJAI Web Intelligence for enriched merchant data.

## What It Adds

| REZ Atlas Module | Web Intelligence Input |
|------------------|----------------------|
| **Signals (5155)** | Competitor monitoring, review alerts |
| **Twin (5153)** | Company news, reviews, social |
| **Score (5154)** | Web presence score |
| **Discover (5151)** | Industry context, competitor data |
| **Copilot (5172)** | Real-time news for pitches |

## Integration Flow

```
REZ Atlas
    │
    ├──► /api/signals/generate
    │        │
    │        ▼
    │    AtlasWebIntelligenceBridge
    │        │
    │        ▼
    │    HOJAI Web Intelligence (4595)
    │        │
    │        ├──► GDELT News ──────────► Company news
    │        ├──► Cheerio Scraping ───► Competitor data
    │        └──► Content Extract ─────► Reviews, social
    │
    ▼
REZ Atlas Updates
    ├──► Merchant Twin enriched
    ├──► Signals generated
    └──► Score updated
```

## API Integration

```bash
# Web Intelligence must be running
export WEB_INTELLIGENCE_URL=http://localhost:4595

# Or in docker-compose
WEB_INTELLIGENCE_URL=http://hojai-web-intelligence:4595
```

## Signals Generated

| Signal | Trigger | Product Suggestion |
|--------|---------|-------------------|
| NO_WEBSITE | Website not found | REZ Website Builder |
| NO_GOOGLE_LISTING | No Google presence | REZ Local SEO |
| NO_REVIEWS | No review data | REZ Reviews |
| NO_FOOD_DELIVERY | No Zomato/Swiggy | REZ Delivery |
| LOW_ONLINE_VISIBILITY | Score < 30 | REZ Marketing |
| HAS_NEWS_COVERAGE | News found | Upsell opportunity |

## Usage

```typescript
import { AtlasWebIntelligenceBridge } from './src/index';

const bridge = new AtlasWebIntelligenceBridge();

// Get full intelligence for a merchant
const intelligence = await bridge.getMerchantIntelligence(
  'merchant-123',
  'https://restaurant.com'
);

// Update Atlas signals
const { signals, score } = await bridge.updateAtlasSignals(
  'merchant-123',
  'https://restaurant.com'
);
```

## Environment

```bash
# Required
WEB_INTELLIGENCE_URL=http://localhost:4595
```
