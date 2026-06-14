# REZ Media Analytics

**Version:** 1.0.0
**Date:** June 2026
**Company:** AdBazaar
**Port:** 4069

## Overview
Performance analytics service for all media services including ad campaigns and DOOH (Digital Out-of-Home) placements. Tracks impressions, clicks, conversions, and provides metrics like CTR, CVR, CPM, and attribution reports.

## Tech Stack
- Framework: Express.js (Node.js)
- Storage: In-memory (production: MongoDB)
- Logging: Winston

## Key Features
1. **Campaign Analytics** - Track campaign performance metrics
2. **Impression Tracking** - Track ad impressions by campaign and placement
3. **Click Tracking** - Track clicks with impression attribution
4. **Conversion Tracking** - Track conversions and cost per conversion
5. **DOOH Analytics** - Track DOOH placements (retail, restaurant, elevator, taxi)
6. **Revenue Reports** - Ad and DOOH revenue breakdown
7. **Attribution Reports** - First-touch, last-touch, and linear attribution

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| POST | /api/track/impression | Track ad impression |
| POST | /api/track/click | Track ad click |
| POST | /api/track/conversion | Track conversion |
| POST | /api/campaigns | Create campaign |
| GET | /api/campaigns | List all campaigns |
| GET | /api/campaigns/:id/analytics | Get campaign analytics |
| POST | /api/dooh/placements | Add DOOH placement |
| GET | /api/dooh/analytics | Get DOOH analytics |
| GET | /api/reports/revenue | Get revenue report |
| GET | /api/reports/attribution | Get attribution report |

## Metrics Calculated
| Metric | Formula |
|--------|---------|
| CTR | (Clicks / Impressions) * 100 |
| CVR | (Conversions / Clicks) * 100 |
| CPM | (Spent / Impressions) * 1000 |
| Cost/Conversion | Spent / Conversions |

## Quick Start

```bash
cd REZ-media-analytics
npm install
npm run dev
```

## Environment Variables
- PORT (default: 4069)

## Related Services
- REZ-marketing-backend - Marketing data
- REZ-ad-ai - Ad intelligence
- DOOH services - DOOH placement tracking
- REZ-growth-dashboard - Dashboard visualization