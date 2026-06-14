# REZ Marketing Service

**Version:** 1.1.0
**Date:** June 2026
**Company:** AdBazaar
**Port:** 4136
**Tagline:** "Marketing Automation for the RTNM Ecosystem"

## Overview
Marketing automation service for campaigns and customer engagement. Provides campaign management, user segmentation, and marketing analytics with MongoDB and Redis for data persistence.

## Tech Stack
- Framework: Express.js (Node.js)
- Database: MongoDB
- Cache: Redis
- Security: Helmet, CORS, Rate Limiting, Auth
- Logging: Winston

## Key Features
1. **Campaign Management** - Create, manage, and execute marketing campaigns
2. **User Segmentation** - Segment users based on behavior and demographics
3. **Marketing Analytics** - Track campaign performance and engagement metrics
4. **Channel Orchestration** - Multi-channel campaign execution
5. **Scheduling** - Schedule campaigns for optimal timing
6. **Hotel Guest Marketing** - Targeted campaigns for hotel guests (NEW)
7. **Loyalty Marketing** - Target loyalty program members (NEW)
8. **Personalized Offers** - Send targeted offers to guests (NEW)

## API Endpoints

### Core Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check with MongoDB/Redis status |
| GET | /ready | Readiness check |
| GET | /api/v1/campaigns | List campaigns |
| POST | /api/v1/campaigns | Create campaign |
| GET | /api/v1/campaigns/:id | Get campaign details |
| PUT | /api/v1/campaigns/:id | Update campaign |
| POST | /api/v1/campaigns/:id/execute | Execute campaign |
| GET | /api/v1/segments | List segments |
| POST | /api/v1/segments | Create segment |
| GET | /api/v1/segments/:id | Get segment details |
| GET | /api/v1/analytics | Marketing analytics |
| GET | /api/v1/analytics/campaigns | Campaign analytics |

### RTNM Hotel Marketing Integration (NEW - June 2026)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/v1/hotels/:hotelId/guests | Get hotel guests |
| POST | /api/v1/hotels/:hotelId/campaigns | Create hotel campaign |
| GET | /api/v1/campaigns/:campaignId/performance | Campaign performance |
| POST | /api/v1/campaigns/:campaignId/track | Track conversion |
| GET | /api/v1/guests/:guestId/preferences | Guest preferences |
| GET | /api/v1/hotels/:hotelId/loyalty/members | Loyalty members |
| POST | /api/v1/guests/:guestId/offers | Send targeted offer |
| GET | /api/v1/integration/stayown/status | Check StayOwn integration |

## RTNM Ecosystem Integration (NEW - June 2026)

### StayOwn Hotel OS Integration

REZ Marketing integrates with StayOwn Hotel OS for hotel guest marketing campaigns.

| Connected Company | Service | Integration Type |
|-------------------|---------|-----------------|
| StayOwn | Hotel OS (3899) | Hotel guest marketing |

### Connected HOJAI Services
| Service | Purpose |
|---------|---------|
| REZ Intelligence | ML predictions |
| Memory | User context |

## Quick Start

```bash
cd AdBazaar/REZ-marketing-service
npm install
npm run dev
```

## Environment Variables
- PORT (default: 4136)
- MONGODB_URI
- REDIS_URL
- INTERNAL_SERVICE_TOKEN
- STAYOWN_URL (default: http://localhost:3899)

## Related Services
- REZ-marketing-backend - Marketing automation
- REZ-engagement-platform - Engagement campaigns
- REZ-media-analytics - Analytics pipeline
- REZ-growth-dashboard - Dashboard visualization
- REZ-ads-service - Ad serving
- REZ-feedback-service - User feedback
- REZ-gamification-service - Gamification engine

---

**Last Updated:** 2026-06-12