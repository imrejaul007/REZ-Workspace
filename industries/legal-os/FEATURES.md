# Legal OS - Features

**Status:** ✅ BUILT | **Port:** 5050 | **Updated:** June 14, 2026

---

## Digital Twins

### Case Twin
- Case lifecycle tracking
- Timeline management
- Deadline tracking
- Document linkage
- Status management
- Party tracking

### Client Twin
- Client profiles
- Matter management
- Billing history
- Communication log
- Document vault
- Portal access

### Document Twin
- Version control
- E-signature integration
- Template library
- OCR processing
- Metadata tagging
- Retention policies

### Contract Twin
- Clause library
- Obligation tracking
- Renewal alerts
- Counterparty management
- Compliance mapping

### Court Twin
- Docket tracking
- Filing deadlines
- Hearing schedules
- Judge preferences
- Court rules

---

## AI Agents

### CaseResearch Agent
- Precedent search
- Case law analysis
- Citation verification
- Issue spotting

### DocumentDraft Agent
- Contract generation
- Brief writing
- Motion drafting
- Clause suggestions

### Billing Agent
- Time tracking
- Invoice generation
- Expense management
- Trust accounting

### Compliance Agent
- Regulatory monitoring
- Deadline reminders
- Filing alerts
- Audit support

### CourtRemind Agent
- Hearing reminders
- Deadline alerts
- Filing notifications
- Status updates

---

## API Endpoints

### Core
- `GET /health` - Health check
- `GET /api/twins` - List all twins
- `GET /api/agents` - List all agents

### Cases
- `POST /api/cases` - Open case
- `GET /api/cases/:id` - Get case
- `PUT /api/cases/:id` - Update case
- `GET /api/cases/:id/timeline` - Case timeline
- `GET /api/cases/status/:status` - Filter by status

### Clients
- `POST /api/clients` - Add client
- `GET /api/clients/:id` - Get client
- `PUT /api/clients/:id` - Update client
- `GET /api/clients/:id/cases` - Client cases

### Documents
- `POST /api/documents` - Upload document
- `GET /api/documents/:id` - Get document
- `PUT /api/documents/:id` - Update document
- `GET /api/documents/case/:caseId` - Case documents

### Contracts
- `POST /api/contracts` - Create contract
- `GET /api/contracts/:id` - Get contract
- `PUT /api/contracts/:id` - Update contract
- `GET /api/contracts/expiring` - Expiring contracts

---

## Integrations

| Service | Integration Type | Purpose |
|---------|-----------------|---------|
| RTMN Hub | HTTP | Central orchestration |
| AgentOS | HTTP | Agent invocation |
| Memory OS | Storage | Document storage |
| Government OS | Event | Court data |
| RABTUL | Payment | Billing |

---

## Quick Start

```bash
cd industries/legal-os
npm install
node src/index.js
# Runs on http://localhost:5050
```
