# Construction OS - Features

**Status:** ✅ BUILT | **Port:** 5210 | **Updated:** June 14, 2026

---

## Digital Twins

### Project Twin
- Project timeline
- Budget tracking
- Scope management
- Change orders
- Risk register

### Contractor Twin
- Vendor registry
- Credentials tracking
- Performance ratings
- Insurance verification
- Payment history

### Worker Twin
- Skills inventory
- Certification tracking
- Safety training
- Hours logging
- Productivity metrics

### Material Twin
- Material catalog
- Delivery tracking
- Inventory management
- Cost tracking
- Waste logging

---

## AI Agents

### ProjectMgmt Agent
- Timeline tracking
- Milestone management
- Resource forecasting
- Change order processing
- Status reporting

### SafetyInsp Agent
- Compliance checking
- Incident reporting
- Training verification
- Audit preparation
- Risk assessment

### ResourceAlloc Agent
- Crew scheduling
- Equipment allocation
- Skill matching
- Utilization optimization
- Overtime management

### ProgressTrack Agent
- Milestone tracking
- Percentage completion
- Delay detection
- Visual documentation
- Client updates

### CostEst Agent
- Quantity takeoff
- Cost estimation
- Markup calculation
- Bid preparation
- Variance analysis

---

## API Endpoints

### Core
- `GET /health` - Health check
- `GET /api/twins` - List all twins
- `GET /api/agents` - List all agents

### Projects
- `POST /api/projects` - Create project
- `GET /api/projects/:id` - Get project
- `PUT /api/projects/:id/milestone` - Update milestone

### Contractors
- `GET /api/contractors` - List contractors
- `GET /api/contractors/:id` - Get contractor
- `PUT /api/contractors/:id/rating` - Update rating

### Workers
- `GET /api/workers` - List workers
- `GET /api/workers/:id` - Get worker
- `PUT /api/workers/:id/hours` - Log hours

### Materials
- `GET /api/materials` - List materials
- `POST /api/materials/delivery` - Log delivery

---

## Integrations

| Service | Integration Type | Purpose |
|---------|-----------------|---------|
| RTMN Hub | HTTP | Central orchestration |
| AgentOS | HTTP | Agent invocation |
| RealEstate OS | Event | Property data |
| Manufacturing OS | Event | Materials |

---

## Quick Start

```bash
cd industries/construction-os
npm install
node src/index.js
# Runs on http://localhost:5210
```