# Content Workflow Service

**Port:** 5072

Review, approval, and publishing workflows for content management. Supports multi-stage approval processes with delegation and history tracking.

## Features

- Multi-stage workflow creation
- Sequential and parallel approvals
- Workflow submission, approval, and publishing
- Approval delegation
- Full audit history
- Priority levels
- Deadline tracking

## Tech Stack

- Express.js
- MongoDB with Mongoose
- Winston logging
- Prometheus metrics
- Zod validation

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/workflows | Create workflow |
| GET | /api/workflows | List workflows |
| GET | /api/workflows/:id | Get workflow |
| PUT | /api/workflows/:id | Update workflow |
| POST | /api/workflows/:id/submit | Submit for review |
| POST | /api/workflows/:id/approve | Approve/reject |
| POST | /api/workflows/:id/publish | Publish approved |
| GET | /api/workflows/:id/history | Get history |
| GET | /api/workflows/:id/approvals | Get approvals |
| GET | /health | Health check |
| GET | /metrics | Prometheus metrics |

## Quick Start

```bash
npm install
npm run dev
curl http://localhost:5072/health
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 5072 | Service port |
| MONGODB_URI | mongodb://localhost:27017/content-workflow | MongoDB connection |

## License

Proprietary - AdBazaar