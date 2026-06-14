# REZ Signal Service

**Port: 4129**

B2B Intent Signal Detection Service - Detect, track, and act on buyer intent signals.

## Features

- **Signal Detection**: Detect 14 types of B2B intent signals
- **Intent Scoring**: Multi-dimensional intent scoring (awareness → purchase)
- **Alert Generation**: Automatic alerts for high-intent accounts
- **Trend Analysis**: Track signal trends over time
- **Company Tracking**: Monitor signal activity for target accounts
- **Priority Management**: Flag and prioritize high-intent accounts

## Signal Types

| Type | Description | Intent Stage |
|------|-------------|--------------|
| jobPosting | Hiring activity | Consideration |
| funding | Investment news | Decision |
| technologyChange | Tech stack changes | Consideration |
| expansion | Business expansion | Consideration |
| executiveChange | Leadership changes | Awareness |
| partnership | New partnerships | Consideration |
| productLaunch | Product announcements | Awareness |
| news | Press/news coverage | Awareness |
| regulatory | Compliance requirements | Decision |
| socialEngagement | Social media activity | Awareness |

## API Endpoints

### Signals

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/signals` | Create signal |
| POST | `/api/v1/signals/batch` | Create multiple signals |
| GET | `/api/v1/signals` | List signals |
| GET | `/api/v1/signals/top` | Get top signals |
| GET | `/api/v1/signals/company/:id` | Get company signals |
| GET | `/api/v1/signals/types` | Get signal types |
| PATCH | `/api/v1/signals/:id/engage` | Record engagement |

### Alerts

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/alerts` | Create alert |
| GET | `/api/v1/alerts` | List alerts |
| GET | `/api/v1/alerts/actionable` | Get actionable alerts |
| GET | `/api/v1/alerts/company/:id` | Get company alerts |
| PATCH | `/api/v1/alerts/:id` | Update alert |
| POST | `/api/v1/alerts/generate` | Generate alerts from signals |

### Companies

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/companies` | List companies with signals |
| GET | `/api/v1/companies/intent-leaderboard` | Ranked by intent |
| GET | `/api/v1/companies/active-signals` | Trending accounts |
| GET | `/api/v1/companies/stats` | Aggregate statistics |
| PATCH | `/api/v1/companies/:id/priority` | Update priority |

## Intent Stages

```
awareness → consideration → decision → purchase
   (low)         (med)         (high)    (highest)
```

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 4129 | Service port |
| MONGODB_URI | mongodb://localhost:27017/rez-signal-service | MongoDB |
| NODE_ENV | development | Environment |
| MIN_SIGNAL_SCORE | 30 | Minimum signal score |
| TREND_WINDOW_DAYS | 30 | Days for trend calculation |
| SPIKE_THRESHOLD | 2.0 | Threshold for spike detection |

## Related Services

- **REZ TAM Builder** (Port 4128) - Account universe building
- **REZ Intelligence** (Ports 4100-4119) - AI/ML services
- **RAZO** (Ports 4300-4312) - Revenue AI Suite
