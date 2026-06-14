# People App (MyTalent) - Employee Mobile App Features

**Product:** People (MyTalent)
**Version:** 4.0.0
**Platform:** iOS/Android
**Framework:** Expo SDK 50
**Last Updated:** June 12, 2026

---

## Overview

The People app (MyTalent) is the employee-facing mobile application for CorpPerks, providing employees with self-service access to their HR data, attendance, leave management, payslips, and more.

---

## Core Features

### Authentication
| Feature | Description | Status |
|---------|-------------|--------|
| Login | Email/password authentication | ✅ |
| Biometric Login | Face ID / Fingerprint | ✅ |
| CorpID Integration | Universal identity login | ✅ |
| OTP Login | One-time password | ✅ |
| Forgot Password | Password reset flow | ✅ |
| Session Management | Secure token handling | ✅ |

### Dashboard
| Feature | Description | Status |
|---------|-------------|--------|
| Quick Actions | One-tap access to common actions | ✅ |
| Today's Summary | Day overview | ✅ |
| Notifications | Activity feed | ✅ |
| Quick Check-in | Attendance shortcut | ✅ |
| Leave Balance | Leave summary widget | ✅ |
| Upcoming | Meetings and events | ✅ |

### Profile & Personal Info
| Feature | Description | Status |
|---------|-------------|--------|
| My Profile | View personal information | ✅ |
| Edit Profile | Update personal details | ✅ |
| Emergency Contacts | Manage emergency contacts | ✅ |
| Bank Details | View/update bank information | ✅ |
| Documents | View/upload documents | ✅ |
| Profile Photo | Update profile picture | ✅ |
| My QR Code | Digital employee ID | ✅ |

### Attendance
| Feature | Description | Status |
|---------|-------------|--------|
| Face Check-in | AI face recognition check-in | ✅ |
| Manual Check-in | Manual time entry | ✅ |
| Check-out | End of day checkout | ✅ |
| Attendance History | View past attendance | ✅ |
| Late Arrivals | View late marks | ✅ |
| Attendance Calendar | Monthly view | ✅ |
| Shift Info | Current shift details | ✅ |
| Overtime View | Overtime hours | ✅ |

### Leave Management
| Feature | Description | Status |
|---------|-------------|--------|
| Apply Leave | Submit leave request | ✅ |
| Leave Balance | View available leave | ✅ |
| Leave History | Past leave requests | ✅ |
| Leave Calendar | Team calendar view | ✅ |
| Cancel Leave | Cancel pending request | ✅ |
| Leave Policy | View leave policies | ✅ |
| Holiday Calendar | View holidays | ✅ |
| Encashment | Leave encashment request | ✅ |

### Payroll & Compensation
| Feature | Description | Status |
|---------|-------------|--------|
| Payslips | View/download payslips | ✅ |
| Salary Details | Salary breakdown | ✅ |
| Reimbursements | Submit expense claims | ✅ |
| Claims History | View claim status | ✅ |
| Benefits | View employee benefits | ✅ |
| Tax Declaration | Submit tax declarations | ✅ |
| Investment Proofs | Upload proofs | ✅ |
| Form 16 | Download Form 16 | ✅ |

### Performance & Goals
| Feature | Description | Status |
|---------|-------------|--------|
| My OKRs | View personal OKRs | ✅ |
| Update Progress | Update OKR progress | ✅ |
| Goals | View and track goals | ✅ |
| Feedback | View received feedback | ✅ |
| Reviews | Performance review history | ✅ |
| Competencies | Self-assessment | ✅ |

### 1:1 Meetings
| Feature | Description | Status |
|---------|-------------|--------|
| Upcoming Meetings | View scheduled meetings | ✅ |
| Schedule Meeting | Request meeting with manager | ✅ |
| Meeting Notes | View/add meeting notes | ✅ |
| Action Items | Track action items | ✅ |
| Meeting History | Past meetings | ✅ |
| Feedback | Meeting feedback | ✅ |

### Learning & Development
| Feature | Description | Status |
|---------|-------------|--------|
| Course Catalog | Browse available courses | ✅ |
| Enrolled Courses | My learning | ✅ |
| Progress Tracking | Course progress | ✅ |
| Certifications | My certifications | ✅ |
| Learning Paths | Recommended paths | ✅ |
| Certifications | View certificates | ✅ |

### Announcements & Directory
| Feature | Description | Status |
|---------|-------------|--------|
| Announcements | Company announcements | ✅ |
| Employee Directory | Search employees | ✅ |
| Org Chart | View organization | ✅ |
| My Team | Direct reports | ✅ |
| My Manager | Manager info | ✅ |
| Messages | Send message | ✅ |

### Notifications & Settings
| Feature | Description | Status |
|---------|-------------|--------|
| Push Notifications | In-app notifications | ✅ |
| Notification Settings | Configure alerts | ✅ |
| App Settings | App preferences | ✅ |
| Language | Language selection | ✅ |
| Theme | Dark/Light mode | ✅ |
| Help & Support | Support options | ✅ |
| Privacy | Privacy settings | ✅ |
| Logout | Sign out | ✅ |

---

## Screens & Navigation

### Tab Navigation
1. **Home** - Dashboard with quick actions
2. **Attendance** - Attendance features
3. **Leave** - Leave management
4. **Payroll** - Payslips and compensation
5. **Profile** - Personal info and settings

### Screen List

#### Home Tab
- `HomeScreen` - Main dashboard
- `NotificationsScreen` - All notifications
- `AnnouncementsScreen` - Company announcements

#### Attendance Tab
- `AttendanceHomeScreen` - Attendance dashboard
- `CheckInScreen` - Face/manual check-in
- `AttendanceHistoryScreen` - Past records
- `AttendanceCalendarScreen` - Monthly view
- `ShiftInfoScreen` - Shift details

#### Leave Tab
- `LeaveHomeScreen` - Leave dashboard
- `ApplyLeaveScreen` - New leave request
- `LeaveBalanceScreen` - Leave balances
- `LeaveHistoryScreen` - Past requests
- `LeaveCalendarScreen` - Team calendar
- `HolidayCalendarScreen` - Holidays

#### Payroll Tab
- `PayrollHomeScreen` - Payroll dashboard
- `PayslipsScreen` - Payslip list
- `PayslipDetailScreen` - Payslip detail
- `ReimbursementsScreen` - Claims
- `BenefitsScreen` - Employee benefits
- `TaxDeclarationScreen` - Tax setup

#### Profile Tab
- `ProfileScreen` - My profile
- `EditProfileScreen` - Edit details
- `DocumentsScreen` - My documents
- `EmergencyContactsScreen` - Emergency contacts
- `BankDetailsScreen` - Bank info
- `SettingsScreen` - App settings
- `HelpScreen` - Support

### Modal Screens
- `QRCodeScreen` - Digital ID
- `TeamDirectoryScreen` - Employee search
- `OrgChartScreen` - Organization view
- `MeetingDetailScreen` - Meeting info
- `CourseDetailScreen` - Course info

---

## Integrations

### Internal Services
| Service | Integration | Status |
|---------|-------------|--------|
| api-gateway | REST API | ✅ |
| backend | Core data | ✅ |
| payroll-service | Payslips | ✅ |
| shift-service | Shift data | ✅ |
| meeting-service | Meetings | ✅ |
| performance-service | Performance | ✅ |
| okr-service | OKRs | ✅ |
| lms-service | Learning | ✅ |
| push-service | Push notifications | ✅ |
| realtime-service | Real-time updates | ✅ |

### External Integrations
| Service | Purpose | Status |
|---------|---------|--------|
| CorpID | Identity & auth | ✅ |
| Face Attendance | Face recognition | ✅ |
| RABTUL | Notifications | ✅ |

---

## API Endpoints

### Auth
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/auth/login` | POST | Login |
| `/api/v1/auth/otp` | POST | Send OTP |
| `/api/v1/auth/verify-otp` | POST | Verify OTP |
| `/api/v1/auth/refresh` | POST | Refresh token |

### Profile
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/employees/me` | GET | Get profile |
| `/api/v1/employees/me` | PUT | Update profile |
| `/api/v1/employees/me/documents` | POST | Upload document |

### Attendance
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/attendance/checkin` | POST | Check in |
| `/api/v1/attendance/checkout` | POST | Check out |
| `/api/v1/attendance/history` | GET | Get history |
| `/api/v1/attendance/balance` | GET | Get balance |

### Leave
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/leave/apply` | POST | Apply leave |
| `/api/v1/leave/balance` | GET | Get balance |
| `/api/v1/leave/history` | GET | Get history |
| `/api/v1/leave/cancel/:id` | POST | Cancel leave |

### Payroll
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/payroll/payslips` | GET | Get payslips |
| `/api/v1/payroll/payslips/:id` | GET | Get payslip |
| `/api/v1/payroll/reimbursements` | GET/POST | Reimbursements |

---

## Technology Stack

### Framework
- **Framework:** Expo SDK 50
- **Language:** TypeScript
- **Runtime:** React Native

### State Management
- **Global State:** Zustand
- **Server State:** React Query (TanStack Query)
- **Navigation:** React Navigation 6

### Key Libraries
- `expo-camera` - Camera for face attendance
- `expo-secure-store` - Secure storage
- `expo-notifications` - Push notifications
- `expo-local-authentication` - Biometrics
- `react-native-qrcode-svg` - QR code generation
- `react-native-svg` - SVG support
- `date-fns` - Date utilities
- `zod` - Validation

### Architecture
- **Pattern:** Feature-based architecture
- **API Layer:** Custom fetch wrapper with interceptors
- **Auth:** JWT with secure storage
- **Offline:** Limited offline support

---

## Related Documentation

- [CorpPerks README](/README.md) - Main documentation
- [PeopleOS FEATURES.md](/docs/peopleos/FEATURES.md) - Web app features
- [Manager App FEATURES.md](/docs/manager-app/FEATURES.md) - Manager app

---

*Last Updated: June 12, 2026*
*CorpPerks - Employee App*