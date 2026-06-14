# REZ Talent Infrastructure - Specification

**Part of:** CorpPerks Ecosystem
**Depends on:** REZ Profile Service, REZ Intelligence, Career Graph
**Purpose:** Shared talent backend for all hiring-related features

---

## Overview

The Talent Infrastructure is a **shared backend** that powers all hiring-related features across CorpPerks apps:

| App | Uses Talent Infrastructure For |
|-----|-------------------------------|
| Insight Campus | Student internships, fresher jobs |
| HR App | Corporate hiring, workforce management |
| RestoPapa | Hospitality hiring |
| CorpPerks | Employee referrals |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ REZ TALENT INFRASTRUCTURE │
├─────────────────────────────────────────────────────────────┤
│ │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ TALENT CORE │ │
│ │ ├── Candidate Profiles │ │
│ │ ├── Job Postings │ │
│ │ ├── Applications │ │
│ │ ├── ATS │ │
│ │ └── Talent Graph │ │
│ └─────────────────────────────────────────────────────┘ │
│ │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ TALENT SERVICES │ │
│ │ ├── Job Matching Engine │ │
│ │ ├── Resume Parser │ │
│ │ ├── Skill Matcher │ │
│ │ └── Recruiter Dashboard │ │
│ └─────────────────────────────────────────────────────┘ │
│ │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ AI LAYER (REZ Intelligence) │ │
│ │ ├── Career Graph │ │
│ │ ├── Skill Extraction │ │
│ │ ├── Match Scoring │ │
│ │ └── Intent Detection │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Models

### Candidate Profile

```typescript
interface CandidateProfile {
  userId: string; // REZ Profile userId
  
  // Links to existing services
  profileService: string; // REZ Profile
  careerGraph: string; // REZ Career Graph
  
  // Job-specific data
  resume: {
    fileUrl: string;
    parsed: ParsedResume;
    skills: string[];
    experience: WorkExperience[];
    education: Education[];
  };
  
  // Job preferences
  preferences: {
    roles: string[];
    locations: string[];
    salary: { min: number; max: number };
    workType: ('full_time' | 'part_time' | 'contract' | 'internship')[];
    remote: boolean;
  };
  
  // Status
  visibility: 'public' | 'private' | 'only_applied';
  jobSearchStatus: 'actively_looking' | 'passive' | 'not_looking';
  
  // Analytics
  profileStrength: number; // 0-100
  lastActive: Date;
  applicationCount: number;
}
```

### Job Posting

```typescript
interface JobPosting {
  id: string;
  
  // Job details
  title: string;
  description: string;
  requirements: string[];
  skills: string[];
  
  // Type & Location
  type: 'full_time' | 'part_time' | 'contract' | 'internship' | 'freelance';
  location: {
    city: string;
    state: string;
    remote: boolean;
    hybrid: boolean;
  };
  
  // Compensation
  salary: {
    min: number;
    max: number;
    currency: string;
    period: 'monthly' | 'yearly';
  };
  
  // Employer
  employer: {
    id: string;
    name: string;
    logo: string;
    type: 'company' | 'restaurant' | 'startup';
    verified: boolean;
  };
  
  // Meta
  source: 'insight_campus' | 'hr_app' | 'restopapa' | 'corpperks';
  status: 'draft' | 'active' | 'paused' | 'closed';
  views: number;
  applications: number;
  
  // Dates
  postedAt: Date;
  expiresAt: Date;
  startDate: Date;
}
```

### Application

```typescript
interface Application {
  id: string;
  
  // Links
  jobId: string;
  candidateId: string; // User ID
  employerId: string;
  
  // Status
  status: 'applied' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected' | 'withdrawn';
  stage: number;
  
  // Assessments
  resumeScore: number;
  skillMatchScore: number;
  overallScore: number;
  
  // Timeline
  appliedAt: Date;
  statusHistory: {
    status: string;
    changedAt: Date;
    changedBy: string;
    notes?: string;
  }[];
  
  // Feedback
  employerNotes?: string;
  candidateNotes?: string;
  rating?: number;
}
```

### ATS (Applicant Tracking)

```typescript
interface ATSPipeline {
  id: string;
  employerId: string;
  
  // Pipeline stages
  stages: {
    name: string;
    order: number;
    color: string;
    automations?: {
      type: 'email' | 'reminder' | 'score';
      config: any;
    }[];
  }[];
  
  // Default stages
  defaultStages: [
    { name: 'Applied', order: 0 },
    { name: 'Screening', order: 1 },
    { name: 'Interview', order: 2 },
    { name: 'Offer', order: 3 },
    { name: 'Hired', order: 4 }
  ];
}
```

---

## API Endpoints

### Candidate Profile

```
GET /api/talent/candidates/:userId
  → Get candidate profile

POST /api/talent/candidates
  → Create/update candidate profile

PATCH /api/talent/candidates/:userId/resume
  → Upload/update resume

GET /api/talent/candidates/:userId/analytics
  → Get profile analytics
```

### Jobs

```
GET /api/talent/jobs
  → List jobs (with filters)

POST /api/talent/jobs
  → Create job posting (employer only)

GET /api/talent/jobs/:id
  → Get job details

PATCH /api/talent/jobs/:id
  → Update job

DELETE /api/talent/jobs/:id
  → Close/delete job

GET /api/talent/jobs/recommended
  → Get recommended jobs for candidate
```

### Applications

```
POST /api/talent/apply
  → Apply for job

GET /api/talent/applications
  → List applications (candidate or employer)

GET /api/talent/applications/:id
  → Get application details

PATCH /api/talent/applications/:id/status
  → Update application status

POST /api/talent/applications/:id/notes
  → Add notes
```

### Matching

```
POST /api/talent/match/jobs
  → Match candidate to jobs

POST /api/talent/match/candidates
  → Match job to candidates

GET /api/talent/skills/extract
  → Extract skills from resume
```

### Recruiter (Employer)

```
GET /api/talent/employer/dashboard
  → Get employer dashboard

GET /api/talent/employer/pipeline/:jobId
  → Get hiring pipeline for job

POST /api/talent/employer/bulk-actions
  → Bulk update applications

GET /api/talent/employer/analytics
  → Get hiring analytics
```

---

## Features

### For Candidates (Insight Campus)

- [ ] Profile builder with REZ Profile integration
- [ ] Resume upload & parsing
- [ ] AI skill extraction
- [ ] Job recommendations (AI-matched)
- [ ] Application tracking
- [ ] Interview reminders
- [ ] Salary estimator
- [ ] Skill gap analysis

### For Employers (HR App)

- [ ] Job posting form
- [ ] Resume screening (AI-assisted)
- [ ] Pipeline management (ATS)
- [ ] Candidate search
- [ ] Bulk actions
- [ ] Hiring analytics
- [ ] Interview scheduling
- [ ] Offer management

### For RestoPapa (Hospitality)

- [ ] Quick job posting
- [ ] Staff requirement tracking
- [ ] Experience-based hiring
- [ ] Interview templates
- [ ] Onboarding checklist

### AI Features (REZ Intelligence)

- [ ] Resume parsing
- [ ] Skill extraction
- [ ] Match scoring (0-100)
- [ ] Candidate ranking
- [ ] Job description optimization
- [ ] Salary prediction
- [ ] Interview question suggestions
- [ ] Career path recommendations

---

## Integration Points

### REZ Profile Service
```typescript
// Get user identity
GET /api/profile/:userId

// Get personas
GET /api/personas/:userId
  → Check if 'student' or 'employee' persona active

// Update persona extension
PATCH /api/personas/:userId/extension
```

### REZ Career Graph
```typescript
// Get career data
GET /api/career/:userId

// Search by skills
GET /api/career/search/skills?skills=React,Node

// Get analytics
GET /api/career/:userId/analytics
```

### REZ Intent Graph
```typescript
// Track job search intent
POST /api/intent/capture
  → { type: 'job_search', userId, data: { roles, skills } }

// Dormant job seeker detection
GET /api/intent/dormant/:userId
```

---

## Build Order

### Phase 1: Core (MVP)
1. Candidate profile model
2. Job posting model
3. Application model
4. Basic CRUD APIs
5. Simple matching (skills-based)

### Phase 2: Employer Features
1. Employer dashboard
2. ATS pipeline
3. Resume screening
4. Bulk actions
5. Analytics

### Phase 3: AI Features
1. Resume parsing
2. Skill extraction
3. Match scoring
4. Recommendations
5. Intent detection

### Phase 4: Integration
1. Insight Campus UI
2. HR App UI
3. RestoPapa integration
4. CorpPerks referrals

---

## Tech Stack

| Component | Technology |
|-----------|-----------|
| API | Node.js + Express |
| Database | MongoDB |
| Cache | Redis |
| Search | MongoDB text search |
| AI | REZ Intelligence |
| Auth | REZ Auth Service |
| Storage | S3 for resumes |

---

## Environment Variables

```bash
# Service
PORT=4020
NODE_ENV=production

# Database
MONGODB_URI=mongodb://localhost:27017/rez-talent

# Redis
REDIS_URL=redis://localhost:6379

# External Services
PROFILE_SERVICE_URL=http://localhost:4001
CAREER_GRAPH_URL=http://localhost:4055
INTENT_GRAPH_URL=http://localhost:3001

# Auth
INTERNAL_SERVICE_TOKEN=your-token

# Storage
AWS_S3_BUCKET=rez-talent-resumes
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
```

---

## Next Steps

1. Create `talent-platform/` directory structure
2. Initialize NestJS project
3. Create MongoDB models
4. Implement CRUD APIs
5. Add matching logic
6. Connect to REZ Profile & Career Graph
7. Build UI for Insight Campus

---

**Document Version:** 1.0.0
**Last Updated:** May 16, 2026
