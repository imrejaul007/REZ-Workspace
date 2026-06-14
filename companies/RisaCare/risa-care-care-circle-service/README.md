# RisaCare Care Circle Service

**Family and Care Team Management**

Service for managing family members, caregivers, and healthcare team coordination.

## Overview

RisaCare Care Circle Service handles:
- Family member management
- Caregiver assignments
- Healthcare team coordination
- Access permissions
- Emergency access
- Circle activity feeds

## Features

### Family Management
- Add family members
- Relationship mapping
- Family health history
- Shared access controls
- Minor consent management

### Care Team
- Assign caregivers
- Doctor assignments
- Nurse assignments
- Care coordinator access
- Provider permissions

### Access Control
- Granular permissions
- View-only access
- Edit access
- Emergency access
- Time-limited access

### Activity Feed
- Circle activity updates
- Care milestone notifications
- Health event alerts
- Medication reminders

## Quick Start

```bash
cd risa-care-care-circle-service
npm install
npm run dev
```

Service runs on **port 4706**.

## API Endpoints

### Care Circles
```
POST /api/circles                            - Create care circle
GET  /api/circles/:userId                  - Get user's circles
GET  /api/circles/:circleId                 - Get circle details
PUT  /api/circles/:circleId                 - Update circle
DELETE /api/circles/:circleId              - Delete circle
```

### Members
```
POST /api/circles/:circleId/members          - Add member
GET  /api/circles/:circleId/members         - List members
PUT  /api/circles/:circleId/members/:id     - Update member
DELETE /api/circles/:circleId/members/:id  - Remove member
```

### Permissions
```
GET  /api/circles/:circleId/permissions/:userId
PUT  /api/circles/:circleId/permissions/:userId
```

### Activity
```
GET  /api/circles/:circleId/activity        - Get activity feed
POST /api/circles/:circleId/activity        - Add activity
```

### Emergency Access
```
POST /api/emergency/:userId                  - Grant emergency access
GET  /api/emergency/:userId                 - Get emergency contacts
DELETE /api/emergency/:userId/:contactId   - Remove emergency access
```

## Usage Examples

### Create Care Circle
```bash
curl -X POST http://localhost:4706/api/circles \
  -H "Content-Type: application/json" \
  -d '{
    "ownerId": "user-123",
    "name": "Sharma Family",
    "description": "Healthcare management for the Sharma family",
    "members": [
      {
        "userId": "user-123",
        "role": "owner",
        "relationship": "self"
      }
    ]
  }'
```

### Add Family Member
```bash
curl -X POST http://localhost:4706/api/circles/circle-456/members \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-789",
    "relationship": "spouse",
    "permissions": {
      "viewRecords": true,
      "editRecords": false,
      "viewMedications": true,
      "manageAppointments": true,
      "emergencyAccess": true
    }
  }'
```

### Grant Emergency Access
```bash
curl -X POST http://localhost:4706/api/emergency/user-123 \
  -H "Content-Type: application/json" \
  -d '{
    "grantedTo": "user-999",
    "relationship": "sibling",
    "expiresAt": "2025-12-31T23:59:59Z",
    "accessLevel": "full"
  }'
```

## Member Roles

| Role | Description |
|------|-------------|
| owner | Circle administrator |
| admin | Can manage other members |
| member | Regular member |
| caregiver | Healthcare provider |
| viewer | Read-only access |

## Permission Types

| Permission | Description |
|------------|-------------|
| viewRecords | View health records |
| editRecords | Edit health records |
| viewMedications | View medication list |
| manageMedications | Manage medications |
| viewAppointments | View appointments |
| manageAppointments | Book/cancel appointments |
| emergencyAccess | Access in emergencies |
| shareData | Share with third parties |

## Circle Types

| Type | Description |
|------|-------------|
| family | Family members |
| caregiver | Care team circle |
| assisted | Care circle for elderly/disabled |
| corporate | Employee health circles |

## Integration

Integrates with:
- RisaCare API Gateway (4700)
- RisaCare Profile Service (4701)
- RisaCare Consent Service (4705)
- RABTUL Notifications (4011) for activity alerts

## Port Configuration

| Service | Port |
|---------|------|
| Care Circle Service | 4706 |

## License

Proprietary - RTNM Group
