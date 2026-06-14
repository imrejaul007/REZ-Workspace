# Segmentation Engine Service

Real-time audience segmentation for AdBazaar.

## Features

- Dynamic and static segments
- Complex criteria with AND/OR logic
- Real-time user evaluation
- Member management
- Segment analytics

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/segments | Create segment |
| GET | /api/segments | List segments |
| GET | /api/segments/:id | Get segment |
| PUT | /api/segments/:id | Update segment |
| GET | /api/segments/:id/members | Get segment members |
| POST | /api/segments/:id/members | Add member |
| DELETE | /api/segments/:id/members/:userId | Remove member |
| POST | /api/segments/evaluate | Evaluate user segments |
| DELETE | /api/segments/:id | Archive segment |

## Quick Start

```bash
cd /Users/rejaulkarim/Documents/ReZ\ Full\ App/AdBazaar/segmentation-engine-service
npm install
npm run dev
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 5097 | Service port |
| MONGODB_URI | mongodb://localhost:27017/segmentation-engine | MongoDB connection |