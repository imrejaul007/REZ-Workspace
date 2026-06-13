# Fitness OS - Features

**Status:** ✅ BUILT | **Port:** 5110 | **Updated:** June 14, 2026

---

## Digital Twins

### Member Twin
- Fitness goals
- Health metrics
- Progress tracking
- Injury history
- Class history
- Achievement badges

### Trainer Twin
- Certifications
- Specializations
- Availability
- Client roster
- Performance ratings

### Equipment Twin
- Equipment status
- Maintenance schedule
- Usage analytics
- Warranty tracking
- Replacement planning

### Class Twin
- Class schedule
- Capacity management
- Instructor assignment
- Waitlist handling
- Cancellation policies

---

## AI Agents

### Membership Agent
- Lead conversion
- Plan recommendations
- Upgrade suggestions
- Retention prediction

### ClassBooking Agent
- Class scheduling
- Instructor matching
- Waitlist management
- Conflict resolution

### FitnessCoach Agent
- Workout plans
- Exercise demonstrations
- Progression tracking
- Goal adjustment

### CheckIn Agent
- Facility access
- Attendance tracking
- Member recognition
- Guest management

### Retention Agent
- Churn prediction
- Engagement scoring
- Re-engagement campaigns
- Win-back offers

---

## API Endpoints

### Core
- `GET /health` - Health check
- `GET /api/twins` - List all twins
- `GET /api/agents` - List all agents

### Members
- `POST /api/members` - Add member
- `GET /api/members/:id` - Get member
- `GET /api/members/:id/progress` - Progress data

### Classes
- `GET /api/classes` - List classes
- `POST /api/classes` - Create class
- `POST /api/classes/:id/book` - Book class
- `GET /api/classes/:id/waitlist` - Waitlist

### Trainers
- `GET /api/trainers` - List trainers
- `POST /api/trainers` - Add trainer
- `PUT /api/trainers/:id/schedule` - Update schedule

---

## Integrations

| Service | Integration Type | Purpose |
|---------|-----------------|---------|
| RTMN Hub | HTTP | Central orchestration |
| AgentOS | HTTP | Agent invocation |
| Wearables | External | Health data |
| Agriculture OS | Event | Nutrition |

---

## Quick Start

```bash
cd industries/fitness-os
npm install
node src/index.js
# Runs on http://localhost:5110
```