# Manufacturing OS - Features

**Status:** ✅ BUILT | **Port:** 5150 | **Updated:** June 14, 2026

---

## Digital Twins

### Product Twin
- BOM management
- Specifications
- Quality standards
- Version control
- Cost breakdown

### Machine Twin
- Equipment registry
- OEE tracking
- Maintenance schedule
- Downtime logging
- Calibration records

### Production Twin
- Work order tracking
- Line scheduling
- Output tracking
- Yield analytics
- Shift management

### Inventory Twin
- Raw materials
- Work-in-progress
- Finished goods
- Safety stock
- Shelf life tracking

---

## AI Agents

### ProductionSched Agent
- Schedule optimization
- Resource allocation
- Bottleneck identification
- Changeover planning

### QualityCtrl Agent
- Defect detection
- SPC monitoring
- Root cause analysis
- Audit support

### MaintenancePred Agent
- Failure prediction
- Maintenance scheduling
- Parts forecasting
- Cost optimization

### SupplyChain Agent
- Supplier management
- Lead time tracking
- Risk monitoring
- Order automation

### SafetyInsp Agent
- Compliance checking
- Incident tracking
- Training verification
- Audit preparation

---

## API Endpoints

### Core
- `GET /health` - Health check
- `GET /api/twins` - List all twins
- `GET /api/agents` - List all agents

### Products
- `POST /api/products` - Add product
- `GET /api/products/:id` - Get product
- `GET /api/products/:id/bom` - Bill of materials

### Machines
- `GET /api/machines` - List machines
- `GET /api/machines/:id` - Get machine
- `PUT /api/machines/:id/status` - Update status

### Production
- `POST /api/production` - Create work order
- `GET /api/production/:id` - Get work order
- `PUT /api/production/:id/complete` - Mark complete

---

## Integrations

| Service | Integration Type | Purpose |
|---------|-----------------|---------|
| RTMN Hub | HTTP | Central orchestration |
| AgentOS | HTTP | Agent invocation |
| Retail OS | Event | Supply chain |
| BOA | Event | Analytics |

---

## Quick Start

```bash
cd industries/manufacturing-os
npm install
node src/index.js
# Runs on http://localhost:5150
```