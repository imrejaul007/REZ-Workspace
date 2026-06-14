# AdBazaar Support Analytics Service

Support team performance analytics for AdBazaar support operations.

## Features

- Analytics overview dashboard
- Team performance metrics
- Agent performance analytics
- Trend analysis with configurable granularity
- Customizable dashboards
- SLA compliance tracking
- Customer satisfaction metrics
- First contact resolution tracking

## API Endpoints

### Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/overview` | Get analytics overview |
| GET | `/api/analytics/team/:teamId` | Get team analytics |
| GET | `/api/analytics/agent/:agentId` | Get agent analytics |
| GET | `/api/analytics/trends` | Get trend data |
| GET | `/api/analytics/metrics` | Get aggregated metrics |

### Dashboards

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/dashboard` | List dashboards |
| GET | `/api/analytics/dashboard/:id` | Get dashboard by ID |
| POST | `/api/analytics/dashboard` | Create new dashboard |
| PUT | `/api/analytics/dashboard/:id` | Update dashboard |

## Query Parameters

### Overview, Team, and Agent Analytics

| Parameter | Type | Description |
|-----------|------|-------------|
| startDate | ISO date | Start of date range |
| endDate | ISO date | End of date range |

### Trends

| Parameter | Type | Description |
|-----------|------|-------------|
| metric | string | Metric name |
| startDate | ISO date | Start of date range |
| endDate | ISO date | End of date range |
| granularity | string | daily, weekly, or monthly |

## Metrics Tracked

- Ticket volume
- Response time (average)
- Resolution time (average)
- SLA compliance rate
- Customer satisfaction score
- First contact resolution rate
- Agent productivity

## Configuration

Environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Service port | 5087 |
| MONGODB_URI | MongoDB connection string | mongodb://localhost:27017/support-analytics |
| LOG_LEVEL | Logging level | info |
| SERVICE_API_KEY | API key for authentication | adbazaar-service-key |
| INTERNAL_SERVICE_TOKEN | Internal service token | - |

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Health Check

```bash
curl http://localhost:5087/health
```

## Metrics

Prometheus metrics available at `/metrics`.

## License

Proprietary - AdBazaar