# REZ AB Testing Service

**Version:** 1.0.0
**Date:** June 2026
**Company:** AdBazaar
**Port:** 4220

## Overview
A/B testing service for REZ-Media that enables experiment creation, variant management, user allocation, and statistical analysis. The service supports marketing campaigns, ad creative testing, and conversion optimization with real-time results tracking.

## Tech Stack
- Framework: Express.js (Node.js)
- Database: MongoDB
- Logging: Morgan, Winston
- Security: Helmet, CORS, Rate Limiting, Internal Auth

## Key Features
1. **Experiment Management** - Create, start, pause, complete, and archive experiments
2. **Variant Management** - Multiple variants per experiment with allocation control
3. **User Allocation** - Consistent user-to-variant assignment with preview
4. **Impression/Conversion Tracking** - Batch tracking for impressions and conversions
5. **Statistical Analysis** - Results, stats, time series, revenue breakdown
6. **Sample Size Calculator** - Statistical significance calculation
7. **Significance Analysis** - Confidence intervals and p-values

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| GET | /ready | Readiness check |
| GET | /api | API documentation |
| POST | /api/experiments | Create experiment |
| GET | /api/experiments | List experiments (paginated) |
| GET | /api/experiments/:id | Get experiment by ID |
| PATCH | /api/experiments/:id | Update experiment |
| DELETE | /api/experiments/:id | Delete experiment (draft only) |
| POST | /api/experiments/:id/start | Start experiment |
| POST | /api/experiments/:id/pause | Pause experiment |
| POST | /api/experiments/:id/complete | Complete experiment |
| POST | /api/experiments/:id/archive | Archive experiment |
| POST | /api/experiments/:id/variants | Add variant |
| GET | /api/experiments/:id/variants | List variants |
| GET | /api/experiments/:id/variants/:variantId | Get variant |
| DELETE | /api/experiments/:id/variants/:variantId | Remove variant |
| POST | /api/experiments/:id/allocate | Allocate user to variant |
| POST | /api/experiments/:id/impressions | Batch track impressions |
| POST | /api/experiments/:id/conversions | Batch track conversions |
| GET | /api/experiments/:id/preview | Allocation preview |
| GET | /api/experiments/:id/results | Get experiment results |
| GET | /api/experiments/:id/stats | Get variant statistics |
| GET | /api/experiments/:id/timeseries | Time series data |
| GET | /api/experiments/:id/revenue | Revenue breakdown |
| GET | /api/experiments/:id/sample-size | Sample size calculator |
| GET | /api/experiments/:id/significance | Significance analysis |
| GET | /api/experiments/:id/daily | Daily summary |

## Quick Start

```bash
cd REZ-ab-testing
npm install
npm run dev
```

## Environment Variables
- PORT (default: 4220)
- MONGODB_URI
- CORS_ORIGIN
- ALLOWED_ORIGINS
- X_INTERNAL_TOKEN

## Related Services
- REZ-marketing-backend - Marketing campaign integration
- REZ-media-analytics - Analytics pipeline
- REZ-ai-campaign-builder - AI-powered campaign creation
- REZ-autonomous-growth-agent (4298) - Growth automation