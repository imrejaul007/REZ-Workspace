# REZ Atlas Scraper

**Version:** 1.0.0 | **Port:** 5160

Dedicated scraper service for REZ Atlas merchant intelligence - scrapes websites, Google Reviews, Zomato, and social media to build comprehensive merchant profiles.

## Features

- **Website Scraper** - Extracts contact info, hours, social links, images from any website
- **Google Reviews Scraper** - Scrapes reviews and ratings from Google Maps
- **Zomato Scraper** - Restaurant data including ratings, cuisine, pricing
- **Social Media Scanner** - Detects social media presence across platforms

## Quick Start

```bash
cd REZ-atlas-scraper

# Install dependencies
npm install

# Run in development
npm run dev

# Build for production
npm run build
npm start
```

## API Endpoints

### Health Check
```
GET /health
```

### Website Scraping
```bash
# Scrape a website
curl -X POST http://localhost:5160/api/scrape/website \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "extractFields": {"products": ".product"}}'
```

### Google Reviews
```bash
# From Google Maps URL
curl -X POST http://localhost:5160/api/scrape/google-reviews \
  -H "Content-Type: application/json" \
  -d '{"placeUrl": "https://www.google.com/maps/place/..."}'

# Search by business name
curl -X POST http://localhost:5160/api/scrape/google-reviews/search \
  -H "Content-Type: application/json" \
  -d '{"businessName": "Pizza Palace", "location": "Mumbai"}'
```

### Zomato
```bash
# Scrape restaurant
curl -X POST http://localhost:5160/api/scrape/zomato \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.zomato.com/mumbai/restaurant-name"}'

# Search restaurants
curl -X POST http://localhost:5160/api/scrape/zomato/search \
  -H "Content-Type: application/json" \
  -d '{"query": "Italian", "city": "Mumbai"}'
```

### Social Media
```bash
# From website
curl -X POST http://localhost:5160/api/scrape/social-media \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'

# By business name
curl -X POST http://localhost:5160/api/scrape/social-media \
  -H "Content-Type: application/json" \
  -d '{"businessName": "Pizza Palace"}'
```

### Full Merchant Intelligence
```bash
curl -X POST http://localhost:5160/api/intelligence \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Pizza Palace",
    "url": "https://pizzapalace.com",
    "googleMapsUrl": "https://maps.google.com/...",
    "zomatoUrl": "https://www.zomato.com/...",
    "location": "Mumbai"
  }'
```

### Competitor Analysis
```bash
curl -X POST http://localhost:5160/api/competitors \
  -H "Content-Type: application/json" \
  -d '{"category": "Pizza", "merchantUrl": "https://pizzapalace.com"}'
```

## Architecture

```
REZ-atlas-scraper (Port 5160)
├── WebsiteScraper      → Cheerio + Axios
├── GoogleReviewsScraper → Puppeteer (JS rendering)
├── ZomatoScraper       → Cheerio + Axios
└── SocialMediaScraper  → Cheerio + Axios
```

## Web Presence Score

The `/api/intelligence` endpoint calculates a web presence score (0-100):

| Source | Points |
|--------|--------|
| Website | 0-25 |
| Google Reviews | 0-30 (rating-based) |
| Zomato | 0-20 |
| Social Media | 0-25 (per platform) |

## Dependencies

- `cheerio` - HTML parsing
- `puppeteer` - Chrome/Chromium for JS rendering
- `axios` - HTTP requests
- `express` - API server
- `cors` - Cross-origin support

## Integrations

- **HOJAI Web Intelligence** - Can delegate to services on ports 4595-4597
- **REZ Atlas Twin** - Creates merchant digital twins
- **AssetMind** - Market intelligence data

---

**License:** Proprietary - RTNM Digital