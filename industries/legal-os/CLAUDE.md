# Legal OS - Legal Services Platform

**Status:** ✅ BUILT - June 14, 2026  
**Port:** 5050  
**Location:** `industries/legal-os/`

## Overview

Legal OS provides a comprehensive platform for law firms and legal departments, connecting cases, clients, documents, contracts, and court proceedings with AI-powered legal research and automation.

## Digital Twins

| Twin | Description | Capabilities |
|------|-------------|--------------|
| **Case Twin** | Case management, timeline | Status tracking, deadlines |
| **Client Twin** | Client profiles, billing | Matter management |
| **Document Twin** | Document storage, version | E-signature, templates |
| **Contract Twin** | Contract lifecycle | Clause library, alerts |
| **Court Twin** | Court schedules, filings | Calendar sync, reminders |

## AI Agents

| Agent | Purpose |
|-------|---------|
| **CaseResearch Agent** | Precedent search, analysis |
| **DocumentDraft Agent** | Contract, brief generation |
| **Billing Agent** | Time tracking, invoicing |
| **Compliance Agent** | Regulatory monitoring |
| **CourtRemind Agent** | Deadline, hearing alerts |

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `GET /health` | - | Health check |
| `GET /api/twins` | GET | List all twins |
| `GET /api/twins/case/:id` | GET | Get case twin |
| `GET /api/twins/client/:id` | GET | Get client twin |
| `GET /api/twins/document/:id` | GET | Get document twin |
| `GET /api/agents` | GET | List all agents |
| `POST /api/cases` | POST | Open case |
| `GET /api/cases/:id` | GET | Get case |
| `POST /api/clients` | POST | Add client |
| `GET /api/clients/:id` | GET | Get client |
| `POST /api/documents` | POST | Upload document |
| `POST /api/contracts` | POST | Create contract |

## Quick Start

```bash
cd industries/legal-os && npm install && node src/index.js

# Health check
curl http://localhost:5050/health

# Add client
curl -X POST http://localhost:5050/api/clients \
  -H "Content-Type: application/json" \
  -d '{"name": "Acme Corp", "type": "corporate", "contacts": {...}}'

# Open case
curl -X POST http://localhost:5050/api/cases \
  -H "Content-Type: application/json" \
  -d '{"clientId": "client_123", "type": "litigation", "description": "Contract dispute"}'
```

## Integration

- Connected to RTMN Hub at `http://localhost:8000`
- Legal Agent available via AgentOS
- Document storage via Memory OS
- Court calendar integration
