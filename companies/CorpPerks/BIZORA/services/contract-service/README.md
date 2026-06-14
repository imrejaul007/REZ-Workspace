# BIZORA Contract Service

Contract management service for BIZORA - handles contract creation, signing, and PDF generation.

## Features

- Create and manage contracts
- Multi-party contract support
- Contract signing workflow
- PDF generation with professional templates
- Contract status tracking
- Expiration alerts
- Contract statistics

## Tech Stack

- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose
- **PDF Generation:** PDFKit
- **Validation:** Zod
- **Language:** TypeScript

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment file
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
| GET | `/api/contracts` | List all contracts |
| POST | `/api/contracts` | Create contract |
| GET | `/api/contracts/:id` | Get contract by ID |
| PUT | `/api/contracts/:id` | Update contract |
| DELETE | `/api/contracts/:id` | Terminate contract |
| POST | `/api/contracts/:id/sign` | Sign contract |
| GET | `/api/contracts/:id/pdf` | Generate PDF |
| GET | `/api/contracts/stats` | Get statistics |
| GET | `/api/contracts/expiring` | Get expiring contracts |

## Contract Types

- `employment` - Employment contracts
- `nda` - Non-disclosure agreements
- `vendor` - Vendor agreements
- `partnership` - Partnership contracts
- `service` - Service agreements
- `lease` - Lease agreements
- `other` - Other contract types

## Contract Statuses

- `draft` - Contract is being prepared
- `pending_signature` - Waiting for signatures
- `active` - Contract is signed and active
- `expired` - Contract has expired
- `terminated` - Contract was terminated

## Example Usage

### Create Contract

```bash
curl -X POST http://localhost:4000/api/contracts \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Service Agreement",
    "type": "service",
    "parties": [
      { "name": "Company A", "email": "legal@companya.com" },
      { "name": "Company B", "email": "legal@companyb.com" }
    ],
    "clauses": [
      { "title": "Scope of Work", "content": "...", "order": 1 },
      { "title": "Payment Terms", "content": "...", "order": 2 }
    ],
    "startDate": "2026-01-01",
    "endDate": "2026-12-31",
    "value": 500000,
    "createdBy": "admin@bizora.com"
  }'
```

### Sign Contract

```bash
curl -X POST http://localhost:4000/api/contracts/:id/sign \
  -H "Content-Type: application/json" \
  -d '{
    "partyEmail": "legal@companya.com",
    "signature": "base64-encoded-signature-data"
  }'
```

### Download PDF

```bash
curl http://localhost:4000/api/contracts/:id/pdf -o contract.pdf
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 4000 | Server port |
| `NODE_ENV` | development | Environment mode |
| `MONGODB_URI` | mongodb://localhost:27017/bizora-contracts | MongoDB connection string |
| `CORS_ORIGIN` | * | CORS allowed origins |
| `LOG_LEVEL` | info | Logging level |
| `INTERNAL_SERVICE_TOKEN` | - | Internal service authentication |

## Health Check

```bash
curl http://localhost:4000/health
```

Response:
```json
{
  "status": "healthy",
  "service": "bizora-contract-service",
  "timestamp": "2026-06-08T10:00:00.000Z"
}
```

## License

Proprietary - BIZORA