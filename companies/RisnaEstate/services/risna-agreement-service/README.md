# RisnaEstate Agreement Service

A comprehensive contract generation and e-signature service for RisnaEstate, built with Node.js, Express, TypeScript, MongoDB, and Redis.

## Features

- **Agreement Management**: Create, update, delete, and list property agreements
- **Contract Generation**: Generate professional PDF contracts
- **E-Signatures**: Support for buyer, seller, and witness signatures
- **Payment Tracking**: Payment schedule management and tracking
- **Registration**: Property registration workflow
- **Multiple Templates**: Support for Sale Agreement, NOC, MoU, Lease, and more

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose
- **Cache**: Redis
- **PDF Generation**: PDFKit
- **Validation**: Zod
- **Logging**: Winston
- **Authentication**: JWT

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB
- Redis

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
```

### Configuration

Edit the `.env` file with your settings:

```env
PORT=4128
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/risna_agreement_service
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-secure-jwt-secret
```

### Running the Service

```bash
# Development mode
npm run dev

# Production build
npm run build
npm start
```

### Docker

```bash
# Build image
docker build -t risna-agreement-service .

# Run container
docker run -p 4128:4128 risna-agreement-service
```

## API Endpoints

### Agreement Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/agreements` | Create new agreement |
| GET | `/api/v1/agreements` | List agreements |
| GET | `/api/v1/agreements/:id` | Get agreement by ID |
| PUT | `/api/v1/agreements/:id` | Update agreement |
| DELETE | `/api/v1/agreements/:id` | Soft delete agreement |

### Agreement Generation

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/agreements/:id/generate` | Generate PDF |
| GET | `/api/v1/agreements/:id/pdf` | Download PDF |
| POST | `/api/v1/agreements/:id/templates` | List templates |
| POST | `/api/v1/agreements/:id/preview` | Preview agreement |

### E-Signing

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/agreements/:id/sign/buyer` | Buyer e-sign |
| POST | `/api/v1/agreements/:id/sign/seller` | Seller e-sign |
| POST | `/api/v1/agreements/:id/sign/witness` | Witness e-sign |
| GET | `/api/v1/agreements/:id/signatures` | Get signature status |

### Registration

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/agreements/:id/register` | Submit for registration |
| POST | `/api/v1/agreements/:id/registered` | Mark as registered |
| GET | `/api/v1/agreements/:id/registration-status` | Check status |

### Payments

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/agreements/:id/payments` | Add payment |
| GET | `/api/v1/agreements/:id/payments` | Get payment schedule |
| POST | `/api/v1/agreements/:id/payments/:paymentId/confirm` | Confirm payment |

## Agreement Types

| Type | Description |
|------|-------------|
| `sale_agreement` | Full property sale contract |
| `noc` | No Objection Certificate |
| `mou` | Memorandum of Understanding |
| `租约` | Lease Agreement |
| `leave_license` | Leave and License Agreement |
| `租让协议` | Tenancy Agreement |

## Agreement Status

| Status | Description |
|--------|-------------|
| `draft` | Agreement in draft state |
| `pending_buyer_sign` | Awaiting buyer signature |
| `pending_seller_sign` | Awaiting seller signature |
| `pending_witness` | Awaiting witness signatures |
| `completed` | All parties signed |
| `registered` | Agreement registered |
| `cancelled` | Agreement cancelled |

## Example Usage

### Create Agreement

```bash
curl -X POST http://localhost:4128/api/v1/agreements \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "dealId": "deal123",
    "propertyId": "prop456",
    "buyerId": "buyer@example.com",
    "sellerId": "seller@example.com",
    "brokerId": "broker123",
    "type": "sale_agreement",
    "propertyAddress": "123 Main Street, Mumbai",
    "propertyType": "apartment",
    "propertyArea": 1500,
    "propertyAreaUnit": "sqft",
    "totalPrice": 5000000,
    "saleConsideration": 5000000,
    "possessionDate": "2026-12-31",
    "agreementDate": "2026-06-06"
  }'
```

### E-Sign Agreement

```bash
curl -X POST http://localhost:4128/api/v1/agreements/AGR-xxx/sign/buyer \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "signature": "data:image/png;base64,...",
    "signerName": "John Doe",
    "signerEmail": "john@example.com"
  }'
```

### Generate PDF

```bash
curl -X POST http://localhost:4128/api/v1/agreements/AGR-xxx/generate \
  -H "Authorization: Bearer <token>"
```

## Health Check

```bash
curl http://localhost:4128/health
```

## Project Structure

```
risna-agreement-service/
├── src/
│   ├── config/           # Configuration files
│   ├── controllers/      # Route handlers
│   ├── middleware/       # Express middleware
│   ├── models/ # Mongoose models
│   ├── routes/          # API routes
│   ├── schemas/          # Zod validation schemas
│   ├── services/         # Business logic
│   ├── templates/       # Agreement templates
│   ├── utils/           # Utilities
│   └── index.ts         # Entry point
├── storage/
│   └── pdfs/            # Generated PDFs
├── .env.example
├── Dockerfile
├── package.json
└── tsconfig.json
```

## License

Proprietary - RisnaEstate
