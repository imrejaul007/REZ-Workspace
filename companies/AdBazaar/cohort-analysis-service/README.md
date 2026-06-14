# Cohort Analysis Service

Advanced cohort analysis for AdBazaar analytics.

## Features

- **Cohort Analysis**: Analyze user behavior by cohort groups
- **Retention Analysis**: Track user retention over time
- **Revenue Analysis**: Analyze revenue by user cohorts
- **Segment Management**: Define and manage user segments
- **Comparison**: Compare multiple cohorts side by side
- **Export**: Export analysis results as JSON or CSV

## Quick Start

```bash
cd cohort-analysis-service
npm install
npm run dev
```

## API Endpoints

### Cohorts

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/cohorts` | List all cohorts |
| POST | `/api/cohorts` | Create a new cohort |
| GET | `/api/cohorts/:id` | Get cohort by ID |
| PUT | `/api/cohorts/:id` | Update cohort |
| DELETE | `/api/cohorts/:id` | Delete cohort |
| GET | `/api/cohorts/:id/analysis` | Analyze cohort |
| GET | `/api/cohorts/:id/compare` | Compare cohorts |
| GET | `/api/cohorts/:id/export` | Export cohort data |

### Analyses

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analyses` | List all analyses |
| GET | `/api/analyses/stats` | Get analysis statistics |
| GET | `/api/analyses/cohort/:cohortId` | Get analyses for cohort |
| GET | `/api/analyses/:id` | Get analysis by ID |
| DELETE | `/api/analyses/:id` | Delete analysis |

### Segments

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/segments` | List all segments |
| POST | `/api/segments` | Create a new segment |
| GET | `/api/segments/:id` | Get segment by ID |
| PUT | `/api/segments/:id` | Update segment |
| DELETE | `/api/segments/:id` | Delete segment |
| GET | `/api/segments/:id/estimate` | Estimate segment size |

### Comparisons

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/comparisons` | List all comparisons |
| GET | `/api/comparisons/stats` | Get comparison statistics |
| GET | `/api/comparisons/:id` | Get comparison by ID |
| DELETE | `/api/comparisons/:id` | Delete comparison |

## Cohort Types

- **retention**: User retention analysis
- **revenue**: Revenue cohort analysis
- **engagement**: User engagement analysis
- **conversion**: Conversion funnel analysis
- **behavioral**: Behavioral cohort analysis

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 5092 |
| MONGODB_URI | MongoDB connection string | mongodb://localhost:27017/adbazaar-cohorts |
| LOG_LEVEL | Log level | info |

## Authentication

All API endpoints require authentication via the `x-api-key` header.

## Visualization Types

- **heatmap**: Retention heatmap (default)
- **line**: Line chart over time
- **bar**: Bar chart comparison
- **table**: Tabular data view

## Health Check

```bash
curl http://localhost:5092/health
```

## Metrics

Prometheus metrics available at:
```bash
curl http://localhost:5092/metrics
```