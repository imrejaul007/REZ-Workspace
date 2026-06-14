# TalentAI - Career Intelligence Platform Features

**Product:** TalentAI
**Version:** 4.0.0
**URL:** https://talentai.corpperks.com
**Framework:** Next.js 14
**Last Updated:** June 12, 2026

---

## Overview

TalentAI is an AI-powered career intelligence platform that helps employees discover career paths, develop skills, and advance their careers with personalized guidance from AI agents.

---

## Core Features

### Career Discovery
| Feature | Description | Status |
|---------|-------------|--------|
| Career Path Mapping | Visual career progression paths | ✅ |
| Skill Gap Analysis | Identify skills needed for target roles | ✅ |
| AI Career Coach | Personalized career guidance | ✅ |
| Role Exploration | Detailed role descriptions and requirements | ✅ |
| Industry Insights | Market trends and salary data | ✅ |
| Competency Framework | Skills and competencies library | ✅ |

### Skill Development
| Feature | Description | Status |
|---------|-------------|--------|
| Personalized Learning | AI-recommended courses | ✅ |
| Learning Paths | Structured skill development journeys | ✅ |
| Skill Tracking | Progress tracking for acquired skills | ✅ |
| Certification Support | Track professional certifications | ✅ |
| Micro-learning | Short learning modules | ✅ |
| Peer Learning | Connect with learning buddies | ✅ |

### AI Agents (TalentAI Specific)
| Feature | Description | Status |
|---------|-------------|--------|
| Career Coach Agent | Career path and advice | ✅ |
| Skill Recommender | Course and resource suggestions | ✅ |
| Resume Analyzer | Resume optimization tips | ✅ |
| Interview Coach | Mock interview practice | ✅ |
| Goal Tracker | Career goal progress monitoring | ✅ |
| Mentor Matcher | Connect with internal mentors | ✅ |

### Performance Integration
| Feature | Description | Status |
|---------|-------------|--------|
| OKR Alignment | Align personal goals with company OKRs | ✅ |
| Feedback Integration | Performance feedback display | ✅ |
| Competency Assessment | Self-assessment tools | ✅ |
| 360 Feedback | Multi-source feedback collection | ✅ |

### Talent Marketplace
| Feature | Description | Status |
|---------|-------------|--------|
| Internal Mobility | Internal job postings | ✅ |
| Project Opportunities | Gig/project matching | ✅ |
| Skill Badges | Verified skill endorsements | ✅ |
| Portfolio Builder | Showcase achievements | ✅ |
| Peer Recognition | Recognition from colleagues | ✅ |

---

## Screens & Pages

### Dashboard
- `/dashboard` - Career overview and AI insights
- `/dashboard/skills` - Skills snapshot
- `/dashboard/goals` - Career goals tracker
- `/dashboard/recommendations` - AI recommendations

### Career Paths
- `/career-paths` - Browse career paths
- `/career-paths/[id]` - Career path detail
- `/career-paths/explore` - Explore different roles
- `/career-paths/compare` - Compare career options

### Skills
- `/skills` - Skills inventory
- `/skills/gap` - Skill gap analysis
- `/skills/track` - Track skill progress
- `/skills/certifications` - Certifications
- `/skills/badges` - Earned badges

### Learning
- `/learning` - Learning recommendations
- `/learning/paths` - Learning paths
- `/learning/courses` - Course catalog
- `/learning/progress` - Learning progress
- `/learning/history` - Completed learning

### AI Agents
- `/ai/career-coach` - Career Coach chat
- `/ai/resume-analyzer` - Resume analysis
- `/ai/interview-prep` - Interview preparation
- `/ai/mentor-match` - Find mentors

### Performance
- `/performance` - Performance overview
- `/performance/okrs` - Personal OKRs
- `/performance/feedback` - Feedback received
- `/performance/reviews` - Review history

### Marketplace
- `/marketplace` - Internal opportunities
- `/marketplace/jobs` - Internal job board
- `/marketplace/projects` - Project board
- `/marketplace/portfolio` - My portfolio

### Profile
- `/profile` - Career profile
- `/profile/resume` - Resume builder
- `/profile/achievements` - Achievements
- `/profile/analytics` - Career analytics

### Settings
- `/settings` - App settings
- `/settings/notifications` - Notification preferences
- `/settings/privacy` - Privacy settings
- `/settings/goals` - Goal preferences

---

## Integrations

### Internal Services
| Service | Integration | Status |
|---------|-------------|--------|
| api-gateway | REST API | ✅ |
| backend | Employee data | ✅ |
| lms-service | Learning content | ✅ |
| performance-service | Performance data | ✅ |
| okr-service | OKR alignment | ✅ |
| ai-agents-service | AI agents | ✅ |
| role-ai-agents | Career AI agents | ✅ |
| corpperks-intelligence | AI engine | ✅ |
| push-service | Notifications | ✅ |

### External Integrations
| Service | Purpose | Status |
|---------|---------|--------|
| CorpID | Identity | ✅ |
| HOJAI AI | AI capabilities | ✅ |
| PeopleOS | Employee data sync | ✅ |

---

## API Endpoints

### Career
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/career/paths` | GET | Get career paths |
| `/api/v1/career/skills` | GET | Get skills inventory |
| `/api/v1/career/gap` | POST | Analyze skill gap |
| `/api/v1/career/recommendations` | GET | Get recommendations |

### Learning
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/learning/paths` | GET | Get learning paths |
| `/api/v1/learning/enroll` | POST | Enroll in course |
| `/api/v1/learning/progress` | GET | Get progress |
| `/api/v1/learning/complete` | POST | Mark complete |

### AI Agents
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/ai/career-coach` | POST | Chat with career coach |
| `/api/v1/ai/resume-analyze` | POST | Analyze resume |
| `/api/v1/ai/interview-prep` | POST | Get interview prep |

### Performance
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/performance/okrs` | GET | Get personal OKRs |
| `/api/v1/performance/feedback` | GET | Get feedback |
| `/api/v1/performance/reviews` | GET | Get reviews |

---

## Technology Stack

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **UI:** React 18, Tailwind CSS
- **State:** Zustand, React Query
- **AI Chat:** Custom chat UI with streaming
- **Charts:** Recharts for analytics

### Backend Communication
- **API Client:** Fetch with auth interceptor
- **Real-time:** WebSocket for AI responses
- **Auth:** JWT with CorpID

---

## Related Documentation

- [CorpPerks README](/README.md) - Main documentation
- [talentai-app FEATURES.md](/docs/talentai-app/FEATURES.md) - Mobile app features
- [AI Agents System](/README.md#ai-agents-system) - AI agents documentation

---

*Last Updated: June 12, 2026*
*CorpPerks - Career Intelligence*