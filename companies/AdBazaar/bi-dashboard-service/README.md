# BI Dashboard Service

Business intelligence dashboards for AdBazaar analytics.

## Features

- **Interactive Dashboards**: Create and manage BI dashboards
- **Widget Library**: Reusable charts, tables, and KPI widgets
- **Chart Templates**: Pre-configured chart templates
- **Multiple Data Sources**: Connect to various analytics platforms
- **Real-time Refresh**: Auto-refresh dashboard data

## Quick Start

```bash
cd bi-dashboard-service
npm install
npm run dev
```

## API Endpoints

### Dashboards

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboards` | List all dashboards |
| GET | `/api/dashboards/favorites` | Get favorite dashboards |
| POST | `/api/dashboards` | Create a new dashboard |
| GET | `/api/dashboards/:id` | Get dashboard by ID |
| PUT | `/api/dashboards/:id` | Update dashboard |
| DELETE | `/api/dashboards/:id` | Delete dashboard |
| POST | `/api/dashboards/:id/widgets` | Add widget to dashboard |
| DELETE | `/api/dashboards/:id/widgets/:widgetId` | Remove widget |
| GET | `/api/dashboards/:id/refresh` | Refresh dashboard |
| POST | `/api/dashboards/:id/favorite` | Toggle favorite |

### Widgets

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/widgets` | List all widgets |
| GET | `/api/widgets/popular` | Get popular widgets |
| POST | `/api/widgets` | Create a new widget |
| GET | `/api/widgets/:id` | Get widget by ID |
| PUT | `/api/widgets/:id` | Update widget |
| DELETE | `/api/widgets/:id` | Delete widget |

### Charts

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/charts` | List all charts |
| GET | `/api/charts/templates` | Get chart templates |
| POST | `/api/charts` | Create a new chart |
| GET | `/api/charts/:id` | Get chart by ID |
| PUT | `/api/charts/:id` | Update chart |
| DELETE | `/api/charts/:id` | Delete chart |
| GET | `/api/charts/:id/render` | Render chart |

### Data Sources

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/datasources` | List all data sources |
| POST | `/api/datasources` | Create a new data source |
| GET | `/api/datasources/:id` | Get data source by ID |
| PUT | `/api/datasources/:id` | Update data source |
| DELETE | `/api/datasources/:id` | Delete data source |
| POST | `/api/datasources/:id/test` | Test connection |
| GET | `/api/datasources/:id/fetch` | Fetch data |

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 5091 |
| MONGODB_URI | MongoDB connection string | mongodb://localhost:27017/adbazaar-bi |
| LOG_LEVEL | Log level | info |

## Authentication

All API endpoints require authentication via the `x-api-key` header.

## Widget Types

- **chart**: Line, bar, pie, area, scatter, gauge, funnel, heatmap
- **table**: Tabular data display
- **metric**: Single value KPI
- **kpi**: Key performance indicator
- **text**: Rich text content
- **image**: Image display

## Chart Types

- Line charts
- Bar charts
- Pie charts
- Area charts
- Scatter plots
- Gauge charts
- Funnel charts
- Heatmaps
- Candlestick charts

## Health Check

```bash
curl http://localhost:5091/health
```

## Metrics

Prometheus metrics available at:
```bash
curl http://localhost:5091/metrics
```