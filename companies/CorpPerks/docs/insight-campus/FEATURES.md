# InsightCampus - Student Campus Management Features

**Product:** InsightCampus
**Version:** 4.0.0
**URL:** https://insight.corpperks.com
**Framework:** Next.js 14
**Last Updated:** June 12, 2026

---

## Overview

InsightCampus is a comprehensive student information system designed for educational institutions, managing admissions, academics, attendance, fees, and student lifecycle.

---

## Core Features

### Admissions & Enrollment
| Feature | Description | Status |
|---------|-------------|--------|
| Online Application | Digital application portal | ✅ |
| Application Review | Track and review applications | ✅ |
| Document Verification | Upload and verify documents | ✅ |
| Enrollment Management | Student enrollment process | ✅ |
| Fee Structure | Configure fee categories | ✅ |
| Scholarship Management | Scholarship tracking | ✅ |
| Waitlist Management | Manage waiting lists | ✅ |
| Batch/Class Assignment | Assign students to batches | ✅ |

### Student Information
| Feature | Description | Status |
|---------|-------------|--------|
| Student Profiles | Comprehensive student records | ✅ |
| Guardian Information | Parent/guardian details | ✅ |
| Contact Management | Multiple contact points | ✅ |
| Medical Information | Health and medical records | ✅ |
| Emergency Contacts | Emergency contact management | ✅ |
| Document Storage | Document repository | ✅ |
| Photo ID | Student identification | ✅ |
| ID Card Generation | Digital ID cards | ✅ |

### Academic Management
| Feature | Description | Status |
|---------|-------------|--------|
| Course Management | Course setup and assignment | ✅ |
| Timetable | Class schedule management | ✅ |
| Attendance Tracking | Attendance marking and reports | ✅ |
| Assignment Management | Create and track assignments | ✅ |
| Grade Management | Grade entry and calculation | ✅ |
| Report Cards | Generate report cards | ✅ |
| Transcripts | Academic transcript generation | ✅ |
| Result Management | Exam results and analysis | ✅ |

### Fee Management
| Feature | Description | Status |
|---------|-------------|--------|
| Fee Collection | Online and offline fee collection | ✅ |
| Fee Reminders | Automated reminders | ✅ |
| Payment Gateway | Online payments | ✅ |
| Receipt Generation | Digital receipts | ✅ |
| Fee Waivers | Scholarship and waiver management | ✅ |
| Installment Plans | Flexible payment options | ✅ |
| Financial Reports | Fee collection reports | ✅ |
| Outstanding Balance | Track pending fees | ✅ |

### Library Management
| Feature | Description | Status |
|---------|-------------|--------|
| Catalog Management | Book catalog | ✅ |
| Issue/Return | Book issue and return | ✅ |
| Reservation | Book reservation | ✅ |
| Overdue Tracking | Late return tracking | ✅ |
| Fine Management | Fine calculation and collection | ✅ |
| Reading History | Student reading history | ✅ |

### Transport Management
| Feature | Description | Status |
|---------|-------------|--------|
| Route Management | Bus routes setup | ✅ |
| Stop Management | Bus stops | ✅ |
| Vehicle Assignment | Assign vehicles to routes | ✅ |
| Transport Fee | Transport fee management | ✅ |
| Live Tracking | Real-time bus tracking | ✅ |
| Pickup/Drop Status | Track student status | ✅ |

### Hostel Management
| Feature | Description | Status |
|---------|-------------|--------|
| Room Allocation | Hostel room management | ✅ |
| Mess Management | Mess fee and menu | ✅ |
| Attendance | Hostel attendance | ✅ |
| Visitor Log | Visitor management | ✅ |
| Maintenance | Hostel maintenance requests | ✅ |

### Communication
| Feature | Description | Status |
|---------|-------------|--------|
| Announcements | Broadcast messages | ✅ |
| Notices | Notice board | ✅ |
| Messages | Direct messaging | ✅ |
| Newsletter | Periodic newsletters | ✅ |
| SMS Alerts | SMS notifications | ✅ |
| Email Alerts | Email notifications | ✅ |
| WhatsApp Integration | WhatsApp updates | ✅ |

### Analytics & Reports
| Feature | Description | Status |
|---------|-------------|--------|
| Dashboard | Institution dashboard | ✅ |
| Academic Reports | Performance analytics | ✅ |
| Attendance Reports | Attendance analytics | ✅ |
| Fee Reports | Financial analytics | ✅ |
| Student Trends | Enrollment trends | ✅ |
| Export Reports | Excel/PDF export | ✅ |

---

## Screens & Pages

### Dashboard
- `/dashboard` - Main dashboard
- `/dashboard/analytics` - Analytics view
- `/dashboard/calendar` - Academic calendar

### Admissions
- `/admissions` - Applications list
- `/admissions/new` - New application
- `/admissions/[id]` - Application detail
- `/admissions/review` - Review applications
- `/admissions/enrollments` - Enrolled students

### Students
- `/students` - Student list
- `/students/new` - Add student
- `/students/[id]` - Student profile
- `/students/[id]/documents` - Documents
- `/students/[id]/attendance` - Attendance
- `/students/[id]/grades` - Grades
- `/students/[id]/fees` - Fee details
- `/students/bulk-import` - Bulk import

### Academics
- `/academics/courses` - Course management
- `/academics/timetable` - Timetable
- `/academics/attendance` - Attendance marking
- `/academics/assignments` - Assignments
- `/academics/grades` - Grade management
- `/academics/results` - Results
- `/academics/reports` - Report cards

### Fees
- `/fees` - Fee management
- `/fees/structure` - Fee structure
- `/fees/collection` - Fee collection
- `/fees/reports` - Fee reports
- `/fees/reminders` - Send reminders
- `/fees/scholarships` - Scholarships

### Library
- `/library` - Library dashboard
- `/library/catalog` - Book catalog
- `/library/issue` - Issue books
- `/library/return` - Return books
- `/library/reservations` - Reservations
- `/library/reports` - Library reports

### Transport
- `/transport` - Transport management
- `/transport/routes` - Route management
- `/transport/vehicles` - Vehicle management
- `/transport/assignments` - Student assignments
- `/transport/tracking` - Live tracking

### Hostel
- `/hostel` - Hostel management
- `/hostel/rooms` - Room management
- `/hostel/allocation` - Room allocation
- `/hostel/mess` - Mess management
- `/hostel/attendance` - Hostel attendance

### Communication
- `/communication/announcements` - Announcements
- `/communication/notices` - Notices
- `/communication/messages` - Messages
- `/communication/sms` - SMS

### Settings
- `/settings` - General settings
- `/settings/institution` - Institution profile
- `/settings/academic` - Academic years
- `/settings/departments` - Departments
- `/settings/batches` - Batch management

---

## Integrations

### Internal Services
| Service | Integration | Status |
|---------|-------------|--------|
| api-gateway | REST API | ✅ |
| backend | Core data | ✅ |
| push-service | Notifications | ✅ |
| whatsapp-service | WhatsApp alerts | ✅ |
| analytics-service | Reports | ✅ |
| document-service | Document storage | ✅ |

### External Integrations
| Service | Purpose | Status |
|---------|---------|--------|
| RABTUL | Payment gateway | ✅ |
| CorpID | Student identity | ✅ |

---

## API Endpoints

### Students
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/students` | GET | List students |
| `/api/v1/students` | POST | Create student |
| `/api/v1/students/:id` | GET | Get student |
| `/api/v1/students/:id` | PUT | Update student |
| `/api/v1/students/bulk` | POST | Bulk import |

### Academics
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/academics/courses` | GET/POST | Manage courses |
| `/api/v1/academics/attendance` | POST | Mark attendance |
| `/api/v1/academics/grades` | POST | Enter grades |
| `/api/v1/academics/results` | GET | Get results |

### Fees
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/fees/structure` | GET/POST | Fee structure |
| `/api/v1/fees/collect` | POST | Collect fee |
| `/api/v1/fees/reports` | GET | Fee reports |

### Library
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/library/books` | GET/POST | Manage books |
| `/api/v1/library/issue` | POST | Issue book |
| `/api/v1/library/return` | POST | Return book |

---

## Technology Stack

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **UI:** React 18, Tailwind CSS
- **State:** Zustand, React Query
- **Forms:** React Hook Form + Zod

### Backend Communication
- **API Client:** Fetch with auth
- **Auth:** JWT with CorpID

---

## Related Documentation

- [CorpPerks README](/README.md) - Main documentation
- [insight-app FEATURES.md](/docs/insight-app/FEATURES.md) - Mobile app features

---

*Last Updated: June 12, 2026*
*CorpPerks - Student Campus*