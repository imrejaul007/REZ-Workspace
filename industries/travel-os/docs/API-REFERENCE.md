# Travel OS API Reference

## Base URL
```
Staging: http://localhost:3131
```

## Traveler Twin Service

### Create Traveler
```
POST /api/travelers
```
```json
{
  "name": "John Traveler",
  "email": "john@email.com",
  "phone": "+1-555-0123",
  "preferences": {
    "seatPreference": "window",
    "mealPreference": "vegetarian",
    "hotelPreference": "luxury"
  },
  "passportInfo": {
    "number": "AB123456",
    "expiry": "2028-01-01",
    "nationality": "USA"
  }
}
```

### Get Travelers
```
GET /api/travelers?loyaltyTier=gold
```

### Get Traveler by ID
```
GET /api/travelers/:id
```

## REZ CRM Integration
Connect with Amadeus/Sabre:
```bash
curl -X POST http://localhost:3100/api/crm/sync -d '{"provider": "amadeus"}'
```
