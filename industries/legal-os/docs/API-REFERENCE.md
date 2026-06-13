# Legal OS API Reference

## Overview

Legal OS provides a comprehensive suite of APIs for law firm operations including client management, case management, document handling, and calendar management.

## Base URL

```
Production: https://legal-api.rtmn.io
Staging: http://localhost:3014
```

## Authentication

All API endpoints require JWT authentication.

```http
Authorization: Bearer <your_jwt_token>
```

## Client Twin Service

### Endpoints

#### Create Client
```
POST /api/clients
```

**Request Body:**
```json
{
  "name": "Acme Corporation",
  "type": "corporate",
  "email": "contact@acme.com",
  "phone": "+1-555-0123",
  "address": {
    "street": "123 Main St",
    "city": "San Francisco",
    "state": "CA",
    "zip": "94102",
    "country": "USA"
  },
  "company": "Acme Corporation",
  "industry": "Technology",
  "status": "prospect",
  "billingInfo": {
    "paymentTerms": "net30",
    "billingEmail": "billing@acme.com"
  }
}
```

#### Get Clients
```
GET /api/clients?status=active&limit=50&offset=0
```

#### Get Client by ID
```
GET /api/clients/:id
```

#### Update Client
```
PUT /api/clients/:id
```

#### Get Client Matters
```
GET /api/clients/:id/matters
```

#### Create Matter for Client
```
POST /api/clients/:id/matters
```

---

## Case Twin Service

### Endpoints

#### Create Case
```
POST /api/cases
```

**Request Body:**
```json
{
  "title": "Smith v. Acme - Breach of Contract",
  "caseNumber": "2024-CV-1234",
  "type": "litigation",
  "status": "intake",
  "priority": "high",
  "client": "client_id_here",
  "description": "Breach of contract dispute regarding software licensing agreement",
  "billingType": "hourly",
  "billingRate": 450,
  "budget": 50000
}
```

#### Get Cases
```
GET /api/cases?status=active&type=litigation&limit=50&offset=0
```

#### Get Case by ID
```
GET /api/cases/:id
```

#### Update Case
```
PUT /api/cases/:id
```

#### Add Milestone
```
POST /api/cases/:id/milestones
```

**Request Body:**
```json
{
  "title": "Discovery Deadline",
  "description": "Complete all discovery requests",
  "dueDate": "2024-06-15"
}
```

#### Add Time Entry
```
POST /api/cases/:id/time-entries
```

**Request Body:**
```json
{
  "hours": 2.5,
  "description": "Reviewed contract documents and prepared summary",
  "billingRate": 450
}
```

#### Get Case Documents
```
GET /api/cases/:id/documents
```

---

## Document Twin Service

### Endpoints

#### Create Document
```
POST /api/documents
```

**Request Body:**
```json
{
  "title": "Service Agreement - Final",
  "type": "contract",
  "case": "case_id_here",
  "tags": ["contract", "final", "2024"]
}
```

#### Get Documents
```
GET /api/documents?type=contract&caseId=xxx&limit=50&offset=0
```

#### Get Document by ID
```
GET /api/documents/:id
```

#### Download Document
```
GET /api/documents/:id/download
```

#### Update Document
```
PUT /api/documents/:id
```

#### Archive Document
```
POST /api/documents/:id/archive
```

#### Delete Document
```
DELETE /api/documents/:id
```

---

## Calendar Twin Service

### Endpoints

#### Create Event
```
POST /api/calendar
```

**Request Body:**
```json
{
  "title": "Client Meeting - Contract Review",
  "type": "meeting",
  "start": "2024-06-15T10:00:00Z",
  "end": "2024-06-15T11:30:00Z",
  "allDay": false,
  "case": "case_id_here",
  "location": "Conference Room A",
  "attendees": ["user_id_1", "user_id_2"],
  "reminders": [
    { "time": "2024-06-15T09:00:00Z", "type": "email" }
  ]
}
```

#### Get Events
```
GET /api/calendar?startDate=2024-06-01&endDate=2024-06-30&type=meeting
```

#### Get Event by ID
```
GET /api/calendar/:id
```

#### Update Event
```
PUT /api/calendar/:id
```

#### Add Reminder
```
POST /api/calendar/:id/reminders
```

#### Delete Event
```
DELETE /api/calendar/:id
```

---

## AI Agents

### Case Research Agent

**Endpoint:** `POST /agents/case-research`

#### Search Precedents
```json
{
  "action": "search_precedents",
  "query": "breach of contract software license",
  "filters": {
    "jurisdiction": "federal",
    "dateRange": { "start": "2020-01-01", "end": "2024-01-01" }
  }
}
```

#### Analyze Case
```json
{
  "action": "analyze_case",
  "query": { "caseId": "case_id_here" }
}
```

#### Generate Legal Memo
```json
{
  "action": "generate_legal_memo",
  "query": {
    "title": "Memorandum re: Breach of Contract Analysis",
    "subject": "Contract Dispute Analysis",
    "question": "Whether Acme Corporation materially breached the software license agreement",
    "facts": "Facts of the case...",
    "briefAnswer": "Yes, Acme materially breached...",
    "conclusion": "Based on the foregoing..."
  }
}
```

#### Find Similar Cases
```json
{
  "action": "find_similar_cases",
  "query": { "caseId": "case_id_here" },
  "filters": {
    "caseType": "litigation",
    "dateRange": { "start": "2019-01-01", "end": "2024-01-01" }
  }
}
```

---

### Document Draft Agent

**Endpoint:** `POST /agents/document-draft`

#### Generate Document
```json
{
  "action": "generate_document",
  "template": "contract",
  "data": {
    "title": "Service Agreement",
    "parties": {
      "party1": "ABC Law Firm",
      "party2": "Client Corporation"
    },
    "services": "Legal consultation and representation services",
    "compensation": "$10,000 per month",
    "startDate": "2024-07-01",
    "endDate": "2025-06-30",
    "jurisdiction": "California"
  },
  "caseId": "case_id_here"
}
```

#### Review Document
```json
{
  "action": "review_document",
  "documentId": "document_id_here"
}
```

#### Compare Versions
```json
{
  "action": "compare_versions",
  "v1": "version_1_id",
  "v2": "version_2_id"
}
```

---

### Billing Agent

**Endpoint:** `POST /agents/billing`

#### Generate Invoice
```json
{
  "action": "generate_invoice",
  "caseId": "case_id_here"
}
```

#### Get Time Entries
```json
{
  "action": "get_time_entries",
  "caseId": "case_id_here"
}
```

#### Calculate Fees
```json
{
  "action": "calculate_fees",
  "caseId": "case_id_here",
  "data": {
    "hours": 10,
    "rate": 450
  }
}
```

#### Get Billing Report
```json
{
  "action": "get_billing_report",
  "data": {
    "startDate": "2024-01-01",
    "endDate": "2024-06-30",
    "attorneyId": "attorney_id_here"
  }
}
```

---

### Compliance Agent

**Endpoint:** `POST /agents/compliance`

#### Check Compliance
```json
{
  "action": "check_compliance",
  "entityType": "corporation",
  "data": {
    "entityId": "entity_id_here",
    "beneficialOwners": ["owner_1", "owner_2"]
  }
}
```

#### Generate Compliance Report
```json
{
  "action": "generate_report",
  "data": {
    "entity": "Entity Name",
    "period": "2024"
  }
}
```

#### Identify Requirements
```json
{
  "action": "identify_requirements",
  "entityType": "corporation",
  "data": {
    "jurisdiction": "federal"
  }
}
```

---

## Response Formats

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2024-06-13T10:30:00Z"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request body",
    "details": [...]
  },
  "timestamp": "2024-06-13T10:30:00Z"
}
```

## Rate Limiting

- **API Endpoints:** 100 requests/minute
- **Agent Endpoints:** 20 requests/minute
- **File Upload:** 10 requests/minute

## Webhooks

Subscribe to events for real-time updates:

```json
{
  "event": "case.status_changed",
  "callback": "https://your-app.com/webhooks/legal",
  "secret": "your_webhook_secret"
}
```

## REZ CRM Integration

Connect with HubSpot or Zoho for client sync:

```bash
curl -X POST http://localhost:3090/api/crm/sync \
  -H "Authorization: Bearer <token>" \
  -d '{"provider": "hubspot", "direction": "bidirectional"}'
```
