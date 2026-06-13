# Non-Profit OS API Reference

## Base URL
```
Staging: http://localhost:3151
```

## Donor Twin Service

### Create Donor
```
POST /api/donors
```
```json
{
  "name": "Jane Donor",
  "email": "jane@email.com",
  "phone": "+1-555-0123",
  "causes": ["education", "healthcare"],
  "givingHistory": [
    { "amount": 500, "campaign": "Education Fund", "date": "2024-01-15" }
  ]
}
```

### Get Donors
```
GET /api/donors?loyaltyTier=gold
```

### Get Donor by ID
```
GET /api/donors/:id
```

## REZ CRM Integration
Connect with Salesforce Nonprofit Cloud:
```bash
curl -X POST http://localhost:3102/api/crm/sync -d '{"provider": "salesforce_nonprofit"}'
```
