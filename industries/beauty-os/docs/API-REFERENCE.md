# Beauty OS API Reference

## Overview

Beauty OS provides digital twin services for salon and spa management.

## Base URL

```
Staging: http://localhost:3101
Production: https://beauty-api.rtmn.io
```

## Client Twin Service

### Create Client
```
POST /api/clients
```

**Request Body:**
```json
{
  "name": "Jane Smith",
  "email": "jane@email.com",
  "phone": "+1-555-0123",
  "skinType": "combination",
  "hairType": "wavy",
  "allergies": ["sulfates"],
  "preferences": {
    "stylist": "Maria",
    "services": ["haircut", "color"]
  }
}
```

### Get Clients
```
GET /api/clients?limit=50&offset=0
```

### Get Client by ID
```
GET /api/clients/:id
```

### Update Client
```
PUT /api/clients/:id
```

## AI Agents

### Booking Agent
**Endpoint:** `POST /agents/booking`

```json
{
  "action": "schedule_appointment",
  "clientId": "client_id",
  "service": "haircut",
  "date": "2024-06-15",
  "time": "14:00"
}
```

### Consultation Agent
**Endpoint:** `POST /agents/consultation`

```json
{
  "action": "recommend_services",
  "clientId": "client_id",
  "occasion": "wedding"
}
```

## REZ CRM Integration

Connect with Square Appointments/Vagaro:

```bash
curl -X POST http://localhost:3094/api/crm/sync \
  -d '{"provider": "square", "direction": "bidirectional"}'
```
