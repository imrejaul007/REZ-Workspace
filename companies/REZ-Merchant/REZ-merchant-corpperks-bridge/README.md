# REZ Merchant CorpPerks Bridge

Corporate employee integration service that connects CorpPerks HR platform with REZ Merchant. Enables corporate discounts, expense tracking, employee benefits management, and corporate catalog access.

## Overview

This service acts as a bridge between CorpPerks HR platform and REZ Merchant, providing seamless corporate employee benefits integration including discount validation, expense logging, allowance management, and corporate catalog access.

## Service Details

| Property | Value |
|----------|-------|
| **Service Name** | REZ Merchant CorpPerks Bridge |
| **Port** | 3005 |
| **Node Version** | >=18.0.0 |
| **Type** | REST API Service |

## Features

- **Employee Validation** - Validate corporate employee tokens and sync data
- **Corporate Discounts** - Apply and manage corporate discount rates by category
- **Expense Tracking** - Log and track corporate expenses
- **Allowance Management** - Manage employee spending allowances
- **Corporate Catalog** - Access company-specific product catalogs
- **Batch Operations** - Batch sync employees and configurations
- **Discount Eligibility** - Check discount eligibility before applying

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check endpoint |
| GET | `/` | Service info endpoint |
| POST | `/api/v1/employee/validate` | Validate employee token |
| POST | `/api/v1/employee/sync` | Sync single employee to merchant |
| POST | `/api/v1/employee/batch-sync` | Batch sync multiple employees |
| GET | `/api/v1/discount/:companyId` | Get corporate discount for category |
| POST | `/api/v1/discount/apply` | Apply corporate discount to cart |
| POST | `/api/v1/discount/eligibility` | Check discount eligibility |
| GET | `/api/v1/discount/:companyId/all` | Get all company discounts |
| POST | `/api/v1/expense/log` | Log a corporate expense |
| GET | `/api/v1/expense/history/:employeeId` | Get employee expense history |
| GET | `/api/v1/allowance/:employeeId` | Get corporate allowance |
| GET | `/api/v1/allowance/:employeeId/status` | Check allowance status |
| POST | `/api/v1/allowance/deduct` | Deduct from corporate allowance |
| GET | `/api/v1/catalog/:companyId` | Get corporate catalog |

### Endpoint Details

#### Employee Validation
```http
POST /api/v1/employee/validate
Authorization: Bearer <token>

Response:
{
  "success": true,
  "employee": {
    "employeeId": "...",
    "email": "...",
    "companyId": "...",
    "corporateTier": "standard|premium|enterprise"
  }
}
```

#### Apply Corporate Discount
```http
POST /api/v1/discount/apply
Content-Type: application/json

{
  "customerId": "string",
  "cartTotal": 100.00,
  "category": "groceries"
}

Response:
{
  "success": true,
  "application": {
    "discount": 10.00,
    "companyId": "...",
    "originalTotal": 100.00,
    "finalTotal": 90.00
  }
}
```

#### Deduct from Allowance
```http
POST /api/v1/allowance/deduct
Content-Type: application/json

{
  "employeeId": "string",
  "amount": 25.00,
  "orderId": "string"
}

Response:
{
  "success": true,
  "message": "Allowance deducted successfully",
  "newBalance": 75.00
}
```

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3005 | Service port |
| `NODE_ENV` | development | Environment mode |
| `CORS_ORIGIN` | - | Comma-separated list of allowed origins (required in production) |

**Note**: In production, `CORS_ORIGIN` must be set. The service will refuse to start without it.

## Dependencies

### Production Dependencies
- `express` - Web framework
- `axios` - HTTP client
- `cors` - CORS middleware
- `helmet` - Security headers
- `express-rate-limit` - Rate limiting
- `zod` - Schema validation

### Development Dependencies
- `typescript` - TypeScript compiler
- `ts-node-dev` - Development server with hot reload

## Setup Instructions

### Prerequisites

- Node.js >=18.0.0

### Installation

```bash
# Navigate to service directory
cd REZ-merchant-corpperks-bridge

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your configuration

# Start development server
npm run dev

# Or build and run production
npm run build
npm start
```

### Docker

```bash
# Build image
docker build -t rez-merchant-corpperks-bridge .

# Run container
docker run -p 3005:3005 \
  -e CORS_ORIGIN=https://app.rez.com \
  -e NODE_ENV=production \
  rez-merchant-corpperks-bridge
```

## Project Structure

```
REZ-merchant-corpperks-bridge/
├── src/
│   ├── routes/          # API routes
│   │   └── employeeRoutes.ts
│   ├── services/         # Business logic
│   │   └── employeeIntegration.ts
│   ├── middleware/       # Express middleware
│   │   └── auth.ts      # Authentication middleware
│   ├── integrations/     # External integrations
│   │   └── rabtulClient.ts
│   ├── types/            # TypeScript type definitions
│   └── utils/            # Utility functions
│       └── logger.ts
├── .env.example          # Environment template
├── Dockerfile
├── package.json
└── tsconfig.json
```

## Rate Limiting

The service implements rate limiting:

- **General endpoints**: 100 requests per 15 minutes
- **Auth endpoints**: 5 requests per 15 minutes

## Security Features

- **CORS Protection**: Strict origin validation in production
- **Security Headers**: Helmet.js middleware
- **Token Authentication**: Bearer token validation
- **Internal Service Auth**: X-Internal-Token header support
- **Input Validation**: Zod schema validation
- **Error Sanitization**: Internal errors not exposed in production

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm start` | Run production server |
| `npm test` | Run tests |
| `npm run lint` | Run ESLint |

## Health Check

```bash
curl http://localhost:3005/health
```

## Error Handling

All errors return a consistent format:
```json
{
  "success": false,
  "error": "Error message",
  "errorId": "err-123456-abc123"  // Reference for support
}
```

## License

MIT - REZ Platform