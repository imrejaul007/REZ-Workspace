# NonProfit OS - Features

**Status:** ✅ BUILT | **Port:** 5160 | **Updated:** June 14, 2026

---

## Digital Twins

### Donor Twin
- Giving history
- Communication preferences
- Demographic data
- Engagement scoring
- Wealth indicators

### Campaign Twin
- Fundraising goals
- Progress tracking
- Donor attribution
- Multi-channel tracking
- ROI analysis

### Beneficiary Twin
- Program enrollment
- Impact metrics
- Demographics
- Service history
- Outcome tracking

### Volunteer Twin
- Skills inventory
- Availability
- Hours tracking
- Training records
- Performance ratings

---

## AI Agents

### Fundraising Agent
- Donor cultivation
- Ask amount optimization
- Appeal timing
- Challenge campaigns

### VolunteerMatch Agent
- Skill matching
- Schedule optimization
- Event assignment
- Recognition tracking

### ImpactReport Agent
- Metric aggregation
- Outcome analysis
- Report generation
- Donor updates

### DonorRel Agent
- Stewardship tracking
- Thank you sequences
- Recognition management
- Event invitations

### GrantWriter Agent
- Grant discovery
- Proposal drafting
- Budget templates
- Deadline tracking

---

## API Endpoints

### Core
- `GET /health` - Health check
- `GET /api/twins` - List all twins
- `GET /api/agents` - List all agents

### Donors
- `POST /api/donors` - Add donor
- `GET /api/donors/:id` - Get donor
- `GET /api/donors/:id/history` - Giving history

### Campaigns
- `POST /api/campaigns` - Create campaign
- `GET /api/campaigns/:id` - Get campaign
- `GET /api/campaigns/:id/progress` - Progress stats

### Volunteers
- `POST /api/volunteers` - Add volunteer
- `GET /api/volunteers/:id` - Get volunteer
- `PUT /api/volunteers/:id/hours` - Log hours

---

## Integrations

| Service | Integration Type | Purpose |
|---------|-----------------|---------|
| RTMN Hub | HTTP | Central orchestration |
| AgentOS | HTTP | Agent invocation |
| RABTUL | Payment | Donations |
| BOA | Event | Impact reporting |

---

## Quick Start

```bash
cd industries/nonprofit-os
npm install
node src/index.js
# Runs on http://localhost:5160
```