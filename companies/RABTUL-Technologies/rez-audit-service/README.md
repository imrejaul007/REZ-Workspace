# ReZ Audit Service

A comprehensive audit trail and compliance reporting service for tracking system events, user actions, authentication events, and regulatory compliance across the ReZ ecosystem.

## Features

- **Audit Event Logging**: Track authentication, authorization, data access, and modification events
- **Compliance Monitoring**: Support for SOC2, GDPR, HIPAA, PCI-DSS, and ISO27001 frameworks
- **Compliance Reporting**: Generate automated compliance reports and findings
- **Executive Dashboards**: High-level summary reports for management
- **Security Monitoring**: Track failed authentications, access denials, and suspicious activities
- **Correlation Tracking**: Unique correlation IDs for tracing related events
- **Event Querying**: Flexible query API with filtering by type, actor, resource, and date range
- **Event Types**: Pre-defined event types for common operations
- **Timeline Analysis**: Event timeline and trend analysis

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      ReZ Audit Service                            │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  Express API │  │   Audit     │  │    Compliance        │  │
│  │   (REST)    │  │   Logger    │  │    Reporter         │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘  │
│         │                  │                      │               │
│  ┌──────▼──────────────────▼──────────────────────▼───────────┐  │
│  │                    Event Management                           │  │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐  │  │
│  │  │   Event     │ │   Query     │ │    Report         │  │  │
│  │  │   Storage   │ │   Engine    │ │    Generator      │  │  │
│  │  └──────────────┘ └──────────────┘ └──────────────────┘  │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                             │                                    │
│  ┌──────────────────────────▼────────────────────────────────┐  │
│  │                    In-Memory Event Store                       │  │
│  │  ┌──────────────────────────────────────────────────────┐  │  │
│  │  │  - Authentication Events                             │  │  │
│  │  │  - Authorization Events                              │  │  │
│  │  │  - Data Operations                                  │  │  │
│  │  │  - System Events                                    │  │  │
│  │  │  - Compliance Events                                │  │  │
│  │  └──────────────────────────────────────────────────────┘  │  │
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
PORT=3025
NODE_ENV=development

# Logging
LOG_LEVEL=info

# Audit Settings
MAX_EVENTS=100000
RETENTION_DAYS=90

# External Services (optional)
USER_SERVICE_URL=http://localhost:3010
NOTIFICATION_SERVICE_URL=http://localhost:3012
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

## API Endpoints

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Service health check |

### Audit Events

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/audit` | Log a new audit event |
| GET | `/api/audit` | List audit events with filters |
| GET | `/api/audit/summary` | Get audit event summary |
| GET | `/api/audit/recent` | Get recent audit events |
| GET | `/api/audit/user/:userId` | Get events for specific user |
| GET | `/api/audit/resource/:type/:id` | Get events for specific resource |
| GET | `/api/audit/type/:type` | Get events by type |
| GET | `/api/audit/correlation/:id` | Get events by correlation ID |
| GET | `/api/audit/:id` | Get single event by ID |
| DELETE | `/api/audit/cleanup` | Cleanup old events |

### Compliance

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/compliance/status` | Check compliance status |
| GET | `/api/compliance/report` | Generate compliance report |
| GET | `/api/compliance/frameworks` | List compliance frameworks |
| GET | `/api/compliance/frameworks/:id` | Get framework details |
| POST | `/api/compliance/frameworks` | Add new framework |
| PATCH | `/api/compliance/frameworks/:id/requirements/:rid` | Update requirement |
| DELETE | `/api/compliance/frameworks/:id` | Delete framework |

### Reports

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reports/templates` | List report templates |
| POST | `/api/reports/templates` | Create report template |
| GET | `/api/reports/executive-summary` | Generate executive summary |
| GET | `/api/reports/security` | Generate security report |
| POST | `/api/reports/generate` | Generate custom report |

## Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `startDate` | ISO 8601 | Start of date range |
| `endDate` | ISO 8601 | End of date range |
| `eventTypes` | comma-separated | Filter by event types |
| `actorId` | string | Filter by actor ID |
| `actorType` | string | Filter by actor type (user/system/service) |
| `resourceType` | string | Filter by resource type |
| `resourceId` | string | Filter by resource ID |
| `action` | string | Filter by action operation |
| `status` | string | Filter by status (success/failure) |
| `correlationId` | string | Filter by correlation ID |
| `limit` | number | Number of results (default: 100) |
| `offset` | number | Pagination offset |

## Event Types

### Authentication Events

| Event Type | Description |
|------------|-------------|
| `auth.login` | Successful login |
| `auth.logout` | User logout |
| `auth.login_failed` | Failed login attempt |
| `auth.token_refresh` | Token refresh |
| `auth.password_change` | Password changed |

### Authorization Events

| Event Type | Description |
|------------|-------------|
| `authz.access_granted` | Access granted |
| `authz.access_denied` | Access denied |
| `authz.permission_change` | Permission modified |

### Data Operations

| Event Type | Description |
|------------|-------------|
| `data.create` | Record created |
| `data.read` | Record accessed |
| `data.update` | Record modified |
| `data.delete` | Record deleted |
| `data.export` | Data exported |
| `data.import` | Data imported |

### System Events

| Event Type | Description |
|------------|-------------|
| `system.startup` | Service started |
| `system.shutdown` | Service stopped |
| `system.error` | System error occurred |

### Compliance Events

| Event Type | Description |
|------------|-------------|
| `compliance.export` | Compliance report exported |
| `compliance.access` | Compliance data accessed |
| `gdpr.request` | GDPR data request |
| `consent.change` | Consent modified |

## Data Models

### AuditEvent

```typescript
interface AuditEvent {
  id: string;
  timestamp: Date;
  eventType: AuditEventType;
  actor: AuditActor;
  resource: AuditResource;
  action: AuditAction;
  metadata?: Record<string, unknown>;
  correlationId?: string;
  ipAddress?: string;
  userAgent?: string;
  status: 'success' | 'failure';
  errorMessage?: string;
}
```

### AuditActor

```typescript
interface AuditActor {
  id: string;
  type: 'user' | 'system' | 'service';
  name?: string;
  email?: string;
  role?: string;
}
```

### AuditResource

```typescript
interface AuditResource {
  type: string;
  id: string;
  name?: string;
  parentId?: string;
  parentType?: string;
}
```

### AuditAction

```typescript
interface AuditAction {
  operation: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  endpoint?: string;
  changes?: Record<string, { old: unknown; new: unknown }>;
}
```

## API Examples

### Log an Audit Event

```bash
curl -X POST http://localhost:3025/api/audit \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "data.update",
    "actor": {
      "id": "user_123",
      "type": "user",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "resource": {
      "type": "order",
      "id": "order_456"
    },
    "action": {
      "operation": "update_status",
      "method": "PATCH",
      "endpoint": "/api/orders/456",
      "changes": {
        "status": {
          "old": "pending",
          "new": "completed"
        }
      }
    },
    "status": "success"
  }'
```

### Query Events

```bash
curl "http://localhost:3025/api/audit?startDate=2024-01-01&endDate=2024-01-31&eventTypes=auth.login,auth.logout"
```

### Get User Activity

```bash
curl http://localhost:3025/api/audit/user/user_123
```

### Generate Compliance Report

```bash
curl "http://localhost:3025/api/compliance/report?framework=SOC2&startDate=2024-01-01&endDate=2024-01-31"
```

## Compliance Frameworks

### SOC 2 Trust Services Criteria

- Security (CC6)
- Availability (CC7)
- Processing Integrity (CC8)
- Confidentiality (CC9)
- Privacy (CC9)

### GDPR Articles

- Article 5: Principles of Processing
- Article 6: Lawfulness of Processing
- Article 15: Right of Access
- Article 17: Right to Erasure
- Article 32: Security of Processing

### HIPAA Safeguards

- Administrative Safeguards
- Physical Safeguards
- Technical Safeguards

## Testing

```bash
npm test
```

## Deployment

### Docker

```bash
docker build -t rez-audit-service .
docker run -p 3025:3025 \
  -e LOG_LEVEL=info \
  -e MAX_EVENTS=100000 \
  rez-audit-service
```

## License

MIT
