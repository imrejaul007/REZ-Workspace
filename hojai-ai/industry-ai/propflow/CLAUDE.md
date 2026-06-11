# PROPFLOW - Developer Guide

## Project Context

PROPFLOW is part of the HOJAI AI Industry AI ecosystem. It's an AI-powered real estate operating system.

**Parent:** HOJAI AI (`/hojai-ai/`)
**Category:** Industry AI
**Industry:** Real Estate

## Key Files

| File | Purpose |
|------|---------|
| `SOT.md` | Complete technical specification |
| `PRODUCT.md` | Product overview and requirements |
| `src/index.ts` | Main Express server (TO BE BUILT) |

## Architecture

```
PROPFLOW
├── employees/           # AI Agent implementations (TO BE BUILT)
│   ├── lead-qualifier/
│   ├── property-advisor/
│   ├── site-visit-coordinator/
│   └── negotiation-agent/
├── workers/            # AI Worker implementations (TO BE BUILT)
│   ├── lead-worker/
│   ├── property-worker/
│   └── report-worker/
├── voice-agents/       # Voice agents (TO BE BUILT)
│   ├── phone-receptionist/
│   └── whatsapp-ai/
├── services/           # Backend services
│   └── property-service/
└── src/
    └── index.ts        # Main entry point (TO BE BUILT)
```

## AI Employees

1. **Lead Qualifier AI** - Lead scoring, qualification
2. **Property Advisor AI** - Property recommendations, matching
3. **Site Visit Coordinator AI** - Visit scheduling, management
4. **Negotiation Agent AI** - Deal support, pricing

## AI Workers

1. **Lead Worker** - Lead management, nurturing
2. **Property Worker** - Property database management
3. **Report Worker** - Sales reporting

## Voice Agents

1. **Phone Receptionist** - Answer calls 24/7
2. **WhatsApp AI** - Voice/text conversations

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
PORT=4807
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
HOJAI_CORE_URL=http://localhost:4100
MERCHANT_OS_URL=http://localhost:4000
VOICE_PROVIDER=twilio
```

## API Base URL

```
http://localhost:4807
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
