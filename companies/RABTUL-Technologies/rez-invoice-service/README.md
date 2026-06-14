# Invoice Generation Service

A GST-compliant invoice generation service with PDF generation, email delivery, payment tracking, and automated reminders.

## Features

- **GST-compliant Invoices**: Full support for CGST, SGST, IGST calculations
- **PDF Generation**: Professional, branded invoice PDFs using PDFKit
- **Email Delivery**: Send invoices and reminders via SMTP
- **Payment Tracking**: Record partial and full payments
- **Automated Reminders**: Cron-based reminder system for overdue invoices
- **RESTful API**: Complete CRUD operations with filtering and pagination
- **Validation**: Request validation using Zod schemas
- **Logging**: Comprehensive request and error logging

## Quick Start

### 1. Install Dependencies

```bash
cd rez-invoice-service
npm install
```

### 2. Configure Environment

Copy the example environment file and configure:

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```env
PORT=4028
NODE_ENV=development

# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Company Details (for GST invoices)
COMPANY_NAME=Your Company
COMPANY_ADDRESS=123 Business Street, Mumbai, Maharashtra 400001
COMPANY_GSTIN=YOURGSTIN123456
COMPANY_PAN=AAACP1234C
COMPANY_EMAIL=contact@yourcompany.com

# Invoice Settings
INVOICE_PREFIX=INV
INVOICE_DUE_DAYS=30

# Reminder Settings (cron expression)
REMINDER_SCHEDULE=0 9 * * *
FIRST_REMINDER_DAYS=7
SECOND_REMINDER_DAYS=14
FINAL_REMINDER_DAYS=21
```

### 3. Build and Run

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## API Endpoints

### Invoices

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/invoices` | Create new invoice |
| GET | `/api/invoices` | List invoices (with filters) |
| GET | `/api/invoices/:id` | Get invoice by ID |
| GET | `/api/invoices/number/:number` | Get by invoice number |
| PATCH | `/api/invoices/:id` | Update invoice |
| DELETE | `/api/invoices/:id` | Delete invoice |
| PATCH | `/api/invoices/:id/status` | Update status |
| POST | `/api/invoices/:id/payments` | Record payment |
| GET | `/api/invoices/:id/payments` | Get payment history |
| POST | `/api/invoices/:id/send` | Send via email |
| GET | `/api/invoices/:id/pdf` | Download PDF |
| GET | `/api/invoices/:id/preview` | Preview PDF |
| POST | `/api/invoices/:id/reminders` | Send reminder |
| POST | `/api/invoices/reminders/batch` | Batch reminders |

### Reports

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/invoices/stats/summary` | Invoice statistics |
| GET | `/api/invoices/reports/gst` | GST summary |
| GET | `/api/invoices/reports/overdue` | Overdue invoices |

### Utilities

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api` | API documentation |
| POST | `/api/emails/verify` | Verify email connection |
| POST | `/api/reminders/trigger` | Manual reminder trigger |

## Usage Examples

### Create Invoice

```bash
curl -X POST http://localhost:4028/api/invoices \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "Acme Corporation",
    "customerAddress": {
      "line1": "456 Enterprise Blvd",
      "city": "Bangalore",
      "state": "Karnataka",
      "postalCode": "560001",
      "country": "India",
      "email": "billing@acme.com",
      "gstin": "29ABCTB1234B1ZX"
    },
    "items": [
      {
        "description": "Software Development Services",
        "hsnCode": "9954",
        "quantity": 100,
        "unit": "hours",
        "rate": 1500,
        "discountPercent": 10
      },
      {
        "description": "Cloud Hosting (Annual)",
        "hsnCode": "9983",
        "quantity": 1,
        "rate": 60000
      }
    ],
    "notes": "Thank you for your business!",
    "bankDetails": {
      "bankName": "HDFC Bank",
      "branch": "MG Road",
      "accountNumber": "1234567890",
      "ifscCode": "HDFC0001234",
      "upiId": "acme@upi"
    }
  }'
```

### Record Payment

```bash
curl -X POST http://localhost:4028/api/invoices/{id}/payments \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 150000,
    "date": "2024-01-15",
    "method": "bank_transfer",
    "reference": "NEFT REF123456"
  }'
```

### Send Invoice Email

```bash
curl -X POST http://localhost:4028/api/invoices/{id}/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "client@example.com",
    "cc": ["accounting@company.com"],
    "subject": "Invoice INV-2024-0001",
    "message": "Please find attached your invoice for services rendered.",
    "attachPdf": true
  }'
```

### Get GST Summary

```bash
curl "http://localhost:4028/api/invoices/reports/gst?fromDate=2024-01-01&toDate=2024-03-31"
```

## Invoice Status Flow

```
draft -> sent -> viewed
                   |
                   v
               partial <- paid
                   |
                   v
               overdue (auto, if past due date)
                   |
                   v
              cancelled
```

## Payment Methods

- `bank_transfer` - NEFT/RTGS/IMPS
- `upi` - UPI payments
- `cash` - Cash payments
- `check` - Cheque payments
- `card` - Card payments
- `other` - Other methods

## GST Calculation

The service automatically calculates GST based on:

1. **Inter-state transactions**: IGST is applied
2. **Intra-state transactions**: CGST + SGST (split equally)

Default GST rate is 18%, configurable per line item via `gstRate`.

## Project Structure

```
rez-invoice-service/
├── src/
│   ├── index.ts           # Main entry point
│   ├── models/
│   │   └── Invoice.ts     # Invoice model & business logic
│   ├── routes/
│   │   └── invoice.routes.ts  # API routes
│   ├── services/
│   │   ├── pdfService.ts      # PDF generation
│   │   └── emailService.ts   # Email delivery
│   ├── db/
│   │   └── database.ts       # SQLite database
│   ├── types/
│   │   └── index.ts          # TypeScript types
│   └── utils/
│       ├── logger.ts             # Logging utility
│       └── reminderScheduler.ts # Cron scheduler
├── data/                   # SQLite database files
├── logs/                   # Application logs
├── package.json
├── tsconfig.json
└── .env.example
```

## Database

SQLite with WAL mode for better concurrency. Database file location is configurable via `DB_PATH`.

## License

MIT
