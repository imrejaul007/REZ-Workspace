# FITMIND - Developer Guide

## Project Context

FITMIND is part of the HOJAI AI Industry AI ecosystem. It's an AI-powered fitness center operating system.

**Parent:** HOJAI AI (`/hojai-ai/`)
**Category:** Industry AI
**Industry:** Fitness & Gym

## Key Files

| File | Purpose |
|------|---------|
| `SOT.md` | Complete technical specification |
| `PRODUCT.md` | Product overview and requirements |
| `README.md` | User-facing documentation |
| `src/index.ts` | Main Express server (TO BE BUILT) |

## Architecture

```
FITMIND
├── employees/           # AI Agent implementations
│   ├── fitness-coach/
│   ├── nutrition-advisor/
│   ├── membership-advisor/
│   └── retention-manager/
├── workers/            # AI Worker implementations (TO BE BUILT)
├── voice-agents/       # Voice agents (TO BE BUILT)
├── services/          # Backend services
│   ├── member-service/
│   ├── membership-plan-service/
│   ├── attendance-service/
│   └── class-scheduler/
└── src/
    └── index.ts        # Main entry point (TO BE BUILT)
```

## AI Employees

1. **Fitness Coach AI** - Workout plans, exercise guidance
2. **Nutrition Advisor AI** - Diet plans, meal suggestions
3. **Membership Advisor AI** - Plan recommendations, renewals
4. **Retention Manager AI** - Churn prediction, re-engagement

## AI Workers

1. **Attendance Worker** - Check-in tracking, analytics
2. **Class Scheduler Worker** - Class management, instructor coordination
3. **Compliance Worker** - Safety protocols, regulations
4. **Report Worker** - Daily/weekly/monthly reports

## Voice Agents

1. **Phone Receptionist** - Answer calls 24/7
2. **WhatsApp AI** - Voice/text conversations
3. **IVR System** - Auto-attendant

## Port

**Main Service:** 4801
**Voice Agents:** 4850-4860

## Commands

```bash
npm install
npm run build
npm start
```

## Environment Variables

```bash
PORT=4801
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
HOJAI_CORE_URL=http://localhost:4100
MERCHANT_OS_URL=http://localhost:4000
VOICE_PROVIDER=twilio
```

## API Base URL

```
http://localhost:4801
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
- [x] Employee folders created
- [x] Service folders created
- [x] src/index.ts - Main server (complete)
- [x] AI employee implementations
- [x] AI worker implementations
- [x] Voice agent implementations
- [x] CLAUDE.md (this file)
