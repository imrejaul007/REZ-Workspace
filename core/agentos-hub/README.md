# AgentOS Hub

Central registry for all 121+ AI agents across 24 industries in the RTMN Industry OS ecosystem.

## Overview

AgentOS Hub provides a unified registry of all AI agents, enabling:
- **Agent Discovery** - Find agents by industry, role, or capability
- **Agent Catalog** - Browse all available agents with descriptions
- **Orchestration** - Coordinate multiple agents for complex tasks
- **Metrics** - Track agent usage and performance

## Agent Distribution

| Industry | Agent Count | Example Agents |
|----------|------------|----------------|
| Legal | 5 | Case Research, Document Draft, Billing, Compliance, Client Intake |
| Healthcare | 5 | Patient Intake, Medical Coding, Claims, Scheduling, Prior Auth |
| Finance | 5 | Bookkeeping, Invoicing, Tax, Payroll, Expense |
| Retail | 5 | Inventory, POS, Upsell, Customer Support, Loyalty |
| Education | 5 | Enrollment, Grading, Attendance, Scheduling, Advising |
| Manufacturing | 5 | Production, Quality, Maintenance, Supply Chain, Inventory |
| Real Estate | 5 | Lead Gen, Listing, Showing, Transaction, Tenant |
| Travel | 5 | Booking, Itinerary, Support, Loyalty, Expense |
| Restaurant | 5 | Reservation, Ordering, Inventory, Scheduling, Marketing |
| Fitness | 5 | Member Onboarding, Training, Class Booking, Billing, Engagement |
| Automotive | 5 | Service Advisor, Parts, CRM, Financing, Recall |
| Entertainment | 5 | Booking, Ticketing, Marketing, Analytics, Catering |
| Gaming | 5 | Player Support, Moderation, Matchmaking, Monetization, Analytics |
| Agriculture | 5 | Crop Management, Equipment, Weather, Livestock, Market |
| Construction | 5 | Project Management, Scheduling, Safety, Subcontractor, RFP |
| Beauty | 5 | Booking, Consultation, Inventory, Marketing, Retail |
| Fashion | 5 | Design, Production, Merchandising, Trend, Sourcing |
| Sports | 5 | Ticket Sales, Fan Engagement, Operations, Analytics, Sponsorship |
| Government | 5 | Citizen Service, Permit, Compliance, Records, Licensing |
| Home Services | 5 | Scheduling, Dispatch, Quoting, Customer Support, Inventory |
| Professional | 5 | Project, Resource, Billing, Proposal, Knowledge |
| Non-Profit | 5 | Donor, Fundraising, Volunteer, Grant, Impact |
| Media | 5 | Content, Audience, Advertising, Subscription, Social |
| Energy | 5 | Metering, Billing, Grid, Renewable, Efficiency |

**Total: 121+ agents across 24 industries**

## Quick Start

```bash
cd core/agentos-hub
npm install
npm start
```

## API Endpoints

### Health & Stats
```
GET /health                    - Health check
GET /stats                     - Overall statistics
GET /catalog                   - Full agent catalog
```

### Agents
```
GET /agents                     - List all agents
GET /agents/:id                 - Get specific agent
GET /agents/role/:role          - Get agents by role
GET /agents/search/:query       - Search agents
```

### Industry Agents
```
GET /industries                  - List all industry agents
GET /industries/:industry        - Get agents for industry
GET /industries/:industry/roles  - Get agent roles in industry
POST /industries/compare         - Compare agents across industries
```

### Orchestration
```
POST /orchestrate                - Execute multi-agent orchestration
```

## Example Responses

### Get All Agents
```json
{
  "agents": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 121,
    "pages": 3
  }
}
```

### Get Industry Agents
```json
{
  "industry": "legal",
  "agents": [
    {
      "id": "uuid",
      "role": "case-research",
      "name": "Case Research Agent",
      "description": "Searches case law...",
      "capabilities": ["case_search", "precedent_analysis"],
      "tools": ["case_database", "legal_search"]
    }
  ],
  "count": 5
}
```

## Architecture

```
agentos-hub/
├── src/
│   ├── index.js              # Main entry
│   ├── services/
│   │   ├── agentRegistry.js  # Agent registry (121+ agents)
│   │   ├── agentOrchestrator.js # Orchestration
│   │   └── agentMetrics.js   # Metrics
│   └── routes/
│       ├── agents.js         # Agent routes
│       └── industryAgents.js # Industry routes
├── package.json
└── README.md
```

## License

MIT
