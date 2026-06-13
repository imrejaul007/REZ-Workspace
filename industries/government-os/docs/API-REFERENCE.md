# Government OS API Reference

## Base URL
```
Staging: http://localhost:3141
```

## Citizen Twin Service

### Create Citizen
```
POST /api/citizens
```
```json
{
  "name": "John Citizen",
  "aadhaarNumber": "1234-5678-9012",
  "email": "john@email.com",
  "phone": "+91-9876543210",
  "address": {
    "street": "123 Main St",
    "city": "Mumbai",
    "state": "Maharashtra",
    "zip": "400001"
  }
}
```

### Get Citizens
```
GET /api/citizens?verificationStatus=verified
```

### Get Citizen by ID
```
GET /api/citizens/:id
```

## REZ CRM Integration
Connect with Salesforce Government Cloud:
```bash
curl -X POST http://localhost:3101/api/crm/sync -d '{"provider": "salesforce_gov"}'
```
