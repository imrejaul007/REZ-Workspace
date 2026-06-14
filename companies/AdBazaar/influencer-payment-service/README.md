# Influencer Payment Service

**Port:** 5068

## Overview
Process influencer payments, invoices, and manage payment workflows.

## Features
- Payment creation and processing
- Invoice generation
- Rate management
- Payment approval workflow
- Tax calculation (GST, TDS)

## Models

### Payment
Payment records with line items, tax, and status tracking.

### Invoice
Invoice documents with billing details.

### Rate
Influencer rate cards by platform and content type.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/payments | Create payment |
| GET | /api/payments/pending | List pending payments |
| GET | /api/payments/:id | Get payment |
| POST | /api/payments/:id/process | Process payment |
| POST | /api/payments/:id/approve | Approve payment |
| POST | /api/payments/:id/cancel | Cancel payment |
| POST | /api/payments/:id/refund | Refund payment |
| GET | /api/payments/:id/history | Influencer history |
| POST | /api/payments/:id/invoice | Create invoice |
| POST | /api/payments/calculate | Calculate amount |
| POST | /api/payments/rates | Set rate |
| GET | /api/payments/rates/:id | Get rates |

## Quick Start

```bash
cd /Users/rejaulkarim/Documents/ReZ\ Full\ App/AdBazaar/influencer-payment-service
npm install
npm run dev
```

## Health Check

```bash
curl http://localhost:5068/health
```