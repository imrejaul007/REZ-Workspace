# AdBazaar → Hojai Integration

**Port:** 4722

Bridges AdBazaar advertising platform to Hojai Unified Platform (4850) for:

- User sync & targeting
- Campaign automation via WhatsApp
- Conversion tracking
- Audience matching
- Retargeting
- Analytics

## Quick Start

```bash
cd adBazaar-hojai-integration
npm install
npm run dev
```

## Environment

```bash
HOJAI_UNIFIED_URL=http://localhost:4850
```

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/users/sync` | Sync user to Hojai |
| GET | `/api/users/:id/segments` | Get user segments |
| GET | `/api/users/:id/engagement` | Get engagement metrics |
| POST | `/api/campaigns/hojai` | Create Hojai campaign |
| POST | `/api/campaigns/:id/notify` | Send notification |
| POST | `/api/campaigns/:id/send-cta` | Send ad with CTA |
| POST | `/api/conversions/track` | Track conversion |
| POST | `/api/cart/recovery` | Send cart recovery |
| GET | `/api/analytics/campaigns/:id` | Get analytics |
| POST | `/api/audiences/match` | Match users to audience |
| POST | `/api/audiences/lookalike` | Create lookalike |
| POST | `/api/retarget` | Retarget users |

## Features

### User Sync
- Sync AdBazaar users to Hojai for targeting
- Get behavioral segments
- Track engagement

### Campaign Automation
- Create WhatsApp campaigns from AdBazaar ads
- Send notifications to users
- Interactive CTA buttons

### Conversion Tracking
- Track ad views, clicks, conversions
- Cart abandonment recovery
- Revenue attribution

### Audience Targeting
- Match users by demographics
- Create lookalike audiences
- Behavioral targeting

### Retargeting
- Reach users who viewed but didn't convert
- Exclude existing customers
- Personalized messages
