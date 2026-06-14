# REZ Activity Service

**Port: 4132**

Unified B2B Activity Tracking - Track all touchpoints across the revenue cycle.

## Features

- **Unified Activity Tracking**: Email, call, meeting, LinkedIn, SMS, deal activities
- **Multi-Entity Links**: Track activities by company, contact, or deal
- **Engagement Metrics**: Duration, opens, clicks, response time
- **Sentiment Tracking**: Track sentiment of activities
- **Activity Timeline**: Full history of all interactions
- **Activity Stats**: Aggregate stats by entity

## Activity Types

| Category | Types |
|----------|-------|
| Email | email_sent, email_opened, email_clicked, email_replied |
| Call | call_made, call_received, call_completed, call_missed |
| Meeting | meeting_scheduled, meeting_started, meeting_completed, meeting_cancelled |
| LinkedIn | linkedin_sent, linkedin_connected, linkedin_message |
| SMS | sms_sent, sms_received |
| Deal | deal_created, deal_stage_changed, deal_closed |
| Engagement | document_viewed, proposal_sent, contract_signed |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/activities` | Create activity |
| POST | `/api/v1/activities/batch` | Batch create |
| GET | `/api/v1/activities` | List activities |
| GET | `/api/v1/activities/timeline/:type/:id` | Get entity timeline |
| GET | `/api/v1/activities/stats/:type/:id` | Get entity stats |
| GET | `/api/v1/activities/types` | List activity types |

## Quick Start

```bash
npm install
npm run dev
```

## Related Services

- REZ-deal-intelligence (4131) - Deal tracking
- REZ-outbound-service (4130) - Outbound sequences
- REZ-signal-service (4129) - Signal detection
