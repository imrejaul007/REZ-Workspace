# RTNM × StayOwn Hotel OS - Integration Specifications

**Version:** 1.0  
**Date:** June 12, 2026  
**Purpose:** Connect all RTNM sister companies to StayOwn Hotel OS

---

## Overview

This document defines how each RTNM sister company connects to StayOwn Hotel OS to enable the "Invisible Hotel" experience described in "The Hotel That Remembered Everything" story.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           RTNM ECOSYSTEM                                     │
│                                                                              │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│   │  Airzy   │  │CorpPerks │  │KHAIRMOVE │  │  Nexha   │  │  RIDZA   │   │
│   │ (Flight) │  │ (Staff)  │  │(Transport│  │(Procrmnt)│  │(Finance) │   │
│   └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
│        │            │            │            │            │            │
│        └────────────┴────────────┴────────────┴────────────┘            │
│                                 │                                         │
│                                 ▼                                         │
│                    ┌─────────────────────────────┐                       │
│                    │    StayOwn Hotel OS (3899)   │                       │
│                    │    hotel-os-integration      │                       │
│                    │                             │                       │
│                    │  ┌───────────────────────┐  │                       │
│                    │  │   StayBot (4840)     │  │                       │
│                    │  │   AI Concierge        │  │                       │
│                    │  └───────────────────────┘  │                       │
│                    │                             │                       │
│                    │  ┌───────────────────────┐  │                       │
│                    │  │  HOJAI Services       │  │                       │
│                    │  │  Memory | Genie        │  │                       │
│                    │  └───────────────────────┘  │                       │
│                    │                             │                       │
│                    │  ┌───────────────────────┐  │                       │
│                    │  │  19 Guest Services     │  │                       │
│                    │  │  Minibar | Restaurant  │  │                       │
│                    │  │  Spa | Housekeeping    │  │                       │
│                    │  └───────────────────────┘  │                       │
│                    └─────────────────────────────┘                       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. AIRZY Integration (Flight Tracking)

**Purpose:** Chapter 2 - "Three days before Sarah lands. Airzy activates. Flight delayed by 2 hours. StayBot updates."

### Required Endpoints

#### StayOwn provides to Airzy:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `POST /api/airzy/flight/update` | POST | Receive flight delay notification |
| `GET /api/airzy/guest/:guestId/flight-status` | GET | Get guest flight tracking status |
| `POST /api/airzy/guest/:guestId/register-flight` | POST | Register flight for tracking |
| `GET /api/airzy/hotel/:hotelId/upcoming-arrivals` | GET | Get hotel's upcoming arrivals |

#### Airzy must implement:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `GET /health` | GET | Health check |
| `GET /api/flights/:flightNumber/status` | GET | Get flight status |
| `POST /api/flights/:flightNumber/webhook` | POST | Register for flight updates |

### Integration Flow

```
1. Guest books hotel via StayOwn
2. StayOwn calls: POST /api/airzy/guest/:guestId/register-flight
   { bookingId, flightNumber, arrivalDate }
3. Airzy tracks flight and calls back on delay:
   POST /api/airzy/flight/update
   { guestId, bookingId, flightNumber, newArrival, delayMinutes }
4. StayOwn updates:
   - Airport pickup timing
   - Room preparation
   - StayBot notification
   - Restaurant forecasts
```

### Implementation in Airzy

```typescript
// Airzy must add this endpoint to connect to StayOwn
app.post('/api/stayown/flight-update', async (req, res) => {
  const { guestId, bookingId, flightNumber, newArrival, delayMinutes } = req.body;
  
  // Update StayOwn
  await fetch('http://stayown:3899/api/airzy/flight/update', {
    method: 'POST',
    body: JSON.stringify({ guestId, bookingId, flightNumber, newArrival, delayMinutes })
  });
  
  res.json({ success: true });
});
```

---

## 2. CorpPerks Integration (HR/Staff/CoPilot)

**Purpose:** Chapter 1 - "A company using CorpPerks plans a leadership retreat. The HR Head asks CoPilot: Find hotel for 80 employees."

### Required Endpoints

#### StayOwn provides to CorpPerks:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `POST /api/corp/book` | POST | Create corporate booking |
| `GET /api/corp/booking/:bookingId` | GET | Get booking status |
| `POST /api/corp/booking/:bookingId/cancel` | POST | Cancel booking |
| `GET /api/corp/company/:companyId/bookings` | GET | List company bookings |
| `POST /api/corp/employee/check-in` | POST | Individual employee check-in |

#### CorpPerks must implement:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `GET /api/companies/:companyId/profile` | GET | Get company profile |
| `GET /api/companies/:companyId/travel-policy` | GET | Get travel policy |
| `POST /api/employees/:employeeId/booking` | POST | Create employee booking |

### Integration Flow

```
1. CorpPerks CoPilot receives: "Find hotel for 80 employees, 3 days, conference hall"
2. CorpPerks calls: POST /api/corp/book
   { companyId, destination: 'Bangalore', checkIn, checkOut, rooms: 80, guests: 80, 
     requirements: { conferenceRooms: 4, teamActivities: true } }
3. StayOwn:
   - Creates bulk booking
   - Generates individual guest records
   - Processes corporate payment
   - Notifies StayBot
4. StayOwn returns: { bookingId, confirmationCode, totalCost, guestBookings[] }
5. CorpPerks confirms to HR Head
```

### CorpPerks CoPilot Implementation

```typescript
// CorpPerks must add hotel booking capability
async function hotelBookingRequest(query: string) {
  // Parse requirements from CoPilot query
  const requirements = parseRequirements(query);
  
  // Call StayOwn
  const result = await fetch('http://stayown:3899/api/corp/book', {
    method: 'POST',
    body: JSON.stringify({
      companyId: getCurrentCompanyId(),
      ...requirements,
      coPilotRequestId: `COPILOT-${Date.now()}`
    })
  });
  
  return result;
}
```

---

## 3. KHAIRMOVE Integration (Transport)

**Purpose:** Chapter 1 - "Airport pickup prepared" and Chapter 16 - checkout transport

### Required Endpoints

#### StayOwn provides to KHAIRMOVE:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `POST /api/transport/request` | POST | Request airport transfer |
| `GET /api/transport/:transferId/status` | GET | Get transfer status |
| `POST /api/transport/:transferId/cancel` | POST | Cancel transfer |

#### KHAIRMOVE must implement:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `GET /health` | GET | Health check |
| `POST /api/ride/request` | POST | Create ride request |
| `GET /api/ride/:rideId` | GET | Get ride status |
| `POST /api/ride/:rideId/cancel` | POST | Cancel ride |

### Integration Flow

```
1. Guest books hotel (StayBot receives booking)
2. StayOwn calls: POST /api/transport/request
   { guestId, hotelId, flightNumber, arrivalTime, pickupType: 'airport' }
3. KHAIRMOVE:
   - Confirms driver assigned
   - Tracks flight for pickup time
   - Notifies guest
4. On checkout: Same flow for airport drop
```

---

## 4. NEXHA Integration (Procurement)

**Purpose:** Chapter 11 - "Towel inventory low. Nexha activates. Supplier agents respond."

### Required Endpoints

#### StayOwn provides to Nexha:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `POST /api/procurement/rfq` | POST | Create procurement request |
| `GET /api/procurement/:rfqId/status` | GET | Get RFQ status |
| `POST /api/procurement/:rfqId/award` | POST | Award contract |

#### Nexha must implement:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `GET /api/suppliers/:category` | GET | Get suppliers by category |
| `POST /api/rfq/create` | POST | Create RFQ |
| `GET /api/rfq/:id/quotes` | GET | Get quotes |
| `POST /api/order/:id/confirm` | POST | Confirm order |

### Integration Flow

```
1. StayOwn inventory detects low stock (towels, coffee, seafood)
2. StayOwn calls: POST /api/procurement/rfq
   { hotelId, items: [{ name: 'towels', quantity: 500, unit: 'pcs' }], priority: 'normal' }
3. Nexha:
   - Publishes intent to supplier network
   - Collects quotes
   - Negotiates (Trust Engine validates)
4. StayOwn awards contract
5. Nexha confirms delivery schedule
6. RABTUL settles payment
```

---

## 5. RIDZA Integration (Finance)

**Purpose:** Chapter 15 - "RIDZA monitors: Revenue, Occupancy, Expenses, Profit Margins"

### Required Endpoints

#### StayOwn provides to RIDZA:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `GET /api/finance/hotel/:hotelId/analytics` | GET | Get hotel financial data |
| `POST /api/finance/hotel/:hotelId/expense` | POST | Report expense |
| `GET /api/finance/hotel/:hotelId/forecast` | GET | Get financial forecast |

#### RIDZA must implement:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `GET /api/finance/hotel/:hotelId/overview` | GET | Financial overview |
| `GET /api/finance/hotel/:hotelId/trends` | GET | Revenue trends |
| `GET /api/finance/hotel/:hotelId/costs` | GET | Cost analysis |
| `POST /api/finance/agent/insights` | POST | Receive agent insights |

### Integration Flow

```
1. RIDZA requests hotel financial data
2. StayOwn returns aggregated analytics
3. RIDZA CFO Agent analyzes:
   - Laundry costs rising (+₹22 Lakhs/year)
   - Revenue vs target
   - Occupancy forecast
4. RIDZA sends recommendations
5. Hotel owner (Ahmed) approves via CoPilot
```

---

## 6. AdBazaar Integration (Marketing)

**Purpose:** Chapter 12 - "AdBazaar activates. Campaign Agents analyze traveler behavior."

### Required Endpoints

#### StayOwn provides to AdBazaar:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `POST /api/marketing/campaign` | POST | Create campaign |
| `GET /api/marketing/campaign/:id/results` | GET | Get campaign results |
| `POST /api/marketing/target-audience` | POST | Define target audience |

#### AdBazaar must implement:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `GET /api/audiences/business-travelers` | GET | Get business traveler audience |
| `POST /api/campaigns/create` | POST | Create campaign |
| `GET /api/campaigns/:id/analytics` | GET | Campaign analytics |

### Integration Flow

```
1. Hotel owner (Ahmed) wants more business travelers
2. StayOwn calls: POST /api/marketing/campaign
   { hotelId, targetAudience: 'business_travelers', objective: 'bookings', budget: 500000 }
3. AdBazaar:
   - Analyzes traveler behavior
   - Targets business travelers
   - Launches campaigns
4. Bookings increase
5. StayOwn tracks conversion
```

---

## 7. BrandPulse Integration (Reputation)

**Purpose:** Track hotel reputation, reviews, NPS

### Required Endpoints

#### StayOwn provides to BrandPulse:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `GET /api/reputation/:hotelId` | GET | Get reputation metrics |
| `POST /api/reputation/:hotelId/review` | POST | Submit review data |
| `GET /api/reputation/:hotelId/mentions` | GET | Get brand mentions |

#### BrandPulse must implement:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `GET /api/brand/:hotelId/overview` | GET | Brand overview |
| `GET /api/brand/:hotelId/sentiment` | GET | Sentiment analysis |
| `GET /api/brand/:hotelId/reviews` | GET | Review aggregation |

---

## 8. HOJAI GENIE Integration

**Purpose:** Chapter 1 Scenario B - "Genie books Pentouz automatically"

### Required Endpoints

#### StayOwn provides to Genie:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `POST /api/genie/:userId/book-hotel` | POST | Book hotel for user |
| `GET /api/genie/:userId/hotels` | GET | Search hotels |
| `GET /api/genie/:userId/briefing` | GET | Get guest briefing |

#### Genie must implement:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `GET /api/genie/:userId/preferences` | GET | Get user preferences |
| `GET /api/genie/:userId/history` | GET | Get booking history |

### Integration Flow

```
1. User tells Genie: "I need a hotel for tomorrow, near Indiranagar, investor meeting"
2. Genie:
   - Gets user preferences from memory
   - Calls: POST /api/genie/:userId/book-hotel
   - { destination: 'Bangalore Indiranagar', checkIn: tomorrow, 
       preferences: { businessHotel: true, quietRoom: true } }
3. StayOwn:
   - Searches hotels matching criteria
   - Books Pentouz
   - Prepares room
4. Genie confirms to user
```

---

## 9. RABTUL Integration (Already Implemented)

**Purpose:** Payment, Auth, Wallet - Already connected via hojai-staybot

### Services Connected

| Service | Port | Status |
|---------|------|--------|
| rez-auth | 4002 | ✅ Connected |
| rez-payment | 4001 | ✅ Connected |
| rez-wallet | 4004 | ✅ Connected |

---

## API Contracts

### Hotel Booking Contract

```typescript
interface HotelBookingRequest {
  guestId: string;
  hotelId: string;
  roomType: 'standard' | 'deluxe' | 'suite';
  checkIn: string; // ISO date
  checkOut: string; // ISO date
  guests: number;
  preferences?: {
    temperature?: number;
    pillow?: string;
    dietary?: string[];
  };
  paymentMethod?: string;
  source: 'direct' | 'genie' | 'corpperks' | 'ota';
}

interface HotelBookingResponse {
  success: boolean;
  bookingId: string;
  confirmationCode: string;
  status: 'pending' | 'confirmed';
  roomId?: string;
  totalAmount?: number;
}
```

### Corporate Booking Contract

```typescript
interface CorporateBookingRequest {
  companyId: string;
  coPilotRequestId: string;
  requesterId: string;
  details: {
    destination: string;
    checkIn: string;
    checkOut: string;
    numberOfRooms: number;
    guests: number;
    purpose: 'meeting' | 'retreat' | 'conference' | 'training';
    requirements: {
      conferenceRooms?: number;
      teamActivities?: boolean;
      dining?: 'included' | 'optional' | 'none';
    };
    budget?: {
      perRoom: number;
      total: number;
    };
  };
}

interface CorporateBookingResponse {
  success: boolean;
  bookingId: string;
  bookingReference: string;
  status: 'confirmed' | 'partial';
  hotelId: string;
  rooms: { roomType: string; count: number; rate: number }[];
  totalCost: { amount: number; currency: string };
  guestCount: number;
}
```

### Flight Update Contract

```typescript
interface FlightUpdateRequest {
  guestId: string;
  bookingId: string;
  flightNumber: string;
  originalArrival: string;
  newArrival: string;
  delayMinutes: number;
  reason?: string;
}

interface FlightUpdateResponse {
  success: boolean;
  syncId: string;
  updatesSent: {
    stayBot: boolean;
    airportPickup: boolean;
    roomPreparation: boolean;
    restaurantForecasts: boolean;
    guestMemory: boolean;
  };
}
```

---

## Environment Variables

### For StayOwn (Provider)

```bash
# External RTNM Services
AIRZY_URL=http://airzy:3000
CORPPERKS_URL=http://corpperks:4700
KHAIRMOVE_URL=http://khaimove:4000
NEXHA_URL=http://nexha:4600
RIDZA_URL=http://ridza:4500
ADBazaar_URL=http://adbazaar:4500
BRANDPULSE_URL=http://brandpulse:4770

# Internal
STAYOWN_URL=http://stayown-hotel-os:3899
STAYBOT_URL=http://staybot:4840
```

### For RTNM Services (Consumer)

```bash
# All RTNM services need to know StayOwn URL
STAYOWN_URL=http://stayown-hotel-os:3899
STAYBOT_URL=http://staybot:4840
```

---

## Testing

### Test Hotel Booking Flow

```bash
# 1. Book via Genie
curl -X POST http://localhost:3899/api/genie/user123/book-hotel \
  -H "Content-Type: application/json" \
  -d '{"destination":"Bangalore","checkIn":"2026-06-15","checkOut":"2026-06-17","preferences":{"businessHotel":true}}'

# 2. Corporate booking
curl -X POST http://localhost:3899/api/corp/book \
  -H "Content-Type: application/json" \
  -d '{"companyId":"corp123","destination":"Bangalore","checkIn":"2026-06-15","checkOut":"2026-06-18","rooms":20,"guests":20}'

# 3. Flight update
curl -X POST http://localhost:3899/api/airzy/flight/update \
  -H "Content-Type: application/json" \
  -d '{"guestId":"guest123","bookingId":"book123","flightNumber":"AI101","newArrival":"2026-06-15T06:00:00Z","delayMinutes":120}'
```

---

## Status Checklist

| RTNM Company | Status | Notes |
|--------------|--------|-------|
| **HOJAI AI** | ✅ Connected | StayBot, Memory, Genie |
| **RABTUL** | ✅ Connected | Auth, Payment, Wallet |
| **Airzy** | 🔴 Needs Implementation | Flight tracking |
| **CorpPerks** | 🔴 Needs Implementation | CoPilot hotel booking |
| **KHAIRMOVE** | 🔴 Needs Implementation | Airport transfers |
| **Nexha** | 🔴 Needs Implementation | Procurement |
| **RIDZA** | 🔴 Needs Implementation | Finance analytics |
| **AdBazaar** | 🔴 Needs Implementation | Marketing campaigns |
| **BrandPulse** | 🔴 Needs Implementation | Reputation tracking |

---

**Document Version:** 1.0  
**Last Updated:** June 12, 2026  
**Owner:** StayOwn Hospitality Team