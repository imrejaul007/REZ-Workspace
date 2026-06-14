# REZ Atlas v2 - API Reference

**Version:** 2.0.0  
**Date:** June 9, 2026

---

## Base URLs

| Environment | URL |
|-------------|-----|
| Development | `http://localhost:5155` |
| Staging | `https://api.staging.rez.atlas/v1` |
| Production | `https://api.rez.atlas/v1` |

---

## Authentication

All API requests require authentication via API key:

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
     -H "Content-Type: application/json" \
     https://api.rez.atlas/v1/...
```

---

## Common Headers

| Header | Description |
|--------|-------------|
| `Authorization` | Bearer token for authentication |
| `Content-Type` | `application/json` |
| `X-API-Version` | API version (default: v1) |
| `X-Request-ID` | Unique request ID for tracing |

---

## Common Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "requestId": "req_123",
    "timestamp": "2026-06-09T10:00:00Z"
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "details": [...]
  },
  "meta": {
    "requestId": "req_123",
    "timestamp": "2026-06-09T10:00:00Z"
  }
}
```

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Invalid or missing API key |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid request body |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

---

## API Endpoints

### Discovery Layer

#### Search Companies
```http
GET /api/discover/companies
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `q` | string | Yes | Search query |
| `industry` | string | No | Filter by industry |
| `size` | string | No | `startup`, `smb`, `mid-market`, `enterprise` |
| `location` | string | No | Filter by location |
| `limit` | number | No | Results per page (default: 20) |
| `offset` | number | No | Pagination offset |

**Response:**
```json
{
  "success": true,
  "data": {
    "companies": [
      {
        "id": "comp_123",
        "name": "TechCorp India",
        "domain": "techcorp.in",
        "industry": "Technology",
        "employeeCount": 500,
        "revenue": "$50M",
        "location": "Mumbai, Maharashtra"
      }
    ],
    "total": 150,
    "limit": 20,
    "offset": 0
  }
}
```

---

#### Find Contact Email
```http
POST /api/contacts/find-email
```

**Request Body:**
```json
{
  "firstName": "Sarah",
  "lastName": "Chen",
  "company": "TechCorp India",
  "domain": "techcorp.in",
  "title": "VP of Engineering"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "email": "sarah.chen@techcorp.in",
    "pattern": "{first}.{last}@techcorp.in",
    "status": "verified",
    "confidence": 95
  }
}
```

---

### Intelligence Layer

#### Get Company Twin
```http
GET /api/twin/company/{companyId}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "comp_123",
    "company": {
      "name": "TechCorp India",
      "size": "mid-market",
      "revenue": {
        "estimated": "$50M",
        "confidence": 85
      },
      "funding": {
        "total": "$120M",
        "rounds": 4,
        "lastRound": "Series B"
      }
    },
    "signals": [
      {
        "type": "hiring",
        "title": "Hiring SDRs",
        "description": "5 new SDR positions in last 30 days",
        "strength": "strong",
        "detectedAt": "2026-06-08"
      }
    ],
    "buyingIntent": {
      "score": 78,
      "urgency": "high",
      "triggers": ["Funding", "Hiring", "Expansion"]
    }
  }
}
```

---

#### Get Person Twin
```http
GET /api/twin/person/{personId}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "person_456",
    "person": {
      "firstName": "Sarah",
      "lastName": "Chen",
      "title": "VP of Engineering",
      "seniority": "C-level",
      "department": "Engineering"
    },
    "contact": {
      "email": "sarah.chen@techcorp.in",
      "emailStatus": "verified",
      "phone": "+91 98765 43210",
      "linkedinUrl": "https://linkedin.com/in/sarahchen"
    },
    "engagement": {
      "score": 72,
      "preferredChannel": "email",
      "bestTimeToContact": "10:00 AM IST"
    },
    "personalization": {
      "talkingPoints": ["AI initiatives", "Engineering team growth"]
    }
  }
}
```

---

#### Research Company
```http
POST /api/research/company
```

**Request Body:**
```json
{
  "companyId": "comp_123",
  "depth": "comprehensive",
  "include": ["overview", "news", "competitors", "reviews"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "research_789",
    "companyId": "comp_123",
    "status": "completed",
    "summary": "TechCorp India is a mid-market SaaS company...",
    "sections": {
      "overview": "Founded in 2015, TechCorp provides...",
      "products": ["CRM", "Analytics", "Marketing Cloud"],
      "competitors": ["Salesforce", "HubSpot"],
      "news": [
        {
          "title": "TechCorp raises $50M Series B",
          "source": "TechCrunch",
          "date": "2026-06-01"
        }
      ]
    },
    "talkingPoints": [
      "Recent $50M funding",
      "Expanding engineering team",
      "Looking to replace Salesforce"
    ],
    "confidence": 92
  }
}
```

---

#### Get Intent Signals
```http
GET /api/intent/signals
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `type` | string | Filter by signal type |
| `minStrength` | string | `weak`, `medium`, `strong` |
| `since` | date | Signals since date |
| `limit` | number | Results limit |

**Response:**
```json
{
  "success": true,
  "data": {
    "signals": [
      {
        "id": "sig_123",
        "companyId": "comp_456",
        "companyName": "StartupXYZ",
        "type": "hiring",
        "title": "Hiring Sales Team",
        "description": "Posted 5 AE positions",
        "strength": "strong",
        "detectedAt": "2026-06-09T08:00:00Z"
      }
    ],
    "total": 45
  }
}
```

---

### Engage Layer

#### Create Email Campaign
```http
POST /api/email/campaigns
```

**Request Body:**
```json
{
  "name": "Q3 Enterprise Outreach",
  "subject": "Quick question about {{company.name}}'s growth plans",
  "templateId": "tpl_123",
  "segmentId": "seg_456",
  "schedule": {
    "sendAt": "2026-06-15T09:00:00Z",
    "timezone": "Asia/Kolkata"
  },
  "settings": {
    "trackOpens": true,
    "trackClicks": true,
    "replyTo": "sales@yourcompany.com"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "camp_789",
    "name": "Q3 Enterprise Outreach",
    "status": "scheduled",
    "stats": {
      "sent": 0,
      "delivered": 0,
      "opened": 0,
      "clicked": 0,
      "replied": 0
    }
  }
}
```

---

#### Create Email Sequence
```http
POST /api/email/sequences
```

**Request Body:**
```json
{
  "name": "Enterprise Follow-up",
  "steps": [
    {
      "order": 1,
      "channel": "email",
      "subject": "Quick question about {{company.name}}",
      "templateId": "tpl_111",
      "delayDays": 0,
      "condition": null
    },
    {
      "order": 2,
      "channel": "linkedin",
      "message": "Hi {{contact.firstName}}, I sent you an email...",
      "delayDays": 2,
      "condition": {
        "type": "no_reply",
        "previousStep": 1
      }
    },
    {
      "order": 3,
      "channel": "email",
      "subject": "Following up on {{company.name}}",
      "templateId": "tpl_222",
      "delayDays": 5,
      "condition": {
        "type": "no_reply",
        "previousStep": 2
      }
    }
  ],
  "settings": {
    "stopOnReply": true,
    "stopOnMeeting": true,
    "maxAttempts": 5
  }
}
```

---

#### Send WhatsApp Message
```http
POST /api/whatsapp/send
```

**Request Body:**
```json
{
  "to": "+91 98765 43210",
  "templateId": "tpl_welcome",
  "variables": {
    "contactName": "Sarah",
    "companyName": "TechCorp"
  },
  "media": null
}
```

---

### AI Workforce Layer

#### Launch SDR Campaign
```http
POST /api/sdr/campaign
```

**Request Body:**
```json
{
  "name": "Q3 Mid-Market Campaign",
  "targetCriteria": {
    "industries": ["SaaS", "Fintech", "E-commerce"],
    "employeeRange": "50-500",
    "locations": ["India", "Singapore"],
    "technologies": ["Salesforce", "HubSpot"]
  },
  "channels": ["email", "whatsapp"],
  "sequences": {
    "email": "seq_ent_outreach",
    "whatsapp": "seq_whatsapp_intro"
  },
  "aiSettings": {
    "personalization": "deep",
    "responseHandling": "human_review",
    "meetingBooking": "auto"
  },
  "dailyLimit": 50
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "sdr_123",
    "name": "Q3 Mid-Market Campaign",
    "status": "active",
    "stats": {
      "prospects": 500,
      "contacted": 234,
      "engaged": 89,
      "replied": 34,
      "meetings": 12
    }
  }
}
```

---

#### Start Qualification
```http
POST /api/qualify/start
```

**Request Body:**
```json
{
  "contactId": "contact_456",
  "methodology": "BANT",
  "customQuestions": ["budget_range", "timeline"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "qualificationId": "qual_789",
    "currentQuestion": {
      "id": "q_1",
      "text": "What is your approximate annual budget for this project?",
      "type": "multiple_choice",
      "options": [
        "Under ₹5L",
        "₹5L - ₹10L",
        "₹10L - ₹25L",
        "₹25L - ₹50L",
        "Over ₹50L"
      ],
      "criteria": "budget"
    },
    "progress": 0,
    "questionsRemaining": 5
  }
}
```

---

#### Book Meeting
```http
POST /api/meeting/book
```

**Request Body:**
```json
{
  "contactId": "contact_456",
  "type": "product_demo",
  "duration": 30,
  "preferredTimes": [
    "2026-06-15T10:00:00Z",
    "2026-06-15T14:00:00Z",
    "2026-06-16T11:00:00Z"
  ],
  "notes": "Product demo for engineering team"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "meetingId": "meet_123",
    "status": "confirmed",
    "scheduledAt": "2026-06-15T10:00:00Z",
    "duration": 30,
    "joinUrl": "https://zoom.us/j/...",
    "calendarEvent": {
      "title": "Product Demo - TechCorp",
      "invitees": ["sales@yourcompany.com"]
    }
  }
}
```

---

### CRM Layer

#### Create Account
```http
POST /api/accounts
```

**Request Body:**
```json
{
  "name": "TechCorp India",
  "domain": "techcorp.in",
  "industry": "Technology",
  "employeeCount": 500,
  "revenue": "$50M",
  "phone": "+91 22 1234 5678",
  "address": {
    "street": "123 Tech Park",
    "city": "Mumbai",
    "state": "Maharashtra",
    "country": "India",
    "postalCode": "400001"
  }
}
```

---

#### Create Opportunity
```http
POST /api/opportunities
```

**Request Body:**
```json
{
  "accountId": "acc_123",
  "contactId": "contact_456",
  "name": "TechCorp - Enterprise Deal",
  "amount": 500000,
  "stage": "qualification",
  "closeDate": "2026-07-15",
  "type": "new_business",
  "source": "inbound",
  "notes": "Interested in annual contract"
}
```

---

#### Move Deal to Stage
```http
PUT /api/pipeline/deals/{dealId}/move
```

**Request Body:**
```json
{
  "stage": "proposal",
  "probability": 50,
  "notes": "Proposal sent for review"
}
```

---

#### Get Revenue Forecast
```http
GET /api/forecast/current
```

**Query Parameters:**
| Parameter | Description |
|-----------|-------------|
| `period` | `monthly`, `quarterly`, `yearly` |
| `startDate` | Start of forecast period |
| `endDate` | End of forecast period |

**Response:**
```json
{
  "success": true,
  "data": {
    "period": "Q3 2026",
    "predicted": 15000000,
    "committed": 12000000,
    "bestCase": 20000000,
    "target": 18000000,
    "historical": 12000000,
    "growth": 25,
    "confidence": 85,
    "breakdown": {
      "byStage": [
        { "stage": "Proposal", "value": 5000000, "probability": 50 },
        { "stage": "Negotiation", "value": 4000000, "probability": 75 }
      ]
    }
  }
}
```

---

### Conversation Intelligence

#### Transcribe Call
```http
POST /api/conversation/transcribe
```

**Request Body:**
```json
{
  "callId": "call_123",
  "audioUrl": "https://storage.rez.atlas/calls/call_123.mp3",
  "participants": [
    { "role": "agent", "name": "John" },
    { "role": "contact", "name": "Sarah Chen" }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "conversationId": "conv_456",
    "status": "processing",
    "duration": 1800,
    "estimatedCompletion": "2026-06-09T10:05:00Z"
  }
}
```

---

#### Get Conversation Analysis
```http
GET /api/conversation/{conversationId}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "conv_456",
    "duration": 1800,
    "sentiment": {
      "overall": "positive",
      "timeline": [
        { "time": 0, "sentiment": "neutral" },
        { "time": 300, "sentiment": "positive" },
        { "time": 900, "sentiment": "negative" },
        { "time": 1800, "sentiment": "positive" }
      ]
    },
    "objections": [
      { "text": "Too expensive", "category": "pricing", "count": 3 },
      { "text": "Need to check with team", "category": "authority", "count": 2 }
    ],
    "metrics": {
      "talkRatio": { "agent": 45, "contact": 55 },
      "questionsAsked": 12,
      "objectionCount": 5
    },
    "summary": "Contact expressed interest but has concerns about pricing...",
    "coachingPoints": [
      "Address ROI calculation earlier in conversation",
      "Offer flexible payment terms"
    ]
  }
}
```

---

## Rate Limits

| Tier | Requests/minute | Requests/day |
|------|-----------------|--------------|
| Free | 10 | 100 |
| Starter | 60 | 5,000 |
| Professional | 300 | 50,000 |
| Enterprise | 1,000 | Unlimited |

---

## Webhooks

Configure webhooks to receive real-time notifications:

```json
{
  "url": "https://your-server.com/webhook",
  "events": [
    "opportunity.stage_changed",
    "opportunity.won",
    "meeting.booked",
    "qualification.completed"
  ],
  "secret": "your-webhook-secret"
}
```

---

**Last Updated:** June 9, 2026
**Version:** 2.0.0
