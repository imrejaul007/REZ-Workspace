# Influencer Contract Service

**Port:** 5067

## Overview
Handle contracts, NDAs, and agreements for influencer collaborations.

## Features
- Contract creation and management
- Digital signature tracking
- Contract status workflow
- Document management
- Negotiation history

## Models

### Contract
Main contract entity with terms, deliverables, and compensation.

### Signature
Digital signature records with verification.

### ContractDocument
Supporting documents attached to contracts.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/contracts | Create contract |
| GET | /api/contracts | List contracts |
| GET | /api/contracts/:id | Get contract |
| PUT | /api/contracts/:id | Update contract |
| POST | /api/contracts/:id/sign | Sign contract |
| GET | /api/contracts/:id/status | Get status |
| POST | /api/contracts/:id/send | Send contract |
| POST | /api/contracts/:id/changes | Request changes |
| POST | /api/contracts/:id/terminate | Terminate |
| GET | /api/contracts/:id/documents | Get documents |
| DELETE | /api/contracts/:id | Delete contract |

## Quick Start

```bash
cd /Users/rejaulkarim/Documents/ReZ\ Full\ App/AdBazaar/influencer-contract-service
npm install
npm run dev
```

## Health Check

```bash
curl http://localhost:5067/health
```
