# RisaCare Profile Service

**Patient Profile and Identity Management**

Central service for managing patient profiles, identity verification, and personal health information.

## Overview

RisaCare Profile Service handles:
- Patient registration and profiles
- Identity verification
- Personal information management
- Emergency contacts
- Document storage
- Preferences and settings

## Features

### Profile Management
- Create and update patient profiles
- Profile photo and avatar
- Bio and medical history summary
- Contact information

### Identity
- Aadhaar integration (future)
- Phone number verification
- Email verification
- Document upload (ID proof)

### Emergency Contacts
- Multiple emergency contacts
- Relationship mapping
- Priority ordering
- Quick-dial functionality

### Medical Profile
- Blood type
- Allergies
- Chronic conditions
- Family medical history
- Emergency medical info

## Quick Start

```bash
cd risa-care-profile-service
npm install
npm run dev
```

Service runs on **port 4701**.

## API Endpoints

### Profile
```
POST /api/profile                       - Create profile
GET  /api/profile/:userId             - Get profile
PUT  /api/profile/:userId             - Update profile
DELETE /api/profile/:userId           - Delete profile
```

### Verification
```
POST /api/profile/:userId/verify-phone    - Verify phone
POST /api/profile/:userId/verify-email    - Verify email
POST /api/profile/:userId/verify-identity - Verify identity
```

### Emergency Contacts
```
GET  /api/profile/:userId/emergency-contacts
POST /api/profile/:userId/emergency-contacts
PUT  /api/profile/:userId/emergency-contacts/:contactId
DELETE /api/profile/:userId/emergency-contacts/:contactId
```

### Medical Info
```
GET  /api/profile/:userId/medical-info
PUT  /api/profile/:userId/medical-info
```

## Usage Examples

### Create Profile
```bash
curl -X POST http://localhost:4701/api/profile \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "+919876543210",
    "dateOfBirth": "1990-05-15",
    "gender": "male",
    "bloodType": "B+"
  }'
```

### Add Emergency Contact
```bash
curl -X POST http://localhost:4701/api/profile/user-123/emergency-contacts \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "relationship": "spouse",
    "phone": "+919876543211",
    "priority": 1
  }'
```

## Data Model

### Profile
```typescript
interface PatientProfile {
  profileId: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other';
  bloodType?: string;
  allergies?: string[];
  emergencyContacts: EmergencyContact[];
  documents: Document[];
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}
```

## Integration

Integrates with:
- RisaCare API Gateway (4700)
- RABTUL Auth (4002) for authentication
- RisaCare Records Service (4702) for medical history

## Port Configuration

| Service | Port |
|---------|------|
| Profile Service | 4701 |

## License

Proprietary - RTNM Group
