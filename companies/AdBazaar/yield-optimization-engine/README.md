# Yield Optimization Engine

Ad revenue yield optimization engine.

## Service Purpose

Maximizes ad revenue through dynamic floor pricing, waterline optimization, ad selection algorithms, and real-time yield management. Analyzes demand patterns to optimize fill rates and CPM.

## Port

```
3032
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/floors` | Get current floor prices |
| POST | `/api/floors` | Set floor price |
| PUT | `/api/floors/:id` | Update floor |
| DELETE | `/api/floors/:id` | Remove floor |
| GET | `/api/waterline` | Get waterline settings |
| PUT | `/api/waterline` | Update waterline |
| GET | `/api/optimizations` | Active optimizations |
| POST | `/api/optimizations` | Create optimization |
| GET | `/api/optimizations/:id` | Get optimization |
| PUT | `/api/optimizations/:id` | Update optimization |
| POST | `/api/optimizations/:id/toggle` | Enable/disable |
| GET | `/api/strategy` | Current strategy |
| PUT | `/api/strategy` | Update strategy |
| GET | `/api/reports` | Yield reports |
| GET | `/api/reports/lift` | Yield lift analysis |

## Configuration

Environment variables:

```env
PORT=3032
NODE_ENV=development
OPTIMIZATION_INTERVAL_MS=300000
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

# Run tests
npm test
npm run test:run
npm run test:coverage
```

## Optimization Strategies

| Strategy | Description | Best For |
|----------|-------------|----------|
| Maximize Revenue | Highest CPM wins | Premium inventory |
| Fill Rate | Prioritize fill | High-volume sites |
| Quality | Brand-safe focus | Premium advertisers |
| Hybrid | Blend of above | Balanced approach |

## Yield Metrics

| Metric | Description |
|--------|-------------|
| eCPM | Effective CPM |
| Fill Rate | Requests filled % |
| Waterline | Minimum acceptable bid |
| Revenue Lift | vs baseline |

## Tech Stack

- Express.js
- TypeScript
- Axios (HTTP client)
- CORS
- Helmet (security headers)
- Vitest (testing)
