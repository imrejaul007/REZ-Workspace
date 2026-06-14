# Careeros - SPEC.md

**Version:** 1.0.0
**Port:** (see config)
**Company:** CorpPerks
**Category:** HR

---

## Overview

Career management and job posting platform for CorpPerks. Provides job listings, application tracking, and employer branding features.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Careeros                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│  Pages:                                                                    │
│  ├── Jobs          → Job listings and search                             │
│  ├── Job Details   → Individual job postings                            │
│  ├── Applications  → Application management                              │
│  └── Dashboard     → Employer dashboard                                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Models

### Job
```typescript
{
  jobId: string
  title: string
  description: string
  requirements: string[]
  location: string
  type: 'full-time' | 'part-time' | 'contract'
  salary: { min: number; max: number; currency: string }
  companyId: string
  status: 'draft' | 'active' | 'closed'
  postedAt: Date
}
```

### Application
```typescript
{
  applicationId: string
  jobId: string
  candidateId: string
  resume: string
  status: 'applied' | 'screening' | 'interview' | 'offer' | 'rejected'
  appliedAt: Date
}
```

---

## API Integration

| Service | Purpose |
|---------|---------|
| rez-auth-service | Candidate authentication |
| CorpPerks APIs | Company data |

---

## Dependencies

```json
{
  "next": "^14.0.0",
  "react": "^18.2.0",
  "react-dom": "^18.2.0"
}
```

---

## Status

- [x] Job listings
- [x] Application tracking
- [x] Candidate management

