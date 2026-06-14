# CorpPerks WhatsApp Integration Service

WhatsApp Business API integration for CorpPerks HR platform.

## Features

- Employee subscription management
- WhatsApp notifications (leave, attendance, payroll)
- Template management
- Incoming message handling
- Bot commands (HELP, LEAVE, ATTENDANCE, etc.)
- Bulk messaging

## Quick Start

```bash
cd /Users/rejaulkarim/Documents/ReZ\ Full\ App/CorpPerks/whatsapp-service

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev

# Build for production
npm run build
```

## Configuration

Create `.env` with:

```env
PORT=4745
MONGODB_URI=mongodb://localhost:27017/corpperks-whatsapp
INTERNAL_SERVICE_TOKEN=your-internal-service-token

# WhatsApp Business API (Meta)
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
WHATSAPP_BUSINESS_ACCOUNT_ID=your-business-account-id
WHATSAPP_ACCESS_TOKEN=your-whatsapp-access-token
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your-webhook-verify-token
```

## API Endpoints

### Messaging

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/whatsapp/send` | Send a message |
| POST | `/api/whatsapp/send/bulk` | Send bulk messages |
| POST | `/api/whatsapp/webhook` | WhatsApp webhook |

### Subscriptions

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/whatsapp/subscribe` | Subscribe employee |
| GET | `/api/whatsapp/subscribe/:employeeId` | Get subscription |
| PATCH | `/api/whatsapp/subscribe/:employeeId` | Update preferences |
| DELETE | `/api/whatsapp/subscribe/:employeeId` | Unsubscribe |
| GET | `/api/whatsapp/subscriptions` | List all subscriptions |

### Templates

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/whatsapp/templates` | List approved templates |
| GET | `/api/whatsapp/templates/:name` | Get template |
| POST | `/api/whatsapp/templates` | Create template |

### Notifications

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/whatsapp/notifications/leave` | Leave notification |
| POST | `/api/whatsapp/notifications/attendance` | Attendance notification |
| POST | `/api/whatsapp/notifications/payroll` | Payroll notification |
| POST | `/api/whatsapp/notifications/bulk-leave` | Bulk leave notifications |
| POST | `/api/whatsapp/notifications/bulk-attendance` | Bulk attendance notifications |

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Service health status |

## Authentication

Use `X-Internal-Token` header for service-to-service calls:

```bash
curl -H "X-Internal-Token: your-token" http://localhost:4745/api/whatsapp/subscriptions
```

## Message Types

- `text` - Plain text message
- `template` - WhatsApp template message
- `interactive` - Interactive message with buttons

## Notification Categories

- `leave_approval` - Leave request approved
- `leave_rejection` - Leave request rejected
- `attendance_checkin` - Check-in reminder
- `attendance_reminder` - Attendance reminder
- `payroll_credit` - Salary/bonus credit
- `general` - General notifications
- `hr_notice` - HR announcements

## Bot Commands

Employees can reply with these commands:

| Command | Description |
|---------|-------------|
| `HELP` | Show available commands |
| `LEAVE` | Check leave balance |
| `ATTENDANCE` | Check today's attendance |
| `PAYSLIP` | Get latest payslip info |
| `HOLIDAYS` | List upcoming holidays |
| `STOP` | Unsubscribe |
| `START` | Resubscribe |

## Webhook Setup

1. Set webhook URL in Meta Developer Console
2. Configure verify token in `.env`
3. The service handles verification automatically

## Tech Stack

- Node.js + Express
- TypeScript
- MongoDB (Mongoose)
- WhatsApp Business API
- Zod (validation)
- Winston (logging)

## Port

```
4745
```

## Integration Points

### Leave Management
```typescript
await whatsAppService.sendLeaveNotification({
  employeeId: 'EMP001',
  employeeName: 'John Doe',
  leaveType: 'Casual Leave',
  startDate: '2026-06-01',
  endDate: '2026-06-03',
  status: 'approved',
  approvedBy: 'Manager Name'
});
```

### Attendance
```typescript
await whatsAppService.sendAttendanceNotification({
  employeeId: 'EMP001',
  employeeName: 'John Doe',
  type: 'checkin_reminder',
  date: '2026-05-30'
});
```

### Payroll
```typescript
await whatsAppService.sendPayrollNotification({
  employeeId: 'EMP001',
  employeeName: 'John Doe',
  amount: 195000,
  type: 'salary_credit',
  transactionId: 'TXN123456',
  description: 'May 2026 Salary'
});
```
