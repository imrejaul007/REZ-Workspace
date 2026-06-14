# Consent Management Service

**Port:** 4999  
**Company:** AdBazaar  
**Purpose:** GDPR/CCPA Compliance and Consent Management Platform

## Overview

The Consent Management Service is a comprehensive platform for managing user consent across multiple compliance frameworks including GDPR, CCPA, PDPA, and LGPD. It provides full consent lifecycle management including recording, tracking, withdrawing, and auditing of user consents.

## Features

- **Multi-Framework Support**: GDPR, CCPA, PDPA, LGPD
- **Consent Lifecycle Management**: Grant, withdraw, update, expire
- **Complete Audit Trail**: All consent actions are logged and auditable
- **Compliance Reporting**: Automated compliance reports for each framework
- **Bulk Operations**: Process multiple consent updates at once
- **Template Management**: Reusable consent templates
- **History Tracking**: Full consent history with changes

## Consent Types

| Type | Description |
|------|-------------|
| `marketing` | Marketing communications |
| `analytics` | Analytics and tracking |
| `personalization` | Personalized experiences |
| `third_party_sharing` | Data sharing with third parties |
| `data_processing` | General data processing |
| `location` | Location services |
| `profiling` | User profiling |
| `communications` | Push/email communications |
| `advertising` | Personalized advertising |
| `remarketing` | Remarketing campaigns |

## Quick Start

### Installation

```bash
cd /Users/rejaulkarim/Documents/ReZ\ Full\ App/AdBazaar/consent-management
npm install
```

### Configuration

Create a `.env` file:

```env
PORT=4999
MONGODB_URI=mongodb://localhost:27017/adbazaar-consent
REDIS_URL=redis://localhost:6379
INTERNAL_SERVICE_TOKEN=your-secure-token
LOG_LEVEL=info
NODE_ENV=development
```

### Run Development

```bash
npm run dev
```

### Run Production

```bash
npm run build
npm start
```

## API Endpoints

### Health & Metrics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/metrics` | Prometheus metrics |

### Consent Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/consent` | Record new consent |
| GET | `/api/consent/:userId` | Get user consents |
| PUT | `/api/consent/:userId` | Update consent |
| POST | `/api/consent/:userId/withdraw` | Withdraw consent |
| GET | `/api/consent/:userId/history` | Get consent history |
| POST | `/api/consent/bulk` | Bulk consent update |
| GET | `/api/consent/stats` | Consent statistics |

### Compliance & Audit

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/consent/audit` | Query audit logs |
| GET | `/api/consent/compliance/:framework` | Get compliance report |

## API Examples

### Record Consent

```bash
curl -X POST http://localhost:4999/api/consent \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: your-token" \
  -d '{
    "userId": "user123",
    "type": "marketing",
    "framework": "gdpr",
    "granted": true,
    "source": "banner"
  }'
```

### Get User Consents

```bash
curl http://localhost:4999/api/consent/user123 \
  -H "X-Internal-Token: your-token"
```

### Withdraw Consent

```bash
curl -X POST http://localhost:4999/api/consent/user123/withdraw \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: your-token" \
  -d '{
    "type": "marketing",
    "framework": "gdpr"
  }'
```

### Bulk Update

```bash
curl -X POST http://localhost:4999/api/consent/bulk \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: your-token" \
  -d '{
    "userId": "user123",
    "consents": [
      { "type": "marketing", "granted": true },
      { "type": "analytics", "granted": false }
    ],
    "framework": "gdpr"
  }'
```

### Get Compliance Report

```bash
curl http://localhost:4999/api/consent/compliance/gdpr \
  -H "X-Internal-Token: your-token"
```

## Architecture

```
consent-management/
├── src/
│   ├── index.ts           # Main entry point
│   ├── models/            # Mongoose schemas
│   │   ├── Consent.ts
│   │   ├── ConsentHistory.ts
│   │   ├── ConsentTemplate.ts
│   │   └── ConsentAudit.ts
│   ├── services/          # Business logic
│   │   ├── consentService.ts
│   │   ├── historyService.ts
│   │   ├── complianceService.ts
│   │   ├── auditService.ts
│   │   └── templateService.ts
│   ├── routes/            # Express routes
│   │   └── consentRoutes.ts
│   ├── middleware/        # Express middleware
│   │   └── auth.ts
│   └── utils/             # Utilities
│       ├── logger.ts
│       └── metrics.ts
├── package.json
├── tsconfig.json
└── README.md
```

## Data Models

### Consent

```typescript
{
  userId: string;
  type: ConsentType;
  framework: ComplianceFramework;
  granted: boolean;
  grantedAt: Date;
  withdrawnAt?: Date;
  expiresAt?: Date;
  source: string;
  ip?: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### ConsentHistory

```typescript
{
  userId: string;
  consentType: ConsentType;
  framework: ComplianceFramework;
  changes: { field: string; oldValue: any; newValue: any }[];
  action: 'granted' | 'withdrawn' | 'updated' | 'expired';
  source: string;
  ip?: string;
  timestamp: Date;
}
```

## Prometheus Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `consent_granted_total` | Counter | Total consents granted |
| `consent_withdrawn_total` | Counter | Total consents withdrawn |
| `consent_updated_total` | Counter | Total consent updates |
| `consent_bulk_operations_total` | Counter | Total bulk operations |
| `consent_request_duration_seconds` | Histogram | Request duration |
| `consent_errors_total` | Counter | Total errors |

## GDPR Compliance Features

- Right to access (consent export)
- Right to withdraw (withdraw endpoint)
- Right to erasure (delete all consents)
- Consent proof (audit trail)
- Clear consent language (templates)
- Consent withdrawal mechanism

## CCPA Compliance Features

- Right to know (consent data export)
- Right to delete (consent erasure)
- Right to opt-out (withdraw consent)
- Non-discrimination (equal service regardless of consent)

## Security

- Internal service authentication via `X-Internal-Token` header
- Request logging with Winston
- Prometheus metrics for monitoring
- Input validation with Zod

## Dependencies

- **express**: HTTP server
- **mongoose**: MongoDB ODM
- **redis**: Caching and pub/sub
- **winston**: Logging
- **prom-client**: Prometheus metrics
- **zod**: Schema validation
- **axios**: HTTP client

## License

Proprietary - AdBazaar
