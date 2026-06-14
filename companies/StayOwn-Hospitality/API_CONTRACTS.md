# Hotel Ecosystem API Contracts

## Authentication

All API requests require authentication via Bearer token:

```http
Authorization: Bearer <jwt_token>
```

Internal service calls use service tokens:

```http
X-Internal-Token: <service_token>
```

## Common Response Format

### Success Response
```typescript
{
  success: true,
  data: T,
  meta?: {
    page?: number,
    limit?: number,
    total?: number
  }
}
```

### Error Response
```typescript
{
  success: false,
  error: {
    code: string,
    message: string,
    details?: unknown
  }
}
```

---

## StayOwn Service (`rez-stayown-service`)

**Base URL**: `http://localhost:4004/api/stayown`

### Hotel Search
```http
GET /hotels/search
```
**Query Parameters**:
- `city` (string, optional)
- `checkIn` (ISO date, optional)
- `checkOut` (ISO date, optional)
- `guests` (number, optional)

**Response**:
```typescript
{
  success: true,
  data: Array<{
    propertyId: string;
    name: string;
    starRating: number;
    userRating: number;
    pricePerNight: number;
    images: string[];
    amenities: string[];
  }>
}
```

### Hotel Details
```http
GET /hotels/:propertyId
```
**Response**:
```typescript
{
  success: true,
  data: {
    propertyId: string;
    name: string;
    description: string;
    address: { line1: string; city: string; state: string; country: string; pincode: string; };
    starRating: number;
    userRating: number;
    reviewCount: number;
    amenities: string[];
    images: string[];
    roomTypes: Array<{
      roomTypeId: string;
      name: string;
      bedType: string;
      baseRate: number;
      corporateRate: number;
      discount: number;
      maxOccupancy: number;
      available: boolean;
    }>;
    cancellationPolicy: {
      freeCancellation: boolean;
      cancellationDeadline: string;
      refundPercentage: number;
    };
  }
}
```

### Create Booking
```http
POST /hotels/bookings
Authorization: Bearer <jwt>
```
**Request Body**:
```typescript
{
  propertyId: string;
  roomId: string;
  checkIn: string; // ISO date
  checkOut: string; // ISO date
  guests?: number;
  guestDetails?: Array<{
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
  }>;
  paymentOption?: 'prepay' | 'pay_at_hotel' | 'partial';
}
```
**Response**:
```typescript
{
  success: true,
  data: {
    bookingId: string;
    confirmationNumber: string;
    status: 'confirmed';
    totalAmountPaise: number;
    upfrontAmountPaise: number;
    payAtHotelAmountPaise: number;
    property: { propertyId: string; name: string; address: string; };
    room: { roomTypeId: string; name: string; bedType: string; };
    dates: { checkIn: string; checkOut: string; nights: number; };
  }
}
```

### Cancel Booking
```http
POST /hotels/bookings/:bookingId/cancel
Authorization: Bearer <jwt>
```
**Response**:
```typescript
{
  success: true,
  data: {
    bookingId: string;
    status: 'cancelled';
    refundAmountPaise: number;
    refundStatus: string;
    cancelledAt: string;
  }
}
```

### Calculate Pricing
```http
POST /hotels/pricing/calculate
```
**Request Body**:
```typescript
{
  propertyId: string;
  roomId: string;
  checkIn: string;
  checkOut: string;
}
```
**Response**:
```typescript
{
  success: true,
  data: {
    baseRate: number;
    nights: number;
    subtotal: number;
    taxableAmount: number;
    cgstRate: number;
    cgstAmount: number;
    sgstRate: number;
    sgstAmount: number;
    totalTax: number;
    totalAmount: number;
    dynamicPrice?: number;
    demandFactor?: number;
    eventFactor?: number;
  }
}
```

---

## Habixo Service (`rez-habixo-service`)

**Base URL**: `http://localhost:4005/api/habixo`

### Property Types
- `stays` - Short-term rentals
- `rent` - Long-term rentals
- `match` - Flatmate matching

### Create Property
```http
POST /properties
Authorization: Bearer <jwt>
```
**Request Body**:
```typescript
{
  propertyType: 'stays' | 'rent' | 'match';
  title: string;
  description: string;
  address: Address;
  propertyType: PropertyTypeConfig;
  amenities: string[];
  images: string[];
  pricing: {
    rentAmount: number;
    depositAmount: number;
    availableFrom: string;
  };
}
```

### Create Flatmate Profile
```http
POST /flatmates/profile
Authorization: Bearer <jwt>
```
**Request Body**:
```typescript
{
  lifestyle: {
    vibeTags?: string[];
    sleepSchedule?: string;
    workFromHome?: boolean;
    smoking?: string;
    drinking?: string;
    pets?: boolean;
    allergies?: string[];
  };
  preferences: {
    minBudget?: number;
    maxBudget?: number;
    preferredAreas?: string[];
    moveInDate?: string;
    leaseDuration?: number;
    roommateCount?: { min?: number; max?: number; };
  };
}
```

### Find Matches
```http
GET /flatmates/matches
Authorization: Bearer <jwt>
```
**Query Parameters**:
- `city` (string)
- `minBudget` (number)
- `maxBudget` (number)
- `vibeTags` (string, comma-separated)
- `sleepSchedule` (string)
- `workFromHome` (boolean)
- `page` (number)
- `limit` (number)

**Response**:
```typescript
{
  success: true,
  data: {
    matches: Array<{
      profile: FlatmateProfile;
      compatibility: {
        score: number;
        matchedTags: string[];
      };
    }>;
    total: number;
  }
}
```

---

## Hotel Service (`rez-hotel-service`)

**Base URL**: `http://localhost:4006/api/hotel`

### Room QR

#### Generate QR
```http
POST /qr/generate
Authorization: Bearer <jwt>
```
**Request Body**:
```typescript
{
  bookingId: string;
  roomId: string;
  expiresAt?: string; // ISO date, default 7 days
}
```

#### Validate QR
```http
POST /qr/validate
```
**Request Body**:
```typescript
{
  qrData: string;
}
```
**Response**:
```typescript
{
  success: true,
  data: {
    valid: boolean;
    bookingId: string;
    roomId: string;
    guestName?: string;
    checkIn?: string;
    checkOut?: string;
  }
}
```

### Staff Tasks

#### Create Task
```http
POST /tasks
Authorization: Bearer <jwt>
```
**Request Body**:
```typescript
{
  type: 'housekeeping' | 'maintenance' | 'concierge';
  roomId: string;
  priority: 'low' | 'medium' | 'high';
  description?: string;
}
```

#### Update Task Status
```http
PATCH /tasks/:taskId/status
Authorization: Bearer <jwt>
```
**Request Body**:
```typescript
{
  status: 'pending' | 'in_progress' | 'completed';
  notes?: string;
}
```

---

## Hotel POS Service (`rez-hotel-pos-service`)

**Base URL**: `http://localhost:4009/api/pos`

### Folio Management

#### Create Folio
```http
POST /folio
Authorization: Bearer <jwt>
```
**Request Body**:
```typescript
{
  bookingId: string;
  guestName: string;
  roomId: string;
  checkOut: string;
}
```

#### Add Charge
```http
POST /folio/charge
Authorization: Bearer <jwt>
```
**Request Body**:
```typescript
{
  folioId: string;
  item: {
    name: string;
    quantity: number;
    unitPrice: number;
    hsnCode?: string;
    taxRate?: number;
  };
  outlet?: 'restaurant' | 'minibar' | 'spa' | 'banquet' | 'laundry';
}
```

#### Post Folio to PMS
```http
POST /folio/:folioId/post
Authorization: Bearer <jwt>
```

### Outlet Orders

#### Restaurant Order
```http
POST /outlet/restaurant/:restaurantId/order
Authorization: Bearer <jwt>
```
**Request Body**:
```typescript
{
  folioId?: string;
  tableNumber?: string;
  items: Array<{
    menuItemId: string;
    quantity: number;
    specialInstructions?: string;
  }>;
}
```

---

## Reputation Service (`rez-reputation-service`)

**Base URL**: `http://localhost:4010/api/reviews`

### Get Reviews
```http
GET /reviews
```
**Query Parameters**:
- `hotelId` (string)
- `source` (string: google, tripadvisor, bookingcom, internal)
- `sentiment` (string: positive, neutral, negative)
- `page` (number)
- `limit` (number)

### Create Internal Review
```http
POST /reviews
Authorization: Bearer <jwt>
```
**Request Body**:
```typescript
{
  hotelId: string;
  bookingId: string;
  rating: number; // 1-5
  title: string;
  content: string;
  guestName?: string;
}
```

### Generate AI Response
```http
POST /reviews/:reviewId/respond
Authorization: Bearer <jwt>
```
**Response**:
```typescript
{
  success: true,
  data: {
    reviewId: string;
    response: string;
    status: 'pending_approval' | 'approved' | 'posted';
  }
}
```

### Webhook Endpoints

```http
POST /webhooks/google
POST /webhooks/tripadvisor
POST /webhooks/bookingcom
POST /webhooks/internal
```
Each webhook receives review data from external platforms and requires HMAC signature verification.

---

## Rate Limits

| Endpoint Pattern | Limit | Window |
|-----------------|-------|--------|
| `/hotels/search` | 30 | per minute |
| `/bookings` (POST) | 10 | per minute |
| `/qr/validate` | 100 | per minute |
| All others | 60 | per minute |

---

## Error Codes

| Code | Description |
|------|-------------|
| `PROPERTY_NOT_FOUND` | Property ID does not exist |
| `ROOM_NOT_AVAILABLE` | Room is not available for dates |
| `BOOKING_NOT_FOUND` | Booking ID does not exist |
| `INVALID_DATE_RANGE` | Check-out before check-in |
| `INVALID_PAYMENT_OPTION` | Unknown payment option |
| `QR_EXPIRED` | QR code has expired |
| `UNAUTHORIZED` | Invalid or missing token |
| `RATE_LIMITED` | Too many requests |
