# REZ Atlas GTM v3.3.0 - Architecture Documentation

**Version:** 3.3.0
**Date:** June 9, 2026
**Status:** COMPLETE

## Overview

REZ Atlas GTM is an **Autonomous Go-To-Market Agent System** that competes directly with Explee. It generates complete GTM campaigns from a single domain input.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         REZ ATLAS GTM v3.3                                  │
│                   Autonomous Go-To-Market Agent System                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         INPUT LAYER                                  │   │
│  │                         Domain Input                                  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      GTM AGENTS (8 Core)                             │   │
│  │  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐              │   │
│  │  │   Company     │ │  Competitor   │ │   Segment     │              │   │
│  │  │ Understanding │ │  Discovery    │ │   Builder     │              │   │
│  │  └───────────────┘ └───────────────┘ └───────────────┘              │   │
│  │  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐              │   │
│  │  │   Buyer      │ │   Prospect    │ │  Outreach    │              │   │
│  │  │   Persona    │ │  Intelligence │ │  Intelligence│              │   │
│  │  └───────────────┘ └───────────────┘ └───────────────┘              │   │
│  │  ┌───────────────┐ ┌───────────────┐                                │   │
│  │  │  Message     │ │  Campaign    │                                │   │
│  │  │  Factory     │ │  Generator   │                                │   │
│  │  └───────────────┘ └───────────────┘                                │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      OUTREACH MODULES (15 Total)                    │   │
│  │                                                                       │   │
│  │  CHANNEL DELIVERY                                                     │   │
│  │  ├── AI Message Generator (OpenAI)    Port: 5200                     │   │
│  │  ├── Email Sender (SendGrid)          Port: 5200                     │   │
│  │  ├── SMS Integration (Twilio/MSG91)   Port: 5200                     │   │
│  │  ├── WhatsApp Business API            Port: 5200                     │   │
│  │  └── LinkedIn Sales Navigator        Port: 5200                     │   │
│  │                                                                       │   │
│  │  AUTOMATION & SEQUENCING                                             │   │
│  │  ├── Sequence Builder                  Port: 5200                     │   │
│  │  ├── Workflow Automation               Port: 5200                     │   │
│  │  └── A/B Testing Engine                 Port: 5200                     │   │
│  │                                                                       │   │
│  │  INTELLIGENCE                                                         │   │
│  │  ├── AI Prospect Scoring              Port: 5200                     │   │
│  │  ├── Data Enrichment APIs              Port: 5200                     │   │
│  │  └── Analytics Dashboard               Port: 5200                     │   │
│  │                                                                       │   │
│  │  OPERATIONS                                                           │   │
│  │  ├── Prospect Database                 Port: 5200                     │   │
│  │  ├── Calendar/Meeting Booking          Port: 5200                     │   │
│  │  ├── Territory Management              Port: 5200                     │   │
│  │  └── REZ CRM Integration               Port: 5200                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Module Specifications

### 1. AI Message Generator
**File:** `modules/ai-message-generator.js`
**Purpose:** Generate personalized messages using OpenAI

```javascript
// Key Functions
generateEmail(prospect, campaign)
generateLinkedIn(prospect, campaign)
generateWhatsApp(prospect, campaign)
generateCallScript(prospect, campaign)
generateAllMessages(prospect, campaign)
```

### 2. Sequence Builder
**File:** `modules/sequence-builder.js`
**Purpose:** Multi-step automation with conditions and delays

```javascript
// Key Functions
createSequence(data)
addStep(sequenceId, step)
enrollContact(contactId, sequenceId, prospectData)
getNextStep(enrollmentId)
markStepSent(enrollmentId, stepId)
markStepReplied(enrollmentId, stepId, replyData)
```

### 3. Email Sender
**File:** `modules/email-sender.js`
**Purpose:** Send emails via SendGrid with warmup rotation

```javascript
// Key Functions
sendEmail(data)
sendBulkEmails(campaign, prospects, templates)
trackOpen(emailId, recipientIp)
trackClick(emailId, url, recipientIp)
trackReply(emailId, replyText)
getWarmupAccounts()
```

### 4. SMS Integration
**File:** `modules/sms-integration.js`
**Purpose:** Send SMS via Twilio or MSG91

```javascript
// Key Functions
sendSMS(data)
sendBulkSMS({ recipients, message, campaignId })
getTemplates()
createCampaign(data)
executeCampaign(campaignId, recipients)
getAnalytics(range)
```

### 5. AI Prospect Scoring
**File:** `modules/ai-scoring.js`
**Purpose:** ML-powered lead scoring

```javascript
// Weight Configuration
WEIGHTS = {
  engagement: 0.25,
  demographic: 0.20,
  firmographic: 0.20,
  behavioral: 0.20,
  intent: 0.15
}

// Key Functions
scoreProspect(prospect)
batchScoreProspects(prospectIds)
getScoredSegments()
getPriorityList(segment)
retrainModel(options)
```

### 6. Analytics Dashboard
**File:** `modules/analytics-dashboard.js`
**Purpose:** Multi-touch attribution, cohort analysis, funnel tracking

```javascript
// Key Functions
getDashboard({ range, campaignId })
getFunnelAnalysis({ range, campaignId })
getMultiTouchAttribution({ range, model })
getCohortAnalysis({ cohortType, metric })
getChannelPerformance({ range })
comparePeriods(period1, period2)
getForecast(metric, horizon)
```

### 7. Workflow Automation
**File:** `modules/workflow-automation.js`
**Purpose:** Visual workflow builder with triggers/actions/conditions

```javascript
// Step Types
STEP_TYPES = [
  'trigger', 'send_email', 'send_sms', 'send_whatsapp',
  'add_tag', 'update_status', 'create_crm_deal',
  'schedule_meeting', 'webhook', 'ai_analyze',
  'condition', 'delay', 'end'
]

// Key Functions
createWorkflow(data)
addStep(workflowId, step)
executeWorkflow(workflowId, prospectId, context)
activateWorkflow(workflowId)
getExecutions(workflowId, filters)
```

### 8. A/B Testing
**File:** `modules/ab-testing.js`
**Purpose:** Statistical significance testing for experiments

```javascript
// Key Functions
createExperiment(data)
addVariant(experimentId, variant)
startExperiment(experimentId)
analyzeExperiment(experimentId)  // Returns statistical significance
selectWinner(experimentId)
```

### 9. Territory Management
**File:** `modules/territory-management.js`
**Purpose:** Geo-based territory and rep assignment

```javascript
// Key Functions
createTerritory(data)
assignProspects(territoryId, prospectIds, repId)
createRep(data)
getRepPerformance(repId)
createAssignmentRule(data)
evaluateAssignment(prospectId)
autoAssignProspects(territoryId)
```

### 10. Data Enrichment
**File:** `modules/data-enrichment.js`
**Purpose:** Enrich company and person data from external APIs

```javascript
// Key Functions
enrichCompany(domain, options)
enrichPerson(data)
findEmail(data)
verifyEmail(email)
createBulkJob(data)
executeBulkJob(jobId, prospects)
```

### 11. WhatsApp Integration
**File:** `modules/whatsapp-integration.js`
**Purpose:** WhatsApp Business API messaging

```javascript
// Key Functions
sendMessage(data)
sendTemplate(to, templateId, templateData)
sendBulkMessages(recipients, templateId, templateDataFn)
createCampaign(data)
executeCampaign(campaignId, recipients)
```

### 12. LinkedIn Integration
**File:** `modules/linkedin-integration.js`
**Purpose:** LinkedIn Sales Navigator outreach

```javascript
// Key Functions
searchProspects(query)
getProfile(id)
getEngagementInsights(id)
sendConnectionRequest(data)
sendInMail(data)
postUpdate(data)
```

### 13. Calendar Integration
**File:** `modules/calendar-integration.js`
**Purpose:** Meeting booking and calendar management

```javascript
// Key Functions
createBookingLink(data)
getAvailableSlots(linkId, date)
bookMeeting(data)
rescheduleMeeting(meetingId, newDate, newTime)
cancelMeeting(meetingId, reason)
sendReminder(meetingId, type)
```

### 14. Prospect Database
**File:** `modules/prospect-database.js`
**Purpose:** Full CRUD, search, bulk ops, import/export

```javascript
// Key Functions
create(data)
get(id)
update(id, data)
delete(id)
search({ query, filters, page, limit })
createBulk(prospects)
importCSV(csv)
exportCSV(options)
```

### 15. CRM Integration
**File:** `modules/crm-integration.js`
**Purpose:** Bidirectional sync with REZ CRM (Port 4210)

```javascript
// Key Functions
syncProspectToCRM(prospect)
fullSync(options)
createCRMDeal(prospect, data)
logEngagementToCRM(prospectId, type, data)
handleCRMWebhook(data)
```

## API Endpoints

### Core GTM
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/gtm/campaign | Generate GTM campaign |
| GET | /api/gtm/campaigns | List all campaigns |
| GET | /api/gtm/campaign/:id | Get campaign details |

### Messages
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/gtm/messages/generate | Generate AI messages |
| GET | /api/gtm/messages/:prospectId | Get generated messages |

### Sequences
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/gtm/sequences | Create sequence |
| GET | /api/gtm/sequences | List sequences |
| POST | /api/gtm/sequences/:id/steps | Add step |
| POST | /api/gtm/enroll | Enroll contact |

### Email
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/gtm/email/send | Send single email |
| POST | /api/gtm/email/bulk | Send bulk emails |
| GET | /api/gtm/email/stats | Get email stats |

### SMS
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/gtm/sms/send | Send single SMS |
| POST | /api/gtm/sms/bulk | Send bulk SMS |
| GET | /api/gtm/sms/campaigns | List campaigns |
| POST | /api/gtm/sms/campaigns/:id/execute | Execute campaign |
| GET | /api/gtm/sms/analytics | Get analytics |

### AI Scoring
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/gtm/scoring/prospect/:id | Score single prospect |
| POST | /api/gtm/scoring/batch | Batch score prospects |
| GET | /api/gtm/scoring/segments | Get scored segments |
| POST | /api/gtm/scoring/retrain | Retrain model |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/gtm/analytics/dashboard | Get dashboard data |
| GET | /api/gtm/analytics/funnel | Get funnel analysis |
| GET | /api/gtm/analytics/attribution | Get attribution model |
| GET | /api/gtm/analytics/cohort | Get cohort analysis |
| GET | /api/gtm/analytics/forecasting | Get revenue forecast |

### Workflows
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/gtm/workflows | List workflows |
| POST | /api/gtm/workflows | Create workflow |
| POST | /api/gtm/workflows/:id/execute | Execute workflow |
| GET | /api/gtm/workflows/templates | Get templates |

### A/B Testing
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/gtm/experiments | List experiments |
| POST | /api/gtm/experiments | Create experiment |
| POST | /api/gtm/experiments/:id/start | Start experiment |
| GET | /api/gtm/experiments/:id/analyze | Analyze results |
| POST | /api/gtm/experiments/:id/winner | Select winner |

### Territory
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/gtm/territories | List territories |
| POST | /api/gtm/territories | Create territory |
| POST | /api/gtm/territories/:id/assign | Assign prospects |
| GET | /api/gtm/reps | List reps |
| POST | /api/gtm/assignment/rules | Create rules |

### CRM Integration
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/gtm/crm/sync/prospect/:id | Sync prospect |
| POST | /api/gtm/crm/sync/all | Full sync |
| POST | /api/gtm/crm/deal/prospect/:id | Create deal |
| GET | /api/gtm/crm/contacts | Get CRM contacts |

## Integration Points

### REZ CRM (Port 4210)
```javascript
const CRM_BASE_URL = process.env.CRM_URL || 'http://localhost:4210';
```

### OpenAI
```javascript
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
```

### SendGrid
```javascript
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
```

### Twilio
```javascript
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
```

## Data Flow

```
Domain Input
     │
     ▼
┌─────────────┐
│ Company     │ ──► Company Data
│ Understanding│
└─────────────┘
     │
     ▼
┌─────────────┐
│ Competitor  │ ──► Competitor Data
│ Discovery   │
└─────────────┘
     │
     ▼
┌─────────────┐
│ Segment     │ ──► Segments + Prospects
│ Builder     │
└─────────────┘
     │
     ▼
┌─────────────┐
│ Prospect    │ ──► Scored Prospects
│ Intelligence│    (AI Scoring)
└─────────────┘
     │
     ├──────────────────────────┐
     ▼                          ▼
┌─────────────┐         ┌─────────────┐
│ Message     │         │ Territory   │
│ Factory     │         │ Management  │
└─────────────┘         └─────────────┘
     │                          │
     ▼                          ▼
┌─────────────┐         ┌─────────────┐
│ Channel     │         │ Rep         │
│ Delivery    │         │ Assignment  │
└─────────────┘         └─────────────┘
     │
     ├──────┬───────┬───────┬───────┐
     ▼      ▼       ▼       ▼       ▼
┌──────┐ ┌─────┐ ┌────┐ ┌──────┐ ┌──────┐
│Email │ │ SMS │ │ WA │ │LinkedIn│ │Call │
└──────┘ └─────┘ └────┘ └──────┘ └──────┘
     │      │     │      │         │
     └──────┴──────┴──────┴─────────┘
                    │
                    ▼
             ┌─────────────┐
             │ Analytics   │
             │ Dashboard   │
             └─────────────┘
                    │
                    ▼
             ┌─────────────┐
             │ CRM Sync    │
             │ (Port 4210) │
             └─────────────┘
```

## Competitive Positioning

| Feature | Explee | Atlas GTM v3.3 |
|---------|--------|----------------|
| Company Research | ✅ | ✅ |
| Competitor Discovery | ✅ | ✅ |
| Segment Building | ✅ | ✅ |
| Buyer Personas | ✅ | ✅ |
| Email Generation | ✅ | ✅ |
| LinkedIn Messages | ✅ | ✅ |
| WhatsApp | ❌ | ✅ |
| Call Scripts | ❌ | ✅ |
| SMS Integration | ❌ | ✅ |
| AI Prospect Scoring | ❌ | ✅ |
| Territory Management | ❌ | ✅ |
| A/B Testing | ❌ | ✅ |
| Workflow Automation | ❌ | ✅ |
| Analytics Dashboard | ❌ | ✅ |
| REZ CRM Integration | ❌ | ✅ |

## Quick Start

```bash
# Install dependencies
cd atlas-gtm
npm install

# Start service
npm run dev

# Health check
curl http://localhost:5200/health

# Generate campaign
curl -X POST http://localhost:5200/api/gtm/campaign \
  -H "Content-Type: application/json" \
  -d '{"domain": "yourcompany.com"}'
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Service port | 5200 |
| OPENAI_API_KEY | OpenAI API key | - |
| SENDGRID_API_KEY | SendGrid API key | - |
| TWILIO_ACCOUNT_SID | Twilio Account SID | - |
| TWILIO_AUTH_TOKEN | Twilio Auth Token | - |
| MSG91_API_KEY | MSG91 API key | - |
| CRM_URL | REZ CRM URL | http://localhost:4210 |
| LINKEDIN_COOKIE | LinkedIn cookie | - |

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 3.3.0 | June 9, 2026 | Added SMS, AI Scoring, Analytics, Workflow, A/B Testing, Territory |
| 3.2.0 | June 8, 2026 | Added CRM Integration, Prospect Database, LinkedIn |
| 3.1.0 | June 7, 2026 | Added WhatsApp, Data Enrichment |
| 3.0.0 | June 6, 2026 | Initial release with core GTM agents |