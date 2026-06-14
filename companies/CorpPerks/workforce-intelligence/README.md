# CorpPerks Workforce Intelligence - Insider Risk Module

**Version:** 1.0.0  
**Port:** 4710  
**Company:** CorpPerks  
**Role:** HRMS Workforce Intelligence - Insider Risk Detection& Trust Scoring

---

## Overview

The Workforce Intelligence module provides comprehensive insider risk management capabilities for CorpPerks HRMS. It integrates with the HIB (HOJAI Intelligence Bureau) platform to provide real-time employee trust scoring, risk factor detection, and enhanced exit monitoring.

## Features

### 1. Employee Trust Scoring

Automated trust score calculation (0-100) based on:
- Performance history
- Attendance patterns
- Policy compliance
- Manager feedback
- Project outcomes
- Incident records

**Trust Levels:**
| Level | Score Range | Description |
|-------|-------------|-------------|
| Trusted | 80-100 | Normal operations |
| Monitored | 60-79 | Standard monitoring |
| Elevated | 40-59 | Enhanced attention |
| Critical | 0-39 | Immediate action required |

### 2. Risk Signal Detection

Detects risk signals from multiple sources:
- Performance decline (15%+ drop)
- Attendance issues (<85% rate)
- Policy violations
- Manager feedback flags
- Security incidents
- Access anomalies
- Exit indicators

### 3. HIB Integration

Synchronizes with HIB Workforce Intelligence Gateway:
- Employee profile sync
- Risk score exchange
- Exit trigger notifications
- Investigation triggers
- Alert aggregation

### 4. Exit Monitoring

Enhanced monitoring when an employee submits notice:
- Auto-start monitoring mode
- Pre-exit risk assessment
- Clearance checklist (18 items)
- Evidence collection
- HIB notification

---

## API Endpoints

### Trust Score Management

```bash
# Calculate/update trust score
POST /api/workforce/employees/:id/trust-score
Body: {
  "employeeName": "John Doe",
  "department": "Engineering",
  "performanceMetrics": { ... }
}

# Get risk profile
GET /api/workforce/employees/:id/risk-profile

# Enhance monitoring
POST /api/workforce/employees/:id/enhance-monitoring
Body: {
  "reason": "Suspicious activity detected",
  "duration": 30,
  "level": "enhanced"
}
```

### High Risk Management

```bash
# Get all high-risk employees
GET /api/workforce/high-risk?threshold=50

# Get employee signals
GET /api/workforce/employees/:id/signals
```

### Exit Monitoring

```bash
# Submit notice (triggers monitoring)
POST /api/workforce/employees/:id/notice
Body: {
  "lastWorkingDate": "2026-06-30"
}

# Get exit monitoring status
GET /api/workforce/employees/:id/exit-monitoring

# Update clearance item
PATCH /api/workforce/employees/:id/exit-monitoring/clearance
Body: {
  "itemId": "uuid",
  "completed": true,
  "completedBy": "HR Manager",
  "notes": "Laptop returned in good condition"
}
```

### HIB Sync

```bash
# Sync all employees with HIB
POST /api/workforce/sync/hib

# Sync specific employees
POST /api/workforce/sync/hib
Body: {
  "employeeIds": ["emp-1", "emp-2"],
  "forceResync": true
}
```

### Configuration

```bash
# Get configuration
GET /api/workforce/config

# Update configuration
PUT /api/workforce/config
Body: {
  "enabled": true,
  "autoMonitorOnNotice": true,
  "monitoringDays": 30,
  "alertThreshold": 50
}
```

---

## Quick Start

```bash
# Navigate to module
cd /CorpPerks/workforce-intelligence

# Install dependencies
npm install

# Start development server
npm run dev

# Health check
curl http://localhost:4710/health
```

---

## TypeScript Types

### EmployeeTrustScore

```typescript
interface EmployeeTrustScore {
  employeeId: string;
  trustLevel: 'trusted' | 'monitored' | 'elevated' | 'critical';
  trustScore: number; // 0-100
  riskFactors: RiskFactor[];
  lastAssessment: string;
  monitoringStatus: ExitMonitoringStatus;
  hibSyncStatus: SyncStatus;
}
```

### InsiderRiskConfig

```typescript
interface InsiderRiskConfig {
  enabled: boolean;
  autoMonitorOnNotice: boolean;
  monitoringDays: number;
  alertThreshold: number;
  syncIntervalMinutes: number;
  hibGatewayUrl: string;
  riskWeights: RiskWeights;
}
```

### RiskFactor

```typescript
interface RiskFactor {
  id: string;
  category: 'behavioral' | 'technical' | 'organizational' | 'access' | 'compliance';
  name: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  weight: number;
  detectedAt: string;
  resolved: boolean;
}
```

---

## Exit Clearance Checklist

The module generates an18-item clearance checklist covering:

### Assets
- Laptop/Computer return
- Mobile phone return
- Access cards/keys return
- Other company property

### Access
- System access revocation
- Email account disable
- VPN access removal
- Cloud services removal
- Code repository removal

### Documents
- Project handover
- Knowledge transfer documentation
- Client files organization

### Financial
- Expense reimbursement
- Final settlement
- Company credit card

### Compliance
- NDA review
- Non-compete acknowledgment
- Exit interview

---

## HIB Integration

### Endpoints Used

| Endpoint | Purpose |
|----------|---------|
| `POST /api/workforce/sync` | Sync employee data |
| `POST /api/workforce/exit` | Send exit trigger |
| `GET /api/workforce/employee/:id/risk` | Get risk score |
| `POST /api/workforce/investigation` | Trigger investigation |

### Configuration

Set via environment variable:
```bash
export HIB_GATEWAY_URL=http://localhost:3055
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│ CorpPerks Workforce Intelligence                      │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │   Employee   │  │    Risk      │  │    Exit     │             │
│  │ Trust     │  │   Signals    │  │  Monitoring │             │
│  │   Scoring    │  │   Detection  │  │             │             │
│  │ (employee-   │  │   (risk-     │  │   (exit-     │             │
│  │   trust.ts)  │  │   signals.ts)│  │   monitoring)│             │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘             │
│ │                 │                 │                      │
│         └─────────────────┼─────────────────┘                      │
│                           │                                        │
│                    ┌──────┴───────┐                                │
│                    │     HIB      │                                │
│                    │    Sync      │                                │
│                    │  (hib-sync)   │                                │
│                    └──────┬───────┘                                │
│                           │                                        │
│                           ▼                                        │
│              ┌────────────────────────┐                           │
│              │ HIB Workforce Gateway │                           │
│              │       (Port 3055)      │                           │
│              └────────────────────────┘                           │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Risk Weights

Default weights for trust score calculation:

| Category | Weight | Description |
|----------|--------|-------------|
| Behavioral | 25% | Performance, attendance, feedback |
| Technical | 20% | Project outcomes, technical skills |
| Organizational | 20% | Teamwork, communication |
| Access | 20% | System access, data handling |
| Compliance | 15% | Policy violations, security |

---

## Signal Detection Thresholds

| Signal | Threshold | Severity |
|--------|-----------|----------|
| Performance Decline | 15% drop | Medium |
| Attendance Issues | <85% rate | Medium |
| Policy Violations | 2+ unresolved | Medium |
| Manager Flags | 2+ in30 days | Medium |
| Critical Incidents | 1+ unresolved | Critical |
| Access Denials | 5+ attempts | High |

---

## Logging

Logs are written to:
- Console (info level)
- `workforce-intelligence.log` (file)
- `hib-sync.log` (HIB sync operations)
- `exit-monitoring.log` (Exit monitoring)

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 4710 | Service port |
| `HIB_GATEWAY_URL` | http://localhost:3055 | HIB Gateway URL |
| `NODE_ENV` | development | Environment |

---

## Dependencies

- **express**: HTTP server
- **axios**: HTTP client for HIB API
- **winston**: Logging
- **uuid**: ID generation

---

## Related Services

| Service | Port | Purpose |
|---------|------|---------|
| CorpPerks Backend | 4006 | Core HRMS |
| CorpPerks API Gateway | 4700 | Central API |
| HIB Fusion Engine | 3055 | Intelligence platform |
| HIB Insider Threat | 3046 | Insider threat detection |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-06-10 | Initial release |

---

**Author:** CorpPerks Engineering  
**License:** MIT
