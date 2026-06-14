# Flywheel Analytics

Ecosystem loop tracking and flywheel analytics for AdBazaar.

## Service Purpose

Tracks the advertising ecosystem flywheel - the cycle of value creation between advertisers, publishers, and users. Measures growth loops, virality, and network effects.

## Port

```
3022
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/flywheel/metrics` | Flywheel health metrics |
| GET | `/api/flywheel/growth` | Growth loop analysis |
| GET | `/api/flywheel/virality` | Viral coefficient metrics |
| GET | `/api/flywheel/network` | Network effects data |
| POST | `/api/events/track` | Track ecosystem event |
| GET | `/api/loops/:type` | Get specific loop data |
| GET | `/api/cohorts` | Cohort analysis |
| GET | `/api/cohorts/:id` | Specific cohort data |
| GET | `/api/reports` | Generate reports |

## Configuration

Environment variables:

```env
PORT=3022
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/flywheel-analytics
```

## Setup Instructions

```bash
# Install dependencies
npm install

# Development mode
npm run dev

# Build for production
npm run build
npm start
```

## Flywheel Metrics

| Metric | Description |
|--------|-------------|
| Advertiser Retention | Monthly advertiser retention rate |
| Publisher Retention | Monthly publisher retention rate |
| LTV | Customer lifetime value |
| CAC | Customer acquisition cost |
| LTV:CAC Ratio | Efficiency ratio |
| Viral Coefficient | User-driven growth rate |
| Network Value | Metcalfe's law approximation |

## Tech Stack

- Express.js
- TypeScript
- Mongoose (MongoDB)
- Axios (HTTP client)
- CORS
- Helmet (security headers)
