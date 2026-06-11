# WAITRON - Developer Guide

## Project Context

WAITRON is part of the HOJAI AI Industry AI ecosystem. It's an AI-powered restaurant operating system.

**Parent:** HOJAI AI (`/hojai-ai/`)
**Category:** Industry AI
**Industry:** Restaurant

## Key Files

| File | Purpose |
|------|---------|
| `SOT.md` | Complete technical specification |
| `PRODUCT.md` | Product overview and requirements |
| `src/index.ts` | Main Express server (TO BE BUILT) |

## Architecture

```
WAITRON
├── employees/           # AI Agent implementations (TO BE BUILT)
│   ├── ai-waiter/
│   ├── catering-manager/
│   ├── kitchen-manager/
│   └── reservation-manager/
├── workers/            # AI Worker implementations (TO BE BUILT)
│   ├── order-worker/
│   ├── kds-worker/
│   ├── inventory-worker/
│   └── report-worker/
├── voice-agents/       # Voice agents (TO BE BUILT)
│   ├── phone-receptionist/
│   ├── whatsapp-ai/
│   └── ivr-system/
├── services/           # Backend services (TO BE BUILT)
│   ├── pos-service/
│   ├── menu-service/
│   ├── kds-service/
│   └── inventory-service/
└── src/
    └── index.ts        # Main entry point (TO BE BUILT)
```

## AI Employees

1. **AI Waiter** - Take orders, answer questions
2. **Catering Manager AI** - Event orders, bulk bookings
3. **Kitchen Manager AI** - Order coordination, quality control
4. **Reservation Manager AI** - Table bookings, seating

## AI Workers

1. **Order Worker** - Order tracking, fulfillment
2. **KDS Worker** - Kitchen display system
3. **Inventory Worker** - Stock tracking, alerts
4. **Report Worker** - Daily/weekly/monthly reports

## Voice Agents

1. **Phone Receptionist** - Answer calls 24/7
2. **WhatsApp AI** - Voice/text conversations
3. **IVR System** - Auto-attendant

## Port

**Main Service:** 4820
**Voice Agents:** 4850-4860

## Commands

```bash
npm install
npm run build
npm start
```

## Environment Variables

```bash
PORT=4820
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
HOJAI_CORE_URL=http://localhost:4100
MERCHANT_OS_URL=http://localhost:4000
VOICE_PROVIDER=twilio
```

## API Base URL

```
http://localhost:4820
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
- [ ] Employee folders (TODO)
- [ ] Service folders (TODO)
- [ ] src/index.ts - Main server (TODO)
- [ ] AI employee implementations
- [ ] AI worker implementations
- [ ] Voice agent implementations
- [ ] CLAUDE.md (this file)
