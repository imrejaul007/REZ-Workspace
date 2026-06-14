# Wedding Graph Service

**Port:** 4881  
**Company:** AdBazaar  
**Purpose:** Wedding Graph - Event intelligence for weddings

The Wedding Graph Service is AdBazaar's comprehensive wedding management and analytics platform. It provides complete lifecycle management for weddings including guest tracking, vendor management, budget analytics, and ad targeting capabilities.

## Features

- **Wedding Management** - Register, update, and track wedding events
- **Guest Management** - Track guests, RSVP, dietary requirements, plus-ones
- **Vendor Management** - Manage vendors across 18 categories
- **Budget Analytics** - Real-time budget tracking and projections
- **Ad Targeting** - AI-powered audience segmentation and targeting
- **Campaign Management** - Create and track ad campaigns
- **Location Intelligence** - Find nearby weddings, guest distribution
- **Digital Twin** - Complete wedding digital replica

## Tech Stack

- **Runtime:** Node.js 18+
- **Language:** TypeScript
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose
- **Cache:** Redis
- **Logging:** Winston
- **Metrics:** Prometheus (prom-client)
- **Validation:** Zod

## Quick Start

```bash
# Install dependencies
cd wedding-graph-service
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Environment Variables

```env
PORT=4881
MONGODB_URI=mongodb://localhost:27017/wedding-graph
REDIS_URL=redis://localhost:6379
INTERNAL_SERVICE_TOKEN=wedding-graph-internal-token
LOG_LEVEL=info
NODE_ENV=development
```

## API Endpoints

### Health & Metrics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Service health check |
| GET | `/metrics` | Prometheus metrics |

### Weddings

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/weddings` | Create wedding |
| GET | `/api/weddings` | List weddings |
| GET | `/api/weddings/nearby` | Find nearby weddings |
| GET | `/api/weddings/:id` | Get wedding |
| PUT | `/api/weddings/:id` | Update wedding |
| DELETE | `/api/weddings/:id` | Cancel wedding |
| GET | `/api/weddings/:id/analytics` | Get analytics |
| GET | `/api/weddings/:id/targeting` | Get targeting data |
| GET | `/api/weddings/:id/stats` | Get statistics |

### Guests

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/weddings/:id/guests` | Add guest(s) |
| GET | `/api/weddings/:id/guests` | List guests |
| GET | `/api/weddings/:id/guests/stats` | Guest statistics |
| GET | `/api/weddings/:id/guests/locations` | Guest locations |
| GET | `/api/weddings/:id/guests/:guestId` | Get guest |
| PUT | `/api/weddings/:id/guests/:guestId` | Update guest |
| DELETE | `/api/weddings/:id/guests/:guestId` | Remove guest |

### Vendors

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/weddings/:id/vendors` | Add vendor(s) |
| GET | `/api/weddings/:id/vendors` | List vendors |
| GET | `/api/weddings/:id/vendors/stats` | Vendor statistics |
| GET | `/api/weddings/:id/vendors/by-category` | Vendors by category |
| GET | `/api/weddings/:id/vendors/payments` | Upcoming payments |
| GET | `/api/weddings/:id/vendors/:vendorId` | Get vendor |
| PUT | `/api/weddings/:id/vendors/:vendorId` | Update vendor |
| POST | `/api/weddings/:id/vendors/:vendorId/book` | Book vendor |
| POST | `/api/weddings/:id/vendors/:vendorId/payment` | Record payment |
| POST | `/api/weddings/:id/vendors/:vendorId/review` | Add review |
| DELETE | `/api/weddings/:id/vendors/:vendorId` | Remove vendor |

## Authentication

All API endpoints require internal service authentication via the `X-Internal-Token` header:

```bash
curl -H "X-Internal-Token: wedding-graph-internal-token" \
     http://localhost:4881/api/weddings
```

## Example Usage

### Create a Wedding

```bash
curl -X POST http://localhost:4881/api/weddings \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: wedding-graph-internal-token" \
  -d '{
    "coupleName": "Rahul & Priya Sharma",
    "brideName": "Priya Sharma",
    "groomName": "Rahul Sharma",
    "weddingDate": "2026-12-15T10:00:00Z",
    "venue": {
      "name": "The Grand Palace",
      "address": "123 Wedding Lane",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pincode": "400001",
      "latitude": 19.0760,
      "longitude": 72.8777,
      "capacity": 500
    },
    "budget": {
      "total": 2000000,
      "currency": "INR",
      "breakdown": {
        "venue": 500000,
        "catering": 600000,
        "photography": 200000,
        "decoration": 300000
      }
    },
    "theme": "Royal",
    "hashtags": ["RahulPriyaWeds", "DestinationWedding"],
    "instagramHandle": "@rahulpriyaweds",
    "ownerId": "user-123",
    "createdBy": "user-123"
  }'
```

### Add Guests

```bash
curl -X POST http://localhost:4881/api/weddings/WDG-ABC12345/guests \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: wedding-graph-internal-token" \
  -d '{
    "firstName": "Amit",
    "lastName": "Singh",
    "email": "amit.singh@email.com",
    "phone": "+919876543210",
    "rsvp": "confirmed",
    "plusOne": true,
    "plusOneName": "Sneha Singh",
    "dietary": {
      "vegetarian": true,
      "halal": true
    },
    "category": "friend",
    "address": {
      "city": "Delhi",
      "state": "Delhi",
      "pincode": "110001"
    }
  }'
```

### Bulk Add Guests

```bash
curl -X POST http://localhost:4881/api/weddings/WDG-ABC12345/guests \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: wedding-graph-internal-token" \
  -d '{
    "guests": [
      {"firstName": "John", "lastName": "Doe", "category": "friend"},
      {"firstName": "Jane", "lastName": "Doe", "category": "friend"},
      {"firstName": "Bob", "lastName": "Smith", "category": "colleague"}
    ]
  }'
```

### Add Vendor

```bash
curl -X POST http://localhost:4881/api/weddings/WDG-ABC12345/vendors \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: wedding-graph-internal-token" \
  -d '{
    "category": "photography",
    "name": "Studio Elegance",
    "businessName": "Studio Elegance Photography",
    "contactName": "Vikram Malhotra",
    "email": "info@studioelegance.com",
    "phone": "+919876543211",
    "service": "Wedding Photography & Videography",
    "price": {
      "amount": 150000,
      "currency": "INR",
      "breakdown": {
        "basePrice": 120000,
        "tax": 18000,
        "extra": 12000
      }
    }
  }'
```

### Get Wedding Analytics

```bash
curl http://localhost:4881/api/weddings/WDG-ABC12345/analytics \
  -H "X-Internal-Token: wedding-graph-internal-token"
```

### Get Ad Targeting Data

```bash
curl http://localhost:4881/api/weddings/WDG-ABC12345/targeting \
  -H "X-Internal-Token: wedding-graph-internal-token"
```

## Data Models

### Wedding

```typescript
{
  weddingId: string;          // WDG-XXXXXXXX
  coupleName: string;
  brideName: string;
  groomName: string;
  weddingDate: Date;
  venue: {
    name: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
    latitude?: number;
    longitude?: number;
    capacity?: number;
  };
  budget: {
    total: number;
    spent: number;
    currency: string;
    breakdown?: {...};
  };
  guestCount: {
    expected: number;
    confirmed: number;
    declined: number;
    tentative: number;
  };
  status: 'planning' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  hashtags?: string[];
  instagramHandle?: string;
}
```

### Guest

```typescript
{
  guestId: string;            // GST-XXXXXXXX
  weddingId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  rsvp: 'pending' | 'confirmed' | 'declined' | 'tentative';
  plusOne: boolean;
  plusOneName?: string;
  dietary: {
    vegetarian: boolean;
    vegan: boolean;
    glutenFree: boolean;
    halal: boolean;
    kosher: boolean;
    nutAllergy: boolean;
    dairyFree: boolean;
  };
  category: 'family' | 'friend' | 'colleague' | 'vendor' | 'neighbor' | 'other';
  tableNumber?: number;
  giftAmount?: number;
}
```

### Vendor

```typescript
{
  vendorId: string;           // VND-XXXXXXXX
  weddingId: string;
  category: 'venue' | 'catering' | 'photography' | ...;
  name: string;
  businessName?: string;
  phone: string;
  service: string;
  price: {
    amount: number;
    currency: string;
  };
  status: 'inquiry' | 'quoted' | 'negotiating' | 'booked' | 'paid' | 'confirmed' | 'completed' | 'cancelled';
  booked: boolean;
  rating?: number;
}
```

## Prometheus Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `wedding_http_requests_total` | Counter | HTTP requests by method, path, status |
| `wedding_http_request_duration_seconds` | Histogram | HTTP request latency |
| `wedding_total_created` | Counter | Total weddings created |
| `wedding_active_count` | Gauge | Active weddings |
| `wedding_guest_total_created` | Counter | Total guests created |
| `wedding_guest_active_count` | Gauge | Total guests |
| `wedding_vendor_total_created` | Counter | Total vendors created |
| `wedding_vendor_booked_total` | Counter | Total vendors booked |
| `wedding_campaign_impressions_total` | Counter | Campaign impressions |
| `wedding_campaign_spend_total` | Counter | Campaign spend in INR |

## Vendor Categories

1. venue
2. catering
3. photography
4. videography
5. florist
6. decorator
7. dj
8. band
9. makeup_artist
10. mehndi_artist
11. wedding_planner
12. priest
13. transportation
14. cake
15. invitation
16. gift
17. accommodation
18. other

## Project Structure

```
wedding-graph-service/
├── package.json
├── tsconfig.json
├── README.md
└── src/
    ├── index.ts              # Main entry point
    ├── models/
    │   ├── Wedding.ts        # Wedding schema
    │   ├── Guest.ts         # Guest schema
    │   ├── Vendor.ts        # Vendor schema
    │   └── WeddingAnalytics.ts  # Analytics & Campaign schemas
    ├── services/
    │   ├── weddingService.ts    # Wedding business logic
    │   ├── guestService.ts      # Guest business logic
    │   ├── vendorService.ts     # Vendor business logic
    │   ├── analyticsService.ts  # Analytics calculations
    │   └── targetingService.ts   # Ad targeting logic
    ├── routes/
    │   ├── weddingRoutes.ts     # Wedding endpoints
    │   ├── guestRoutes.ts       # Guest endpoints
    │   └── vendorRoutes.ts      # Vendor endpoints
    ├── middleware/
    │   └── auth.ts              # Authentication middleware
    └── utils/
        ├── logger.ts           # Winston logger
        └── metrics.ts          # Prometheus metrics
```

## Integration

### Internal Services

The Wedding Graph Service integrates with other AdBazaar services:

- **AdBazaar Backend** - Campaign data sync
- **RABTUL** - Payment processing
- **HOJAI AI** - AI-powered targeting
- **REZ Notifications** - Guest notifications

### Environment

```bash
# Start MongoDB
mongod --dbpath /data/db

# Start Redis
redis-server

# Run the service
npm run dev
```

## Health Check

```bash
curl http://localhost:4881/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2026-06-07T10:00:00.000Z",
  "service": "wedding-graph-service",
  "version": "1.0.0",
  "port": 4881,
  "checks": {
    "mongodb": "connected",
    "redis": "connected"
  }
}
```

## License

Proprietary - AdBazaar