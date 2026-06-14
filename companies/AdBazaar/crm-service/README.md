# CRM Service

Customer relationship management service for AdBazaar.

## Features

- Contact management
- Company management
- Deal/pipeline tracking
- Activity logging and timeline
- Lead management
- Task and note management

## Port

**5033**

## API Endpoints

### Contacts
- `POST /api/contacts` - Create contact
- `GET /api/contacts` - List contacts
- `GET /api/contacts/:id` - Get contact details
- `PUT /api/contacts/:id` - Update contact
- `DELETE /api/contacts/:id` - Delete contact
- `GET /api/contacts/:id/timeline` - Get contact timeline
- `POST /api/contacts/:id/activities` - Add activity to contact

### Companies
- `POST /api/companies` - Create company
- `GET /api/companies` - List companies
- `GET /api/companies/:id` - Get company details
- `PUT /api/companies/:id` - Update company
- `DELETE /api/companies/:id` - Delete company

### Deals
- `POST /api/deals` - Create deal
- `GET /api/deals` - List deals
- `GET /api/deals/:id` - Get deal details
- `PUT /api/deals/:id` - Update deal
- `DELETE /api/deals/:id` - Delete deal
- `POST /api/deals/:id/stage` - Move deal to next stage

### Activities
- `POST /api/activities` - Create activity
- `GET /api/activities` - List activities
- `GET /api/activities/:id` - Get activity details

## Models

### Contact
- contactId: string
- advertiserId: string
- firstName: string
- lastName: string
- email: string
- phone: string
- companyId: string
- status: lead | prospect | customer | churned
- source: string
- tags: string[]
- metadata: object

### Company
- companyId: string
- advertiserId: string
- name: string
- industry: string
- website: string
- size: string
- revenue: number
- status: active | inactive

### Deal
- dealId: string
- advertiserId: string
- contactId: string
- companyId: string
- title: string
- value: number
- stage: lead | qualified | proposal | negotiation | closed_won | closed_lost
- probability: number
- expectedCloseDate: Date
- metadata: object

### Activity
- activityId: string
- contactId: string
- companyId: string
- dealId: string
- type: call | email | meeting | note | task
- subject: string
- description: string
- userId: string
- metadata: object

## Quick Start

```bash
cd crm-service
npm install
npm run dev
```

## Health Check

```bash
curl http://localhost:5033/health
```

## Environment Variables

```
PORT=5033
MONGODB_URI=mongodb://localhost:27017/crm
INTERNAL_SERVICE_TOKEN=your-token
```