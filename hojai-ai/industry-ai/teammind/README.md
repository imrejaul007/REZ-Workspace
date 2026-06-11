# TEAMMIND - HR AI

> "AI-Powered HR That Works"

TEAMMIND is an AI-powered operating system for HR departments and recruitment. It combines AI agents, automated workers, voice agents, and a complete backend to manage HR operations.

## Features

### AI Agents (Workers)

- **Recruiter AI** - Sourcing, screening, JD generation
- **Interview AI** - Interview assistance, evaluation
- **Payroll Agent** - Salary processing, compliance
- **HR Helpdesk** - Employee queries, support

### AI Workers (Automated Tasks)

- **Attendance Worker** - Time tracking, reports
- **Onboarding Worker** - New hire processing
- **Performance Worker** - Review management
- **Compliance Worker** - Regulatory compliance

### Voice Agents

- **Phone Receptionist** - Answer calls 24/7, HR queries
- **WhatsApp AI** - Text/voice conversations, leave requests

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## API Endpoints

### AI Agent APIs

```bash
POST /api/ai/recruiter/screen
POST /api/ai/interview/schedule
POST /api/ai/payroll/process
POST /api/ai/helpdesk/query
```

### Worker APIs

```bash
POST /api/workers/attendance/sync
POST /api/workers/onboarding/start
GET  /api/workers/performance/reviews
GET  /api/workers/compliance/audit
```

## Environment Variables

```bash
PORT=4803
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
HOJAI_CORE_URL=http://localhost:4100
MERCHANT_OS_URL=http://localhost:4000
VOICE_PROVIDER=twilio
```

## Port

- **Main Service:** 4803
- **Voice Agents:** 4850-4860

## Documentation

- [State of Technology](SOT.md) - Complete technical specification
- [Developer Guide](CLAUDE.md) - Developer documentation
- [Product Overview](PRODUCT.md) - Product requirements

## Pricing

- **₹4,999/month** (HOJAI AI - Non-REZ clients)
- Included in REZ-Merchant OS (REZ ecosystem clients)

## Support

For technical support, contact: support@hojai.ai

## License

Proprietary - HOJAI AI
