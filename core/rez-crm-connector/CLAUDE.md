# 🔗 REZ CRM Connector

## Overview

**Service Name:** REZ CRM Connector  
**Version:** 1.0.0  
**Location:** `core/rez-crm-connector/`  
**Purpose:** Unified CRM integration for RTNM Industry OS (HubSpot, Salesforce, Zoho)

**Status:** ✅ PRODUCTION READY  
**Last Updated:** June 13, 2026

---

## Quick Start

```bash
cd core/rez-crm-connector
npm install
npm start
```

---

## Features

| Feature | Description | Status |
|---------|-------------|--------|
| HubSpot Integration | Full HubSpot CRM sync | ✅ |
| Salesforce Integration | Salesforce CRM connector | ✅ |
| Zoho Integration | Zoho CRM connector | ✅ |
| Unified API | Single API for all CRMs | ✅ |
| Real-time Sync | Kafka-based sync | ✅ |
| Contact Management | Unified contact records | ✅ |
| Deal Tracking | Cross-CRM deal management | ✅ |

---

## Supported CRMs

| CRM | Status | Features |
|-----|--------|----------|
| HubSpot | ✅ | Contacts, Deals, Companies |
| Salesforce | ✅ | Contacts, Accounts, Opportunities |
| Zoho | ✅ | Contacts, Deals, Accounts |

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/contacts` | List all contacts |
| POST | `/contacts` | Create contact |
| GET | `/contacts/:id` | Get contact |
| PUT | `/contacts/:id` | Update contact |
| GET | `/deals` | List all deals |
| POST | `/deals` | Create deal |
| POST | `/sync/:crm` | Sync with specific CRM |
| GET | `/sync/status` | Get sync status |

---

## Architecture

```
REZ CRM Connector
├── HubSpot Adapter
├── Salesforce Adapter
├── Zoho Adapter
├── Unified API
├── Kafka Sync
└── MongoDB Storage
```

---

## Configuration

| Variable | Description |
|----------|-------------|
| `HUBSPOT_API_KEY` | HubSpot API key |
| `SALESFORCE_*` | Salesforce credentials |
| `ZOHO_*` | Zoho credentials |
| `KAFKA_BROKERS` | Kafka broker URLs |
| `MONGODB_URI` | MongoDB connection |

---

## Dependencies

| Package | Purpose |
|---------|---------|
| express | Web framework |
| mongoose | MongoDB ODM |
| hubspot | HubSpot SDK |
| @salesforce/client | Salesforce SDK |
| zoho-crm | Zoho SDK |
| kafkajs | Kafka client |
| helmet | Security |
| redis | Caching |

---

## Related Documentation

- [HOJAI AI CLAUDE.md](../../companies/hojai-ai/CLAUDE.md)
- [RTNM-COMPANIES-AUDIT.md](../../RTNM-COMPANIES-AUDIT.md)

---

**Built with ❤️ by RTNM**
