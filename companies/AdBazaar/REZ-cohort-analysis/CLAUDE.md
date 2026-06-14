# REZ Cohort Analysis

**Version:** 1.0.0
**Date:** June 2026
**Company:** AdBazaar
**Port:** 4132

## Overview
Cohort analysis service for analyzing user behavior patterns, retention curves, revenue cohorts, and segment comparisons. Uses MongoDB for data storage and Redis for caching, with scheduled jobs for daily aggregation and cleanup.

## Tech Stack
- Framework: Express.js (Node.js)
- Database: MongoDB
- Cache: Redis
- Logging: Winston
- Scheduling: node-cron
- Security: Helmet, CORS, Internal Auth

## Key Features
1. **Cohort Definitions** - Define and manage custom cohort configurations
2. **Retention Curve Analysis** - Track user retention over time periods
3. **Revenue Cohorts** - Analyze revenue patterns by user cohorts
4. **Time-to-Convert Analysis** - Measure conversion timing patterns
5. **Segment Comparison** - Compare metrics across user segments
6. **Data Export** - Export cohort data with auto-expiring URLs
7. **Scheduled Aggregation** - Daily retention curve aggregation at midnight
8. **Auto Cleanup** - Automatic cleanup of expired exports at 2 AM

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| POST | /api/cohorts/generate | Generate cohort analysis |
| GET | /api/cohorts/retention-curve | Get retention curve data |
| GET | /api/cohorts/revenue | Get revenue cohort analysis |
| GET | /api/cohorts/time-to-convert | Get time-to-convert metrics |
| POST | /api/cohorts/compare-segments | Compare user segments |
| GET | /api/cohorts/definitions | List cohort definitions |
| POST | /api/cohorts/definitions | Create cohort definition |
| GET | /api/cohorts/definitions/:id | Get cohort definition |
| PUT | /api/cohorts/definitions/:id | Update cohort definition |
| DELETE | /api/cohorts/definitions/:id | Delete cohort definition |
| POST | /api/cohorts/export | Export cohort data |
| GET | /api/cohorts/exports/:id | Download export |

## Quick Start

```bash
cd REZ-cohort-analysis
npm install
npm run dev
```

## Environment Variables
- PORT (default: 4132)
- MONGODB_URI
- REDIS_URL
- INTERNAL_SERVICE_TOKEN
- NODE_ENV
- ALLOWED_ORIGINS

## Related Services
- REZ-marketing-backend - Marketing data integration
- REZ-media-analytics - Analytics pipeline
- REZ-growth-dashboard - Dashboard visualization
- REZ-intent-graph - User behavior signals