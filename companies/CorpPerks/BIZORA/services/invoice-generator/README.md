# BIZORA Invoice Generator

GST-compliant invoice generation service for Indian businesses.

## Features

- GST-compliant invoice generation (CGST/SGST for intrastate, IGST for interstate)
- Automatic GST calculation based on state codes
- PDF generation with professional layout
- Line items with HSN codes
- Invoice lifecycle management (draft, sent, paid, overdue, cancelled)
- Payment reminders
- Indian number format (Lakh, Crore)
- RESTful API with Zod validation

## Tech Stack

- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose
- **PDF:** PDFKit
- **Validation:** Zod
- **Logging:** Winston
- **Language:** TypeScript

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/invoices` | List all invoices |
| POST | `/api/invoices` | Create new invoice |
| GET | `/api/invoices/:id` | Get invoice by ID |
| PUT | `/api/invoices/:id` | Update invoice |
| POST | `/api/invoices/:id/send` | Send invoice via email |
| GET | `/api/invoices/:id/pdf` | Generate PDF |
| POST | `/api/invoices/:id/remind` | Send payment reminder |
| POST | `/api/invoices/:id/pay` | Mark invoice as paid |
| POST | `/api/invoices/:id/cancel` | Cancel invoice |
| GET | `/api/invoices/stats/summary` | Get invoice statistics |

## API Examples

### Create Invoice

```bash
curl -X POST http://localhost:4010/api/invoices \
  -H "Content-Type: application/json" \
  -H "X-User-Id: user123" \
  -d '{
    "seller": {
      "gstin": "27AABCU9603R1ZM",
      "businessName": "BIZORA Pvt Ltd",
      "address": "123 Business Park, Mumbai",
      "state": "Maharashtra"
    },
    "buyer": {
      "gstin": "29AABCU9603R1ZM",
      "businessName": "Customer Corp",
      "address": "456 Commerce St, Bangalore",
      "state": "Karnataka"
    },
    "lineItems": [
      {
        "description": "HRMS License - Annual",
        "quantity": 10,
        "unitPrice": 12000,
        "gstRate": 18
      }
    ],
    "dueDate": "2026-07-08",
    "notes": "Thank you for your business"
  }'
```

### Get Invoice PDF

```bash
curl -O -J http://localhost:4010/api/invoices/:id/pdf
```

## GST Calculation

The service automatically calculates:

- **Intrastate transactions:** CGST + SGST (each half of total GST rate)
- **Interstate transactions:** IGST (full GST rate)
- **Reverse charge:** Applicable when total >= Rs. 5,000

### Supported GST Rates

| Rate | CGST | SGST | IGST |
|------|------|------|------|
| 0% | 0% | 0% | 0% |
| 5% | 2.5% | 2.5% | 5% |
| 12% | 6% | 6% | 12% |
| 18% | 9% | 9% | 18% |
| 28% | 14% | 14% | 28% |

## Invoice Number Format

`BIZ/YYYY/MM/####`

Example: `BIZ/2026/06/0001`

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 4010 |
| MONGODB_URI | MongoDB connection string | mongodb://localhost:27017/bizora_invoices |
| LOG_LEVEL | Logging level | info |
| COMPANY_NAME | Company name for PDF | BIZORA |

## Port

**Port: 4010**

## Related Services

- **RABTUL Auth (4002):** Token verification
- **RABTUL Notifications (4011):** Email/SMS notifications
- **CorpPerks Backend (4006):** HRMS data

## License

Proprietary - All rights reserved
