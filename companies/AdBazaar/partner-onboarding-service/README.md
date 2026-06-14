# Partner Onboarding Service

AdBazaar service for automated partner registration and verification.

## Features

- Partner registration and management
- Multi-step verification (email, phone, GSTIN, PAN, bank)
- Document upload and verification
- Tier-based partner management
- Referral code generation

## API Endpoints

### Partners

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/partners` | Create new partner |
| GET | `/api/partners` | List all partners |
| GET | `/api/partners/:id` | Get partner by ID |
| PUT | `/api/partners/:id` | Update partner |
| POST | `/api/partners/:id/verify` | Start partner verification |
| GET | `/api/partners/:id/status` | Get onboarding status |
| PATCH | `/api/partners/:id/tier` | Update partner tier |

### Verifications

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/verifications` | Create verification |
| GET | `/api/verifications/:id` | Get verification |
| POST | `/api/verifications/:id/start` | Start verification |
| POST | `/api/verifications/:id/complete` | Complete verification |
| POST | `/api/verifications/:id/send-otp` | Send OTP |
| POST | `/api/verifications/:id/verify-otp` | Verify OTP |
| GET | `/api/verifications/partner/:partnerId` | Get partner verifications |

### Documents

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/documents` | Upload document |
| GET | `/api/documents/:id` | Get document |
| POST | `/api/documents/:id/verify` | Verify document |
| POST | `/api/documents/:id/reject` | Reject document |
| DELETE | `/api/documents/:id` | Delete document |

## Quick Start

```bash
npm install
npm run dev
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Service port | 5061 |
| MONGODB_URI | MongoDB connection | mongodb://localhost:27017/partner-onboarding |
| LOG_LEVEL | Log level | info |
