# REZ Alerting Service

## Overview

Unified alerting and notifications service for AdBazaar ecosystem. Provides alert rules, multi-channel notifications (email, SMS, push, webhook), alert history tracking, and escalation policies.

## Port

4670

## API Endpoints

- `GET /health` - Health check with active alerts and rules count

### Alert Management

- `GET /api/alerts` - List all alerts (filterable by status, severity, source)
- `GET /api/alerts/:id` - Get specific alert
- `POST /api/alerts` - Create new alert (internal)
- `PATCH /api/alerts/:id/acknowledge` - Acknowledge alert
- `PATCH /api/alerts/:id/resolve` - Resolve alert

### Rule Management

- `GET /api/rules` - List alert rules (filterable by enabled, severity)
- `POST /api/rules` - Create alert rule
- `PATCH /api/rules/:id` - Update rule
- `PATCH /api/rules/:id/toggle` - Enable/disable rule

### Notifications

- `GET /api/notifications` - List sent notifications

### Metrics & Analytics

- `POST /api/evaluate` - Evaluate metrics and trigger alerts
- `GET /api/analytics` - Get alert analytics and trends

## Configuration

Environment variables:
- `PORT` - Server port (default: 4670)

## Dependencies

- Express.js - HTTP server
- Helmet - Security headers
- CORS - Cross-origin support
- Axios - HTTP client for notifications

## Testing

```bash
npm run build
npm start
```

## Key Features

- Alert rules engine with condition evaluation
- Multi-channel notifications
- Escalation policies
- Alert analytics and trends
- Severity-based prioritization
