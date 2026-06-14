# CLAUDE.md - Breach Detector

## Project Overview

**Name:** REZ-breach-detector
**Type:** SUTAR OS - Contract Layer
**Port:** 4196
**Company:** RABTUL Technologies
**Part of:** SUTAR OS Phase 6 - ContractOS
**Lines:** 230
**Status:** ✅ PRODUCTION READY

## What is Breach Detector?

Breach Detector identifies, tracks, and manages contract breaches across the RTNM ecosystem. It ensures accountability and facilitates resolution.

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
| PORT | No | 4196 | Service port |
| MONGODB_URI | Yes | - | MongoDB connection |

## Features

### 1. Breach Detection

| Feature | Description |
|---------|-------------|
| **Auto Detection** | Detect breaches from various sources |
| **Contract Link** | Link breaches to contracts |
| **Type Classification** | Categorize by breach type |
| **Severity Assessment** | Assess severity level |
| **Parties Involved** | Track breaching and affected parties |

### 2. Breach Types

| Type | Description | Example |
|------|-------------|---------|
| delivery | Missed delivery deadline | Delivery 3 days late |
| payment | Payment default | Payment not made |
| quality | Quality standard breach | Quality below 95% |
| terms | Contract terms violation | Unauthorized change |
| sla | SLA breach | Response time exceeded |

### 3. Severity Levels

| Level | Impact | Score Impact | Action |
|-------|--------|-------------|--------|
| critical | Major damage | Auto-escalate | Legal team |
| high | Significant damage | -10 points | Immediate attention |
| medium | Moderate damage | -5 points | Standard handling |
| low | Minor damage | -2 points | Low priority |

### 4. Impact Analysis

| Metric | Description |
|--------|-------------|
| Financial | Monetary impact of breach |
| Reputational | 0-10 scale impact |
| Operational | 0-10 scale impact |

### 5. Escalation

| Feature | Description |
|---------|-------------|
| **Auto-escalation** | Critical breaches auto-escalate |
| **Escalation Target** | legal, management, compliance |
| **Escalation Reason** | Document reason |
| **Escalation Tracking** | Track escalation history |

### 6. Resolution Tracking

| Feature | Description |
|---------|-------------|
| **Resolution Status** | Track resolution progress |
| **Resolution Notes** | Document resolution |
| **Resolution Time** | Track time to resolve |
| **Resolved By** | Track who resolved |

### 7. Analytics

| Feature | Description |
|---------|-------------|
| **Total Breaches** | Count of all breaches |
| **By Type** | Breakdown by breach type |
| **By Status** | Breakdown by status |
| **Financial Impact** | Total monetary impact |
| **Trends** | Breach trends over time |

## API Endpoints

### Breach Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/breaches` | Detect/create breach |
| GET | `/api/breaches` | List breaches |
| GET | `/api/breaches/:id` | Get breach details |
| PUT | `/api/breaches/:id` | Update breach |
| DELETE | `/api/breaches/:id` | Delete breach |

### Escalation

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/breaches/:id/escalate` | Escalate breach |

### Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/breaches/analytics` | Get breach analytics |

## Breach Schema

```typescript
interface Breach {
  breachId: string;
  contractId: string;
  type: BreachType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  party: string;
  affectedParty: string;
  impact: {
    financial: number;
    reputational: number;  // 0-10
    operational: number;   // 0-10
  };
  remediation: {
    required: string;
    deadline: Date;
    cost: number;
  };
  status: BreachStatus;
  escalatedTo?: string;
  escalationReason?: string;
  resolution?: string;
  resolvedAt?: Date;
  resolvedBy?: string;
}
```

## Breach Status Flow

```
detected → reported → acknowledged → remediating → resolved
                ↓
           escalated
```

## Integration

### Upstream
- SLA Monitor
- ContractOS
- Payment systems

### Downstream
- Legal systems
- Compliance dashboards
- Trust Scorer (score impact)

## Health Endpoints

- `GET /health` - Health check
- `GET /health/ready` - Readiness probe

## File Structure

```
REZ-breach-detector/
├── src/
│   └── index.ts                    # Main server (all-in-one)
├── package.json
├── tsconfig.json
└── CLAUDE.md (this file)
```

## Notes

- Breach Detector manages contract breaches
- Auto-escalates critical breaches
- Tracks resolution
- Impacts trust scores
