# REZ Lead Intelligence

**Version:** 1.0.0
**Date:** June 2026
**Company:** AdBazaar
**Port:** 4100

## Overview
Lead intelligence service that detects and scores leads as hot/warm/cold based on user behavior signals. Scores users based on searches, carts, views, and activity patterns. Detects abandoned carts and searches, sends signals to REZ Mind for learning, and integrates with marketing for channel selection.

## Tech Stack
- Framework: Express.js (Node.js)
- Database: MongoDB
- Documentation: Swagger/OpenAPI
- Scheduling: node-cron
- Logging: Winston (shared)

## Key Features
1. **Lead Scoring** - Score users as hot/warm/cold based on behavior signals
2. **Abandoned Cart Detection** - Detect and track abandoned shopping carts
3. **Abandoned Search Detection** - Track abandoned search queries
4. **Channel Recommendations** - Recommend best channel (WhatsApp/Push/Email) per lead
5. **Re-engagement** - Trigger re-engagement campaigns for abandoned actions
6. **Marketing Integration** - Sync leads to marketing campaigns
7. **Batch Processing** - Process hot leads and abandoned carts in batches
8. **Swagger Documentation** - Full API documentation at /api-docs

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/v1/health | Health check |
| GET | /api/v1/ready | Readiness check |
| GET | /api/v1/leads | List leads with scores |
| GET | /api/v1/leads/:id | Get lead details |
| POST | /api/v1/leads/score | Score a lead |
| GET | /api/v1/carts | List abandoned carts |
| POST | /api/v1/carts/track | Track abandoned cart |
| GET | /api/v1/searches | List abandoned searches |
| POST | /api/v1/searches/track | Track abandoned search |
| GET | /api/v1/channels/recommend | Get channel recommendations |
| POST | /api/v1/re-engage | Trigger re-engagement |
| POST | /api/v1/activity | Track user activity |

## Scheduled Jobs
| Schedule | Job | Description |
|----------|-----|-------------|
| Hourly | Hot leads batch | Process hot leads |
| Hourly (at :05) | Marketing sync | Sync leads to marketing campaigns |
| Every 4 hours | Abandoned carts | Process abandoned carts batch |

## Quick Start

```bash
cd REZ-lead-intelligence
npm install
npm run dev
```

## Environment Variables
- PORT (default: 4100)
- MONGODB_URI
- NODE_ENV
- CORS_ORIGIN

## Related Services
- REZ-intent-graph - User intent signals
- REZ-marketing-backend - Marketing campaigns
- REZ-abandonment-tracker - Abandonment tracking
- REZ-mind - Learning signals
- REZ-growth-playbook - Growth strategies