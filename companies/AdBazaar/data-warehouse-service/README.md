# Data Warehouse Service

Centralized data warehouse for AdBazaar analytics.

## Features

- **Data Sync**: Sync data from multiple sources (Google Analytics, Facebook Ads, Google Ads)
- **Schema Management**: Define and manage data schemas
- **Data Transformation**: Apply filters, maps, and aggregations
- **Table Management**: Manage warehouse tables
- **Query Execution**: Execute queries against data sources

## Quick Start

```bash
cd data-warehouse-service
npm install
npm run dev
```

## API Endpoints

### Data

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/data/sync` | Sync data from source |
| GET | `/api/data/:source` | Get data from source |
| POST | `/api/data/transform` | Transform data |
| GET | `/api/data/:source/schema` | Get source schema |
| POST | `/api/data/query` | Execute query |

### Schemas

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/schemas` | Create schema |
| GET | `/api/schemas/source/:sourceId` | Get schema by source |
| PUT | `/api/schemas/:id` | Update schema |
| GET | `/api/schemas/:id/history` | Get schema history |
| POST | `/api/schemas/validate/:id` | Validate schema |
| POST | `/api/schemas/infer` | Infer schema from data |

### Syncs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/syncs` | List all syncs |
| GET | `/api/syncs/stats` | Get sync statistics |
| GET | `/api/syncs/:id` | Get sync by ID |
| POST | `/api/syncs/:id/cancel` | Cancel sync |
| GET | `/api/syncs/source/:sourceId/history` | Get source sync history |

### Tables

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tables/source/:sourceId` | List tables for source |
| POST | `/api/tables` | Create table |
| GET | `/api/tables/:id` | Get table by ID |
| PUT | `/api/tables/:id` | Update table |
| DELETE | `/api/tables/:id` | Delete table |
| GET | `/api/tables/:id/stats` | Get table statistics |
| GET | `/api/tables/:id/data` | Get table data |

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 5090 |
| MONGODB_URI | MongoDB connection string | mongodb://localhost:27017/adbazaar-warehouse |
| LOG_LEVEL | Log level | info |

## Authentication

All API endpoints require authentication via the `x-api-key` header.

## Supported Data Sources

- Google Analytics
- Facebook Ads
- Google Ads
- MongoDB
- PostgreSQL
- MySQL
- REST APIs
- GraphQL

## Health Check

```bash
curl http://localhost:5090/health
```

## Metrics

Prometheus metrics available at:
```bash
curl http://localhost:5090/metrics
```