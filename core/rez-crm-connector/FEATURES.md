# 🔗 REZ CRM Connector - Features

**Service:** REZ CRM Connector  
**Location:** `core/rez-crm-connector/`  
**Status:** ✅ PRODUCTION READY

---

## Core Features

### 1. Multi-CRM Integration
- [x] HubSpot integration
- [x] Salesforce integration
- [x] Zoho integration
- [x] Unified API
- [x] Adapter pattern

### 2. Contact Management
- [x] Unified contact records
- [x] Contact sync
- [x] Duplicate detection
- [x] Merge functionality
- [x] Import/Export

### 3. Deal Tracking
- [x] Cross-CRM deals
- [x] Deal stages
- [x] Pipeline view
- [x] Deal history
- [x] Activity logging

### 4. Real-time Sync
- [x] Kafka-based sync
- [x] Event-driven
- [x] Bi-directional sync
- [x] Conflict resolution
- [x] Retry logic

### 5. Company Management
- [x] Company profiles
- [x] Company contacts
- [x] Company deals
- [x] Company activities

---

## Supported CRMs

| CRM | Status | Features |
|-----|--------|----------|
| HubSpot | ✅ | Contacts, Deals, Companies, Tasks |
| Salesforce | ✅ | Contacts, Accounts, Opportunities, Tasks |
| Zoho | ✅ | Contacts, Deals, Accounts, Tasks |

---

## API Features

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/contacts` | GET | List all contacts |
| `/contacts` | POST | Create contact |
| `/contacts/:id` | GET | Get contact |
| `/contacts/:id` | PUT | Update contact |
| `/deals` | GET | List all deals |
| `/deals` | POST | Create deal |
| `/sync/:crm` | POST | Sync with specific CRM |
| `/sync/status` | GET | Get sync status |
| `/companies` | GET | List companies |
| `/companies` | POST | Create company |

---

## Kafka Topics

| Topic | Description |
|-------|-------------|
| `crm.contact.created` | Contact created |
| `crm.contact.updated` | Contact updated |
| `crm.deal.created` | Deal created |
| `crm.deal.stage_changed` | Deal stage changed |
| `crm.sync.complete` | Sync completed |

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
| winston | Logging |

---

## Related Services

| Service | Description |
|---------|-------------|
| AgentOS Hub | Agent-based CRM tasks |
| TwinOS Hub | Digital twin management |
| HOJAI Intelligence | CRM analytics |

---

**Documentation:** [CLAUDE.md](./CLAUDE.md)
