# Professional OS API Reference

## Overview

Professional OS provides digital twin services for consulting and professional services.

## Base URL

```
Staging: http://localhost:3111
Production: https://professional-api.rtmn.io
```

## Client Twin Service

### Create Client
```
POST /api/clients
```

**Request Body:**
```json
{
  "companyName": "Acme Corp",
  "contactPerson": {
    "name": "John CEO",
    "email": "john@acme.com",
    "phone": "+1-555-0123"
  },
  "industry": "Technology",
  "status": "prospect",
  "contractValue": 100000,
  "paymentTerms": "net30"
}
```

### Get Clients
```
GET /api/clients?status=active&limit=50&offset=0
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

### Project Manager Agent
**Endpoint:** `POST /agents/project-manager`

```json
{
  "action": "get_project_status",
  "projectId": "project_id"
}
```

### Proposal Generator Agent
**Endpoint:** `POST /agents/proposal`

```json
{
  "action": "generate_proposal",
  "clientId": "client_id",
  "scope": "Consulting services for digital transformation"
}
```

## REZ CRM Integration

Connect with HubSpot/Salesforce:

```bash
curl -X POST http://localhost:3095/api/crm/sync \
  -d '{"provider": "hubspot", "direction": "bidirectional"}'
```
