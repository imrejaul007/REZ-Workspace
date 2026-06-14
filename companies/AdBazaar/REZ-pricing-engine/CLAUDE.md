# REZ Pricing Engine

**Version:** 1.0.0
**Date:** June 2026
**Company:** AdBazaar
**Port:** 4131

## Overview
Dynamic pricing engine for ads and campaigns that calculates prices based on ad type, placement, location, target audience, and campaign goals. Supports surge pricing, liquidation pricing, budget allocation, and unified campaign creation with wallet reservation.

## Tech Stack
- Framework: Express.js (Node.js)
- Metrics: Prometheus
- Security: Helmet, CORS, Rate Limiting, Auth

## Key Features
1. **Dynamic Pricing** - Calculate prices based on multiple factors
2. **Surge Pricing** - Apply surge multipliers by ad type (up to 8x for DOOH)
3. **Liquidation Pricing** - Calculate prices for unsold inventory
4. **Budget Allocation** - Smart budget distribution across channels
5. **Minimum Spend Validation** - Enforce minimum spend per ad type
6. **Price Caps** - Maximum surge limits per ad type
7. **Unified Campaigns** - Create multi-channel campaigns with wallet reservation
8. **Campaign Lifecycle** - Pause, resume, cancel campaigns

## Ad Types and Price Caps
| Type | Max Surge | Min Spend |
|------|-----------|-----------|
| banner | 5x | ₹500 |
| feed | 4x | ₹500 |
| search | 6x | ₹500 |
| store | 5x | ₹500 |
| push | 4x | ₹300 |
| whatsapp | 3x | ₹1,000 |
| email | 2x | ₹300 |
| dooh | 8x | ₹3,000 |
| offline | 4x | ₹5,000 |
| qr | 5x | ₹500 |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| GET | /metrics | Prometheus metrics |
| POST | /api/price | Calculate dynamic price |
| POST | /api/price/legacy | Legacy pricing engine |
| POST | /api/price/liquidation | Calculate liquidation price |
| POST | /api/price/allocate | Smart budget allocation |
| POST | /api/price/validate | Validate minimum spend |
| GET | /api/price/caps | Get price caps |
| POST | /api/campaigns/unified | Create unified campaign |
| GET | /api/campaigns/:id/status | Get campaign status |
| POST | /api/campaigns/:id/pause | Pause campaign |
| POST | /api/campaigns/:id/resume | Resume campaign |
| POST | /api/campaigns/:id/cancel | Cancel campaign |

## Quick Start

```bash
cd REZ-pricing-engine
npm install
npm run dev
```

## Environment Variables
- PORT (default: 4131)
- ALLOWED_ORIGINS
- CORS_ORIGIN
- INTERNAL_SERVICE_TOKEN

## Related Services
- RABTUL Wallet - Wallet reservation for campaigns
- REZ-marketing-service - Campaign management
- REZ-media-analytics - Analytics tracking