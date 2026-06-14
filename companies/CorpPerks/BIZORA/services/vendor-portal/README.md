# BIZORA Vendor Portal

A vendor management service for CorpPerks B2B marketplace.

## Features

- Vendor registration and management
- Document upload support
- Order tracking
- Payment history
- Rating and performance metrics
- GST/PAN verification

## Tech Stack

- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose
- **Validation:** Zod
- **Logging:** Winston
- **File Upload:** Multer
- **Language:** TypeScript

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB 6+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server
npm run dev
```

### Production

```bash
# Build
npm run build

# Start production server
npm start
```

## API Endpoints

### Health Check

```
GET /health              # Basic health check
GET /health/ready        # Readiness check with dependencies
```

### Vendors

```
GET    /api/vendors              # List all vendors (paginated)
GET    /api/vendors/stats        # Get vendor statistics
POST   /api/vendors              # Register new vendor
GET    /api/vendors/:id          # Get vendor by ID
PUT    /api/vendors/:id          # Update vendor
PATCH  /api/vendors/:id/status   # Update vendor status
DELETE /api/vendors/:id          # Delete vendor (soft delete)
GET    /api/vendors/:id/orders  # Get vendor orders
GET    /api/vendors/:id/payments # Get payment history
POST   /api/vendors/:id/documents # Upload documents
```

### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| page | number | Page number (default: 1) |
| limit | number | Items per page (max: 100) |
| sortBy | string | Sort field |
| sortOrder | asc/desc | Sort direction |
| status | string | Filter by status |
| category | string | Filter by category |
| search | string | Search in name/email |
| minRating | number | Minimum rating filter |

## Data Model

### Vendor

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Vendor name |
| email | string | Yes | Email (unique) |
| phone | string | Yes | Phone number |
| companyName | string | No | Company name |
| gstin | string | No | GST registration number |
| pan | string | No | PAN number |
| address | object | No | Address details |
| category | enum | Yes | Vendor category |
| bankDetails | object | No | Bank information |
| documents | object | No | Document paths |
| status | enum | No | Vendor status |
| rating | number | No | Average rating (0-5) |
| totalOrders | number | No | Total completed orders |
| totalRevenue | number | No | Total revenue |
| averageDeliveryTime | number | No | Avg delivery time (minutes) |
| onTimeDeliveryRate | number | No | On-time delivery % |

### Vendor Categories

- `food` - Food and beverages
- `grocery` - Grocery items
- `electronics` - Electronic equipment
- `furniture` - Furniture items
- `stationery` - Office supplies
- `uniforms` - Workwear and uniforms
- `equipment` - Industrial equipment
- `services` - Service providers
- `other` - Other categories

### Vendor Status

- `pending` - Awaiting approval
- `active` - Active and approved
- `suspended` - Temporarily suspended
- `rejected` - Registration rejected

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 4515 |
| NODE_ENV | Environment | development |
| MONGODB_URI | MongoDB connection string | mongodb://localhost:27017/bizora_vendor_portal |
| JWT_SECRET | JWT signing secret | - |
| JWT_EXPIRES_IN | JWT expiration | 7d |
| UPLOAD_DIR | File upload directory | ./uploads |
| MAX_FILE_SIZE | Max upload size (bytes) | 10485760 |
| RATE_LIMIT_WINDOW_MS | Rate limit window | 900000 |
| RATE_LIMIT_MAX_REQUESTS | Max requests per window | 100 |
| LOG_LEVEL | Logging level | info |
| CORS_ORIGIN | CORS allowed origin | * |

## Docker

```bash
# Build image
docker build -t bizora-vendor-portal .

# Run container
docker run -p 4515:4515 \
  -e MONGODB_URI=mongodb://host.docker.internal:27017/bizora_vendor_portal \
  bizora-vendor-portal
```

## License

Proprietary - CorpPerks
