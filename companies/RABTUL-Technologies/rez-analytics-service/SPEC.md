# REZ Analytics Service - SPEC.md

**Version:** 1.0.0
**Port:** 4016
**Company:** RABTUL-Technologies
**Category:** Core

---

## Overview

Real-time analytics dashboard service providing business metrics, KPI tracking, report generation, and data export capabilities. Supports PDF and CSV exports.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     REZ Analytics Service                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│  Components:                                                                │
│  ├── Metrics Engine   → KPI calculations                                  │
│  ├── Report Generator → PDF/CSV export                                     │
│  ├── Aggregation Worker → Background data aggregation                      │
│  └── Scheduled Reports → Cron-based report delivery                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Models

### Metric
```typescript
{
  metricId: string
  name: string
  category: string
  value: number
  dimension: Record<string, string>
  timestamp: Date
}
```

### Report
```typescript
{
  reportId: string
  name: string
  type: 'sales' | 'user' | 'product' | 'custom'
  filters: Record<string, any>
  format: 'pdf' | 'csv' | 'json'
  status: 'pending' | 'processing' | 'completed' | 'failed'
  downloadUrl?: string
  createdAt: Date
  completedAt?: Date
}
```

---

## API Endpoints

### Metrics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/metrics` | Get aggregated metrics |
| GET | `/api/metrics/:category` | Get metrics by category |
| GET | `/api/metrics/realtime` | Real-time metrics |

### Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/reports` | Create report |
| GET | `/api/reports/:id` | Get report status |
| GET | `/api/reports/:id/download` | Download report |

### Dashboards
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/summary` | Dashboard summary |
| GET | `/api/dashboard/kpis` | KPI metrics |

### Export
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/export/:type` | Export data (CSV) |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |

---

## Dependencies

```json
{
  "express": "^4.18.2",
  "cors": "^2.8.5",
  "helmet": "^7.1.0",
  "morgan": "^1.10.0",
  "node-cron": "^3.0.3",
  "uuid": "^9.0.1",
  "date-fns": "^2.30.0",
  "pdfkit": "^0.14.0",
  "json2csv": "^6.0.0-alpha.2"
}
```

---

## Status

- [x] Metrics aggregation
- [x] Dashboard summaries
- [x] KPI tracking
- [x] PDF reports
- [x] CSV export
- [x] Scheduled reports
- [x] Background workers
