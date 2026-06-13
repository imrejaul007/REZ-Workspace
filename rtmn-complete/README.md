# RTMN Complete

All-in-one RTMN platform with TwinOS, AgentOS, Business Copilot, and BOA.

## Quick Start

```bash
# 1. Start the backend (Node.js API)
cd rtmn-complete
npm install
npm start

# Backend runs on: http://localhost:3000

# 2. Start the UI (optional - Next.js)
cd rtmn-complete/src/app
npm install
npm run dev

# UI runs on: http://localhost:3001
```

## All-in-One Mode

The backend includes everything:

| Module | Description |
|--------|-------------|
| TwinOS Hub | 22 digital twins across 6 industries |
| AgentOS Hub | 5 AI agents |
| Business Copilot | 14 skills |
| BOA Engine | Executive intelligence |

## API Endpoints

### Health
```bash
curl http://localhost:3000/health
```

### Chat with Business Copilot
```bash
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What are my sales this week?", "industry": "retail"}'
```

### BOA Executive Query
```bash
curl -X POST http://localhost:3000/boa/query \
  -H "Content-Type: application/json" \
  -d '{"question": "Why did revenue drop?", "industry": "retail"}'
```

### Search Twins
```bash
curl -X POST http://localhost:3000/twins/search \
  -H "Content-Type: application/json" \
  -d '{"query": "sales", "industry": "retail"}'
```

### Get All Twins
```bash
curl http://localhost:3000/twins
```

### Get Skills
```bash
curl http://localhost:3000/skills/retail
```

## Demo Responses

The system works WITHOUT any external API keys:

- Retail: Sales, inventory, customer insights
- Restaurant: Orders, kitchen inventory, reservations
- Healthcare: Appointments, patient scheduling
- Finance: Invoices, payroll, accounting
- Manufacturing: Production, quality, machines
- Legal: Cases, documents, client management

## Environment Variables

```bash
PORT=3000  # Server port (default: 3000)
```

No other configuration needed - everything works out of the box!
