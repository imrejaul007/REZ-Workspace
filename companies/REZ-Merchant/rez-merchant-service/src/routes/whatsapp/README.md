# WhatsApp Integration Module

## Overview

The WhatsApp Integration module provides comprehensive messaging capabilities for B2B supplier communication. It supports template-based messages, bulk sending, webhook processing, delivery tracking, and integration with purchase orders and payments.

## Key Features

### Message Sending
- **Template Messages**: Pre-approved WhatsApp Business templates
- **Custom Messages**: Free-form text messages
- **Bulk Sending**: Send to multiple recipients with rate limiting
- **Scheduled Sending**: Queue messages for business hours

### Template Management
- **Pre-built Templates**: Standard B2B templates (PO, payment, reminders)
- **Custom Templates**: Register new templates with WhatsApp
- **Template Validation**: Validate parameters before sending
- **Approval Status**: Track template approval status

### Webhook Integration
- **Status Updates**: Track message delivery status
- **Signature Verification**: HMAC-SHA256 signature validation
- **Event Processing**: Process incoming and outgoing statuses
- **Delivery Analytics**: Track open and read rates

### Integration Features
- **PO Notifications**: Auto-send when PO created/updated
- **Payment Reminders**: Send reminders via WhatsApp
- **Business Hours**: Respect configured business hours
- **Rate Limiting**: Batch processing with delays

## API Endpoints

### Send Messages

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/whatsapp/send` | Send single message |
| `POST` | `/whatsapp/send-bulk` | Send to multiple recipients |
| `POST` | `/whatsapp/send/po-created` | Send PO created notification |
| `POST` | `/whatsapp/send/payment-reminder` | Send payment reminder |

### Webhooks

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/whatsapp/webhook` | Webhook verification (GET) |
| `POST` | `/whatsapp/webhook` | Receive status updates (POST) |

### Templates

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/whatsapp/templates` | List available templates |
| `POST` | `/whatsapp/templates/register` | Register new template |

### Message Tracking

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/whatsapp/messages/:id/status` | Get message status |
| `GET` | `/whatsapp/conversations` | List conversations |
| `GET` | `/whatsapp/stats` | Delivery statistics |

## Available Templates

### B2B Templates

| Template Name | Category | Parameters |
|---------------|----------|------------|
| `PO_CREATED` | UTILITY | poNumber, supplierName, amount, dueDate |
| `PO_UPDATED` | UTILITY | poNumber, status, notes |
| `PO_SHIPPED` | UTILITY | poNumber, trackingInfo |
| `PAYMENT_REMINDER` | UTILITY | amount, poNumber, dueDate, merchantName |
| `PAYMENT_RECEIVED` | UTILITY | amount, reference, date |
| `INVOICE` | UTILITY | invoiceNumber, amount, dueDate |
| `FRIENDLY_REMINDER` | MARKETING | customerName, dueDate, amount |
| `OVERDUE_NOTICE` | MARKETING | amount, daysOverdue, contactInfo |

### Template Schema

```typescript
interface WhatsAppTemplate {
  name: WhatsAppTemplate;
  category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
  language: string;

  components: [{
    type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS';
    format?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';
    text?: string;
    buttons?: [{
      type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER';
      text: string;
      url?: string;
      phone_number?: string;
    }];
  }];

  status: 'pending' | 'approved' | 'rejected';
  variables?: string[];
}
```

## Request/Response Examples

### Send Template Message

**Request:**
```json
POST /whatsapp/send
{
  "to": "919876543210",
  "template": "PAYMENT_REMINDER",
  "params": ["50000", "PO-2026-00001", "2026-05-15", "ABC Supplies"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "messageId": "wamid.xxx...",
    "status": "queued",
    "queued": false
  }
}
```

### Send Bulk Messages

**Request:**
```json
POST /whatsapp/send-bulk
{
  "messages": [
    {
      "to": "919876543210",
      "template": "PAYMENT_REMINDER",
      "params": ["50000", "PO-2026-00001", "2026-05-15", "ABC Supplies"]
    },
    {
      "to": "919876543211",
      "template": "PAYMENT_REMINDER",
      "params": ["75000", "PO-2026-00002", "2026-05-16", "XYZ Corp"]
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 2,
    "sent": 2,
    "failed": 0,
    "results": [
      { "to": "919876543210", "success": true, "messageId": "wamid.xxx..." },
      { "to": "919876543211", "success": true, "messageId": "wamid.xxx..." }
    ]
  }
}
```

### Get Delivery Statistics

**Response:**
```json
GET /whatsapp/stats?startDate=2026-04-01&endDate=2026-04-30

{
  "success": true,
  "data": {
    "period": {
      "start": "2026-04-01",
      "end": "2026-04-30"
    },
    "stats": {
      "sent": 1000,
      "delivered": 980,
      "read": 850,
      "failed": 15,
      "pending": 5
    },
    "rates": {
      "deliveryRate": "98.00%",
      "readRate": "86.73%"
    }
  }
}
```

### Send PO Created Notification

**Request:**
```json
POST /whatsapp/send/po-created
{
  "poId": "507f1f77bcf86cd799439011",
  "supplierId": "507f1f77bcf86cd799439012"
}
```

## Webhook Events

### Status Update Payload

```json
{
  "entry": [{
    "id": "WHATSAPP_BUSINESS_ACCOUNT_ID",
    "changes": [{
      "value": {
        "messaging_product": "whatsapp",
        "metadata": {
          "display_phone_number": "15550000000",
          "phone_number_id": "PHONE_NUMBER_ID"
        },
        "statuses": [{
          "id": "wamid.xxx...",
          "status": "delivered",
          "timestamp": "1715500000",
          "recipient_id": "919876543210"
        }]
      }
    }]
  }]
}
```

### Status Values

| Status | Description |
|--------|-------------|
| `sent` | Message sent to WhatsApp |
| `delivered` | Message delivered to recipient |
| `read` | Message read by recipient |
| `failed` | Message delivery failed |

## Message Queue

### Queue Types

```typescript
enum WhatsAppJobTypes {
  SEND_QUEUED = 'whatsapp:send:queued',      // Delayed send
  STATUS_UPDATE = 'whatsapp:status:update',  // Process status webhook
  SEND_BULK = 'whatsapp:send:bulk',          // Bulk send job
  TEMPLATE_APPROVAL = 'whatsapp:template:approval' // Template status check
}
```

### Business Hours Logic

Messages outside business hours are queued:

```typescript
const BUSINESS_HOURS = {
  start: '09:00',      // 9 AM
  end: '20:00',       // 8 PM
  timezone: 'Asia/Kolkata',
  excludeDays: ['Sunday']
};
```

## Configuration

### Environment Variables

```bash
# WhatsApp Business API
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
WHATSAPP_BUSINESS_ACCOUNT_ID=your-business-account-id
WHATSAPP_ACCESS_TOKEN=your-access-token
WHATSAPP_WEBHOOK_SECRET=your-webhook-secret
```

### Rate Limits

```typescript
const RATE_LIMITS = {
  singleMessage: 1,           // 1 per second
  bulkBatchSize: 10,         // 10 messages per batch
  bulkDelay: 1000,           // 1 second delay between batches
  dailyLimit: 1000,          // Max messages per day
};
```

## Error Handling

### Send Errors

| Error Code | Message | Action |
|------------|---------|--------|
| `INVALID_PHONE` | Invalid phone number | Validate format |
| `NOT_subscribed` | Recipient not subscribed | Prompt opt-in |
| `MESSAGE_TOO_LONG` | Message exceeds limit | Truncate |
| `TEMPLATE_NOT_APPROVED` | Template pending approval | Wait for approval |
| `OUTSIDE_BUSINESS_HOURS` | Outside business hours | Queue for next window |

### Webhook Errors

- Invalid signature: 401 Unauthorized
- Processing error: Log and return 200 (always acknowledge)
- Unknown status: Log as warning

## Message Logging

All messages are logged to Redis for tracking:

```typescript
// Key pattern
`whatsapp:merchant:${merchantId}:${messageId}`

// Hash fields
{
  messageId: string,
  merchantId: string,
  recipientPhone: string,
  template: string,
  status: string,
  createdAt: string,
  referenceId?: string
}
```

## Security

### Webhook Verification

```typescript
// Verify webhook token
function verifyWebhookToken(token: string): boolean {
  return token === process.env.WHATSAPP_WEBHOOK_SECRET;
}

// Verify webhook signature
function verifySignature(body: string, signature: string): boolean {
  const expected = crypto
    .createHmac('sha256', process.env.WHATSAPP_WEBHOOK_SECRET)
    .update(body)
    .digest('hex');
  return signature === `sha256=${expected}`;
}
```

## Related Modules

| Module | Integration |
|--------|-------------|
| Suppliers | Get supplier phone numbers |
| Purchase Orders | Send PO notifications |
| Dunning | Send payment reminders |
| Reminder Templates | Template management |

## File Structure

```
src/routes/
  whatsappRoutes.ts         # WhatsApp routes

src/services/
  whatsappService.ts        # WhatsApp API service
  whatsappTemplates.ts      # Template management

src/jobs/
  whatsappJobs.ts          # BullMQ job definitions

src/utils/
  formatters.ts            # Amount, date formatters
```
