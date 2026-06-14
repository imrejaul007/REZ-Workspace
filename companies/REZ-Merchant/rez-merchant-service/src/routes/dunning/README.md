# Dunning Module

## Overview

The Dunning module automates payment collection from overdue suppliers through configurable reminder sequences. It supports multi-channel notifications (WhatsApp, SMS, email), approval workflows, escalation contacts, and comprehensive tracking.

## Key Features

### Dunning Configurations
- **Multiple Configs**: Create different dunning rules per supplier segment
- **Rule-based Triggers**: Due date, days overdue, amount threshold
- **Multi-channel Support**: WhatsApp, SMS, email, or all
- **Business Hours**: Respect delivery windows
- **Holiday Handling**: Skip holidays and non-business days

### Reminder Sequences
- **Step-based**: Define sequential reminder steps
- **Priority Levels**: Low, medium, high, critical
- **Approval Workflow**: Require approval for sensitive steps
- **CC/BCC Support**: Include additional recipients

### Escalation
- **Multi-level Escalation**: Configure escalation contacts
- **Automatic Escalation**: Progress through levels automatically
- **Manual Override**: Manually escalate when needed

### Template Management
- **Multi-format Templates**: WhatsApp, SMS, email
- **Variable Substitution**: Dynamic content (amount, date, etc.)
- **Preview Mode**: Test templates before activation
- **Default Templates**: Pre-built standard templates

## API Endpoints

### Dunning Configurations

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/dunning/configs` | List all configs |
| `POST` | `/dunning/configs` | Create new config |
| `GET` | `/dunning/configs/:id` | Get config details |
| `PUT` | `/dunning/configs/:id` | Update config |
| `DELETE` | `/dunning/configs/:id` | Soft delete config |
| `POST` | `/dunning/configs/:id/activate` | Set as default |

### Dunning Sequences

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/dunning/sequences` | List active sequences |
| `GET` | `/dunning/sequences/:id` | Get sequence details |
| `POST` | `/dunning/sequences` | Start new sequence |
| `GET` | `/dunning/sequences/:id/steps` | Get sequence steps |
| `POST` | `/dunning/sequences/:id/pause` | Pause sequence |
| `POST` | `/dunning/sequences/:id/resume` | Resume sequence |
| `POST` | `/dunning/sequences/:id/cancel` | Cancel sequence |
| `POST` | `/dunning/sequences/:id/step/:stepId/resend` | Resend failed step |
| `POST` | `/dunning/sequences/:id/approve/:stepId` | Approve pending step |

### Statistics & Reports

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/dunning/stats` | Get dunning statistics |
| `GET` | `/dunning/supplier/:supplierId` | Supplier dunning status |

### Templates

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/reminder-templates` | List templates |
| `POST` | `/reminder-templates` | Create template |
| `GET` | `/reminder-templates/:id` | Get template |
| `PUT` | `/reminder-templates/:id` | Update template |
| `DELETE` | `/reminder-templates/:id` | Delete template |

### Testing

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/dunning/send-test` | Send test message |
| `GET` | `/dunning/default-config-template` | Get default template |

## Data Models

### DunningConfig Schema

```typescript
interface DunningConfig {
  _id: ObjectId;
  merchantId: ObjectId;

  name: string;
  description?: string;
  isDefault: boolean;
  isActive: boolean;

  rules: [{
    sequence: number;
    trigger: 'due_date' | 'days_overdue' | 'amount_threshold';
    triggerDays?: number;      // Days relative to due date
    triggerAmount?: number;    // For amount threshold
    channel: 'whatsapp' | 'sms' | 'email' | 'all';
    template: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    ccEmails?: string[];
    bccEmails?: string[];
    requiresApproval: boolean;
    approverEmail?: string;
    isActive: boolean;
  }];

  businessHours?: {
    start: string;       // HH:mm
    end: string;         // HH:mm
    timezone: string;     // e.g., Asia/Kolkata
    excludeDays: string[]; // e.g., ['Sunday']
  };

  escalationContacts?: [{
    level: number;
    email?: string;
    phone?: string;
    name?: string;
  }];

  minOverdueAmount: number;
  maxDunningDays: number;

  createdAt: Date;
  updatedAt: Date;
}
```

### DunningSequence Schema

```typescript
interface DunningSequence {
  _id: ObjectId;
  merchantId: ObjectId;
  configId: ObjectId;

  supplierId: ObjectId;
  poId?: ObjectId;

  sequenceNumber: string;      // Auto-generated
  currentOverdueAmount: number;

  status: 'active' | 'paused' | 'completed' | 'cancelled';

  steps: [{
    _id: ObjectId;
    stepNumber: number;
    channel: 'whatsapp' | 'sms' | 'email';
    templateId: ObjectId;

    status: 'scheduled' | 'pending_approval' | 'approved' | 'sent' | 'delivered' | 'failed';

    scheduledAt?: Date;
    sentAt?: Date;
    deliveredAt?: Date;

    approvedBy?: ObjectId;
    approvedAt?: Date;
    approvalNotes?: string;

    retryCount: number;
    lastError?: string;

    isOverdue: boolean;
    triggerDays: number;
  }];

  currentStep: number;
  nextActionDate: Date;

  pauseReason?: string;
  pausedAt?: Date;

  completedAt?: Date;
  cancelReason?: string;
  cancelledAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}
```

## Trigger Types

| Trigger | Description | Example |
|---------|-------------|---------|
| `due_date` | Day relative to due date | -7 (7 days before) |
| `days_overdue` | Days after due date | 1, 7, 14, 30 |
| `amount_threshold` | Overdue amount exceeds | 50000 |

## Standard Dunning Sequence

```json
{
  "name": "Standard 30-day Dunning",
  "description": "Standard 7-step dunning sequence",
  "rules": [
    {
      "sequence": 1,
      "trigger": "due_date",
      "triggerDays": -7,
      "channel": "whatsapp",
      "template": "friendly_reminder",
      "priority": "low"
    },
    {
      "sequence": 2,
      "trigger": "due_date",
      "triggerDays": -3,
      "channel": "all",
      "template": "friendly_reminder",
      "priority": "medium"
    },
    {
      "sequence": 3,
      "trigger": "due_date",
      "triggerDays": 0,
      "channel": "all",
      "template": "due_today",
      "priority": "medium"
    },
    {
      "sequence": 4,
      "trigger": "days_overdue",
      "triggerDays": 1,
      "channel": "all",
      "template": "overdue_1",
      "priority": "high"
    },
    {
      "sequence": 5,
      "trigger": "days_overdue",
      "triggerDays": 7,
      "channel": "all",
      "template": "overdue_7",
      "priority": "high",
      "requiresApproval": true
    },
    {
      "sequence": 6,
      "trigger": "days_overdue",
      "triggerDays": 14,
      "channel": "all",
      "template": "overdue_14",
      "priority": "critical",
      "requiresApproval": true
    },
    {
      "sequence": 7,
      "trigger": "days_overdue",
      "triggerDays": 30,
      "channel": "all",
      "template": "final_notice",
      "priority": "critical",
      "requiresApproval": true
    }
  ]
}
```

## Request/Response Examples

### Create Dunning Config

**Request:**
```json
POST /dunning/configs
{
  "name": "High-Value Supplier Dunning",
  "description": "Aggressive dunning for high-value suppliers",
  "isDefault": false,
  "rules": [
    {
      "sequence": 1,
      "trigger": "due_date",
      "triggerDays": -3,
      "channel": "all",
      "template": "friendly_reminder",
      "priority": "medium",
      "isActive": true
    }
  ],
  "businessHours": {
    "start": "09:00",
    "end": "20:00",
    "timezone": "Asia/Kolkata",
    "excludeDays": ["Sunday"]
  },
  "escalationContacts": [
    { "level": 1, "email": "accounting@company.com", "name": "Accounting" },
    { "level": 2, "email": "finance@company.com", "name": "Finance Head" }
  ],
  "minOverdueAmount": 10000,
  "maxDunningDays": 30
}
```

**Response:**
```json
{
  "success": true,
  "message": "Dunning config created successfully",
  "data": {
    "config": {
      "_id": "...",
      "name": "High-Value Supplier Dunning",
      "isDefault": false,
      "rules": [...]
    }
  }
}
```

### Start Dunning Sequence

**Request:**
```json
POST /dunning/sequences
{
  "supplierId": "507f1f77bcf86cd799439011",
  "configId": "507f1f77bcf86cd799439012",
  "poId": "507f1f77bcf86cd799439013"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Dunning sequence started",
  "data": {
    "sequence": {
      "_id": "...",
      "sequenceNumber": "DNS-2026-00001",
      "status": "active",
      "currentStep": 1,
      "nextActionDate": "2026-05-10T00:00:00.000Z",
      "steps": [...]
    }
  }
}
```

### Get Dunning Statistics

**Response:**
```json
GET /dunning/stats

{
  "success": true,
  "data": {
    "statusSummary": {
      "active": 25,
      "paused": 5,
      "completed": 100,
      "cancelled": 10
    },
    "recentActivity": [
      {
        "sequenceNumber": "DNS-2026-00025",
        "supplierName": "ABC Supplies",
        "currentOverdueAmount": 50000,
        "status": "active",
        "currentStep": 3,
        "updatedAt": "2026-05-12T10:30:00.000Z"
      }
    ],
    "topOverdueSuppliers": [
      {
        "supplierName": "XYZ Corp",
        "totalAmount": 500000,
        "sequenceCount": 3
      }
    ]
  }
}
```

## Template Variables

### Available Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `{{supplier_name}}` | Supplier name | ABC Supplies |
| `{{po_number}}` | Purchase order number | PO-2026-00001 |
| `{{amount}}` | Overdue amount | 50,000 |
| `{{due_date}}` | Payment due date | 15 May 2026 |
| `{{days_overdue}}` | Days overdue | 7 |
| `{{merchant_name}}` | Merchant name | ReZ Merchant |
| `{{contact_phone}}` | Contact phone | +91 98765 43210 |

### Sample Templates

```json
// WhatsApp Template
{
  "name": "overdue_7",
  "type": "overdue_7",
  "channel": "whatsapp",
  "whatsappTemplate": "Dear {{supplier_name}}, this is a reminder that payment of INR {{amount}} for {{po_number}} was due on {{due_date}} ({{days_overdue}} days overdue). Please process the payment at your earliest convenience.",
  "variables": ["supplier_name", "amount", "po_number", "due_date", "days_overdue"]
}

// Email Template
{
  "name": "final_notice",
  "type": "final_notice",
  "channel": "email",
  "subject": "FINAL NOTICE: Overdue Payment - {{po_number}}",
  "emailHtml": "<h1>Final Payment Notice</h1><p>Dear {{supplier_name}},</p><p>Your payment of INR {{amount}} for {{po_number}} is {{days_overdue}} days overdue.</p>",
  "variables": ["supplier_name", "amount", "po_number", "days_overdue"]
}
```

## Sequence Lifecycle

```
START ──> ACTIVE ──> COMPLETED (when PO paid or max days reached)
         │
         ├─> PAUSED (manual pause)
         │     │
         │     └─> RESUME ──> ACTIVE
         │
         └─> CANCELLED (manual cancel)
```

### Sequence States

| State | Description |
|-------|-------------|
| `active` | Sequence running, sending reminders |
| `paused` | Sequence paused, no reminders sent |
| `completed` | Successfully collected or max days reached |
| `cancelled` | Manually cancelled |

## Business Hours Logic

```typescript
function shouldSendMessage(scheduledTime: Date, config: DunningConfig): boolean {
  if (!config.businessHours) return true;

  const { start, end, timezone, excludeDays } = config.businessHours;

  // Check excluded days
  const dayName = scheduledTime.toLocaleDateString('en-US', { weekday: 'long', timeZone: timezone });
  if (excludeDays.includes(dayName)) return false;

  // Check hours
  const hour = scheduledTime.getHours();
  const [startHour] = start.split(':').map(Number);
  const [endHour] = end.split(':').map(Number);

  return hour >= startHour && hour < endHour;
}
```

## Error Handling

### Config Errors

| Error | HTTP Code | Description |
|-------|-----------|-------------|
| Name exists | 409 | Config with same name |
| Active sequences | 409 | Cannot delete with active sequences |
| Cannot activate | 400 | Inactive config cannot be activated |

### Sequence Errors

| Error | HTTP Code | Description |
|-------|-----------|-------------|
| Already exists | 409 | Active sequence exists |
| Cannot pause | 400 | Terminal states cannot be paused |
| Cannot resume | 400 | Only paused sequences can resume |
| Maximum retries | 400 | Step exceeded retry limit |

## Related Modules

| Module | Integration |
|--------|-------------|
| Suppliers | Target of dunning |
| Purchase Orders | Overdue POs trigger sequences |
| WhatsApp | Send reminders |
| Reminder Templates | Template rendering |
| Credit Lines | Payment tracking |

## File Structure

```
src/routes/
  dunningRoutes.ts          # Dunning routes
  reminderTemplates.ts      # Template routes

src/models/
  DunningConfig.ts         # Config model
  DunningSequence.ts       # Sequence model
  ReminderTemplate.ts      # Template model

src/services/
  dunningService.ts        # Dunning business logic
  templateRenderer.ts     # Template rendering

src/schemas/
  b2b.ts                # Zod validation schemas
```
