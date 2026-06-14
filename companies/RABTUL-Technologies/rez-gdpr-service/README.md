# ReZ GDPR Service

A comprehensive GDPR compliance service providing consent management, data erasure, data portability, and privacy policy management for the ReZ ecosystem.

## Features

- **Consent Management**: Granular consent tracking for different data processing purposes
- **Data Erasure**: Automated data deletion with verification and audit trails
- **Data Portability**: Export user data in machine-readable formats
- **Privacy Policy Management**: Version-controlled privacy policies with user acceptance tracking
- **Data Requests**: Handle access, correction, and deletion requests
- **Cookie Banners**: Configurable consent banners for cookie tracking
- **Audit Trail**: Complete logging of all GDPR-related operations
- **Statistics Dashboard**: Track compliance metrics and consent rates

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     ReZ GDPR Service                             │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  Express API  │  │   Consent   │  │    Data Erasure       │  │
│  │   (REST)     │  │   Manager    │  │    Service           │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘  │
│         │                  │                      │               │
│  ┌──────▼──────────────────▼──────────────────────▼───────────┐  │
│  │                    GDPR Core Services                       │  │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐  │  │
│  │  │   Privacy   │ │   Request   │ │    Export         │  │  │
│  │  │   Policy    │ │   Manager   │ │    Service        │  │  │
│  │  └──────────────┘ └──────────────┘ └──────────────────┘  │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                             │                                    │
│  ┌──────────────────────────▼────────────────────────────────┐  │
│  │                    Data Layer                              │  │
│  │  ┌──────────────────┐  ┌──────────────────────────────┐  │  │
│  │  │  In-Memory Store  │  │  External Service Adapters   │  │  │
│  │  │  - Consents      │  │  - User Service               │  │  │
│  │  │  - Requests      │  │  - Order Service              │  │  │
│  │  │  - Policies      │  │  - Notification Service       │  │  │
│  │  └──────────────────┘  └──────────────────────────────┘  │  │
│  └─────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Installation

```bash
npm install
```

## Configuration

Create a `.env` file:

```env
PORT=4021
NODE_ENV=development

# External Services
USER_SERVICE_URL=http://localhost:3010
ORDER_SERVICE_URL=http://localhost:3003
NOTIFICATION_SERVICE_URL=http://localhost:3012

# GDPR Settings
DATA_RETENTION_DAYS=365
ERASURE_BATCH_SIZE=100
ERASURE_DELAY_HOURS=72

# Export Settings
EXPORT_MAX_RECORDS=10000
EXPORT_FORMATS=json,csv
```

## Running the Service

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm run build
npm start
```

### Run Tests

```bash
npm test
```

## API Endpoints

### Health & Info

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Service health check |
| GET | `/` | Service information |

### Data Requests

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/requests` | Create a new data request |
| GET | `/api/requests/:id` | Get request by ID |
| GET | `/api/requests/user/:userId` | Get all requests for a user |
| PATCH | `/api/requests/:id` | Update request status |

### Consents

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/consents` | Grant or deny consent |
| POST | `/api/consents/batch` | Batch consent update |
| GET | `/api/consents/user/:userId` | Get all consents for user |
| DELETE | `/api/consents/:userId/:consentType` | Withdraw specific consent |
| GET | `/api/consents/banner/active` | Get active consent banner |
| POST | `/api/consents/banner` | Create consent banner |
| GET | `/api/consents/banner` | List all banners |

### Data Erasure

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/erasure/request` | Request data erasure |
| POST | `/api/erasure/process/:requestId` | Process erasure request |
| POST | `/api/erasure/verify/:requestId` | Verify erasure completion |

### Data Export

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/export/:userId` | Generate data export |
| GET | `/api/export/:exportId` | Download export file |

### Privacy Policy

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/privacy-policy/active` | Get active privacy policy |
| GET | `/api/privacy-policy/:id` | Get specific policy version |
| POST | `/api/privacy-policy` | Create new policy version |
| POST | `/api/privacy-policy/:id/publish` | Publish policy version |
| POST | `/api/privacy-policy/:id/accept/:userId` | Record user acceptance |
| GET | `/api/privacy-policy/user/:userId/status` | Get user's policy status |

### Audit

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/audit/user/:userId` | Get audit history for user |
| GET | `/api/audit/export` | Export audit logs |

### Statistics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stats` | Get compliance statistics |

## Data Models

### Consent

```typescript
interface Consent {
  id: string;
  userId: string;
  consentType: ConsentType;
  granted: boolean;
  grantedAt?: Date;
  withdrawnAt?: Date;
  version: string;
  ipAddress?: string;
  userAgent?: string;
}

enum ConsentType {
  ESSENTIAL = 'essential',
  ANALYTICS = 'analytics',
  MARKETING = 'marketing',
  PERSONALIZATION = 'personalization',
  THIRD_PARTY = 'third_party'
}
```

### DataRequest

```typescript
interface DataRequest {
  id: string;
  userId: string;
  type: RequestType;
  status: RequestStatus;
  requestedAt: Date;
  completedAt?: Date;
  verifiedAt?: Date;
  verificationCode?: string;
  metadata?: Record<string, unknown>;
}

enum RequestType {
  ACCESS = 'access',
  RECTIFICATION = 'rectification',
  ERASURE = 'erasure',
  PORTABILITY = 'portability',
  RESTRICTION = 'restriction',
  OBJECTION = 'objection'
}

enum RequestStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  REJECTED = 'rejected'
}
```

### PrivacyPolicy

```typescript
interface PrivacyPolicy {
  id: string;
  version: string;
  content: string;
  summary: string;
  effectiveDate: Date;
  publishedAt?: Date;
  publishedBy?: string;
  isActive: boolean;
  acceptanceRate?: number;
  totalAcceptances?: number;
}
```

### ErasureRequest

```typescript
interface ErasureRequest {
  id: string;
  userId: string;
  status: ErasureStatus;
  requestedAt: Date;
  scheduledAt?: Date;
  completedAt?: Date;
  verificationCode: string;
  servicesToErase: string[];
  servicesErased: string[];
  failedServices: string[];
  verificationMethod: 'email' | 'sms' | 'manual';
}

enum ErasureStatus {
  PENDING_VERIFICATION = 'pending_verification',
  VERIFIED = 'verified',
  SCHEDULED = 'scheduled',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  PARTIALLY_COMPLETED = 'partially_completed',
  FAILED = 'failed'
}
```

## Consent Types

| Type | Description | Required |
|------|-------------|----------|
| `essential` | Core functionality cookies | Yes (cannot withdraw) |
| `analytics` | Usage analytics and metrics | No |
| `marketing` | Marketing and advertising | No |
| `personalization` | Personalized content | No |
| `third_party` | Third-party integrations | No |

## API Examples

### Create Data Request

```bash
curl -X POST http://localhost:4021/api/requests \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_123",
    "type": "access",
    "verificationMethod": "email"
  }'
```

### Grant Consent

```bash
curl -X POST http://localhost:4021/api/consents \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_123",
    "consentType": "marketing",
    "granted": true
  }'
```

### Request Data Erasure

```bash
curl -X POST http://localhost:4021/api/erasure/request \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_123",
    "verificationMethod": "email"
  }'
```

### Export User Data

```bash
curl -X POST http://localhost:3021/api/export/user_123
```

## GDPR Response Timeframes

| Request Type | Regulation | Service Commitment |
|--------------|------------|-------------------|
| Access | 30 days | 7 days |
| Rectification | 30 days | 7 days |
| Erasure | 30 days | 14 days |
| Portability | 30 days | 7 days |
| Restriction | 30 days | 7 days |

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `REQUEST_NOT_FOUND` | 404 | Data request not found |
| `USER_NOT_FOUND` | 404 | User does not exist |
| `ALREADY_PROCESSED` | 409 | Request already processed |
| `VERIFICATION_FAILED` | 403 | Identity verification failed |
| `CONSENT_ALREADY_EXISTS` | 409 | Consent already recorded |
| `EXPORT_NOT_READY` | 425 | Export not yet generated |

## Testing

```bash
# Run tests
npm test

# Run with coverage
npm test -- --coverage
```

## Deployment

### Docker

```bash
docker build -t rez-gdpr-service .
docker run -p 4021:4021 rez-gdpr-service
```

## License

MIT
