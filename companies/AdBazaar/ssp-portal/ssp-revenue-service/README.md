# SSP Revenue Service

Revenue tracking service for AdBazaar Supply Side Platform (SSP) for DOOH advertising.

## Features

- Track revenue by type (impression, click, booking, commission)
- Revenue aggregation by screen, advertiser, and campaign
- Daily, weekly, and monthly revenue statistics
- Period-based revenue breakdowns
- MongoDB-backed persistent storage

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

Copy `.env.example` to `.env` and configure:

```bash
PORT=4524
MONGODB_URI=mongodb://localhost:27017/ssp_revenue
NODE_ENV=development
LOG_LEVEL=info
```

## API Endpoints

### Health & Readiness

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/ready` | Readiness check with MongoDB status |

### Revenue Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/revenue` | Create revenue record |
| GET | `/api/revenue` | List all records (paginated) |
| GET | `/api/revenue/:id` | Get record by ID |
| DELETE | `/api/revenue/:id` | Delete record |

### Revenue Queries

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/revenue/screen/:screenId` | Revenue by screen |
| GET | `/api/revenue/advertiser/:advertiserId` | Revenue by advertiser |
| GET | `/api/revenue/campaign/:campaignId` | Revenue by campaign |

### Revenue Statistics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/revenue/stats/overview` | Overall revenue stats |
| GET | `/api/revenue/stats/daily` | Daily revenue breakdown |
| GET | `/api/revenue/stats/weekly` | Weekly revenue breakdown |
| GET | `/api/revenue/stats/monthly` | Monthly revenue breakdown |
| GET | `/api/revenue/stats/screen/:screenId/period` | Screen revenue by period |

## API Examples

### Create Revenue Record

```bash
curl -X POST http://localhost:4524/api/revenue \
  -H "Content-Type: application/json" \
  -d '{
    "recordId": "REV-001",
    "type": "impression",
    "amount": 1500,
    "currency": "INR",
    "screenId": "SCREEN-001",
    "advertiserId": "ADV-001",
    "campaignId": "CAMP-001",
    "period": "daily",
    "periodDate": "2026-06-06T00:00:00Z",
    "metadata": {
      "impressions": 15000,
      "ctr": 0.025
    }
  }'
```

### Get Revenue Overview

```bash
curl http://localhost:4524/api/revenue/stats/overview
```

### Get Daily Revenue

```bash
curl "http://localhost:4524/api/revenue/stats/daily?startDate=2026-06-01&endDate=2026-06-30"
```

## Port

**4524** - SSP Revenue Service

## Dependencies

- express - Web framework
- mongoose - MongoDB ODM
- zod - Schema validation
- winston - Logging
- helmet - Security headers
- cors - CORS support
- morgan - HTTP logging
