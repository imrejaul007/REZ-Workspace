# Finance Payables

**Port:** 3000

AI-powered payables management for bills, vendor payments, and cash flow optimization.

## Features

- **Vendor Management** - Full CRUD operations with payment terms
- **Bill Tracking** - Create, update, track bill lifecycle
- **Payment Processing** - Integration with RABTUL Payment service
- **Payment Schedule** - Automated scheduling with cash flow suggestions
- **Multi-tenancy** - Tenant isolation with JWT authentication

## Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Start dev server
npm run dev
```

### Docker

```bash
# Build and run
docker-compose up -d

# Check logs
docker-compose logs -f app
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
PORT=3000
MONGODB_URI=mongodb://localhost:27017/finance-payables
JWT_SECRET=your-secure-secret-here
REDIS_URL=redis://localhost:6379

# RABTUL Services
RABTUL_AUTH_URL=http://localhost:4002
RABTUL_PAYMENT_URL=http://localhost:4001
RABTUL_WALLET_URL=http://localhost:4004
RABTUL_NOTIFICATION_URL=http://localhost:4005
```

## API Reference

### Authentication

All API endpoints require a valid JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

Internal service calls use:

```
X-Internal-Token: <INTERNAL_SERVICE_TOKEN>
X-Tenant-ID: <tenant-id>
```

### Vendors

#### Create Vendor

```bash
POST /api/vendors
Content-Type: application/json
Authorization: Bearer <token>

{
  "tenantId": "TENANT001",
  "name": "Acme Supplies",
  "email": "billing@acme.com",
  "phone": "+91-9876543210",
  "gstin": "27AAACH1234P1ZP",
  "paymentTerms": "net30",
  "address": {
    "line1": "123 Industrial Area",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001"
  },
  "bankDetails": {
    "accountName": "Acme Supplies Pvt Ltd",
    "accountNumber": "1234567890",
    "bankName": "HDFC Bank",
    "ifscCode": "HDFC0001234"
  }
}
```

#### List Vendors

```bash
GET /api/vendors/:tenantId?status=active&page=1&limit=20
Authorization: Bearer <token>
```

#### Update Vendor

```bash
PUT /api/vendors/:tenantId/:vendorId
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "Updated Name",
  "paymentTerms": "net45"
}
```

#### Delete Vendor

```bash
DELETE /api/vendors/:tenantId/:vendorId
Authorization: Bearer <token>
```

### Bills

#### Create Bill

```bash
POST /api/bills
Content-Type: application/json
Authorization: Bearer <token>

{
  "tenantId": "TENANT001",
  "vendorId": "VND-ABC12345",
  "invoiceNumber": "INV-2024-001",
  "invoiceDate": "2024-01-15T00:00:00Z",
  "dueDate": "2024-02-15T00:00:00Z",
  "amount": 50000,
  "taxAmount": 9000,
  "totalAmount": 59000,
  "description": "Monthly supply order",
  "lineItems": [
    {
      "description": "Product A",
      "quantity": 100,
      "unitPrice": 500,
      "tax": 9000,
      "total": 59000
    }
  ]
}
```

#### List Bills

```bash
GET /api/bills/:tenantId?status=pending&page=1&limit=20
Authorization: Bearer <token>
```

#### Process Payment

```bash
POST /api/bills/:tenantId/:billId/pay
Content-Type: application/json
Authorization: Bearer <token>

{
  "paymentMethod": "bank_transfer",
  "paymentReference": "REF-123456",
  "notes": "Payment via NEFT"
}
```

### Payment Schedule

#### Get Schedule

```bash
GET /api/schedule/:tenantId?fromDate=2024-01-01&toDate=2024-01-31&includeSuggestions=true
Authorization: Bearer <token>
```

Response includes:
- Scheduled payments with due dates
- Cash flow optimization suggestions
- Total amount due
- Priority classification (high/medium/low)

## Bill Status Flow

```
draft -> pending -> approved -> scheduled -> paid
                      |
                      v
                  overdue -> paid
                      |
                      v
                  cancelled
```

## Vendor Status

- `active` - Can receive bills and payments
- `inactive` - Soft deleted, no new bills
- `blocked` - Manually blocked, requires review

## Error Responses

```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

## Health Check

```bash
GET /health
```

Response:
```json
{
  "status": "healthy",
  "service": "finance-payables",
  "version": "1.0.0",
  "timestamp": "2024-01-15T10:30:00Z",
  "uptime": 3600,
  "mongodb": "connected"
}
```