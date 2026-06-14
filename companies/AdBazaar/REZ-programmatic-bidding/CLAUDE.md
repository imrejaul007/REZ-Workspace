# REZ Programmatic Bidding

**Version:** 1.0.0
**Date:** June 2026
**Company:** AdBazaar
**Port:** 4077

## Overview
Real-time bidding engine for programmatic advertising. Processes bid requests from ad exchanges, finds eligible campaigns, calculates bids, and determines winners. Supports CPM, CPC, and CPA bidding strategies with targeting by site, geo, and device.

## Tech Stack
- Framework: Express.js (Node.js)
- Database: MongoDB
- Security: Helmet, CORS, Rate Limiting

## Key Features
1. **Bid Request Processing** - Process RTB bid requests from ad exchanges
2. **Campaign Management** - Create, update, and manage campaigns
3. **Bidding Strategies** - Support CPM, CPC, and CPA bidding
4. **Targeting** - Target by sites, geos, and devices
5. **Budget Management** - Daily and total budget tracking
6. **Win Detection** - Determine winning bid (highest bidder)
7. **Metrics Tracking** - Track bids, wins, spend per campaign

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| POST | /api/bid-request | Submit bid request, get bids and winner |
| GET | /api/campaigns | List all campaigns |
| POST | /api/campaigns | Create new campaign |
| PATCH | /api/campaigns/:id | Update campaign |
| GET | /api/campaigns/:id/metrics | Get campaign metrics |

## Campaign Structure
| Field | Type | Description |
|-------|------|-------------|
| campaignId | string | Unique campaign ID |
| advertiserId | string | Advertiser identifier |
| status | enum | active, paused, completed |
| bidding.strategy | enum | cpm, cpc, cpa |
| bidding.maxBid | number | Maximum bid price |
| bidding.targetCpa | number | Target CPA |
| targeting.sites | array | Target site IDs |
| targeting.geos | array | Target countries/cities |
| targeting.devices | array | Target device types |
| budget.daily | number | Daily budget |
| budget.total | number | Total budget |
| metrics.bids | number | Total bid requests |
| metrics.wins | number | Won bids |
| metrics.spend | number | Total spend |

## Quick Start

```bash
cd REZ-programmatic-bidding
npm install
npm run dev
```

## Environment Variables
- PORT (default: 4077)
- MONGODB_URI

## Related Services
- REZ-ad-ai - Ad creative and optimization
- REZ-pricing-engine - Price calculation
- REZ-media-analytics - Campaign analytics