# TRIPMIND - Developer Guide

## Project Context

TRIPMIND is part of the HOJAI AI Industry AI ecosystem. It's an AI-powered travel and tourism operating system.

**Parent:** HOJAI AI (`/hojai-ai/`)
**Category:** Industry AI
**Industry:** Travel & Tourism

## Key Files

| File | Purpose |
|------|---------|
| `SOT.md` | Complete technical specification |
| `PRODUCT.md` | Product overview and requirements |
| `src/index.ts` | Main Express server (TO BE BUILT) |

## Architecture

```
TRIPMIND
├── employees/           # AI Agent implementations (TO BE BUILT)
│   ├── travel-planner/
│   ├── concierge-agent/
│   ├── visa-assistant/
│   └── airport-assistant/
├── workers/            # AI Worker implementations (TO BE BUILT)
│   ├── booking-worker/
│   ├── itinerary-worker/
│   └── report-worker/
├── voice-agents/       # Voice agents (TO BE BUILT)
│   ├── phone-receptionist/
│   ├── whatsapp-ai/
│   └── ivr-system/
├── services/           # Backend services
│   └── travel-service/
└── src/
    └── index.ts        # Main entry point (TO BE BUILT)
```

## AI Employees

1. **Travel Planner AI** - Itinerary creation, planning
2. **Concierge Agent AI** - Booking assistance, support
3. **Visa Assistant AI** - Visa guidance, processing
4. **Airport Assistant AI** - Airport services, support

## AI Workers

1. **Booking Worker** - Booking management
2. **Itinerary Worker** - Itinerary management
3. **Report Worker** - Travel reporting

## Voice Agents

1. **Phone Receptionist** - Answer calls 24/7
2. **WhatsApp AI** - Voice/text conversations
3. **IVR System** - Auto-attendant

## Port

**Main Service:** TBD
**Voice Agents:** 4850-4860

## Commands

```bash
npm install
npm run build
npm start
```

## Environment Variables

```bash
PORT=4809
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
HOJAI_CORE_URL=http://localhost:4100
MERCHANT_OS_URL=http://localhost:4000
VOICE_PROVIDER=twilio
```

## API Base URL

```
http://localhost:4809
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
- [ ] Employee folders (empty)
- [x] Service folders
- [ ] src/index.ts - Main server (TODO)
- [ ] AI employee implementations
- [ ] AI worker implementations
- [ ] Voice agent implementations
- [ ] CLAUDE.md (this file)
