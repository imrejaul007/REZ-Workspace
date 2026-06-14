# REZ Rate Shopping Service

Competitor Rate Monitoring & Yield Management

**Port:** 4033

## Features

- Competitor rate scraping and monitoring
- Price parity alerts
- Demand indicators
- AI-driven rate recommendations
- Yield management
- Automated scraping via cron jobs
- Market average calculations

## Supported Channels

| Channel | ID |
|---------|-----|
| Booking.com | booking_com |
| MakeMyTrip | makemytrip |
| Goibibo | goibibo |
| OYO | oyo |
| FabHotels | fabhotels |
| Treebo | treebo |
| Agoda | agoda |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| GET | /api/info | Service info |
| GET | /api/competitors/:hotelId | List competitors |
| POST | /api/competitors | Add competitor |
| PUT | /api/competitors/:competitorId | Update competitor |
| DELETE | /api/competitors/:competitorId | Remove competitor |
| POST | /api/scrape/:competitorId | Scrape single competitor |
| POST | /api/scrape/hotel/:hotelId | Scrape all competitors |
| GET | /api/rates/:hotelId | Get rate data |
| GET | /api/market-average/:hotelId | Get market averages |
| GET | /api/compare/:hotelId | Compare rates vs market |
| GET | /api/alerts/:hotelId | Get rate alerts |
| POST | /api/alerts/:alertId/acknowledge | Acknowledge alert |
| GET | /api/recommendations/:hotelId | Get yield recommendations |
| POST | /api/recommendations/generate | Generate yield recommendations |
| POST | /api/recommendations/:recommendationId/apply | Apply recommendation |
| GET | /api/demand/:hotelId | Get demand indicators |
| GET | /api/stats/:hotelId | Rate shopping stats |

## Quick Start

```bash
# Install dependencies
npm install

# Start the service
npm start

# Development mode with hot reload
npm run dev
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 4033 | Service port |
| MONGO_URL | mongodb://localhost:27017/rez_rate_shopping | MongoDB connection string |
