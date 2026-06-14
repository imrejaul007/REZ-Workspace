# Autonomous Growth Orchestrator

**Port:** 4930  
**Company:** AdBazaar  
**Purpose:** AI-powered autonomous campaign management system that self-manages advertising campaigns

---

## Overview

The Autonomous Growth Orchestrator is AdBazaar's AI-powered system for autonomous campaign management. It continuously monitors campaign performance, makes intelligent optimization decisions, and applies changes within defined constraints - all while keeping humans in the loop for critical decisions.

### Key Features

1. **Autonomous Optimization**
   - Continuous monitoring of campaign performance
   - Automatic budget reallocation based on ROI
   - Bid optimization to maximize conversions
   - Audience refinement for better targeting
   - Creative rotation to combat fatigue

2. **AI Decision Engine**
   - Data-driven decision making using performance metrics
   - Confidence scoring for each decision
   - Multiple alternative strategies consideration
   - Risk assessment for each proposed change

3. **Constraint Management**
   - Define hard limits and soft thresholds
   - Budget caps, bid limits, audience restrictions
   - Automatic validation before applying changes
   - Violation alerts and monitoring

4. **Human-in-the-Loop**
   - Critical decisions require human approval
   - Clear recommendations with reasoning
   - Approve/reject workflow
   - Audit trail for all decisions

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    AUTONOMOUS GROWTH ORCHESTRATOR                          │
├─────────────────────────────────────────────────────────────────────────────┤
│ ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  Campaign │  │   Decision  │  │ Optimization│ │  Constraint │ │
│  │  Service    │  │   Engine    │  │   Service   │  │   Service   │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
│ │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                  Human-in-the-Loop Service                     │  │
│  │         (Approval Workflow& Recommendations)                 │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                      Express API (Port 4930)                    │  │
│  │        Health | Metrics | Dashboard | Campaign Management      │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## API Endpoints

### Campaign Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/campaigns` | Create autonomous campaign |
| GET | `/api/campaigns` | List campaigns with filters |
| GET | `/api/campaigns/:id` | Get campaign details |
| POST | `/api/campaigns/:id/start` | Start autonomous mode |
| POST | `/api/campaigns/:id/pause` | Pause autonomous mode |
| DELETE | `/api/campaigns/:id` | Delete campaign |

### AI Decisions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/campaigns/:id/decisions` | Get AI decisions log |
| POST | `/api/campaigns/:id/analyze` | Trigger AI analysis |

### Optimization

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/campaigns/:id/optimizations` | Get optimization history |
| POST | `/api/optimization/cycle` | Trigger optimization cycle |

### Constraints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/campaigns/:id/constraints` | Set constraints |
| GET | `/api/campaigns/:id/constraints` | Get campaign constraints |
| DELETE | `/api/campaigns/:id/constraints/:constraintId` | Remove constraint |

### Performance

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/campaigns/:id/performance` | Get live performance |

### Human-in-the-Loop

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/campaigns/:id/recommendations` | Get pending recommendations |
| POST | `/api/campaigns/:id/approve` | Approve recommendation |
| POST | `/api/campaigns/:id/reject` | Reject recommendation |

### Dashboard

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard` | Orchestrator dashboard |
| GET | `/api/approvals` | All pending approvals |

### System

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/metrics` | Prometheus metrics |

---

## Request/Response Examples

### Create Campaign

```bash
curl -X POST http://localhost:4930/api/campaigns \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: your-token" \
  -d '{
    "advertiserId": "adv_123",
    "name": "Summer Sale Campaign",
    "description": "Autonomous campaign for summer sale",
    "objectives": [
      { "type": "roas", "target": 5.0, "minTarget": 3.0 }
    ],
    "budget": {
      "total": 100000,
      "daily": 5000
    },
    "autonomousMode": true
  }'
```

### Start Autonomous Mode

```bash
curl -X POST http://localhost:4930/api/campaigns/{id}/start \
  -H "X-Internal-Token: your-token"
```

### Get Recommendations

```bash
curl -X GET http://localhost:4930/api/campaigns/{id}/recommendations \
  -H "X-Internal-Token: your-token"
```

### Approve Recommendation

```bash
curl -X POST http://localhost:4930/api/campaigns/{id}/approve \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: your-token" \
  -H "X-User-Id: user_123" \
  -d '{
    "decisionId": "decision_456",
    "notes": "Approved - looks good for Q3 goals"
  }'
```

### Set Constraints

```bash
curl -X POST http://localhost:4930/api/campaigns/{id}/constraints \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: your-token" \
  -d '{
    "type": "budget",
    "key": "maxDaily",
    "value": 10000,
    "hardLimit": true,
    "description": "Maximum daily budget cap"
  }'
```

### Get Dashboard

```bash
curl -X GET http://localhost:4930/api/dashboard \
  -H "X-Internal-Token: your-token"
```

---

## Data Models

### AutonomousCampaign

| Field | Type | Description |
|-------|------|-------------|
| advertiserId | String | Advertiser identifier |
| name | String | Campaign name |
| objectives | Array | Campaign objectives (ROAS, conversions, etc.) |
| constraints | Object | Campaign constraints |
| budget | Object | Budget configuration |
| status | String | draft, pending, active, paused, completed, failed |
| autonomousMode | Boolean | Whether autonomous mode is enabled |
| performance | Object | Live performance metrics |

### Decision

| Field | Type | Description |
|-------|------|-------------|
| campaignId | ObjectId | Reference to campaign |
| type | String | Decision type (budget_reallocation, bid_adjustment, etc.) |
| action | Object | Proposed action details |
| reasoning | Object | AI analysis and confidence |
| impact | Object | Expected impact metrics |
| approved | Boolean | Whether approved |
| executed | Boolean | Whether executed |

### Constraint

| Field | Type | Description |
|-------|------|-------------|
| campaignId | ObjectId | Reference to campaign |
| type | String | Constraint type |
| key | String | Constraint identifier |
| value | Mixed | Constraint value |
| hardLimit | Boolean | Whether this is a hard limit |

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 4930 | Server port |
| MONGODB_URI | mongodb://localhost:27017/adbazaar-autonomous-growth | MongoDB connection string |
| REDIS_URL | redis://localhost:6379 | Redis connection string |
| INTERNAL_SERVICE_TOKEN | - | Internal service authentication token |
| HOJAI_URL | http://localhost:4800 | HOJAI AI service URL |
| NOTIFICATION_WEBHOOK | - | Webhook for notifications |
| LOG_LEVEL | info | Logging level |

---

## Quick Start

### Installation

```bash
cd autonomous-growth-orchestrator
npm install
```

### Development

```bash
npm run dev
```

### Production

```bash
npm run build
npm start
```

### Health Check

```bash
curl http://localhost:4930/health
```

### Dashboard

```bash
curl http://localhost:4930/api/dashboard
```

---

## Metrics

The service exposes Prometheus metrics at `/metrics`:

- `autonomous_campaigns_total` - Total campaigns by status
- `autonomous_campaigns_active` - Active autonomous campaigns
- `autonomous_decisions_total` - AI decisions made
- `autonomous_optimizations_total` - Optimizations applied
- `autonomous_budget_allocated_total` - Total budget allocated
- `autonomous_average_roas` - Average ROAS
- `autonomous_human_approvals_required` - Pending approvals
- `autonomous_human_approvals_given` - Approvals given
- `autonomous_constraint_violations_total` - Constraint violations
- `autonomous_decision_latency_seconds` - Decision latency histogram

---

## Decision Types

| Type | Description |
|------|-------------|
| budget_reallocation | Budget shift between campaigns/ad sets |
| bid_adjustment | Modify bid amounts |
| audience_expansion | Widen targeting |
| audience_restriction | Narrow targeting |
| creative_rotation | Test new creatives |
| placement_optimization | Adjust placements |
| keyword_bidding | Keyword bid changes |
| frequency_capping | Limit impression frequency |
| ad_format_switch | Change ad formats |
| campaign_pause | Pause campaign |
| campaign_resume | Resume campaign |
| targeting_adjustment | Modify targeting |
| schedule_optimization | Adjust scheduling |

---

## Integration

### Internal Services

The orchestrator integrates with:

- **RABTUL Auth** - Token verification
- **HOJAI AI** - AI decision making
- **AdBazaar Services** - Campaign management

### Webhooks

Configure notification webhook for:

- Pending approval alerts
- Constraint violations
- Performance milestones

---

## License

Proprietary - AdBazaar
