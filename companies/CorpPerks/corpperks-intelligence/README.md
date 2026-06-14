# CorpPerks Intelligence

**AI Workforce Decision Intelligence Layer**

AI-powered decision intelligence for workforce management. Part of the CorpPerks ecosystem.

## Features

### Core AI Services

| Feature | Description |
|---------|-------------|
| **Decision Cards** | AI-generated actionable insights displayed as cards |
| **AI Copilot** | Natural language interface for workforce queries |
| **Health Score** | Composite 0-100 metric for workforce health |
| **Anomaly Detection** | Real-time detection of unusual patterns |
| **Forecasting** | Predictive analytics for attrition, headcount, payroll |

### Enterprise Features

| Feature | Description |
|---------|-------------|
| **Rate Limiting** | 4-tier protection (api, auth, write, ai) |
| **Auth Middleware** | JWT verification via RABTUL Auth Service |
| **Request Tracing** | Correlation IDs for debugging |
| **Metrics** | Prometheus-style metrics endpoint |
| **OpenAPI Docs** | Swagger documentation at `/api/docs` |
| **Graceful Shutdown** | Proper SIGTERM/SIGINT handling |
| **Structured Logging** | JSON logs with error IDs |

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## API Endpoints

### Health & Monitoring

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Full health check with metrics |
| GET | `/health/live` | Kubernetes liveness probe |
| GET | `/health/ready` | Kubernetes readiness probe |
| GET | `/metrics` | Prometheus metrics |
| GET | `/metrics?format=json` | JSON metrics |
| GET | `/api/docs` | OpenAPI specification |
| GET | `/api/docs.yaml` | YAML OpenAPI spec |

### Insights

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/insights/cards` | Get AI decision cards |
| GET | `/api/v1/insights/cards/:id` | Get specific card |
| DELETE | `/api/v1/insights/cards/:id` | Dismiss card |
| PUT | `/api/v1/insights/cards/:id/snooze` | Snooze card |
| GET | `/api/v1/insights/health` | Get workforce health score |
| GET | `/api/v1/insights/health/departments` | Department comparison |
| GET | `/api/v1/insights/health/history` | Health score history |
| GET | `/api/v1/insights/anomalies` | Detect anomalies |
| GET | `/api/v1/insights/anomalies/active` | Active anomalies |
| PUT | `/api/v1/insights/anomalies/:id/acknowledge` | Acknowledge anomaly |
| GET | `/api/v1/insights/anomalies/history` | Anomaly history |

### Copilot

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/copilot/query` | Process natural language query |
| GET | `/api/v1/copilot/suggestions` | Get suggested queries |
| POST | `/api/v1/copilot/explain` | Explain a metric |

### Forecasts

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/forecasts` | Complete workforce forecast |
| GET | `/api/v1/forecasts/attrition` | Attrition risk forecast |
| GET | `/api/v1/forecasts/hiring` | Hiring forecast |
| GET | `/api/v1/forecasts/cost` | Cost projection |
| GET | `/api/v1/forecasts/payroll` | Payroll forecast |
| GET | `/api/v1/forecasts/productivity` | Productivity forecast |
| GET | `/api/v1/forecasts/headcount` | Headcount forecast |
| GET | `/api/v1/forecasts/budget` | Hiring budget forecast |

### Ecosystem

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/ecosystem/services` | List connected services |
| GET | `/api/v1/ecosystem/health` | Check ecosystem health |
| GET | `/api/v1/ecosystem/rabtul/profile/:id` | Get RABTUL profile |
| GET | `/api/v1/ecosystem/intelligence/signals/:id` | Get REZ signals |
| GET | `/api/v1/ecosystem/intelligence/predictions/:id` | Get predictions |
| GET | `/api/v1/ecosystem/media/karma/:id` | Get karma score |
| GET | `/api/v1/ecosystem/media/leaderboard` | Get leaderboard |
| POST | `/api/v1/ecosystem/actions/award-points` | Award wallet points |
| POST | `/api/v1/ecosystem/actions/award-badge` | Award badge |
| POST | `/api/v1/ecosystem/actions/notify` | Send notification |

## Example Usage

### Health Score

```bash
curl http://localhost:4135/api/v1/insights/health \
  -H "X-Tenant-ID: tenant_123"
```

### AI Copilot

```bash
curl -X POST http://localhost:4135/api/v1/copilot/query \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: tenant_123" \
  -d '{"query": "Why is attrition increasing in Engineering?"}'
```

### Prometheus Metrics

```bash
curl http://localhost:4135/metrics
```

### Check Ecosystem Health

```bash
curl http://localhost:4135/api/v1/ecosystem/health \
  -H "X-Tenant-ID: tenant_123"
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              CorpPerks Intelligence (Port 4135)            │
├─────────────────────────────────────────────────────────────┤
│  Decision Cards   │  AI Copilot    │  Health Score       │
│  Anomaly Detect  │  Forecasting   │  Predictive Engine    │
├─────────────────────────────────────────────────────────────┤
│  Metrics        │  OpenAPI Docs │  Auth/Rate Limiting  │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│ CorpPerks API │  │ REZ Intellig.│  │ PeopleOS UI  │
│ (Port 4006)  │  │ (Port 4123) │  │  Frontend    │
└───────────────┘  └───────────────┘  └───────────────┘
```

## Rate Limiting

| Tier | Limit | Endpoint |
|------|-------|----------|
| API | 100/15min | `/api/*` |
| Auth | 20/15min | Auth endpoints |
| Write | 30/min | POST/PUT/DELETE |
| AI | 10/min | `/api/v1/copilot/*` |

## Ecosystem Integration

### RABTUL Technologies (Infrastructure)

| Service | Purpose | Integration |
|---------|---------|-------------|
| Auth Service | JWT verification | ✅ verifyToken() |
| Profile Service | Employee profiles | ✅ getEmployeeProfile() |
| Wallet Service | Points, balance | ✅ awardPoints() |
| Notifications | Push, SMS, Email | ✅ sendNotification() |
| Analytics | Dashboards | ✅ getWorkforceAnalytics() |

### REZ Intelligence (AI Layer)

| Service | Purpose | Integration |
|---------|---------|-------------|
| Signal Aggregator | Behavioral signals | ✅ getEmployeeSignals() |
| Predictive Engine | Attrition, burnout | ✅ getAttritionPrediction() |
| Intent Graph | Career intent | ✅ getCareerIntent() |
| Feature Store | ML features | ✅ getWorkforceFeatures() |
| Decision Engine | Cashback decisions | ✅ getCashbackDecision() |

### REZ Media (Rewards)

| Service | Purpose | Integration |
|---------|---------|-------------|
| Karma Service | Trust scores | ✅ getKarmaScore() |
| Gamification | Badges | ✅ awardBadge() |
| Rewards | Leaderboard | ✅ getLeaderboard() |

### RTNM Group (Platform)

| Service | Purpose | Integration |
|---------|---------|-------------|
| Platform Admin | Tenant management | ✅ getTenantHealth() |
| Support Dashboard | Tickets | ✅ createSupportTicket() |
| Ops Dashboard | Feature flags | ✅ getFeatureFlags() |

## Files Structure

```
corpperks-intelligence/src/
├── index.ts                    # Main server (Port 4135)
├── config/
│   └── index.ts              # Configuration
├── docs/
│   └── openapi.ts           # OpenAPI specification
├── middleware/
│   ├── index.ts             # Middleware exports
│   ├── auth.ts              # JWT auth middleware
│   ├── rateLimit.ts         # Rate limiting
│   └── requestId.ts         # Request tracing
├── services/
│   ├── decisionCards.ts     # Decision card generation
│   ├── copilotService.ts    # NL query processing
│   ├── healthScore.ts       # Health score calculation
│   ├── anomalyDetection.ts   # Anomaly detection
│   ├── forecastService.ts   # Predictive analytics
│   ├── ecosystemIntegrations.ts # RABTUL, REZ, RTNM
│   └── metrics.ts           # Prometheus metrics
├── routes/
│   ├── insights.ts          # /api/v1/insights/*
│   ├── copilot.ts          # /api/v1/copilot/*
│   ├── forecasts.ts         # /api/v1/forecasts/*
│   └── ecosystem.ts         # /api/v1/ecosystem/*
└── types/
    └── index.ts             # TypeScript interfaces
```

## License

MIT
