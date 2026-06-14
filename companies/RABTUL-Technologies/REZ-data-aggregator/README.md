# REZ Data Aggregator

Unified data aggregation from multiple sources.

## Quick Start

```bash
npm install
npm run dev
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/sources | List data sources |
| POST | /api/aggregate | Aggregate from sources |
| GET | /api/query/:source | Query specific source |
| POST | /api/reports | Generate reports |

## Environment Variables

```bash
MONGODB_URI=mongodb://localhost:27017/data-aggregator
```

## Data Sources

- MongoDB collections
- External APIs
- Elasticsearch
- Redis
