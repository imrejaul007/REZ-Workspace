# API Usage Examples

Complete examples for integrating with the REZ RisnaEstate API.

## Table of Contents

- [Authentication](#authentication)
- [Leads](#leads)
- [Properties](#properties)
- [Deals](#deals)
- [Agreements](#agreements)
- [Handovers](#handovers)
- [Documents](#documents)
- [Analytics](#analytics)

---

## Authentication

### Get Access Token

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "agent@rez.com",
    "password": "your-password"
  }'
```

Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user123",
    "name": "Agent Name",
    "email": "agent@rez.com"
  }
}
```

---

## Leads

### Create a Lead

```bash
curl -X POST http://localhost:3000/api/v1/leads \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "Rajesh Kumar",
    "email": "rajesh.kumar@example.com",
    "phone": "+91-9876543210",
    "source": "website",
    "notes": "Interested in 3BHK apartments in Whitefield area"
  }'
```

Response:
```json
{
  "_id": "65abc123def456789",
  "leadId": "LEAD-001",
  "name": "Rajesh Kumar",
  "email": "rajesh.kumar@example.com",
  "phone": "+91-9876543210",
  "source": "website",
  "status": "new",
  "createdAt": "2026-06-07T10:30:00Z"
}
```

### List Leads with Filters

```bash
curl -X GET "http://localhost:3000/api/v1/leads?status=qualified&page=1&limit=10" \
  -H "Authorization: Bearer <token>"
```

### Qualify a Lead

```bash
curl -X POST http://localhost:3000/api/v1/leads/65abc123def456789/qualify \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "budget": 5000000,
    "timeline": "3_6_months",
    "propertyType": "apartment",
    "preferredLocations": ["Whitefield", "Marathahalli", "Electronic City"]
  }'
```

### Update Lead Status

```bash
curl -X PATCH http://localhost:3000/api/v1/leads/65abc123def456789 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "status": "converted",
    "notes": "Converted to deal DEAL-042"
  }'
```

---

## Properties

### Create a Property Listing

```bash
curl -X POST http://localhost:3000/api/v1/properties \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "title": "Luxury 3BHK Apartment with Pool View",
    "type": "apartment",
    "price": 8500000,
    "location": {
      "address": "Prestige Summerdale, ITPL Main Road",
      "city": "Bangalore",
      "state": "Karnataka",
      "pincode": "560066"
    },
    "specifications": {
      "bedrooms": 3,
      "bathrooms": 2,
      "area": 1800,
      "areaUnit": "sqft"
    },
    "amenities": [
      "Swimming Pool",
      "Gym",
      "Club House",
      "24/7 Security",
      "Covered Parking",
      "Power Backup",
      "Children Play Area"
    ]
  }'
```

Response:
```json
{
  "_id": "65def789abc012345",
  "propertyId": "PROP-001",
  "title": "Luxury 3BHK Apartment with Pool View",
  "type": "apartment",
  "status": "available",
  "price": 8500000,
  "createdAt": "2026-06-07T11:00:00Z"
}
```

### Filter Properties by Price Range

```bash
curl -X GET "http://localhost:3000/api/v1/properties?type=apartment&minPrice=5000000&maxPrice=10000000&status=available" \
  -H "Authorization: Bearer <token>"
```

### Update Property Price

```bash
curl -X PATCH http://localhost:3000/api/v1/properties/65def789abc012345 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "price": 8200000,
    "notes": "Price reduced after market analysis"
  }'
```

---

## Deals

### Create a Deal

```bash
curl -X POST http://localhost:3000/api/v1/deals \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "leadId": "65abc123def456789",
    "propertyId": "65def789abc012345",
    "expectedPrice": 8500000,
    "notes": "Customer interested after site visit. Negotiating on price."
  }'
```

Response:
```json
{
  "_id": "65xyz789uvw345678",
  "dealId": "DEAL-042",
  "leadId": "65abc123def456789",
  "propertyId": "65def789abc012345",
  "stage": "inquiry",
  "expectedPrice": 8500000,
  "probability": 20,
  "status": "active",
  "createdAt": "2026-06-07T14:00:00Z"
}
```

### Move Deal to Next Stage

The deal stage workflow: `inquiry` -> `site_visit` -> `offer_made` -> `negotiation` -> `agreement` -> `registry` -> `closed_won`

```bash
curl -X POST http://localhost:3000/api/v1/deals/DEAL-042/stage \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "stage": "site_visit",
    "notes": "Scheduled site visit for June 15th at 11 AM",
    "expectedCloseDate": "2026-07-30"
  }'
```

### Update Deal Price and Probability

```bash
curl -X PATCH http://localhost:3000/api/v1/deals/DEAL-042 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "expectedPrice": 8200000,
    "probability": 50,
    "notes": "Customer agreed to revised pricing"
  }'
```

### Close Deal (Won)

```bash
curl -X POST http://localhost:3000/api/v1/deals/DEAL-042/close \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "outcome": "won",
    "finalPrice": 8000000,
    "reason": "Customer accepted final offer including all amenities"
  }'
```

### Close Deal (Lost)

```bash
curl -X POST http://localhost:3000/api/v1/deals/DEAL-043/close \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "outcome": "lost",
    "reason": "Customer purchased from competitor - better payment terms"
  }'
```

---

## Agreements

### Create Sale Agreement

```bash
curl -X POST http://localhost:3000/api/v1/agreements \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "dealId": "65xyz789uvw345678",
    "type": "sale_agreement",
    "terms": {
      "price": 8000000,
      "paymentSchedule": [
        {
          "milestone": "Booking Amount",
          "amount": 800000,
          "dueDate": "2026-06-20"
        },
        {
          "milestone": "Registry Payment",
          "amount": 7200000,
          "dueDate": "2026-07-15"
        }
      ],
      "possessionDate": "2026-09-30",
      "agreementDate": "2026-06-15"
    }
  }'
```

Response:
```json
{
  "_id": "65mnop456qrs789012",
  "agreementId": "AGREEMENT-015",
  "dealId": "65xyz789uvw345678",
  "type": "sale_agreement",
  "status": "draft",
  "terms": {
    "price": 8000000,
    "paymentSchedule": [...]
  },
  "createdAt": "2026-06-07T15:00:00Z"
}
```

### Generate Agreement PDF

```bash
curl -X POST http://localhost:3000/api/v1/agreements/AGREEMENT-015/generate \
  -H "Authorization: Bearer <token>" \
  --output agreement.pdf
```

### Sign Agreement

```bash
curl -X POST http://localhost:3000/api/v1/agreements/AGREEMENT-015/sign \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "signatureData": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA...",
    "signerRole": "buyer"
  }'
```

---

## Handovers

### Schedule Property Handover

```bash
curl -X POST http://localhost:3000/api/v1/handovers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "dealId": "65xyz789uvw345678",
    "propertyId": "65def789abc012345",
    "scheduledDate": "2026-09-30T10:00:00Z",
    "checklist": [
      { "item": "Keys handed over", "completed": false },
      { "item": "All documents verified", "completed": false },
      { "item": "Property inspection completed", "completed": false },
      { "item": "Amenities walkthrough done", "completed": false },
      { "item": "Final walkthrough signed", "completed": false }
    ],
    "notes": "Buyer requested morning slot. Agent to coordinate with society secretary."
  }'
```

Response:
```json
{
  "_id": "65qrst890vwx456789",
  "handoverId": "HANDOVER-008",
  "dealId": "65xyz789uvw345678",
  "propertyId": "65def789abc012345",
  "status": "scheduled",
  "scheduledDate": "2026-09-30T10:00:00Z",
  "checklist": [...],
  "createdAt": "2026-06-07T16:00:00Z"
}
```

### Update Handover Status

```bash
curl -X PATCH http://localhost:3000/api/v1/handovers/HANDOVER-008/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "status": "in_progress",
    "notes": "Buyer arrived. Starting property inspection."
  }'
```

### Complete Handover

```bash
curl -X PATCH http://localhost:3000/api/v1/handovers/HANDOVER-008/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "status": "completed",
    "notes": "Handover completed successfully. All keys and documents handed over.",
    "completedItems": [
      "Keys handed over",
      "All documents verified",
      "Property inspection completed",
      "Amenities walkthrough done",
      "Final walkthrough signed"
    ],
    "pendingItems": []
  }'
```

---

## Documents

### Upload a Document

```bash
curl -X POST http://localhost:3000/api/v1/documents \
  -H "Authorization: Bearer <token>" \
  -F "file=@/path/to/document.pdf" \
  -F "type=title_deed" \
  -F "relatedTo=65def789abc012345" \
  -F "relatedType=property"
```

### Download a Document

```bash
curl -X GET http://localhost:3000/api/v1/documents/DOC-042/download \
  -H "Authorization: Bearer <token>" \
  --output document.pdf
```

### Delete a Document

```bash
curl -X DELETE http://localhost:3000/api/v1/documents/DOC-042 \
  -H "Authorization: Bearer <token>"
```

---

## Analytics

### Get Deal Analytics

```bash
curl -X GET "http://localhost:3000/api/v1/analytics/deals?startDate=2026-01-01&endDate=2026-12-31" \
  -H "Authorization: Bearer <token>"
```

Response:
```json
{
  "totalDeals": 156,
  "wonDeals": 42,
  "lostDeals": 28,
  "conversionRate": 60.0,
  "totalPipelineValue": 425000000,
  "averageDealSize": 2724359,
  "stageDistribution": {
    "inquiry": 25,
    "site_visit": 18,
    "offer_made": 15,
    "negotiation": 12,
    "agreement": 8,
    "registry": 8,
    "closed_won": 42,
    "closed_lost": 28
  },
  "monthlyTrend": [
    { "month": "2026-01", "deals": 12, "value": 32000000 },
    { "month": "2026-02", "deals": 15, "value": 41000000 }
  ]
}
```

### Get Property Analytics

```bash
curl -X GET http://localhost:3000/api/v1/analytics/properties \
  -H "Authorization: Bearer <token>"
```

Response:
```json
{
  "totalProperties": 245,
  "availableProperties": 68,
  "soldProperties": 177,
  "averagePrice": 6250000,
  "priceTrend": [
    { "month": "2026-01", "avgPrice": 5800000 },
    { "month": "2026-02", "avgPrice": 5950000 },
    { "month": "2026-03", "avgPrice": 6100000 }
  ],
  "propertiesByType": {
    "apartment": 145,
    "villa": 35,
    "plot": 42,
    "commercial": 18,
    "industrial": 5
  }
}
```

---

## Error Handling

### Standard Error Response

```json
{
  "error": "BadRequest",
  "message": "Invalid request parameters",
  "details": [
    "email must be a valid email address",
    "budget must be a positive number"
  ]
}
```

### Common HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 204 | No Content (delete success) |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Invalid/missing token |
| 404 | Not Found - Resource doesn't exist |
| 500 | Internal Server Error |

---

## Rate Limiting

See [rate-limiting.md](rate-limiting.md) for complete rate limiting information.
