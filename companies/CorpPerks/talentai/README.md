# TalentOS - AI-Powered Workforce OS

**Tagline:** "AI Employees That Work 24/7"

TalentOS is a comprehensive workforce operating system with AI agents that handle recruitment, onboarding, performance, payroll, and employee engagement.

## What's Built

### Pages (30+)
- Dashboard
- Recruiter
- Marketing
- Finance
- Settings
- Jobs, Candidate, Marketplace
- Profile, Interview, Company
- Performance, Training, Analytics
- Documents, Benefits, Calendar
- Integrations

### AI Agents (10)

| Port | Service | Purpose |
|------|---------|---------|
| 4011 | Recruiter Agent | Source, screen, schedule |
| 4012 | Interviewer Agent | Conduct interviews, score |
| 4013 | Onboarding Agent | Guide new hires |
| 4014 | Payroll Agent | Auto-calculate salary |
| 4015 | Helpdesk Agent | Answer queries |
| 4016 | Analytics Agent | Workforce insights |
| 4017 | Goals Agent | OKRs, goal tracking |
| 4018 | Performance Agent | Reviews, ratings |
| 4019 | Training Agent | Learning paths |
| 4020 | Compliance Agent | Labor law compliance |
| 4021 | Engagement Agent | Pulse surveys, sentiment |

### Tech Stack
- Frontend: Next.js 14, TailwindCSS, TypeScript
- Backend: Node.js, Express, TypeScript
- Database: PostgreSQL (for production)
- AI: Claude AI integration ready

## Quick Start

```bash
cd CorpPerks/talentai

# Install dependencies
npm install

# Start all services
npm run dev
```

## Environment

```bash
# .env
PORT=4000
DATABASE_URL=postgresql://localhost:5432/talentos
ANTHROPIC_API_KEY=your-key
```

## API Endpoints

### Main API (Port 4000)
- GET /health - Service health
- GET /api/employees - List employees
- POST /api/employees - Create employee
- GET /api/dashboard - Dashboard data

### Agent APIs (Ports 4011-4021)
- GET /health - Agent health
- POST /chat - Chat with agent
- GET /dashboard - Agent dashboard

## Features

### AI Agents
- **Recruiter**: Source candidates, screen resumes, schedule interviews
- **Interviewer**: Conduct structured interviews, score candidates
- **Onboarding**: Guide new hires through onboarding checklist
- **Payroll**: Auto-calculate salary, deductions, disburse
- **Helpdesk**: Answer employee questions, create tickets
- **Analytics**: Workforce analytics, insights, predictions
- **Goals**: OKRs, goal tracking, performance alignment
- **Performance**: Reviews, ratings, career development
- **Training**: Learning paths, courses, certifications
- **Compliance**: Labor law compliance, document verification
- **Engagement**: Pulse surveys, sentiment analysis
