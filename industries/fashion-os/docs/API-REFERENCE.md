# Fashion OS API Reference

## Base URL
```
Staging: http://localhost:3161
```

## Customer Twin Service

### Create Customer
```
POST /api/customers
```
```json
{
  "name": "Jane Doe",
  "email": "jane@email.com",
  "phone": "+1-555-0123",
  "styleProfile": {
    "preferredStyles": ["casual", "minimalist"],
    "preferredColors": ["black", "white"],
    "sizes": { "top": "M", "bottom": "28", "shoes": "8" }
  }
}
```

### Get Customers
```
GET /api/customers
```

### Get Customer by ID
```
GET /api/customers/:id
```

## REZ CRM Integration
Connect with Shopify/Magento:
```bash
curl -X POST http://localhost:3097/api/crm/sync -d '{"provider": "magento"}'
```
