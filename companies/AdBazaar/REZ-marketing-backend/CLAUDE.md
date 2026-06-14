# REZ Marketing Backend

**Version:** 1.0.0
**Date:** June 2026
**Company:** AdBazaar
**Port:** 4026

## Overview
Marketing backend service providing core marketing automation capabilities including A/B testing, abandoned cart recovery, birthday campaigns, WhatsApp messaging, and winback campaigns. Integrates with MongoDB for data persistence.

## Tech Stack
- Framework: Express.js (Node.js)
- Database: MongoDB
- Security: Helmet, CORS, Rate Limiting
- Logging: Winston

## Key Features
1. **A/B Testing** - Create and manage A/B tests with results tracking
2. **Abandoned Cart Recovery** - Send recovery sequences for abandoned carts
3. **Birthday Campaigns** - Trigger birthday offers for users
4. **WhatsApp Messaging** - Send WhatsApp messages via templates
5. **Winback Campaigns** - Re-engage inactive users with winback offers

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| POST | /api/tests | Create A/B test |
| GET | /api/tests/:id | Get test details |
| GET | /api/tests/:id/results | Get test results |
| POST | /api/carts/recover | Send cart recovery sequence |
| POST | /api/birthday/trigger | Trigger birthday offer |
| POST | /api/whatsapp/send | Send WhatsApp message |
| POST | /api/winback/trigger | Trigger winback campaign |

## Quick Start

```bash
cd REZ-marketing-backend
npm install
npm run dev
```

## Environment Variables
- PORT (default: 4026)
- MONGODB_URI

## Related Services
- REZ-ab-testing - A/B testing service
- REZ-abandonment-tracker - Abandonment tracking
- REZ-engagement-platform - Engagement campaigns
- RABTUL WhatsApp - WhatsApp integration