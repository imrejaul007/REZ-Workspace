# REZ-bills

**Smart Receipt Scanner Service for REZ Consumer**

A comprehensive bill scanning and warranty management service that extracts data from receipts, tracks warranties, generates tax records, and enables cashback rewards. Built with Express, Mongoose, and integrated with RABTUL services.

## Overview

REZ-bills transforms physical receipts into digital records. It uses OCR (production) or manual entry to extract merchant info, amounts, and items, then automatically detects warranties and calculates cashback rewards.

## Features

- **Receipt Scanning**: Parse receipt images and extract merchant, amount, date, items
- **Warranty Detection**: Automatically detect warranty periods from receipt text
- **Warranty Registration**: Register detected warranties with verify-qr service
- **Tax Record Generation**: Create consolidated tax records by year
- **Cashback System**: Earn cashback on scanned receipts
- **Category-based Rewards**: Different cashback rates by merchant category
- **Receipt Storage**: Store receipt images for record keeping

## Status

**COMPLETE** - Built June 2026

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Language**: TypeScript

## Project Structure

```
REZ-bills/
├── src/
│   ├── service.ts            # Express app entry point (standalone)
│   ├── models/              # Mongoose schemas
│   ├── routes/              # API route handlers
│   ├── middleware/           # Express middleware
│   └── integrations/        # RABTUL integrations
├── .env.example
├── package.json
├── tsconfig.json
└── Dockerfile
```

## Port Configuration

**Default Port: 3012**

The service runs on `PORT=3012` (configurable via environment variable).

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB instance
- npm or yarn

### Installation

```bash
# Clone and navigate
cd REZ-bills

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Configure MongoDB URI in .env
# MONGODB_URI=mongodb://localhost:27017/rez-bills

# Start development server
npm run dev
```

### Production Build

```bash
npm run build
npm start
```

## API Endpoints

### Bills

| Endpoint | Method | Description |
|----------|--------|-------------|
| `POST /api/bills/scan` | POST | Scan receipt and extract data |
| `GET /api/bills/:userId` | GET | Get user's bills |
| `GET /api/bills/:id` | GET | Get specific bill |

### Cashback

| Endpoint | Method | Description |
|----------|--------|-------------|
| `POST /api/bills/:id/claim-cashback` | POST | Claim earned cashback |

### Tax Records

| Endpoint | Method | Description |
|----------|--------|-------------|
| `GET /api/tax/:userId` | GET | Get tax records for year |
| `POST /api/tax/generate` | POST | Generate tax record |

## API Examples

### Scan Receipt

```bash
curl -X POST http://localhost:3012/api/bills/scan \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user123",
    "receipt_image": "base64_encoded_image...",
    "manual_data": {
      "merchant_name": "Pizza Hut",
      "merchant_category": "restaurant",
      "amount": 599,
      "date": "2026-06-04",
      "items": [
        {"name": "Margherita Pizza", "quantity": 1, "price": 399},
        {"name": "Coke", "quantity": 2, "price": 100}
      ]
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "bill_id": "BILL-1717500000000",
  "cashback_earned": 11.98,
  "warranty_detected": "No",
  "warranty_months": null
}
```

### Get User Bills

```bash
curl "http://localhost:3012/api/bills/user123?category=restaurant&limit=10"
```

### Claim Cashback

```bash
curl -X POST http://localhost:3012/api/bills/BILL-1717500000000/claim-cashback \
  -H "Content-Type: application/json" \
  -d '{"user_id": "user123"}'
```

### Get Tax Records

```bash
curl "http://localhost:3012/api/tax/user123?year=2026"
```

## Environment Variables

### Required

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Service port | 3012 |
| `MONGODB_URI` | MongoDB connection string | mongodb://localhost:27017/rez-bills |

### External Services

| Variable | Description | Default |
|----------|-------------|---------|
| `WALLET_API` | Wallet service URL | https://rez-wallet.onrender.com |
| `VERIFY_API` | Verify QR service URL | https://rez-verify-qr.onrender.com |
| `ANALYTICS_API` | Analytics service URL | https://rez-analytics.onrender.com |

### RABTUL Services

| Variable | Description | Default |
|----------|-------------|---------|
| `AUTH_SERVICE_URL` | RABTUL Authentication service | http://localhost:4002 |
| `WALLET_SERVICE_URL` | RABTUL Wallet service | http://localhost:4004 |
| `ANALYTICS_SERVICE_URL` | RABTUL Analytics service | http://localhost:4016 |
| `NOTIFICATION_SERVICE_URL` | RABTUL Notification service | http://localhost:4011 |
| `EVENT_BUS_URL` | Event bus for pub/sub | http://localhost:4025 |

## Cashback Rates

| Category | Rate | Example |
|----------|------|---------|
| Restaurant | 2% | Rs 10 on Rs 500 |
| Shopping | 1.5% | Rs 7.50 on Rs 500 |
| Grocery | 1% | Rs 5 on Rs 500 |
| Electronics | 1% | Rs 5 on Rs 500 |
| Default | 0.5% | Rs 2.50 on Rs 500 |

## RABTUL Integration

REZ-bills integrates with the following RABTUL services:

1. **Wallet** (`WALLET_API` / `WALLET_SERVICE_URL`): Transfers earned cashback to user wallets
2. **Verify QR** (`VERIFY_API`): Registers detected warranties for tracking
3. **Analytics** (`ANALYTICS_API` / `ANALYTICS_SERVICE_URL`): Tracks bill scanning events

### Cashback Flow

```typescript
// 1. User scans receipt
// 2. Cashback calculated based on category
// 3. Bill saved to database
// 4. If warranty detected → register with verify-qr
// 5. Track event to analytics
// 6. On claim → transfer from service wallet to user wallet
```

## Data Models

### Bill Schema

```typescript
interface Bill {
  bill_id: string;           // Unique bill ID
  user_id: string;           // User identifier
  merchant_name: string;     // Store/restaurant name
  merchant_category: string; // Category for cashback
  amount: number;            // Total amount
  currency: string;          // Currency code (default: INR)
  date: Date;               // Purchase date
  items: Item[];            // Line items
  warranty_months?: number; // Warranty period
  warranty_serial?: string; // Warranty serial number
  cashback_earned: number;  // Cashback amount
  cashback_claimed: boolean; // Claim status
  tax_record_id?: string;   // Linked tax record
  receipt_image?: string;   // Base64 receipt image
  extracted_at: Date;       // Extraction timestamp
}
```

## Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test -- --coverage
```

## Deployment

### Docker

```bash
# Build image
docker build -t rez-bills .

# Run container
docker run -p 3012:3012 --env-file .env rez-bills
```

### Production Considerations

- Use managed MongoDB (MongoDB Atlas) for production
- Configure WALLET_API with production wallet service
- Set up proper CORS origins
- Enable request logging

## Monitoring

The service logs all bill scans and cashback claims. Monitor for:
- High volume of scan requests (potential abuse)
- Cashback claim failures
- Warranty registration failures
- Database connection issues

## Related Services

| Service | Port | Description |
|---------|------|-------------|
| verify-qr-service | 4003 | Warranty verification |
| safe-qr-service | 4001 | QR safety features |
| REZ-expense | 3013 | Expense tracking |

## License

Private - REZ Consumer Application
