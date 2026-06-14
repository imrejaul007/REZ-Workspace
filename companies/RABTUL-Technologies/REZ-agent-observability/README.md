# REZ Agent Observability

Agent execution tracing and observability for REZ AI.

## Quick Start

```bash
npm install
npm run build
npm start
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/traces` | Create new trace |
| GET | `/api/traces` | Search traces |
| GET | `/api/traces/:id` | Get trace by ID |
| GET | `/api/traces/workflow/:workflowId` | Get traces by workflow |
| GET | `/api/traces/agent/:agentId` | Get traces by agent |
| PATCH | `/api/traces/:id` | Update trace |
| POST | `/api/traces/:id/complete` | Complete trace |
| POST | `/api/traces/:id/fail` | Fail trace |
| POST | `/api/traces/:id/events` | Add event to trace |
| GET | `/api/metrics` | Get metrics |
| GET | `/api/metrics/summary` | Get execution summary |
| GET | `/api/alerts` | Get alert rules |

## Features

- Distributed tracing with span management
- Real-time metrics (p50, p95, p99 latency)
- Error tracking and alerting
- Execution summary dashboard
- Custom event logging
- Alert rules with configurable thresholds

## License

MIT
