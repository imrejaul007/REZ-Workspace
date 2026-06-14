# REZ-Consumer API Documentation

**Version:** 1.0.0
**Base URL:** `https://api.rez.consumer`

---

## Authentication

All API requests require authentication via Bearer token:

```
Authorization: Bearer <token>
```

---

## Services & Ports

| Service | Port | Base URL |
|---------|------|----------|
| go4food-api | 3002 | `/api` |
| REZ-inbox | 3003 | `/api` |
| REZ-assistant | 3010 | `/api` |
| REZ-nearby | 3015 | `/api` |
| REZ-scan | 3016 | `/api` |
| safe-qr-service | 4001 | `/api` |
| verify-qr-service | 4003 | `/api` |

---

## go4food-api

### Search Restaurants

```
GET /api/restaurants/search
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| query | string | Search query |
| cuisines | string | Comma-separated cuisines |
| lat | number | Latitude |
| lng | number | Longitude |
| minRating | number | Minimum rating |

**Response:**
```json
{
  "success": true,
  "data": {
    "restaurants": [...],
    "total": 10
  }
}
```

### Get Restaurant

```
GET /api/restaurants/:id
```

### Get Menu

```
GET /api/restaurants/:id/menu
```

### Compare Price

```
GET /api/compare/price?itemName=<name>
```

### Best Deals

```
GET /api/compare/best-deals?query=<query>
```

---

## REZ-inbox

### List Messages

```
GET /api/messages
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| page | number | Page number |
| limit | number | Items per page |
| category | string | Filter by category |

### Get Message

```
GET /api/messages/:id
```

### Mark as Read

```
PATCH /api/messages/:id/read
```

---

## REZ-assistant

### Send Message

```
POST /api/chat/message
```

**Body:**
```json
{
  "userId": "user-123",
  "message": "Hello",
  "context": {}
}
```

### Get History

```
GET /api/chat/history/:userId?limit=50
```

---

## REZ-nearby

### Get Nearby Places

```
GET /api/places/nearby
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| lat | number | Latitude |
| lng | number | Longitude |
| category | string | Place category |

### Search Places

```
GET /api/search?q=<query>
```

### Get Categories

```
GET /api/categories
```

---

## REZ-scan

### Scan QR

```
POST /api/scan
```

**Body:**
```json
{
  "qrContent": "REZ:payment:123",
  "userId": "user-123"
}
```

### Get History

```
GET /api/scan/history/:userId
```

### Get Stats

```
GET /api/scan/history/:userId/stats
```

---

## safe-qr-service

### Create QR

```
POST /api/qr/create
```

### Get QR

```
GET /api/qr/:id
```

### Emergency Mode

```
POST /api/emergency/activate
```

---

## verify-qr-service

### Verify Product

```
POST /api/verify
```

**Body:**
```json
{
  "serialNumber": "REZ123456",
  "userId": "user-123"
}
```

### Register Warranty

```
POST /api/warranty/register
```

### File Claim

```
POST /api/claims
```

---

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| UNAUTHORIZED | 401 | Invalid or missing token |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| VALIDATION_ERROR | 400 | Invalid request |
| INTERNAL_ERROR | 500 | Server error |

---

## Rate Limiting

All endpoints are rate limited:
- **100 requests/minute** for authenticated users
- **20 requests/minute** for unauthenticated users

---

## Support

For API support, contact: support@rez.consumer
