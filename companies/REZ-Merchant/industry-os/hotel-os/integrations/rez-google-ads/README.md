# REZ Google Hotel Ads Service

**Port: 4024**

Google Hotel Ads integration for REZ Hotel Ecosystem - enables hotels to list on Google, manage pricing feeds, and run programmatic ad campaigns.

## Overview

REZ Google Hotel Ads Service provides:
- Hotel data feed management via Google Hotel Center
- Real-time price and availability updates
- Programmatic ad campaign management
- Performance tracking and analytics

## Features

### Hotel Feed Management
- Register hotels with Google Hotel Center
- Property verification
- Feed status tracking
- Multi-hotel support

### Price & Availability
- Real-time price updates
- Availability synchronization
- Room type management
- Price history tracking

### Campaign Management
- Programmatic bidding
- Budget control
- Campaign pausing/resuming
- Multi-campaign support

### Bid Strategies
| Strategy | Description |
|----------|-------------|
| `LOWEST_PRICE` | Always bid lowest price |
| `PERCENTAGE` | Percentage of commission |
| `CLICKS` | Cost per click strategy |
| `DEFAULT` | Google's default strategy |

## Quick Start

```bash
cd industry-os/rez-google-hotel-ads-service
npm install
npm run dev
```

Service runs on **port 4024**.

## API Endpoints

### Hotel Feed
```
GET  /api/hotels                    - List all hotels
GET  /api/hotels/:hotelId          - Get hotel config
POST /api/hotels                    - Register hotel
PUT  /api/hotels/:id/verify        - Verify with Google
```

### Feed Updates
```
POST /api/feed/update               - Update prices/availability
GET  /api/feed/history/:hotelId    - Get price history
```

### Campaigns
```
GET  /api/campaigns/:hotelId         - List campaigns
POST /api/campaigns                 - Create campaign
GET  /api/campaigns/:hotelId/:id   - Get campaign
PUT  /api/campaigns/:id            - Update campaign
POST /api/campaigns/:id/pause     - Pause campaign
POST /api/campaigns/:id/resume    - Resume campaign
POST /api/campaigns/:id/end        - End campaign
```

### Analytics
```
GET /api/stats/:hotelId            - Get ad performance
```

## Usage Examples

### Register Hotel
```bash
curl -X POST http://localhost:4024/api/hotels \
  -H "Content-Type: application/json" \
  -d '{
    "hotelId": "hotel-123",
    "propertyId": "prop-456",
    "destinationId": "dest-789",
    "feedData": {
      "name": "Grand Hotel",
      "address": "123 Main St",
      "starRating": 5
    }
  }'
```

### Update Prices
```bash
curl -X POST http://localhost:4024/api/feed/update \
  -H "Content-Type: application/json" \
  -d '{
    "updates": [
      {
        "hotelId": "hotel-123",
        "roomId": "deluxe-1",
        "date": "2026-06-15",
        "price": 199.99,
        "availability": 5,
        "bookingUrl": "https://example.com/book"
      }
    ]
  }'
```

### Create Campaign
```bash
curl -X POST http://localhost:4024/api/campaigns \
  -H "Content-Type: application/json" \
  -d '{
    "hotelId": "hotel-123",
    "campaignName": "Summer Sale",
    "dailyBudget": 100,
    "bidStrategy": "PERCENTAGE"
  }'
```

## Architecture

```
rez-google-hotel-ads-service/
├── src/
│   ├── index.ts                    # Express server
│   ├── google-ads.test.ts          # Tests
│   └── services/
│       └── google-ads.service.ts   # Business logic
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

## Integration

Integrates with:
- Google Hotel Center API
- REZ Booking Engine
- REZ Channel Manager
- REZ Property Dashboard

## Environment

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 4024 | Service port |
| GOOGLE_ADS_API_KEY | - | Google Ads API key |
| HOTEL_CENTER_ID | - | Hotel Center merchant ID |

## License

Proprietary - RTNM Group
