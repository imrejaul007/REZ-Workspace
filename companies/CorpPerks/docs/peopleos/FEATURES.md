# PeopleOS - Workforce OS Features

**Product:** PeopleOS (Workforce OS)
**Version:** 4.0.0
**URL:** https://peopleos.corpperks.com
**Framework:** Next.js 14
**Last Updated:** June 12, 2026

---

## Overview

PeopleOS is the core Workforce OS of CorpPerks, providing a comprehensive HRMS solution for modern organizations. It handles employee management, organizational structure, time tracking, and all core HR operations.

---

## Core Features

### Employee Management
| Feature | Description | Status |
|---------|-------------|--------|
| Employee Directory | Searchable employee database with filters | ✅ |
| Employee Profiles | Detailed profiles with personal, work, and emergency info | ✅ |
| Org Chart | Visual organizational hierarchy | ✅ |
| Department Management | Create and manage departments | ✅ |
| Location Management | Office/location tracking | ✅ |
| Employment Types | Full-time, part-time, contract, intern | ✅ |
| Bulk Import | CSV/Excel import for employees | ✅ |
| Employee Lifecycle | Hire → Active → Offboard | ✅ |

### Time & Attendance
| Feature | Description | Status |
|---------|-------------|--------|
| Face Attendance | AI-powered face recognition attendance | ✅ |
| Manual Check-in/out | Employee self-service time entry | ✅ |
| Shift Management | Shift scheduling and assignments | ✅ |
| Overtime Tracking | Automatic overtime calculation | ✅ |
| Leave Management | Leave requests, approvals, balance tracking | ✅ |
| Holiday Calendar | Configurable holiday calendar | ✅ |
| Attendance Reports | Daily/weekly/monthly reports | ✅ |

### Performance Management
| Feature | Description | Status |
|---------|-------------|--------|
| OKR Framework | Set and track Objectives & Key Results | ✅ |
| Performance Reviews | Annual/semi-annual review cycles | ✅ |
| 1:1 Meetings | Scheduled manager-employee meetings | ✅ |
| Goal Tracking | Individual and team goals | ✅ |
| Feedback System | 360-degree feedback | ✅ |
| Performance Analytics | Individual and team performance metrics | ✅ |

### Payroll & Compensation
| Feature | Description | Status |
|---------|-------------|--------|
| Salary Processing | Monthly salary calculation | ✅ |
| Indian Payroll | PF, ESI, TDS, Professional Tax | ✅ |
| Payslip Generation | Digital payslips | ✅ |
| Reimbursement | Expense claims and approvals | ✅ |
| Compensation History | Salary revision tracking | ✅ |
| Benefits Management | Health, retirement, other benefits | ✅ |

### Onboarding & Offboarding
| Feature | Description | Status |
|---------|-------------|--------|
| Digital Onboarding | Paperless onboarding workflow | ✅ |
| Document Collection | Document upload and verification | ✅ |
| Asset Assignment | Equipment and asset tracking | ✅ |
| Welcome Workflow | Automated welcome sequence | ✅ |
| Exit Interviews | Offboarding feedback collection | ✅ |
| Clearance Process | Final clearance checklist | ✅ |
| Knowledge Transfer | Document handover tracking | ✅ |

### Learning & Development
| Feature | Description | Status |
|---------|-------------|--------|
| LMS Integration | Learning Management System | ✅ |
| Course Catalog | Training course library | ✅ |
| Skill Mapping | Skills inventory and development | ✅ |
| Certification Tracking | Employee certifications | ✅ |
| Learning Paths | Role-based learning journeys | ✅ |

### Workflows & Automation
| Feature | Description | Status |
|---------|-------------|--------|
| Approval Workflows | Configurable approval chains | ✅ |
| Workflow Builder | No-code workflow creation | ✅ |
| Auto-assignments | Rule-based task assignment | ✅ |
| Notifications | Email/push/WhatsApp alerts | ✅ |
| Audit Trail | Complete activity logging | ✅ |

---

## Screens & Pages

### Dashboard
- `/dashboard` - Main dashboard with key metrics
- `/dashboard/analytics` - Detailed analytics view
- `/dashboard/notifications` - Notification center

### Employee Management
- `/employees` - Employee list with search/filters
- `/employees/new` - Add new employee
- `/employees/[id]` - Employee detail view
- `/employees/[id]/edit` - Edit employee
- `/employees/[id]/documents` - Employee documents
- `/employees/[id]/history` - Employment history
- `/employees/bulk-import` - Bulk import wizard

### Organization
- `/org-chart` - Interactive org chart
- `/departments` - Department management
- `/locations` - Location management
- `/designations` - Designation management

### Time & Attendance
- `/attendance` - Attendance dashboard
- `/attendance/checkin` - Check-in/out interface
- `/attendance/reports` - Attendance reports
- `/shifts` - Shift management
- `/shifts/schedule` - Shift scheduling
- `/leaves` - Leave management
- `/leaves/calendar` - Leave calendar view
- `/holidays` - Holiday management

### Performance
- `/performance` - Performance overview
- `/performance/reviews` - Review cycles
- `/performance/reviews/new` - Create review
- `/performance/okrs` - OKR management
- `/performance/goals` - Goal tracking
- `/performance/feedback` - Feedback collection
- `/meetings` - 1:1 meeting management
- `/meetings/schedule` - Schedule meeting

### Payroll
- `/payroll` - Payroll dashboard
- `/payroll/run` - Run payroll
- `/payroll/payslips` - Payslip management
- `/payroll/reimbursements` - Reimbursement claims
- `/payroll/compensation` - Compensation details

### Onboarding/Offboarding
- `/onboarding` - Onboarding dashboard
- `/onboarding/[id]` - Onboarding progress
- `/onboarding/templates` - Onboarding templates
- `/offboarding` - Offboarding dashboard
- `/offboarding/[id]` - Offboarding process

### Learning
- `/learning` - LMS dashboard
- `/learning/courses` - Course catalog
- `/learning/courses/[id]` - Course detail
- `/learning/my-learning` - My enrolled courses
- `/learning/certifications` - Certifications

### Settings
- `/settings` - General settings
- `/settings/company` - Company profile
- `/settings/policies` - HR policies
- `/settings/workflows` - Workflow configuration
- `/settings/integrations` - Integration settings
- `/settings/security` - Security settings

---

## Integrations

### Internal Services
| Service | Integration | Status |
|---------|-------------|--------|
| api-gateway | REST API | ✅ |
| backend | Core data | ✅ |
| payroll-service | Payroll processing | ✅ |
| meeting-service | 1:1 meetings | ✅ |
| performance-service | Performance reviews | ✅ |
| okr-service | OKR tracking | ✅ |
| onboarding-service | Onboarding | ✅ |
| exit-service | Offboarding | ✅ |
| shift-service | Shift management | ✅ |
| lms-service | Learning | ✅ |
| calendar-service | Calendar | ✅ |
| document-service | Documents | ✅ |
| analytics-service | Analytics | ✅ |
| push-service | Notifications | ✅ |
| whatsapp-service | WhatsApp alerts | ✅ |

### External Integrations
| Service | Purpose | Status |
|---------|---------|--------|
| CorpID | Universal identity | ✅ |
| RABTUL | Auth & payments | ✅ |
| HOJAI AI | AI assistant | ✅ |
| REZ Merchant | Benefits/GST | ✅ |
| Face Attendance | Face recognition | ✅ |

---

## API Endpoints

### Authentication
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/auth/login` | POST | User login |
| `/api/v1/auth/logout` | POST | User logout |
| `/api/v1/auth/refresh` | POST | Refresh token |
| `/api/v1/auth/forgot-password` | POST | Password reset |

### Employees
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/employees` | GET | List employees |
| `/api/v1/employees` | POST | Create employee |
| `/api/v1/employees/:id` | GET | Get employee |
| `/api/v1/employees/:id` | PUT | Update employee |
| `/api/v1/employees/:id` | DELETE | Delete employee |
| `/api/v1/employees/bulk` | POST | Bulk import |

### Attendance
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/attendance` | GET | Get attendance |
| `/api/v1/attendance/checkin` | POST | Check in |
| `/api/v1/attendance/checkout` | POST | Check out |
| `/api/v1/attendance/report` | GET | Attendance report |

### Payroll
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/payroll/run` | POST | Run payroll |
| `/api/v1/payroll/payslips` | GET | Get payslips |
| `/api/v1/payroll/calculate` | POST | Calculate salary |

---

## Technology Stack

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **UI:** React 18, Tailwind CSS
- **State:** Zustand, React Query (TanStack Query)
- **Forms:** React Hook Form + Zod
- **Icons:** Lucide React
- **Charts:** Recharts

### Backend Communication
- **API Client:** Fetch API with custom wrapper
- **Real-time:** WebSocket via realtime-service
- **Auth:** JWT tokens with refresh

### Styling
- **CSS Framework:** Tailwind CSS
- **Design System:** Custom components
- **Responsive:** Mobile-first approach

---

## Related Documentation

- [CorpPerks README](/README.md) - Main documentation
- [CLAUDE.md](/CLAUDE.md) - Developer guide
- [SOT.md](/SOT.md) - Source of truth
- [API Reference](/docs/API-REFERENCE.md) - API documentation
- [Deployment Guide](/docs/DEPLOYMENT-GUIDE.md) - Deployment instructions

---

*Last Updated: June 12, 2026*
*CorpPerks - Workforce OS*