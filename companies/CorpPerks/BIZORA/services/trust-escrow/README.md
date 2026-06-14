# Trust Escrow Service

A production-ready Express-based escrow service for B2B transactions. Holds funds securely until all conditions are met, then releases to the seller.

## Features

- **Multi-party Escrow**: Buyer, Seller, and optional Arbiter roles
- **Milestone Support**: Split payments across multiple milestones
- **Conditional Releases**: Release only when specific conditions are met
- **Dispute Resolution**: Built-in dispute filing and arbiter resolution
- **Complete Audit Trail**: Every action logged with timestamps
- **Platform Fees**: Configurable fee structure
- **Document Management**: Attach and verify documents
- **Auto-expiration**: Set expiration dates for escrows

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Validation**: Zod
- **Logging**: Winston
- **Language**: TypeScript

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB 5+

### Installation

```bash
# Navigate to service directory
cd services/trust-escrow

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your MongoDB URI
```

### Development

```bash
# Start in development mode with hot reload
npm run dev

# Or build and start production
npm run build
npm start
```

### Health Check

```bash
curl http://localhost:4008/health
```

## API Endpoints

### Create Escrow

```bash
POST /api/escrow/create
```

Create a new escrow with optional milestones and conditions.

**Request Body:**
```json
{
  "buyerId": "user123",
  "sellerId": "merchant456",
  "amount": 50000,
  "currency": "INR",
  "description": "Website development project",
  "conditions": [
    { "type": "delivery", "description": "Design mockups approved" },
    { "type": "approval", "description": "Final testing passed" }
  ],
  "milestones": [
    { "name": "Design Phase", "amount": 15000 },
    { "name": "Development", "amount": 25000 },
    { "name": "Final Delivery", "amount": 10000 }
  ],
  "arbiterId": "arbiter789"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Escrow created successfully",
  "data": {
    "escrowId": "ESC-A1B2C3D4",
    "status": "pending",
    "amount": 50000,
    "currency": "INR",
    "buyerId": "user123",
    "sellerId": "merchant456",
    "createdAt": "2026-06-08T10:00:00Z"
  }
}
```

### Get Escrow Details

```bash
GET /api/escrow/:id
```

Retrieve full escrow details including audit log.

**Headers:**
```
Authorization: Bearer <token>
```

### Fund Escrow

```bash
POST /api/escrow/:id/fund
```

Transfer funds into escrow (only buyer can fund).

**Request Body:**
```json
{
  "funderId": "user123"
}
```

### Release Funds

```bash
POST /api/escrow/:id/release
```

Release funds to seller (requires all conditions met).

**Request Body:**
```json
{
  "releasedBy": "user123",
  "role": "buyer",
  "reason": "All deliverables received and approved",
  "milestoneName": "Design Phase"
}
```

### Refund to Buyer

```bash
POST /api/escrow/:id/refund
```

Refund funds back to buyer.

**Request Body:**
```json
{
  "refundedBy": "user123",
  "reason": "Seller failed to deliver on time"
}
```

### Check Status

```bash
GET /api/escrow/:id/status
```

Get detailed escrow status including conditions progress.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "funded",
    "conditionsMet": 1,
    "totalConditions": 2,
    "milestonesCompleted": 0,
    "totalMilestones": 3,
    "canRelease": false,
    "canRefund": true,
    "isExpired": false
  }
}
```

### File Dispute

```bash
POST /api/escrow/:id/dispute
```

Open a dispute for arbiter resolution.

**Request Body:**
```json
{
  "disputedBy": "user123",
  "reason": "Seller delivered incomplete work"
}
```

### Resolve Dispute

```bash
POST /api/escrow/:id/resolve
```

Resolve a dispute (arbiter only).

**Request Body:**
```json
{
  "resolvedBy": "arbiter789",
  "resolution": "release_to_seller",
  "splitPercentage": 50
}
```

### Complete Condition

```bash
POST /api/escrow/:id/condition
```

Mark a condition as completed.

**Request Body:**
```json
{
  "completedBy": "user123",
  "role": "buyer",
  "conditionIndex": 0
}
```

### List User Escrows

```bash
GET /api/escrow/user/:userId?status=funded&limit=10&skip=0
```

List all escrows for a user with optional filtering.

## Authentication

The service uses Bearer token authentication. Include the token in the Authorization header:

```
Authorization: Bearer <token>
```

For development, you can use base64 encoded user IDs:
```bash
# Encode: userId:role
echo -n "user123:buyer" | base64
# dXNlcjEyMzpidXllcg==
```

For production, use proper JWT tokens.

## Escrow Status Flow

```
pending → funded → released (success)
                  → refunded (buyer cancelled)
                  → disputed → released (arbiter: release to seller)
                            → refunded (arbiter: refund to buyer)
                            → released (arbiter: split)

pending → cancelled (before funding)
```

## Platform Fees

Default fee configuration:
- Percentage: 2.5%
- Fixed: 0
- Charged to: split (between buyer and seller)

Override in `.env`:
```env
PLATFORM_FEE_PERCENTAGE=2.5
PLATFORM_FEE_FIXED=0
PLATFORM_FEE_CHARGED_TO=split
```

## Error Codes

| Code | Description |
|------|-------------|
| `UNAUTHORIZED` | Missing or invalid token |
| `FORBIDDEN` | User not authorized for action |
| `NOT_FOUND` | Escrow not found |
| `VALIDATION_ERROR` | Invalid request body |
| `CONDITIONS_NOT_MET` | Cannot release, conditions incomplete |
| `ONLY_BUYER_CAN_FUND` | Only buyer can fund escrow |
| `ONLY_BUYER_CAN_REFUND` | Only buyer can request refund |
| `ONLY_ARBITER_CAN_RESOLVE` | Only arbiter can resolve disputes |
| `ESCROW_EXPIRED` | Escrow has passed expiration date |

## Integration with RABTUL

This service is designed to integrate with RABTUL for payment processing:

```typescript
// Before funding, call RABTUL wallet hold
await rabtul.wallet.hold({
  userId: buyerId,
  amount: escrow.amount,
  reference: escrow.escrowId
});

// On release, call RABTUL transfer
await rabtul.wallet.transfer({
  from: escrowId,
  to: sellerId,
  amount: escrow.amount - escrow.platformFee
});

// On refund, call RABTUL release
await rabtul.wallet.release({
  userId: buyerId,
  reference: escrow.escrowId
});
```

## Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 4008
CMD ["node", "dist/index.js"]
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 4008 | Server port |
| `NODE_ENV` | development | Environment mode |
| `MONGODB_URI` | mongodb://localhost:27017/trust-escrow | MongoDB connection string |
| `CORS_ORIGIN` | * | CORS allowed origins |
| `LOG_LEVEL` | info | Winston log level |
| `JWT_SECRET` | - | JWT signing secret |
| `INTERNAL_SERVICE_TOKEN` | - | Service-to-service auth token |

## License

Internal use only - BIZORA / CorpPerks
