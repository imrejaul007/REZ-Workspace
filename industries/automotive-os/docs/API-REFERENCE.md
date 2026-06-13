# Automotive OS API Reference

## Base URL
Staging: http://localhost:3221

## Vehicle Twin Service

### Create Vehicle
POST /api/vehicles
{ "vin": "1HGBH41JXMN109186", "make": "Honda", "model": "Accord", "year": 2024, "price": 28000 }

### Get Vehicles
GET /api/vehicles

### Get Vehicle by ID
GET /api/vehicles/:id

## REZ CRM Integration
Connect with CDK: curl -X POST http://localhost:3105/api/crm/sync -d '{"provider": "cdk"}'
