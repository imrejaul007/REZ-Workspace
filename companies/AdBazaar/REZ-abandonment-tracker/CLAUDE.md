# REZ Abandonment Tracker

**Version:** 1.0.0
**Date:** June 2026
**Company:** AdBazaar
**Port:** 4221

## Overview
Service that tracks all incomplete user actions (abandoned searches, carts, views, payment flows) and triggers re-engagement campaigns via WhatsApp, Push, SMS, or Email. Uses decay scoring to prioritize follow-ups and generates personalized offers based on abandonment type and urgency.

## Tech Stack
- Framework: Standalone Service (no HTTP server in this module)
- Database: In-memory storage (production: MongoDB)
- Notification Channels: WhatsApp, Push, SMS, Email
- Logging: Winston

## Key Features
1. **Abandonment Tracking** - Track search, cart, view, and payment abandonment
2. **Intent Detection** - AI-powered intent classification (product_comparison, price_lookup, etc.)
3. **Urgency Calculation** - Dynamic urgency based on type, value, and intent
4. **Decay Scoring** - Time-based decay (100 = fresh, 0 = cold)
5. **Multi-Channel Re-engagement** - WhatsApp, Push, SMS, Email with message templates
6. **Offer Generation** - Auto-generate discount/coins offers based on urgency
7. **Statistics Dashboard** - Track re-engagement rates and conversion metrics

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/track/search | Track search abandonment |
| POST | /api/track/cart | Track cart abandonment |
| POST | /api/track/view | Track product view abandonment |
| POST | /api/track/payment | Track payment abandonment |
| POST | /api/re-engage | Trigger re-engagement campaign |
| POST | /api/resolve/:id | Mark abandonment as resolved |
| GET | /api/stats | Get abandonment statistics |
| GET | /api/abandonments | List all abandonments |
| GET | /api/abandonments/user/:userId | Get user's abandonments |
| GET | /api/triggers/pending | Get pending triggers |

## Quick Start

```bash
cd REZ-abandonment-tracker
npm install
npm run dev
```

## Environment Variables
- PORT (default: 4221)
- MONGODB_URI
- REDIS_HOST
- REDIS_PORT

## Related Services
- REZ-marketing-backend - Campaign management
- REZ-notification-service - Push/Email/SMS delivery
- RABTUL WhatsApp integration - WhatsApp campaigns
- REZ-wallet-service - Coin rewards redemption