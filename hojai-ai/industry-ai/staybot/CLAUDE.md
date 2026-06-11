# STAYBOT - Developer Guide

## Project Context

STAYBOT is part of the HOJAI AI Industry AI ecosystem. It's an AI-powered hotel operating system.

**Parent:** HOJAI AI (`/hojai-ai/`)
**Category:** Industry AI
**Industry:** Hotel

## Key Files

| File | Purpose |
|------|---------|
| `SOT.md` | Complete technical specification |
| `PRODUCT.md` | Product overview and requirements |
| `src/index.ts` | Main Express server (IMPLEMENTED) |

## Architecture

```
STAYBOT
├── employees/           # AI Agent implementations (TO BE BUILT)
│   ├── front-desk-ai/
│   ├── concierge-ai/
│   ├── revenue-manager-ai/
│   └── bellhop-ai/
├── workers/            # AI Worker implementations (TO BE BUILT)
│   ├── housekeeping-worker/
│   ├── valet-worker/
│   ├── billing-worker/
│   └── report-worker/
├── voice-agents/       # Voice agents (TO BE BUILT)
│   ├── phone-receptionist/
│   ├── whatsapp-ai/
│   └── ivr-system/
├── services/           # Backend services (TO BE BUILT)
│   ├── pms-service/
│   ├── channel-manager/
│   ├── housekeeping-service/
│   └── billing-service/
└── src/
    └── index.ts        # Main entry point (IMPLEMENTED)
```

## AI Employees

1. **Front Desk AI** - Check-in/out, guest services (IMPLEMENTED)
2. **Concierge AI** - Recommendations, bookings (IMPLEMENTED)
3. **Revenue Manager AI** - Pricing, occupancy optimization (IMPLEMENTED)
4. **Bellhop AI** - Room service, requests (IMPLEMENTED)

## AI Workers

1. **Housekeeping Worker** - Room cleaning, maintenance (IMPLEMENTED)
2. **Valet Worker** - Parking management (TODO)
3. **Billing Worker** - Invoice generation, payments (TODO)
4. **Report Worker** - Daily/weekly/monthly reports (TODO)

## Voice Agents

1. **Phone Receptionist** - Answer calls 24/7 (TODO)
2. **WhatsApp AI** - Voice/text conversations (TODO)
3. **IVR System** - Auto-attendant (TODO)

## Port

**Main Service:** 4101
**Voice Agents:** 4850-4860

## Commands

```bash
npm install
npm run build
npm start
```

## Environment Variables

```bash
PORT=4101
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
HOJAI_CORE_URL=http://localhost:4100
MERCHANT_OS_URL=http://localhost:4000
VOICE_PROVIDER=twilio
```

## API Base URL

```
http://localhost:4101
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

## Current Implementation

The `src/index.ts` is already implemented with:
- Guest management (check-in/check-out)
- Room service ordering
- Housekeeping requests
- Revenue dashboard
- Complaint analysis

## Status

- [x] SOT.md created
- [x] Product folder structure created
- [x] src/index.ts - Main server (IMPLEMENTED)
- [ ] Employee folders with implementations
- [ ] Worker implementations (partial)
- [ ] Voice agent implementations
- [ ] Service implementations
- [ ] CLAUDE.md (this file)
