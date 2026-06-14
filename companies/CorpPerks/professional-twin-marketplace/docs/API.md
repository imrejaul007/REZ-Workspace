# TwinOS API Documentation

**Version:** 1.0.0
**Base URL:** `http://localhost:4760`
**Authentication:** Bearer token in `Authorization` header

---

## Overview

TwinOS Professional Twin Marketplace API enables:
- Professional Twin management (create, read, update, archive)
- Marketplace browsing and search
- Hiring workflow (request, approve, reject, revoke)
- Privacy controls and export
- Memory integration
- Analytics and insights

---

## Authentication

All endpoints require the `x-internal-token` header:
```
x-internal-token: corpid-internal-token
```

For protected endpoints, include JWT token:
```
Authorization: Bearer <jwt_token>
```

---

## Health

### Health Check
```
GET /health
```

Response:
```json
{
  "status": "ok",
  "service": "professional-twin-marketplace",
  "version": "1.0.0",
  "tagline": "The World's First Talent Twin Marketplace",
  "timestamp": "2026-06-10T00:00:00.000Z"
}
```

### Readiness Check
```
GET /health/ready
```

Response:
```json
{
  "status": "ready",
  "mongodb": "connected",
  "stats": {
    "totalTwins": 1250
  }
}
```

---

## Twins

### Create Twin
```
POST /twins
```

Request:
```json
{
  "ownerCorpId": "CI-IND-001",
  "ownerName": "John Doe",
  "ownerEmail": "john@example.com",
  "twinType": "KNOWLEDGE",
  "initialKnowledge": {
    "domains": ["Engineering"],
    "expertise": ["Python", "JavaScript"]
  }
}
```

Response:
```json
{
  "success": true,
  "data": {
    "twinId": "TWIN-CI-IND-001-KNOWLEDGE",
    "twinType": "KNOWLEDGE",
    "status": "TRAINING",
    "ownership": {
      "ownedBy": "EMPLOYEE",
      "portability": true
    }
  }
}
```

### Create Twin Set
Create all 5 twins for an employee:
```
POST /twins/create-set
```

Request:
```json
{
  "ownerCorpId": "CI-IND-001",
  "ownerName": "John Doe",
  "role": "Senior Engineer",
  "skills": ["Python", "JavaScript", "AWS"],
  "department": "Engineering"
}
```

### Get Twin
```
GET /twins/:twinId
```

### Get Owner Twins
```
GET /twins/owner/:corpId
```

Response:
```json
{
  "success": true,
  "data": {
    "ownerCorpId": "CI-IND-001",
    "twinCount": 5,
    "combinedProductivity": "8.5",
    "twins": [
      {
        "twinId": "TWIN-CI-IND-001-KNOWLEDGE",
        "twinType": "KNOWLEDGE",
        "twinTypeName": "Knowledge Twin",
        "status": "ACTIVE",
        "metrics": {
          "productivityMultiplier": 1.5,
          "knowledgeScore": 85,
          "executionScore": 60,
          "reliabilityScore": 92,
          "combinedScore": 79
        }
      }
    ]
  }
}
```

### Update Twin
```
PATCH /twins/:twinId
```

Request:
```json
{
  "metrics.knowledgeScore": 90
}
```

### Learn from Event
```
PATCH /twins/:twinId/learn
```

Request:
```json
{
  "source": "SKILLNET",
  "dataPoints": 1,
  "metrics": {
    "knowledgeScore": 5
  },
  "knowledge": {
    "expertise": ["TypeScript"]
  }
}
```

### Archive Twin
```
DELETE /twins/:twinId
```

### Twin Types
```
GET /twins/meta/types
```

---

## Marketplace

### Search Twins
```
GET /marketplace/search
```

Query Parameters:
| Param | Type | Description |
|-------|------|-------------|
| query | string | Search text |
| twinType | string | Filter by type |
| skills | string | Comma-separated skills |
| minScore | number | Minimum combined score |
| minProductivity | number | Minimum productivity |
| page | number | Page number |
| limit | number | Results per page |

Example:
```
GET /marketplace/search?query=engineering&twinType=SKILL&minScore=70
```

### Featured Twins
```
GET /marketplace/featured?limit=10
```

### Browse by Category
```
GET /marketplace/categories
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "twinType": "KNOWLEDGE",
      "name": "Knowledge Twins",
      "description": "Domain experts with deep knowledge",
      "count": 250,
      "avgScore": 78,
      "avgProductivity": 1.8,
      "topSkills": ["Python", "System Design", "ML"]
    }
  ]
}
```

### View Twin Profile
```
GET /marketplace/:twinId
```

### Compare Twins
```
POST /marketplace/compare
```

Request:
```json
{
  "twinIds": [
    "TWIN-CI-IND-001-KNOWLEDGE",
    "TWIN-CI-IND-002-SKILL"
  ]
}
```

---

## Hiring

### Request Access
```
POST /hire
```

Request:
```json
{
  "twinId": "TWIN-CI-IND-001-SKILL",
  "companyCorpId": "CI-BIZ-001",
  "companyName": "TechCorp",
  "accessType": "USE"
}
```

### Approve/Reject Request
```
PATCH /hire/:grantId
```

Request:
```json
{
  "action": "approve",
  "employeeCorpId": "CI-IND-001"
}
```

Actions: `approve`, `reject`

### Get Pending Requests (for employee)
```
GET /hire/pending/:ownerCorpId
```

### Get Active Hires (for company)
```
GET /hire/active/:companyCorpId
```

Response:
```json
{
  "success": true,
  "data": {
    "activeTwins": 3,
    "totalProductivityMultiplier": "6.9",
    "access": [
      {
        "grantId": "GRANT-ABC123",
        "twinId": "TWIN-CI-IND-001-SKILL",
        "ownerName": "John Doe",
        "accessType": "USE",
        "employmentStartDate": "2026-01-15",
        "usage": {
          "totalInvocations": 247,
          "avgSatisfaction": 4.5
        }
      }
    ]
  }
}
```

### Log Invocation
```
POST /hire/:grantId/invoke
```

Request:
```json
{
  "satisfaction": 4.5,
  "taskType": "code_review"
}
```

### Revoke Access
```
DELETE /hire/:grantId
```

### Bulk Hire
```
POST /hire/bulk
```

Request:
```json
{
  "ownerCorpId": "CI-IND-001",
  "companyCorpId": "CI-BIZ-001",
  "companyName": "TechCorp",
  "twinTypes": ["KNOWLEDGE", "SKILL", "EXECUTION"]
}
```

---

## Privacy

### Get Privacy Settings
```
GET /privacy/:twinId?requesterCorpId=CI-IND-001
```

### Update Privacy Settings
```
PATCH /privacy/:twinId
```

Request:
```json
{
  "ownerCorpId": "CI-IND-001",
  "settings": {
    "shareWithCurrentEmployer": false,
    "showInResume": true
  }
}
```

### Apply Privacy Preset
```
POST /privacy/:twinId/preset
```

Request:
```json
{
  "ownerCorpId": "CI-IND-001",
  "preset": "jobSearch"
}
```

Presets: `maximum`, `balanced`, `open`, `jobSearch`

### Get Access Log
```
GET /privacy/:twinId/access-log?ownerCorpId=CI-IND-001
```

### Emergency Revoke All
```
POST /privacy/:twinId/revoke-all
```

Request:
```json
{
  "ownerCorpId": "CI-IND-001"
}
```

---

## Export

### Export Complete Twin
```
GET /export/:twinId/complete?ownerCorpId=CI-IND-001
```

Response:
```json
{
  "success": true,
  "data": {
    "exportMetadata": {
      "exportedAt": "2026-06-10T00:00:00.000Z",
      "twinId": "TWIN-CI-IND-001-KNOWLEDGE",
      "signature": "base64signature",
      "exportId": "EXP-abc123"
    },
    "ownership": {
      "ownedBy": "EMPLOYEE",
      "transferRights": true,
      "portability": true
    },
    "twin": {
      "twinId": "TWIN-CI-IND-001-KNOWLEDGE",
      "twinType": "KNOWLEDGE",
      "status": "ACTIVE"
    },
    "metrics": {...},
    "knowledge": {...},
    "privacy": {...}
  }
}
```

### Export All Twins for Owner
```
GET /export/owner/:corpId/all
```

### Job Change Export
```
GET /export/job-change/:corpId?targetCompany=NewEmployer
```

### Import Twin Package
```
POST /export/import
```

Request:
```json
{
  "exportPackage": {...},
  "targetOwnerCorpId": "CI-IND-002"
}
```

---

## Memory

### Check Memory Bridge Health
```
GET /memory/bridge/status
```

### Sync Memories to Twin
```
POST /memory/:twinId/sync
```

### Get Twin Memories
```
GET /memory/:twinId/memories?query=project&limit=20
```

### Store New Memory
```
POST /memory/:twinId/memories
```

Request:
```json
{
  "content": "Completed Phase 1 deployment",
  "type": "MILESTONE",
  "tags": ["deployment", "milestone"],
  "importance": "high"
}
```

### Learning Summary
```
GET /memory/:twinId/learning-summary
```

---

## Analytics

### Platform Analytics
```
GET /analytics/workforce
```

Response:
```json
{
  "success": true,
  "data": {
    "platform": {
      "totalTwins": 1250,
      "activeTwins": 980,
      "totalHires": 450,
      "activeHires": 320,
      "avgProductivityMultiplier": "2.3"
    },
    "byType": {
      "KNOWLEDGE": 280,
      "SKILL": 320,
      "EXECUTION": 250,
      "PRODUCTIVITY": 200,
      "CAREER": 200
    },
    "insights": {
      "totalProductivityGain": 3150,
      "marketplaceActivity": "320/450 active hires",
      "trainingProgress": "78% twins fully trained"
    }
  }
}
```

### Twin Analytics
```
GET /analytics/:twinId
```

### Owner Analytics
```
GET /analytics/owner/:corpId
```

### Company Analytics
```
GET /analytics/company/:companyCorpId
```

### Market Trends
```
GET /analytics/trends/marketplace
```

---

## Twin Types

| Type | Purpose | Productivity | Learn From |
|------|---------|--------------|------------|
| KNOWLEDGE | What you know | 1.5x | SkillNet, Work, Memory |
| SKILL | What you can do | 2.5x | SkillNet, Feedback, Projects |
| CAREER | Where you're going | 1.0x | Work, Goals, Feedback |
| PRODUCTIVITY | How you work | 1.5x | Work patterns, Calendar |
| EXECUTION | What you delegate | 3.0x | Projects, Performance |

---

## Error Codes

| Code | Description |
|------|-------------|
| UNAUTHORIZED | Missing or invalid authentication |
| FORBIDDEN | Insufficient permissions |
| NOT_FOUND | Resource not found |
| ALREADY_EXISTS | Duplicate resource |
| ALREADY_HIRED | Company already has access |
| INVALID_TWIN_TYPE | Invalid twin type |
| RATE_LIMITED | Too many requests |
| INTERNAL_ERROR | Server error |

---

## Rate Limits

- Default: 100 requests/minute
- Search: 50 requests/minute
- Write operations: 30 requests/minute

---

## Webhooks

Subscribe to events:
```
POST /webhooks/subscribe
```

Request:
```json
{
  "url": "https://your-server.com/webhook",
  "events": ["twin.created", "twin.hired", "twin.learned"]
}
```

Events:
- `twin.created` - New twin created
- `twin.updated` - Twin metrics updated
- `twin.hired` - Company hired twin
- `twin.learned` - Twin learned new skill
- `hire.requested` - New hire request
- `hire.approved` - Hire request approved
- `hire.rejected` - Hire request rejected
- `privacy.changed` - Privacy settings changed
