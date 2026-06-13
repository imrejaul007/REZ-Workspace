# Home Services OS API Reference

## Base URL
Staging: http://localhost:3231

## Customer Twin Service

### Create Customer
POST /api/customers
{ "name": "John Homeowner", "email": "john@email.com", "phone": "+1-555-0123" }

### Get Customers
GET /api/customers

### Get Customer by ID
GET /api/customers/:id

## REZ CRM Integration
Connect with Jobber: curl -X POST http://localhost:3106/api/crm/sync -d '{"provider": "jobber"}'
