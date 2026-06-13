# REZ CRM Connector

Unified CRM integration module for RTMN Industry OS ecosystem.

## Overview

REZ CRM Connector provides a single API layer to connect all 24 industries with their respective CRM systems. It supports:

- **HubSpot** - Hotels, Real Estate, Professional Services
- **Zoho** - Small businesses, startups
- **Salesforce** - Enterprise, Government, Non-Profits
- **Industry-specific CRMs** - Epic, Cerner, Toast, Square, SAP, etc.

## Quick Start

```bash
# Install dependencies
cd core/rez-crm-connector
npm install

# Run locally
npm start

# Or with Docker
docker build -t rtmn/rez-crm-connector .
docker run -p 3090:3090 \
  -e CRM_PROVIDER=hubspot \
  -e HUBSPOT_API_KEY=your_api_key \
  -e MONGODB_URI=mongodb://localhost:27017/rez_crm \
  rtmn/rez-crm-connector
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `CRM_PROVIDER` | CRM type (hubspot, zoho, salesforce, etc.) | Yes |
| `PORT` | Server port (default: 3090) | No |
| `MONGODB_URI` | MongoDB connection string | Yes |
| `HUBSPOT_API_KEY` | HubSpot API key | If using HubSpot |
| `ZOHO_CLIENT_ID` | Zoho client ID | If using Zoho |
| `ZOHO_CLIENT_SECRET` | Zoho client secret | If using Zoho |
| `ZOHO_REFRESH_TOKEN` | Zoho refresh token | If using Zoho |
| `SALESFORCE_CLIENT_ID` | Salesforce client ID | If using Salesforce |
| `SALESFORCE_CLIENT_SECRET` | Salesforce client secret | If using Salesforce |

## API Endpoints

### Health Check
```
GET /health
```

### Sync Operations
```
POST /api/crm/sync         - Trigger sync
GET  /api/crm/status      - Get sync status
POST /api/crm/search      - Search CRM data
```

### Contact CRUD
```
GET    /api/contacts       - List contacts
GET    /api/contacts/:id    - Get contact
POST   /api/contacts        - Create contact
PUT    /api/contacts/:id   - Update contact
DELETE /api/contacts/:id   - Delete contact
```

### Webhooks
```
POST /api/webhooks/crm     - Receive CRM events
```

## Supported CRM Providers

| Industry | Primary CRM | Secondary |
|----------|------------|-----------|
| Hotel | HubSpot | Opera PMS |
| Restaurant | Toast | Square |
| Retail | Shopify | WooCommerce, Magento |
| Healthcare | Epic | Cerner |
| Real Estate | HubSpot | Salesforce |
| Financial | Core Banking | SAP |
| Legal | Clio | Practice Mgmt |
| Travel | Amadeus | Sabre |
| Government | Salesforce Gov | - |
| Non-Profit | Salesforce NPO | - |
| Construction | Procore | Autodesk |
| Manufacturing | SAP | Oracle |
| Automotive | CDK | Reynolds |
| Home Services | Jobber | Housecall |

## Example Usage

### Create Contact
```bash
curl -X POST http://localhost:3090/api/contacts \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1-555-0123",
    "company": "Acme Corp"
  }'
```

### Sync with CRM
```bash
curl -X POST http://localhost:3090/api/crm/sync \
  -H "Content-Type: application/json" \
  -d '{
    "direction": "bidirectional",
    "entityTypes": ["contacts"]
  }'
```

### Search Contacts
```bash
curl "http://localhost:3090/api/crm/search?query=john"
```

## License

Proprietary - RTMN Technologies
