# TwinOS Hub

Central repository for all 113 digital twins across 24 industries in the RTMN Industry OS ecosystem.

## Overview

TwinOS Hub provides a unified registry of all digital twins, enabling:
- **Twin Discovery** - Find twins by industry, type, or capability
- **Twin Catalog** - Browse all available twins with descriptions
- **Twin Sync** - Synchronize data between twins
- **Analytics** - Track twin usage and performance

## Twin Distribution

| Industry | Twin Count | Example Twins |
|----------|-----------|---------------|
| Legal | 5 | Client Twin, Case Twin, Document Twin, Calendar Twin, Billing Twin |
| Healthcare | 5 | Patient Twin, Provider Twin, Appointment Twin, Medical Record Twin, Insurance Twin |
| Finance | 5 | Account Twin, Transaction Twin, Invoice Twin, Tax Twin, Payroll Twin |
| Retail | 5 | Customer Twin, Product Twin, Inventory Twin, Order Twin, POS Twin |
| Education | 5 | Student Twin, Course Twin, Instructor Twin, Grade Twin, Attendance Twin |
| Manufacturing | 5 | Product Twin, Machine Twin, Work Order Twin, Quality Twin, Supply Chain Twin |
| Real Estate | 5 | Property Twin, Listing Twin, Lead Twin, Transaction Twin, Tenant Twin |
| Travel | 5 | Booking Twin, Itinerary Twin, Loyalty Twin, Expense Twin, Preference Twin |
| Restaurant | 5 | Reservation Twin, Menu Twin, Order Twin, Inventory Twin, Staff Twin |
| Fitness | 5 | Member Twin, Workout Twin, Class Twin, Progress Twin, Billing Twin |
| Automotive | 5 | Vehicle Twin, Service Twin, Owner Twin, Warranty Twin, Dealership Twin |
| Entertainment | 5 | Event Twin, Ticket Twin, Artist Twin, Venue Twin, Audience Twin |
| Gaming | 5 | Player Twin, Game Twin, Inventory Twin, Match Twin, Monetization Twin |
| Agriculture | 5 | Field Twin, Crop Twin, Equipment Twin, Weather Twin, Livestock Twin |
| Construction | 5 | Project Twin, Blueprint Twin, Contractor Twin, Resource Twin, Safety Twin |
| Beauty | 5 | Client Twin, Service Twin, Appointment Twin, Product Twin, Stylist Twin |
| Fashion | 5 | Collection Twin, Garment Twin, Designer Twin, Trend Twin, Inventory Twin |
| Sports | 5 | Athlete Twin, Team Twin, Game Twin, Venue Twin, Fan Twin |
| Government | 5 | Citizen Twin, Permit Twin, Service Twin, Compliance Twin, Facility Twin |
| Home Services | 5 | Customer Twin, Service Twin, Job Twin, Technician Twin, Inventory Twin |
| Professional | 5 | Client Twin, Project Twin, Resource Twin, Deliverable Twin, Timesheet Twin |
| Non-Profit | 5 | Donor Twin, Donation Twin, Volunteer Twin, Beneficiary Twin, Campaign Twin |
| Media | 5 | Content Twin, Author Twin, Audience Twin, Ad Twin, Subscription Twin |
| Energy | 5 | Meter Twin, Facility Twin, Production Twin, Grid Twin, Sustainability Twin |

**Total: 113 twins across 24 industries**

## Quick Start

```bash
cd core/twinos-hub
npm install
npm start
```

## API Endpoints

### Health & Stats
```
GET /health                    - Health check
GET /stats                     - Overall statistics
GET /catalog                   - Full twin catalog
```

### Twins
```
GET /twins                     - List all twins
GET /twins/:id                 - Get specific twin
GET /twins/type/:type          - Get twins by type
GET /twins/search/:query       - Search twins
```

### Industry Twins
```
GET /industries                - List all industry twins
GET /industries/:industry      - Get twins for industry
GET /industries/:industry/types - Get twin types in industry
POST /industries/compare        - Compare twins across industries
```

## Example Responses

### Get All Twins
```json
{
  "twins": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 113,
    "pages": 3
  }
}
```

### Get Industry Twins
```json
{
  "industry": "legal",
  "twins": [
    {
      "id": "uuid",
      "type": "client-twin",
      "name": "Legal Client Twin",
      "description": "Complete client profile...",
      "capabilities": ["profile", "matters", "billing", "documents"]
    }
  ],
  "count": 5
}
```

## Architecture

```
twinos-hub/
├── src/
│   ├── index.js              # Main entry
│   ├── services/
│   │   ├── twinRegistry.js   # Twin registry (113 twins)
│   │   ├── twinSyncService.js # Sync management
│   │   └── twinAnalytics.js   # Analytics
│   └── routes/
│       ├── twins.js          # Twin routes
│       └── industryTwins.js  # Industry routes
├── package.json
└── README.md
```

## License

MIT
