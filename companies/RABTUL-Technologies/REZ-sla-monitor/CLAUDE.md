# CLAUDE.md - SLA Monitor

## Project Overview

**Name:** REZ-sla-monitor
**Type:** SUTAR OS - Contract Layer
**Port:** 4195
**Company:** RABTUL Technologies
**Part of:** SUTAR OS Phase 6 - ContractOS
**Lines:** 209
**Status:** ✅ PRODUCTION READY

## What is SLA Monitor?

SLA Monitor tracks and enforces Service Level Agreements (SLAs) across the RTNM ecosystem. It ensures contracts are honored and alerts when SLAs are at risk.

## Tech Stack

- Node.js 20+
- Express.js
- TypeScript
- MongoDB/Mongoose

## Commands

| Command | Description |
|---------|-------------|
| `npm install` | Install dependencies |
| `npm run dev` | Development server |
| `npm run build` | Build for production |
| `npm start` | Production server |

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| PORT | No | 4195 | Service port |
| MONGODB_URI | Yes | - | MongoDB connection |

## Features

### 1. SLA Definitions

| Feature | Description |
|---------|-------------|
| **Create SLA** | Define SLAs per contract |
| **Contract Link** | Link SLA to contract |
| **Metric Definition** | Define target metrics |
| **Timeframe** | Set start/end dates |

### 2. SLA Types

| Type | Description | Example |
|------|-------------|---------|
| delivery | On-time delivery | Deliver within 3 days |
| response | Response time | Respond within 24 hours |
| resolution | Issue resolution | Resolve within 48 hours |
| quality | Quality standards | 99% quality score |

### 3. Compliance Tracking

| Feature | Description |
|---------|-------------|
| **Target Percentage** | Set compliance target (e.g., 99.9%) |
| **Current Percentage** | Track current compliance |
| **Met Count** | Number of SLAs met |
| **Breach Count** | Number of breaches |
| **Real-time Calculation** | Auto-calculate compliance |

### 4. Alert Generation

| Feature | Description |
|---------|-------------|
| **Warning Alerts** | SLA at risk |
| **Critical Alerts** | SLA breached |
| **Alert Levels** | warning, critical |
| **Alert History** | Track all alerts |

### 5. Breach Prevention

| Feature | Description |
|---------|-------------|
| **Proactive Warnings** | Alert before breach |
| **90% Threshold** | Critical alert at 90% of target |
| **Days Remaining** | Track deadline |
| **Trend Analysis** | Track compliance trends |

## API Endpoints

### SLA Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/slas` | Create SLA |
| GET | `/api/slas` | List SLAs |
| GET | `/api/slas/:id` | Get SLA details |
| PUT | `/api/slas/:id` | Update SLA |
| DELETE | `/api/slas/:id` | Delete SLA |

### Metrics

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/slas/:id/metric` | Record metric value |
| GET | `/api/slas/:id/report` | Get compliance report |

## SLA Schema

```typescript
interface SLA {
  slaId: string;
  contractId: string;
  type: 'delivery' | 'response' | 'resolution' | 'quality';
  metric: {
    name: string;
    target: number;
    unit: string;
  };
  timeframe: {
    startDate: Date;
    endDate: Date;
    measurementPeriod: 'daily' | 'weekly' | 'monthly';
  };
  compliance: {
    targetPercentage: number;
    currentPercentage: number;
    breaches: number;
    met: number;
  };
  alerts: Alert[];
}
```

## Alert Thresholds

| Level | Trigger | Action |
|-------|---------|--------|
| warning | Metric < target | Warning alert |
| critical | Compliance < 90% of target | Critical alert |
| breached | Compliance < target | SLA breached |

## Integration

### Upstream
- ContractOS
- Payment systems
- Delivery tracking

### Downstream
- Breach Detector
- Alert systems
- Dashboard

## Health Endpoints

- `GET /health` - Health check
- `GET /health/ready` - Readiness probe

## File Structure

```
REZ-sla-monitor/
├── src/
│   └── index.ts                    # Main server (all-in-one)
├── package.json
├── tsconfig.json
└── CLAUDE.md (this file)
```

## Notes

- SLA Monitor ensures contract compliance
- Generates alerts before breaches
- Tracks compliance percentage
- Integrates with Breach Detector
