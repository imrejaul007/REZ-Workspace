## Integration Guide

### Overview
This guide covers integrating external systems with the ReZ Merchant B2B platform (NexTaBizz).

### Authentication

#### Internal Services
All internal service-to-service calls require:
```
X-Internal-Token: <scoped-service-token>
```

Tokens are configured via `INTERNAL_SERVICE_TOKENS_JSON` environment variable.

#### External API Access
External clients use JWT authentication:
```
Authorization: Bearer <jwt-token>
```

### Webhook Integration

#### Subscribing to Events
Register webhooks via the Event Bus or directly:

```javascript
POST /api/events/subscribe
{
  "topic": "b2b.order.created",
  "url": "https://your-app.com/webhook",
  "secret": "your-webhook-secret"
}
```

#### Verifying Webhooks
```javascript
const crypto = require('crypto');
const signature = crypto
  .createHmac('sha256', webhookSecret)
  .update(JSON.stringify(payload))
  .digest('hex');
```

#### Event Payload Schema
```typescript
interface B2BEvent {
  id: string;
  topic: string;
  timestamp: string;
  version: string;
  data: {
    entityType: string;
    entityId: string;
    action: string;
    payload: object;
  };
  metadata?: {
    correlationId?: string;
    source?: string;
  };
}
```

### Tally Integration

#### Connection Setup
1. Obtain Tally Developer credentials
2. Configure in environment:
```
TALLY_API_URL=https://api.tally.co
TALLY_ACCESS_TOKEN=<token>
```

#### Export Flow
```typescript
POST /api/b2b/tally-sync/export
{
  "entities": ["purchaseOrders", "payments"],
  "dateRange": {
    "from": "2024-01-01",
    "to": "2024-01-31"
  },
  "format": "json"
}
```

### WhatsApp Business Integration

#### Template Approval
1. Create template in WhatsApp Business Manager
2. Submit for review
3. Once approved, register in system:
```typescript
POST /api/b2b/whatsapp/templates
{
  "name": "payment_reminder",
  "templateId": "your-template-id",
  "body": "Hi {{1}}, your payment of ₹{{2}} is due on {{3}}.",
  "variables": ["customerName", "amount", "dueDate"]
}
```

#### Sending Messages
```typescript
POST /api/b2b/whatsapp/send
{
  "templateId": "payment_reminder",
  "phone": "+919876543210",
  "variables": ["John", "5000", "2024-01-15"]
}
```

### Bank Statement Import

#### Supported Formats
- CSV (standard bank export)
- OFX (Open Financial Exchange)
- NEFT/RTGS transaction logs

#### Import Flow
```typescript
POST /api/b2b/reconciliation/upload
Content-Type: multipart/form-data

file: <bank-statement.csv>
format: csv
accountId: <merchant-bank-account-id>
```

#### CSV Format
```csv
date,description,amount,type,reference
2024-01-15,"PAYMENT FROM ABC CO",50000,credit,REF123
2024-01-16,"PURCHASE ORDER PAYMENT",25000,debit,PO456
```

### Error Handling

#### HTTP Status Codes
| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict (e.g., duplicate) |
| 500 | Internal Server Error |

#### Error Response Format
```typescript
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid supplier data",
    "details": [
      {
        "field": "phone",
        "message": "Invalid phone format"
      }
    ],
    "requestId": "req-abc123"
  }
}
```

### Rate Limiting
- Internal services: 1000 req/min
- External APIs: 100 req/min
- Webhook delivery: 5 retries with exponential backoff
