# REZ Atlas v2 - Services Inventory

**Version:** 2.0.0  
**Date:** June 9, 2026  
**Status:** COMPLETE - 30 Services Built

---

## Architecture Overview

REZ Atlas v2 is a complete Revenue Intelligence Platform built on 5 pillars:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         REZ ATLAS v2 - REVENUE INTELLIGENCE                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│   │  DISCOVER   │  │ INTELLIGENCE│  │   ENGAGE    │  │   AI WORKFORCE│     │
│   │   (5150)    │  │   (5156)    │  │   (5161)    │  │   (5174)    │       │
│   └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘       │
│                                                                              │
│                          ┌─────────────┐                                     │
│                          │  REVENUE OS │                                     │
│                          │   (5180)    │                                     │
│                          └─────────────┘                                     │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │                    SHARED LAYER                                       │  │
│   │    Atlas Gateway (5155) │ Webhook (5170) │ Storage (5171)           │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Port Registry

| Port | Service | Layer | Purpose |
|------|---------|-------|---------|
| **5150** | atlas-discover | Discover | Company discovery & enrichment |
| **5151** | atlas-contact-finder | Discover | Contact data with email/phone |
| **5152** | atlas-data-enrichment | Discover | Additional data enrichment |
| **5153** | atlas-search | Discover | Unified search interface |
| **5154** | atlas-deduplication | Discover | Remove duplicate records |
| **5155** | atlas-gateway | Gateway | Central API gateway |
| **5156** | atlas-company-twin | Intelligence | Company intelligence & signals |
| **5157** | atlas-person-twin | Intelligence | Contact intelligence & profiling |
| **5158** | atlas-research-agent | Intelligence | Deep research automation |
| **5159** | atlas-intent-engine | Intelligence | Intent signal detection |
| **5160** | atlas-enrichment | Intelligence | Multi-source data enrichment |
| **5161** | atlas-email-service | Engage | Email campaigns & sequences |
| **5162** | atlas-whatsapp-service | Engage | WhatsApp outreach |
| **5163** | atlas-sms-service | Engage | SMS campaigns |
| **5164** | atlas-call-service | Engage | Call task management |
| **5165** | atlas-deliverability | Engage | Email warmup & health |
| **5170** | atlas-webhook | Webhook | Outbound webhooks |
| **5171** | atlas-storage | Storage | Blob storage service |
| **5172** | atlas-notification | Notification | Push notifications |
| **5173** | atlas-analytics | Analytics | Engagement analytics |
| **5174** | atlas-sdr-agent | AI Workforce | Autonomous SDR automation |
| **5175** | atlas-qualification-agent | AI Workforce | Lead qualification (BANT/MEDDIC) |
| **5176** | atlas-meeting-agent | AI Workforce | Meeting scheduling |
| **5177** | atlas-followup-agent | AI Workforce | Follow-up automation |
| **5180** | atlas-crm-core | Revenue OS | CRM with accounts, contacts, opportunities |
| **5181** | atlas-pipeline | Revenue OS | Visual pipeline management |
| **5182** | atlas-forecast | Revenue OS | AI revenue forecasting |
| **5183** | atlas-conversation-intel | Revenue OS | Call intelligence |

---

## Layer 1: Discover (5150-5154)

### atlas-discover (Port 5150)

**Purpose:** Company discovery engine with enrichment data.

**Features:**
- Company search with filters
- Firmographic data enrichment
- Industry classification
- Employee count, revenue data
- Tech stack detection

**Endpoints:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/discover/companies | Search companies |
| GET | /api/discover/companies/:id | Get company details |
| POST | /api/discover/enrich | Enrich company data |

**Data Model:**
```typescript
interface Company {
  id: string;
  name: string;
  domain: string;
  industry: string;
  employeeCount: number;
  revenue: string;
  location: string;
  founded: number;
  description: string;
  linkedinUrl: string;
  twitterUrl: string;
  facebookUrl: string;
  logo: string;
  enrichment: {
    funding: string;
    techStack: string[];
    keywords: string[];
  };
}
```

---

### atlas-contact-finder (Port 5151)

**Purpose:** Contact data with verified emails and phone numbers.

**Features:**
- Email finding (pattern + verification)
- Phone number discovery
- LinkedIn profile extraction
- Job title normalization
- Seniority detection

**Endpoints:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/contacts/search | Search contacts |
| GET | /api/contacts/:id | Get contact details |
| POST | /api/contacts/find-email | Find email for person+company |
| POST | /api/contacts/find-phone | Find phone for contact |
| POST | /api/contacts/verify | Verify email deliverability |

**Data Model:**
```typescript
interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  title: string;
  seniority: 'C-level' | 'VP' | 'Director' | 'Manager' | 'Individual';
  department: string;
  email: string;
  emailStatus: 'verified' | 'unverified' | 'risky';
  phone: string;
  phoneStatus: 'verified' | 'unverified';
  linkedinUrl: string;
  company: string;
  companyId: string;
  location: string;
  enrichment: {
    score: number;
    lastVerified: string;
  };
}
```

---

### atlas-data-enrichment (Port 5152)

**Purpose:** Additional data enrichment from multiple sources.

**Features:**
- Clearbit enrichment
- Apollo data
- Hunter.io verification
- ZoomInfo data
- Custom field enrichment

**Endpoints:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/enrich/company | Enrich company data |
| POST | /api/enrich/contact | Enrich contact data |
| POST | /api/enrich/batch | Batch enrichment |

---

### atlas-search (Port 5153)

**Purpose:** Unified search across all entities.

**Features:**
- Full-text search
- Faceted filtering
- Relevance scoring
- Search suggestions
- Recent searches

**Endpoints:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/search | Unified search |
| GET | /api/search/suggestions | Search suggestions |
| GET | /api/search/filters | Available filters |

---

### atlas-deduplication (Port 5154)

**Purpose:** Remove duplicate records using fuzzy matching.

**Features:**
- Company deduplication
- Contact deduplication
- Merge recommendations
- Custom matching rules
- Bulk deduplication

**Endpoints:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/dedup/companies | Dedupe companies |
| POST | /api/dedup/contacts | Dedupe contacts |
| GET | /api/dedup/duplicates | List duplicates |

---

## Layer 2: Intelligence (5156-5160)

### atlas-company-twin (Port 5156)

**Purpose:** Complete company intelligence with digital twin.

**Features:**
- Revenue estimation
- Funding analysis
- Employee trends
- Tech stack intelligence
- Buying signals
- Competitive intelligence
- News & events tracking

**Endpoints:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/twin/company/:id | Get company twin |
| GET | /api/twin/company/:id/signals | Get buying signals |
| GET | /api/twin/company/:id/technologies | Get tech stack |
| POST | /api/twin/company/analyze | Analyze company |
| GET | /api/twin/company/:id/competitors | Get competitors |

**Data Model:**
```typescript
interface CompanyTwin {
  id: string;
  company: {
    name: string;
    domain: string;
    industry: string;
    size: 'startup' | 'smb' | 'mid-market' | 'enterprise';
    revenue: {
      estimated: string;
      confidence: number;
    };
    funding: {
      total: string;
      rounds: number;
      lastRound: string;
    };
    employees: {
      count: number;
      trend: 'growing' | 'stable' | 'shrinking';
    };
  };
  signals: {
    hiring: HiringSignal[];
    funding: FundingSignal[];
    tech: TechSignal[];
    expansion: ExpansionSignal[];
  };
  buyingIntent: {
    score: number;
    triggers: string[];
    urgency: 'low' | 'medium' | 'high';
  };
}
```

---

### atlas-person-twin (Port 5157)

**Purpose:** Individual contact intelligence and profiling.

**Features:**
- Email finding & verification
- Phone number discovery
- LinkedIn enrichment
- Seniority scoring
- Engagement tracking
- Personalization data

**Endpoints:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/twin/person/:id | Get person twin |
| POST | /api/twin/person/enrich | Enrich person data |
| GET | /api/twin/person/:id/activity | Get engagement activity |
| POST | /api/twin/person/score | Calculate engagement score |

**Data Model:**
```typescript
interface PersonTwin {
  id: string;
  person: {
    firstName: string;
    lastName: string;
    fullName: string;
    title: string;
    seniority: 'C-level' | 'VP' | 'Director' | 'Manager' | 'IC';
    department: string;
    function: string;
  };
  contact: {
    email: string;
    emailStatus: 'verified' | 'risky' | 'invalid';
    phone: string;
    phoneStatus: 'verified' | 'unverified';
    linkedinUrl: string;
  };
  engagement: {
    score: number;
    lastActivity: string;
    preferredChannel: 'email' | 'phone' | 'linkedin';
    bestTimeToContact: string;
  };
  personalization: {
    interests: string[];
    recentActivity: string[];
    talkingPoints: string[];
  };
}
```

---

### atlas-research-agent (Port 5158)

**Purpose:** AI-powered deep research on companies and contacts.

**Features:**
- Website analysis
- Review mining (G2, Capterra, Trustpilot)
- News tracking
- Competitor research
- Social media analysis
- Regulatory filings

**Endpoints:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/research/company | Research company |
| POST | /api/research/contact | Research contact |
| POST | /api/research/website | Analyze website |
| GET | /api/research/:id | Get research report |
| POST | /api/research/batch | Batch research |

**Research Report:**
```typescript
interface ResearchReport {
  id: string;
  targetId: string;
  targetType: 'company' | 'contact';
  summary: string;
  sections: {
    overview: string;
    products: string[];
    customers: string[];
    competitors: string[];
    news: NewsItem[];
    reviews: Review[];
  };
  talkingPoints: string[];
  recommendedApproach: string;
  confidence: number;
  createdAt: string;
}
```

---

### atlas-intent-engine (Port 5159)

**Purpose:** Real-time intent signal detection and ICP matching.

**Features:**
- Intent topic tracking
- ICP (Ideal Customer Profile) matching
- Signal aggregation
- Alert generation
- Trend analysis

**Endpoints:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/intent/signals | Get all signals |
| GET | /api/intent/signals/:companyId | Get company signals |
| POST | /api/intent/icp/match | Match against ICP |
| GET | /api/intent/topics | Get intent topics |
| POST | /api/intent/alerts | Create alert |

**Intent Signals:**
```typescript
interface IntentSignal {
  id: string;
  companyId: string;
  companyName: string;
  type: 'hiring' | 'funding' | 'tech_change' | 'expansion' | 'review_spike' | 'leadership_change';
  source: string;
  title: string;
  description: string;
  strength: 'weak' | 'medium' | 'strong';
  detectedAt: string;
  metadata: Record<string, any>;
}

interface ICPMatch {
  companyId: string;
  matchScore: number;
  matchedCriteria: string[];
  unmatchedCriteria: string[];
  recommendation: string;
}
```

---

### atlas-enrichment (Port 5160)

**Purpose:** Multi-source data enrichment from 50+ providers.

**Features:**
- Clearbit API
- Apollo.io
- Hunter.io
- ZoomInfo
- LinkedIn Sales Navigator
- Custom sources
- Batch enrichment
- Real-time enrichment

**Endpoints:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/enrich/company | Enrich company |
| POST | /api/enrich/contact | Enrich contact |
| POST | /api/enrich/batch | Batch enrichment |
| GET | /api/enrich/sources | Available sources |
| GET | /api/enrich/credits | Usage credits |

---

## Layer 3: Engage (5161-5165)

### atlas-email-service (Port 5161)

**Purpose:** Email campaigns, sequences, and tracking.

**Features:**
- Sequence builder
- A/B testing
- Personalization tokens
- Open/click/reply tracking
- Unsubscribe handling
- Template management

**Endpoints:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/email/campaigns | List campaigns |
| POST | /api/email/campaigns | Create campaign |
| POST | /api/email/campaigns/:id/send | Send campaign |
| POST | /api/email/sequences | Create sequence |
| POST | /api/email/sequences/:id/enroll | Enroll contact |
| GET | /api/email/templates | List templates |
| POST | /api/email/templates | Create template |

**Email Campaign:**
```typescript
interface EmailCampaign {
  id: string;
  name: string;
  subject: string;
  templateId: string;
  segmentId: string;
  status: 'draft' | 'scheduled' | 'sending' | 'completed';
  stats: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    replied: number;
    bounced: number;
    unsubscribed: number;
  };
  schedule: {
    sendAt: string;
    timezone: string;
  };
}
```

---

### atlas-whatsapp-service (Port 5162)

**Purpose:** WhatsApp business outreach and automation.

**Features:**
- WhatsApp Business API
- Template messages
- Session messaging
- Media support (images, docs)
- Read receipts
- Quick replies
- HSM templates

**Endpoints:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/whatsapp/send | Send message |
| POST | /api/whatsapp/templates | Create template |
| GET | /api/whatsapp/conversations | List conversations |
| POST | /api/whatsapp/webhook | WhatsApp webhook |
| GET | /api/whatsapp/templates | List approved templates |

---

### atlas-sms-service (Port 5163)

**Purpose:** SMS campaigns and outreach.

**Features:**
- SMS campaigns
- Two-way messaging
- Link shortening
- Delivery receipts
- Opt-out handling
- DLT compliance

**Endpoints:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/sms/send | Send SMS |
| POST | /api/sms/campaigns | Create campaign |
| GET | /api/sms/campaigns/:id | Get campaign stats |
| POST | /api/sms/webhook | SMS webhook |

---

### atlas-call-service (Port 5164)

**Purpose:** Call task management and logging.

**Features:**
- Call task creation
- Auto-dialing
- Call recording
- Outcome logging
- Note taking
- Call disposition
- Callback scheduling

**Endpoints:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/calls/tasks | Create call task |
| POST | /api/calls/dial | Initiate call |
| POST | /api/calls/:id/log | Log call outcome |
| POST | /api/calls/:id/notes | Add call notes |
| GET | /api/calls/tasks | List call tasks |
| GET | /api/calls/stats | Call statistics |

**Call Task:**
```typescript
interface CallTask {
  id: string;
  contactId: string;
  contactName: string;
  phone: string;
  status: 'pending' | 'in_progress' | 'completed' | 'no_answer' | 'voicemail' | 'busy';
  outcome: string;
  notes: string;
  duration: number;
  scheduledAt: string;
  completedAt: string;
}
```

---

### atlas-deliverability (Port 5165)

**Purpose:** Email deliverability and domain health.

**Features:**
- Email warmup
- Bounce tracking
- Spam score monitoring
- Domain health
- SPF/DKIM/DMARC check
- Inbox placement testing

**Endpoints:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/deliverability/health | Domain health score |
| POST | /api/deliverability/warmup/start | Start warmup |
| GET | /api/deliverability/warmup/status | Warmup status |
| POST | /api/deliverability/verify | Verify email |
| GET | /api/deliverability/spam-score | Spam score |

---

## Layer 4: AI Workforce (5174-5177)

### atlas-sdr-agent (Port 5174)

**Purpose:** Autonomous AI SDR - research → outreach → reply → meeting.

**Features:**
- Automated research
- Personalized outreach
- Reply handling
- Meeting booking
- Multi-channel coordination
- Learning from responses

**Endpoints:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/sdr/prospect | Start prospecting |
| GET | /api/sdr/prospects/:id | Get prospect status |
| POST | /api/sdr/campaign | Launch AI campaign |
| GET | /api/sdr/campaigns | List campaigns |
| POST | /api/sdr/reply | Handle reply |

**SDR Campaign:**
```typescript
interface SDRCampaign {
  id: string;
  name: string;
  targetCriteria: ICPProfile;
  channels: ('email' | 'whatsapp' | 'sms' | 'call')[];
  sequences: SequenceConfig;
  aiSettings: {
    personalization: 'basic' | 'deep';
    responseHandling: 'auto' | 'human_review';
    meetingBooking: 'auto' | 'manual';
  };
  stats: {
    prospects: number;
    contacted: number;
    engaged: number;
    replied: number;
    meetings: number;
  };
}
```

---

### atlas-qualification-agent (Port 5175)

**Purpose:** AI-powered BANT/MEDDIC lead qualification.

**Features:**
- Dynamic qualification questions
- Budget analysis
- Authority mapping
- Need identification
- Timeline detection
- Scoring and grading

**Endpoints:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/qualify/start | Start qualification |
| POST | /api/qualify/:id/questions | Get next question |
| POST | /api/qualify/:id/answer | Submit answer |
| GET | /api/qualify/:id/result | Get qualification result |
| GET | /api/qualify/:id/score | Get current score |

**Qualification Result:**
```typescript
interface QualificationResult {
  id: string;
  contactId: string;
  score: number;
  grade: 'A' | 'B' | 'C' | 'D';
  criteria: {
    budget: { score: number; notes: string };
    authority: { score: number; notes: string };
    need: { score: number; notes: string };
    timeline: { score: number; notes: string };
  };
  recommendation: 'hot' | 'warm' | 'nurture' | 'disqualify';
  talkingPoints: string[];
  questions: string[];
}
```

---

### atlas-meeting-agent (Port 5176)

**Purpose:** AI meeting booking and calendar management.

**Features:**
- Calendar integration
- Availability checking
- Time slot management
- Meeting type templates
- Reminders
- Rescheduling
- Cancellation handling

**Endpoints:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/meeting/book | Book meeting |
| GET | /api/meeting/availability | Get availability |
| POST | /api/meeting/slots | Generate time slots |
| GET | /api/meeting/:id | Get meeting details |
| POST | /api/meeting/:id/reschedule | Reschedule |
| POST | /api/meeting/:id/cancel | Cancel meeting |
| POST | /api/meeting/reminders | Schedule reminders |

---

### atlas-followup-agent (Port 5177)

**Purpose:** Automated multi-channel follow-up sequences.

**Features:**
- Personalized follow-ups
- Multi-channel (email, SMS, WhatsApp)
- Trigger-based follow-up
- Snooze/remind later
- Template management
- Performance tracking

**Endpoints:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/followup/create | Create follow-up |
| POST | /api/followup/:id/send | Send follow-up |
| GET | /api/followup/templates | List templates |
| POST | /api/followup/trigger | Trigger follow-up |
| GET | /api/followup/stats | Follow-up statistics |

---

## Layer 5: Revenue OS (5180-5183)

### atlas-crm-core (Port 5180)

**Purpose:** Full CRM with accounts, contacts, opportunities, activities.

**Features:**
- Account management
- Contact management
- Opportunity/Deal tracking
- Activity logging
- Task management
- Notes and comments
- Custom fields

**Endpoints:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | /api/accounts | Account CRUD |
| GET/POST | /api/contacts | Contact CRUD |
| GET/POST | /api/opportunities | Opportunity CRUD |
| GET/POST | /api/activities | Activity CRUD |
| GET/POST | /api/tasks | Task CRUD |
| GET/POST | /api/notes | Note CRUD |

**Data Models:**
```typescript
interface Account {
  id: string;
  name: string;
  domain: string;
  industry: string;
  employeeCount: number;
  revenue: string;
  phone: string;
  address: Address;
  website: string;
  linkedinUrl: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

interface Contact {
  id: string;
  accountId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  title: string;
  department: string;
  linkedinUrl: string;
  isPrimary: boolean;
  ownerId: string;
}

interface Opportunity {
  id: string;
  accountId: string;
  contactId: string;
  name: string;
  amount: number;
  stage: string;
  probability: number;
  closeDate: string;
  type: 'new_business' | 'existing_business' | 'renewal';
  source: string;
  notes: string;
}

interface Activity {
  id: string;
  type: 'call' | 'email' | 'meeting' | 'note' | 'task';
  accountId: string;
  contactId: string;
  subject: string;
  description: string;
  dueDate: string;
  completedAt: string;
  outcome: string;
}
```

---

### atlas-pipeline (Port 5181)

**Purpose:** Visual pipeline management with drag-drop.

**Features:**
- Pipeline stages
- Deal movement
- Stage metrics
- Win/loss analysis
- Weighted pipeline
- Forecast view

**Endpoints:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/pipeline/stages | Get pipeline stages |
| POST | /api/pipeline/stages | Create stage |
| PUT | /api/pipeline/deals/:id/move | Move deal to stage |
| GET | /api/pipeline/metrics | Pipeline metrics |
| GET | /api/pipeline/board | Get board view |

**Pipeline Stage:**
```typescript
interface PipelineStage {
  id: string;
  name: string;
  order: number;
  probability: number;
  color: string;
  deals: Deal[];
  metrics: {
    count: number;
    value: number;
    weightedValue: number;
    avgAge: number;
    conversionRate: number;
  };
}
```

---

### atlas-forecast (Port 5182)

**Purpose:** AI revenue forecasting and planning.

**Features:**
- Predicted revenue
- Commit vs. best case
- Forecast scenarios
- Growth trends
- Risk analysis
- What-if scenarios

**Endpoints:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/forecast/current | Current forecast |
| GET | /api/forecast/predicted | Predicted revenue |
| GET | /api/forecast/scenarios | Forecast scenarios |
| POST | /api/forecast/what-if | What-if analysis |
| GET | /api/forecast/trends | Revenue trends |

**Forecast Response:**
```typescript
interface Forecast {
  period: string;
  predicted: number;
  committed: number;
  bestCase: number;
  target: number;
  historical: number;
  growth: number;
  confidence: number;
  breakdown: {
    byStage: StageBreakdown[];
    byOwner: OwnerBreakdown[];
    bySegment: SegmentBreakdown[];
  };
}
```

---

### atlas-conversation-intel (Port 5183)

**Purpose:** Call transcription and conversation intelligence.

**Features:**
- Call recording
- Transcription
- Sentiment analysis
- Objection extraction
- Talk-to-listen ratio
- Keyword detection
- Coaching insights

**Endpoints:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/conversation/transcribe | Transcribe audio |
| GET | /api/conversation/:id | Get analysis |
| GET | /api/conversation/:id/sentiment | Get sentiment |
| GET | /api/conversation/:id/objections | Get objections |
| GET | /api/conversation/:id/insights | Get insights |

**Conversation Analysis:**
```typescript
interface ConversationAnalysis {
  id: string;
  callId: string;
  duration: number;
  transcript: TranscriptSegment[];
  sentiment: {
    overall: 'positive' | 'neutral' | 'negative';
    timeline: SentimentPoint[];
  };
  objections: {
    text: string;
    category: string;
    count: number;
  }[];
  keywords: string[];
  metrics: {
    talkRatio: number;
    avgSentenceLength: number;
    interruptions: number;
    questionsAsked: number;
  };
  summary: string;
  coachingPoints: string[];
}
```

---

## Shared Services

### atlas-gateway (Port 5155)

**Purpose:** Central API gateway with routing and authentication.

**Features:**
- Request routing
- Authentication
- Rate limiting
- Logging
- CORS handling

### atlas-webhook (Port 5170)

**Purpose:** Outbound webhooks for integrations.

**Events:**
- company.created
- contact.created
- opportunity.stage_changed
- opportunity.created
- opportunity.won
- opportunity.lost
- activity.created
- email.sent
- email.opened
- email.replied

### atlas-storage (Port 5171)

**Purpose:** Blob storage for files and media.

**Features:**
- File upload/download
- Image processing
- CDN integration
- Signed URLs

### atlas-notification (Port 5172)

**Purpose:** Push notifications and alerts.

**Channels:**
- Email
- Push
- SMS
- In-app

### atlas-analytics (Port 5173)

**Purpose:** Engagement and performance analytics.

**Features:**
- Dashboard metrics
- Campaign analytics
- Revenue attribution
- Trend analysis
- Custom reports

---

## Quick Start Commands

```bash
cd /REZ-Merchant/REZ-atlas-v2

# Start all services
for dir in atlas-intelligence atlas-engage atlas-ai-workforce atlas-revenue-os; do
  cd $dir && npm install && npm run dev &
done

# Start Dashboard
cd dashboard && npm install && npm start &  # Port 3001

# Start Field App
cd field-app && npm install && npm run dev &  # Port 3002

# Health checks
curl http://localhost:5150/health  # Discover
curl http://localhost:5156/health  # Company Twin
curl http://localhost:5157/health  # Person Twin
curl http://localhost:5161/health  # Email
curl http://localhost:5174/health  # SDR Agent
curl http://localhost:5180/health  # CRM Core
```

---

**Last Updated:** June 9, 2026
**Version:** 2.0.0
