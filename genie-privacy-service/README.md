# GENIE Privacy Service

Personal Intelligence OS - Privacy Model for Genie AI

## Overview

GENIE (General Neural Intelligence Engine) Privacy Service provides privacy controls for personal AI, including privacy zones, local processing, and encryption settings.

## Features

- Privacy settings management
- Incognito mode toggle
- Memory deletion
- Data export (GDPR compliance)
- Complete data deletion (Right to be Forgotten)
- Audit logging
- Multi-tenant isolation

## Quick Start

```bash
cd genie-privacy-service
npm install
npm run dev
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/privacy/settings` | Get privacy settings |
| PUT | `/api/privacy/settings` | Update privacy settings |
| POST | `/api/privacy/incognito` | Toggle incognito mode |
| POST | `/api/privacy/memory/:id/delete` | Delete specific memory |
| POST | `/api/privacy/export` | Export all data |
| DELETE | `/api/privacy/delete-all` | Delete all data |
| GET | `/api/privacy/audit` | Get audit log |

## Required Headers

```bash
x-tenant-id: <tenant-id>
x-user-id: <user-id>
x-client-type: REZ_ECOSYSTEM | RABTUL_SAAS | EXTERNAL
```

## Example Requests

### Get Privacy Settings
```bash
curl -X GET http://localhost:4706/api/privacy/settings \
  -H "x-tenant-id: tenant-123" \
  -H "x-user-id: user-456"
```

### Update Privacy Settings
```bash
curl -X PUT http://localhost:4706/api/privacy/settings \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: tenant-123" \
  -H "x-user-id: user-456" \
  -d '{
    "privacy_zones": ["banking", "health"],
    "local_processing": true,
    "end_to_end_encryption": true
  }'
```

### Toggle Incognito Mode
```bash
curl -X POST http://localhost:4706/api/privacy/incognito \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: tenant-123" \
  -H "x-user-id: user-456" \
  -d '{"enabled": true, "duration_minutes": 60}'
```

### Export All Data
```bash
curl -X POST http://localhost:4706/api/privacy/export \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: tenant-123" \
  -H "x-user-id: user-456" \
  -d '{
    "format": "json",
    "include_memories": true,
    "include_settings": true,
    "include_audit_log": true
  }'
```

## Privacy Zones

Available privacy zones for sensitive data protection:

- `banking` - Financial transactions and banking data
- `health` - Medical and health records
- `passwords` - Credentials and secrets
- `personal` - Personal conversations
- `work` - Work-related data
- `family` - Family information
- `social` - Social interactions
- `finance` - Financial overview
- `medical` - Medical history
- `legal` - Legal documents

## Security Features

- Helmet.js security headers
- CORS configuration
- Rate limiting (100 requests/15min standard, 20/15min strict)
- Tenant isolation
- Input validation with Zod
- Audit logging

## Port Configuration

Default port: **4706**

Set via `PORT` environment variable.
