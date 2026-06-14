# Insight Campus - Student Infrastructure Platform

**Part of:** CorpPerks Ecosystem
**Persona:** `student`
**Positioning:** Student Infrastructure Platform (NOT college social media)

---

## Overview

Insight Campus is NOT a student social media app.

It's a **Student Infrastructure Platform** that combines:
- Private campus layer (verified students only)
- Public knowledge network (community, learning)
- Career services (internships, jobs)
- Student economy (marketplace, tutoring)

---

## Position vs Traditional Student Apps

| Traditional App | Insight Campus |
|----------------|---------------|
| One feature only | All-in-one platform |
| College social media | Student infrastructure |
| Job board | Career + Education + Community |
| Separate apps | Unified student hub |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ INSIGHT CAMPUS - STUDENT INFRASTRUCTURE │
├─────────────────────────────────────────────────────────────┤
│ │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ LAYER 1: PRIVATE CAMPUS INFRASTRUCTURE │ │
│ │ (Verified Students Only) │ │
│ │ ├── Class Groups │ │
│ │ ├── Subject Groups │ │
│ │ ├── Notes & Materials │ │
│ │ ├── Assignments │ │
│ │ ├── Attendance │ │
│ │ ├── Notices │ │
│ │ └── Faculty Interaction │ │
│ └─────────────────────────────────────────────────────┘ │
│ │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ LAYER 2: PUBLIC KNOWLEDGE NETWORK │ │
│ │ ├── Doubt Solving │ │
│ │ ├── Study Discussions │ │
│ │ ├── Career Guidance │ │
│ │ ├── Mentorship │ │
│ │ ├── Project Collaboration │ │
│ │ └── Alumni Network │ │
│ └─────────────────────────────────────────────────────┘ │
│ │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ LAYER 3: CAREER ECOSYSTEM │ │
│ │ ├── Internships │ │
│ │ ├── Resume Builder │ │
│ │ ├── Skills Tracker │ │
│ │ ├── Certifications │ │
│ │ └── AI Career Matching │ │
│ └─────────────────────────────────────────────────────┘ │
│ │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ LAYER 4: STUDENT ECONOMY │ │
│ │ ├── Marketplace │ │
│ │ ├── Tutoring │ │
│ │ ├── Book Exchange │ │
│ │ └── Notes Marketplace │ │
│ └─────────────────────────────────────────────────────┘ │
│ │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ LAYER 5: STUDENT BENEFITS │ │
│ │ ├── Discounts │ │
│ │ ├── Cashback │ │
│ │ ├── Software Deals │ │
│ │ ├── Food Offers │ │
│ │ └── Learning Resources │ │
│ └─────────────────────────────────────────────────────┘ │
│ │
└─────────────────────────────────────────────────────────────┘
```

---

## Layer 1: Private Campus Infrastructure

### Only for verified college students

#### Class Groups
- [ ] Auto-create groups by subject/year
- [ ] Class announcements
- [ ] Study materials
- [ ] Class notes

#### Academic Tools
- [ ] Notes upload & sharing
- [ ] Assignment tracker
- [ ] Attendance tracking
- [ ] Exam schedule
- [ ] Faculty notices
- [ ] Recorded lectures

#### Why This Matters
Creates **daily engagement** - students come back every day for classes, assignments, notes.

---

## Layer 2: Public Knowledge Network

### For all students (public)

#### Doubt Solving
- [ ] Post questions
- [ ] Get answers
- [ ] Upvote best answers
- [ ] Mark as solved
- [ ] AI doubt assistant

#### Study Discussions
- [ ] Topic-based discussions
- [ ] Study groups
- [ ] Project collaboration
- [ ] Peer learning

#### Career Guidance
- [ ] Industry discussions
- [ ] Interview experiences
- [ ] Resume reviews
- [ ] Career advice

#### Mentorship
- [ ] Connect with alumni
- [ ] Industry mentors
- [ ] Career guidance
- [ ] Mock interviews

#### Why This Matters
Creates **network effects** - more students = more knowledge = more valuable.

---

## Layer 3: Career Ecosystem

### Connects to Talent Platform

#### Internships & Jobs
- [ ] Browse internships (AI-matched)
- [ ] Browse fresher jobs
- [ ] Apply with profile
- [ ] Track applications
- [ ] AI match explanations

#### Resume Builder
- [ ] AI-powered resume
- [ ] Template library
- [ ] Skill suggestions
- [ ] Project showcase
- [ ] Export to PDF

#### Skills Tracker
- [ ] Add skills
- [ ] Track progress
- [ ] Get recommendations
- [ ] Certifications
- [ ] Connect to Career Graph

#### AI Career Guidance
- [ ] "What should I learn?"
- [ ] "Which companies match my profile?"
- [ ] "Skill gap analysis"
- [ ] "Career path suggestions"

---

## Layer 4: Student Economy

### Marketplace for students

#### Marketplace
- [ ] Sell items (books, electronics)
- [ ] Buy from other students
- [ ] Verified student sellers
- [ ] Secure payments

#### Tutoring Services
- [ ] Offer tutoring
- [ ] Find tutors
- [ ] Subject expertise
- [ ] Reviews & ratings

#### Book Exchange
- [ ] List books
- [ ] Exchange/sell
- [ ] Book reviews
- [ ] Syllabus books

#### Notes Marketplace
- [ ] Sell notes
- [ ] Buy quality notes
- [ ] Ratings & reviews
- [ ] Author earnings

---

## Layer 5: Student Benefits

### From REZ Ecosystem

#### Discounts & Cashback
- [ ] Student-exclusive discounts
- [ ] Cashback on purchases
- [ ] REZ Coins
- [ ] Partner offers

#### Software Deals
- [ ] GitHub Student Pack style
- [ ] Cloud credits
- [ ] Learning platforms
- [ ] Design tools

#### Food & Lifestyle
- [ ] Restaurant discounts
- [ ] Food delivery
- [ ] Gym offers
- [ ] Entertainment

---

## Integration Points

### REZ Profile Service
```typescript
// Activate student persona
POST /api/personas/activate
  → { persona: 'student', verificationData: { eduEmail: '...', collegeId: '...' } }

// Get student extension
GET /api/personas/profile/:userId
  → { studentExtension: { college, skills, certifications } }
```

### REZ Career Graph
```typescript
// Get career data
GET /api/career/:userId
  → { education, skills, internships }

// Add skill
POST /api/career/:userId/skills
  → { name: 'React', level: 'intermediate' }

// Add certification
POST /api/career/:userId/certifications
```

### Talent Platform
```typescript
// Get matched internships
GET /api/jobs/recommended?candidateId=xxx&type=internship

// Apply
POST /api/applications
  → { jobId, candidateId }

// Track applications
GET /api/applications?candidateId=xxx
```

### REZ Rewards
```typescript
// Get student rewards
GET /api/rewards/student

// Earn REZ Coins
POST /api/rewards/earn
  → { source: 'doubt_solved', coins: 10 }
```

---

## Campus Graph

### What You'll Know About Students

```
Student Profile:
├── College & Course
├── Academic performance
├── Skills (from discussions, projects)
├── Interests & Intent
├── Communities joined
├── Projects completed
├── Internships
├── Certifications
├── Career goals
└── Engagement patterns
```

### This Creates

| Data Asset | Use Case |
|------------|---------|
| Skill Graph | AI matching |
| Career Trajectory | Hiring insights |
| Community Graph | Recommendations |
| Education Network | Peer learning |
| Engagement Signals | Seriousness score |

---

## UI Structure

```
/insight-campus
│
├── /dashboard
│   └── Daily overview, tasks, announcements
│
├── /campus (Private - Verified)
│   ├── /classes
│   ├── /notes
│   ├── /assignments
│   ├── /attendance
│   └── /notices
│
├── /community (Public)
│   ├── /discussions
│   ├── /doubts
│   ├── /mentors
│   └── /projects
│
├── /career
│   ├── /internships
│   ├── /jobs
│   ├── /resume
│   ├── /skills
│   └── /events
│
├── /marketplace
│   ├── /browse
│   ├── /sell
│   ├── /tutoring
│   └── /books
│
├── /benefits
│   └── /offers
│
└── /profile
    └── /my-campus
```

---

## Why This Is Powerful

### The Flywheel

```
More Students
     ↓
More Campus Engagement (daily)
     ↓
More Knowledge Content
     ↓
Better Career Matching
     ↓
Better Internships/Jobs
     ↓
More Value
     ↓
More Students (cycle repeats)
```

### Your Moat

Most apps solve ONE problem.

Insight Campus solves ALL student problems:
- Academics
- Community
- Career
- Economy
- Benefits

And it connects to your entire ecosystem.

---

## Technical Stack

| Component | Technology |
|-----------|-----------|
| Frontend | Next.js |
| Mobile | React Native |
| Backend | Node.js + Express |
| Database | MongoDB |
| Cache | Redis |
| Search | MongoDB + Vector |
| AI | REZ Intelligence |
| Auth | REZ Auth Service |
| Payments | REZ Wallet |

---

## Environment Variables

```bash
PORT=4023
MONGODB_URI=mongodb://localhost:27017/insight-campus

# Services
PROFILE_SERVICE_URL=http://localhost:4001
CAREER_GRAPH_URL=http://localhost:4055
TALENT_PLATFORM_URL=http://localhost:4020
REZ_REWARDS_URL=http://localhost:4008
INTENT_GRAPH_URL=http://localhost:3001

# Auth
INTERNAL_SERVICE_TOKEN=xxx
```

---

## Build Order

### Phase 1: Core Engagement
1. Student verification (edu email)
2. Private campus groups
3. Notes sharing
4. Basic discussions

### Phase 2: Career
1. Resume builder
2. Internship listings
3. AI matching
4. Applications

### Phase 3: Community
1. Doubt solving
2. Study groups
3. Mentorship
4. Career discussions

### Phase 4: Economy
1. Marketplace
2. Tutoring
3. Book exchange

### Phase 5: Benefits
1. Student discounts
2. Software deals
3. REZ Coins integration

---

## Positioning

Do NOT market as:
- "College social media"
- "Student app"
- "Campus community"

DO market as:
- **Student Infrastructure Platform**
- **Your Complete Student Hub**
- **Where Students Build Careers**

---

## Competitive Position

| Competitor | Only Does |
|------------|----------|
| LinkedIn | Careers |
| Coursera | Courses |
| Discord | Communities |
| Handshake | Student careers |
| Reddit | Discussions |

**Insight Campus does ALL of this.**

---

**Document Version:** 1.0.0
**Last Updated:** May 16, 2026
