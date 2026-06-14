# SSP Bidding Service

Real-time bidding service for DOOH (Digital Out-of-Home) advertising within the AdBazaar Supply Side Platform.

## Overview

This service handles the auction and bidding process for DOOH advertising slots, enabling advertisers to bid on available inventory in real-time.

## Features

- Real-time auction creation and management
- Bid placement with validation
- Automatic auction resolution (highest bidder wins)
- Advertiser statistics and analytics
- Campaign performance tracking
- Bid cancellation for pending bids
- MongoDB persistence with proper indexing

## Tech Stack

- **Runtime:** Node.js with TypeScript
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose ODM
- **Validation:** Zod schemas
- **Logging:** Winston
- **Security:** Helmet, CORS

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB 6+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start the service
npm run dev
```

### Configuration

Create a `.env` file with the following variables:

```env
PORT=4523
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/ssp_bidding
LOG_LEVEL=info
```

## API Endpoints

### Health Checks

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Service health status |
| GET | `/ready` | Readiness check (includes DB status) |

### Bidding Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/bidding/bid` | Place a new bid |
| GET | `/api/bidding` | List all bids (paginated) |
| GET | `/api/bidding/:id` | Get bid by ID |
| DELETE | `/api/bidding/:id` | Cancel a pending bid |

### Auction Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/bidding/auction` | Create a new auction |
| GET | `/api/bidding/auction/:auctionId` | Get bids for an auction |
| GET | `/api/bidding/auction/:auctionId/result` | Get auction result |

### Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/bidding/advertiser/:advertiserId` | Get bids by advertiser |
| GET | `/api/bidding/campaign/:campaignId` | Get bids by campaign |
| GET | `/api/bidding/stats/advertiser/:advertiserId` | Get advertiser statistics |

## API Examples

### Create an Auction

```bash
curl -X POST http://localhost:4523/api/bidding/auction \
  -H "Content-Type: application/json" \
  -d '{
    "slotId": "SLOT-001",
    "bidFloor": 10.00,
    "timeoutMs": 100
  }'
```

### Place a Bid

```bash
curl -X POST http://localhost:4523/api/bidding/bid \
  -H "Content-Type: application/json" \
  -d '{
    "auctionId": "AUC-xxxxx",
    "advertiserId": "ADV-001",
    "campaignId": "CMP-001",
    "slotId": "SLOT-001",
    "amount": 25.00,
    "currency": "INR"
  }'
```

### Get Auction Result

```bash
curl http://localhost:4523/api/bidding/auction/AUC-xxxxx/result
```

### Get Advertiser Statistics

```bash
curl http://localhost:4523/api/bidding/stats/advertiser/ADV-001
```

## Data Models

### Bid

| Field | Type | Description |
|-------|------|-------------|
| bidId | String | Unique bid identifier |
| auctionId | String | Associated auction |
| advertiserId | String | Advertiser identifier |
| campaignId | String | Campaign identifier |
| slotId | String | DOOH slot identifier |
| amount | Number | Bid amount |
| currency | String | Currency code (INR) |
| status | Enum | pending, won, lost, expired |
| creativeId | String | Creative asset ID (optional) |
| bidFloor | Number | Minimum bid amount |
| timestamp | Date | Bid timestamp |

### Auction

| Field | Type | Description |
|-------|------|-------------|
| auctionId | String | Unique auction identifier |
| slotId | String | DOOH slot identifier |
| bidFloor | Number | Minimum bid amount |
| status | Enum | active, completed, cancelled, expired |
| timeoutMs | Number | Auction timeout in milliseconds |
| startedAt | Date | Auction start time |
| endedAt | Date | Auction end time |
| winningBidId | String | Winning bid identifier |
| winningAmount | Number | Winning bid amount |

## Error Handling

All errors return a consistent JSON structure:

```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "details": [...]
  }
}
```

## License

MIT
