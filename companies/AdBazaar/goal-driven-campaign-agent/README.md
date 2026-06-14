# Goal-Driven Campaign Agent

**Port:** 4821

An autonomous AI agent for goal-driven advertising campaigns. Advertisers simply say "Get me 500 leads" and the agent handles everything - from audience discovery to budget optimization.

## Features

- **Natural Language Goal Setting** - Set goals like "Get me 500 leads for Rs. 5000"
- **Autonomous Audience Discovery** - AI discovers and targets optimal audiences
- **Creative Generation & Testing** - Automatically generates and A/B tests creatives
- **Budget Allocation & Optimization** - Real-time budget reallocation based on performance
- **Real-time Decision Making** - Continuous decision loop optimizing campaign performance
- **Progress Tracking & Reporting** - Real-time metrics and comprehensive logging
- **Explainable AI Actions** - Every decision is logged with reasoning and confidence scores

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Goal-Driven Campaign Agent                   │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   Express  │  │    JWT     │  │   Zod      │             │
│  │   Server   │  │   Auth     │  │ Validation │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│         │                                                    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                    Agent Service                      │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │    │
│  │  │  Decision  │  │  Execution  │  │   Sync     │  │    │
│  │  │   Engine   │  │   Engine    │  │   Engine   │  │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  │    │
│  └─────────────────────────────────────────────────────┘    │
│         │                                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │  MongoDB    │  │   Redis    │  │  Prometheus │          │
│  │  Campaign   │  │   Cache    │  │   Metrics   │          │
│  │   Store     │  │            │  │            │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

## Goal Types

| Type | Description | Example |
|------|-------------|---------|
| `leads` | Generate qualified leads | "Get me 500 leads" |
| `sales` | Drive direct sales | "Generate Rs. 10000 in sales" |
| `bookings` | Drive reservations/bookings | "Get 100 table bookings" |
| `app_installs` | Drive app installations | "Get 1000 app installs" |
| `engagement` | Drive user engagement | "Get 10000 engagements" |

## API Endpoints

### Create Campaign
```http
POST /api/agent/campaign
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Summer Sale Campaign",
  "goal": {
    "type": "sales",
    "target": 500,
    "budget": 50000,
    "deadline": "2026-07-01T00:00:00Z"
  },
  "advertiserId": "adv_123"
}
```

### Get Campaign Status
```http
GET /api/agent/campaign/:id
Authorization: Bearer <token>
```

### Set/Change Goal
```http
POST /api/agent/campaign/:id/goal
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "leads",
  "target": 1000,
  "budget": 75000
}
```

### Get AI Actions
```http
GET /api/agent/campaign/:id/actions?limit=50&offset=0
Authorization: Bearer <token>
```

### Pause Agent
```http
PUT /api/agent/campaign/:id/pause
Authorization: Bearer <token>
```

### Get Activity Logs
```http
GET /api/agent/campaign/:id/logs?limit=100&offset=0
Authorization: Bearer <token>
```

### Start Agent (Manual)
```http
POST /api/agent/campaign/:id/start
Authorization: Bearer <token>
```

### Resume Agent
```http
POST /api/agent/campaign/:id/resume
Authorization: Bearer <token>
```

## Agent Actions

The agent performs the following actions autonomously:

| Action | Description |
|--------|-------------|
| `audience_research` | Discovers optimal audience segments |
| `audience_targeting` | Targets or expands audience targeting |
| `creative_generation` | Generates new ad creatives |
| `creative_testing` | A/B tests different creatives |
| `bid_optimization` | Adjusts bids based on CPA performance |
| `budget_reallocation` | Reallocates budget across channels |
| `channel_activation` | Activates new advertising channels |
| `channel_deactivation` | Deactivates underperforming channels |
| `pause_campaign` | Pauses campaign if needed |
| `resume_campaign` | Resumes paused campaign |
| `goal_adjustment` | Adjusts goal based on performance |
| `report_generation` | Generates performance reports |

## Campaign Schema

```typescript
interface GoalDrivenCampaign {
  campaignId: string;
  agentId: string;
  advertiserId: string;
  name: string;
  goal: {
    type: 'leads' | 'sales' | 'bookings' | 'app_installs' | 'engagement';
    target: number;
    budget: number;
    deadline?: Date;
  };
  currentStatus: {
    achieved: number;
    progress: number; // percentage
    spend: number;
    cpa: number;
    roas: number;
  };
  agentActions: {
    timestamp: Date;
    action: string;
    details: object;
    result?: object;
  }[];
  decisions: {
    audienceTargeted: string[];
    creativesUsed: string[];
    channelsActive: string[];
    bidStrategy: string;
  };
  status: 'planning' | 'running' | 'paused' | 'completed' | 'failed';
  logs: {
    timestamp: Date;
    level: 'info' | 'warning' | 'error';
    message: string;
    context?: object;
  }[];
  createdAt: Date;
  updatedAt: Date;
}
```

## Quick Start

```bash
# Install dependencies
cd goal-driven-campaign-agent
npm install

# Copy environment file
cp .env.example .env

# Start the service
npm run dev

# Or build and run
npm run build
npm start
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 4821 | Server port |
| `MONGODB_URI` | mongodb://localhost:27017/goal-driven-campaign-agent | MongoDB connection URI |
| `REDIS_URL` | redis://localhost:6379 | Redis connection URL |
| `JWT_SECRET` | - | JWT signing secret (required) |
| `OPENAI_API_KEY` | - | OpenAI API key for AI features |
| `REZ_ADS_SERVICE_URL` | http://localhost:4007 | REZ Ads service URL |
| `NODE_ENV` | development | Environment (development/production) |
| `LOG_LEVEL` | info | Logging level |

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm test -- --coverage
```

## Health Check

```bash
curl http://localhost:4821/api/health
```

## Metrics

Prometheus metrics are available at:

```bash
curl http://localhost:4821/metrics
```

## Metrics Available

- `campaigns_created_total` - Total campaigns created
- `campaigns_by_status` - Campaigns by status
- `agent_actions_total` - Agent actions by type
- `agent_decision_duration_seconds` - Decision cycle duration
- `campaign_budget_total` - Total budget allocated
- `campaign_spend_total` - Total spend
- `campaign_conversions_total` - Total conversions
- `campaign_progress_percent` - Average progress
- `http_request_duration_seconds` - HTTP request duration
- `cache_hits_total` / `cache_misses_total` - Cache performance
- `external_service_calls_total` - External service calls

## Integration

### With REZ Ads Service

The agent syncs with the REZ Ads service to:
- Fetch real-time campaign metrics
- Update budget allocations
- Sync creative assignments
- Monitor channel performance

### With HOJAI

For advanced AI features, the agent can integrate with HOJAI:
- Natural language goal interpretation
- Advanced audience discovery
- Creative generation using AI
- Competitive analysis

## Error Handling

All errors are:
- Logged with full context
- Tracked in Prometheus metrics
- Returned with appropriate HTTP status codes
- Recorded in campaign logs

## License

MIT
