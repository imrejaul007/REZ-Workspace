# Custom Report Builder Service

Drag-and-drop report builder for AdBazaar analytics.

## Features

- **Drag-and-Drop Interface**: Build reports with reusable widgets
- **Multiple Data Sources**: Connect to MongoDB, PostgreSQL, APIs
- **Layout Management**: Customizable grid layouts
- **Widget Library**: Reusable chart, table, and metric widgets
- **Real-time Preview**: Preview reports before publishing

## Quick Start

```bash
cd custom-report-builder-service
npm install
npm run dev
```

## API Endpoints

### Reports

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reports` | List all reports |
| POST | `/api/reports` | Create a new report |
| GET | `/api/reports/:id` | Get report by ID |
| PUT | `/api/reports/:id` | Update report |
| DELETE | `/api/reports/:id` | Delete report |
| POST | `/api/reports/:id/widgets` | Add widget to report |
| GET | `/api/reports/:id/preview` | Preview report |
| POST | `/api/reports/:id/run` | Run report |

### Widgets

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/widgets` | List all widgets |
| GET | `/api/widgets/popular` | Get popular widgets |
| POST | `/api/widgets` | Create a new widget |
| GET | `/api/widgets/:id` | Get widget by ID |
| PUT | `/api/widgets/:id` | Update widget |
| DELETE | `/api/widgets/:id` | Delete widget |

### Layouts

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/layouts` | List all layouts |
| GET | `/api/layouts/default` | Get default layout |
| POST | `/api/layouts` | Create a new layout |
| GET | `/api/layouts/:id` | Get layout by ID |
| PUT | `/api/layouts/:id` | Update layout |
| DELETE | `/api/layouts/:id` | Delete layout |

### Data Sources

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/datasources` | List all data sources |
| POST | `/api/datasources` | Create a new data source |
| GET | `/api/datasources/:id` | Get data source by ID |
| PUT | `/api/datasources/:id` | Update data source |
| DELETE | `/api/datasources/:id` | Delete data source |
| POST | `/api/datasources/:id/test` | Test connection |
| POST | `/api/datasources/:id/query` | Execute query |

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 5089 |
| MONGODB_URI | MongoDB connection string | mongodb://localhost:27017/adbazaar-report-builder |
| LOG_LEVEL | Log level | info |

## Authentication

All API endpoints require authentication via the `x-api-key` header:

```bash
curl -H "x-api-key: your-api-key" http://localhost:5089/api/reports
```

## Widget Types

- **chart**: Line, bar, pie, area, scatter charts
- **table**: Tabular data display
- **metric**: Single value KPI display
- **text**: Rich text content
- **image**: Image display
- **filter**: Interactive filter controls

## Health Check

```bash
curl http://localhost:5089/health
```

## Metrics

Prometheus metrics available at:
```bash
curl http://localhost:5089/metrics
```