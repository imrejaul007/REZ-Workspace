# Content Heatmap Service

**Port:** 5075

Track content engagement metrics with heatmaps, events, analytics, and segments.

## Features

- Real-time event tracking (views, clicks, scrolls, shares)
- Heatmap data with scroll depth and click maps
- Geographic and device breakdown
- Content analytics with trends
- Audience segmentation
- Dashboard with top content

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/heatmap/:contentId/track | Track engagement event |
| GET | /api/heatmap/:contentId | Get heatmap |
| GET | /api/heatmap/:contentId/range | Get heatmap range |
| GET | /api/heatmap/:contentId/analytics | Get analytics |
| GET | /api/heatmap/dashboard/all | Get dashboard |
| POST | /api/heatmap/segments | Create segment |
| GET | /api/heatmap/segments/list | List segments |
| GET | /api/heatmap/segments/:id | Get segment |
| DELETE | /api/heatmap/segments/:id | Delete segment |
| GET | /health | Health check |
| GET | /metrics | Prometheus metrics |

## Quick Start

```bash
npm install
npm run dev
curl http://localhost:5075/health
```

## License

Proprietary - AdBazaar