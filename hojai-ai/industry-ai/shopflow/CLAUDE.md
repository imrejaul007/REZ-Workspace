# SHOPFLOW - Developer Guide

## Project Context

SHOPFLOW is part of the HOJAI AI Industry AI ecosystem. It's an AI-powered retail operating system.

**Parent:** HOJAI AI (`/hojai-ai/`)
**Category:** Industry AI
**Industry:** Retail

## Key Files

| File | Purpose |
|------|---------|
| `SOT.md` | Complete technical specification |
| `PRODUCT.md` | Product overview and requirements |
| `src/index.ts` | Main Express server (TO BE BUILT) |

## Architecture

```
SHOPFLOW
├── employees/           # AI Agent implementations (TO BE BUILT)
│   ├── inventory-ai/
│   ├── merchandising-ai/
│   ├── customer-ai/
│   └── loyalty-ai/
├── workers/            # AI Worker implementations (TO BE BUILT)
│   ├── stock-worker/
│   ├── pricing-worker/
│   └── report-worker/
├── voice-agents/       # Voice agents (TO BE BUILT)
│   ├── phone-receptionist/
│   └── whatsapp-ai/
├── services/           # Backend services
│   ├── pos-service/
│   ├── inventory-service/
│   └── demand-forecast-service/
└── src/
    └── index.ts        # Main entry point (TO BE BUILT)
```

## AI Employees

1. **Inventory AI** - Stock management, reorder
2. **Merchandising AI** - Product placement, displays
3. **Customer AI** - Customer service, queries
4. **Loyalty AI** - Loyalty program management

## AI Workers

1. **Stock Worker** - Inventory tracking, reconciliation
2. **Pricing Worker** - Price management, markdowns
3. **Report Worker** - Daily/weekly/monthly reports

## Voice Agents

1. **Phone Receptionist** - Answer calls 24/7
2. **WhatsApp AI** - Voice/text conversations

## Port

**Main Service:** 4830
**Voice Agents:** 4850-4860

## Commands

```bash
npm install
npm run build
npm start
```

## Environment Variables

```bash
PORT=4830
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
HOJAI_CORE_URL=http://localhost:4100
MERCHANT_OS_URL=http://localhost:4000
VOICE_PROVIDER=twilio
```

## API Base URL

```
http://localhost:4830
```

## HOJAI Integration

All Industry AI products connect to:
- **HOJAI Core** (port 4100) - Intent Graph, Memory, Trust
- **Merchant OS** - Backend services

## Development Notes

- Use TypeScript for all new files
- Follow Express.js patterns from HOJAI Core
- Integrate with HOJAI Core for AI capabilities
- Add proper error handling and validation
- Include health check endpoints

## Status

- [x] SOT.md created
- [x] Product folder structure created
- [x] Employee folders (empty)
- [x] Service folders
- [ ] src/index.ts - Main server (TODO)
- [ ] AI employee implementations
- [ ] AI worker implementations
- [ ] Voice agent implementations
- [ ] CLAUDE.md (this file)
