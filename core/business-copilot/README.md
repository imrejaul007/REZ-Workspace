# Business Copilot

AI-powered business assistant with 24 industry skill packs for specialized business tasks.

## Overview

Business Copilot provides a conversational AI interface that understands your industry-specific needs:
- **120+ Skills** - Specialized skills for each industry
- **24 Industry Packs** - Context-aware responses for each industry
- **Conversation Memory** - Maintains context across sessions
- **Analytics** - Track usage and performance

## Skill Distribution

| Industry | Skills | Examples |
|----------|--------|----------|
| Legal | 5 | Case Research, Document Drafting, Compliance |
| Healthcare | 5 | Patient Intake, Medical Coding, Claims |
| Finance | 5 | Bookkeeping, Invoicing, Tax |
| Retail | 5 | Inventory, POS, Upselling |
| Education | 5 | Enrollment, Grading, Scheduling |
| Manufacturing | 5 | Production, Quality, Maintenance |
| Real Estate | 5 | Lead Gen, Listing, Transaction |
| Travel | 5 | Booking, Itinerary, Support |
| Restaurant | 5 | Reservation, Ordering, Staff Scheduling |
| Fitness | 5 | Member Onboarding, Workout, Class Booking |
| Automotive | 5 | Service, Parts, CRM |
| Entertainment | 5 | Booking, Ticketing, Marketing |
| Gaming | 5 | Player Support, Moderation, Analytics |
| Agriculture | 5 | Crop Management, Equipment, Weather |
| Construction | 5 | Project, Scheduling, Safety |
| Beauty | 5 | Booking, Consultation, Marketing |
| Fashion | 5 | Design, Production, Merchandising |
| Sports | 5 | Tickets, Fan Engagement, Analytics |
| Government | 5 | Citizen Service, Permit, Compliance |
| Home Services | 5 | Scheduling, Dispatch, Quoting |
| Professional | 5 | Project, Resource, Billing |
| Non-Profit | 5 | Donor, Fundraising, Volunteer |
| Media | 5 | Content, Audience, Advertising |
| Energy | 5 | Metering, Billing, Grid |

## Quick Start

```bash
cd core/business-copilot
npm install
npm start
```

## API Endpoints

### Chat
```
POST /chat                     - Send message and get response
```

### Sessions
```
GET  /sessions/:id             - Get session details
DELETE /sessions/:id           - Delete session
```

### Skills
```
GET /skills                    - List all skill packs
GET /skills?industry=legal     - List skills for industry
```

### Analytics
```
GET /analytics                 - Get usage analytics
GET /analytics?period=7d       - Get analytics for period
```

## Example Usage

### Chat Request
```bash
curl -X POST http://localhost:4002/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Schedule appointment for new patient",
    "industry": "healthcare",
    "context": {"patientName": "John Doe"}
  }'
```

### Response
```json
{
  "response": "I can help you schedule an appointment. What date and time works best for the patient?",
  "sessionId": "uuid",
  "skills": ["Patient Intake", "Scheduling"],
  "suggestions": [
    "Schedule appointment",
    "Register new patient",
    "Check availability"
  ]
}
```

## Architecture

```
business-copilot/
├── src/
│   ├── index.js              # Main entry
│   ├── skills/
│   │   └── skillPackRegistry.js # 120+ skills
│   ├── handlers/
│   │   ├── copilotEngine.js  # AI processing
│   │   ├── conversationManager.js # Sessions
│   │   └── analytics.js      # Usage tracking
│   └── prompts/              # Prompt templates
├── package.json
└── README.md
```

## License

MIT
