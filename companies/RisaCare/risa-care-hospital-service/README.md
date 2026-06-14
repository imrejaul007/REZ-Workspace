# RisaCare Hospital Management Service

A comprehensive B2B hospital operations management system built on the RTNM Group ecosystem, powered by HOJAI AI infrastructure.

## Overview

RisaCare Hospital Management Service provides end-to-end hospital operations capabilities including patient management, bed allocation, operation scheduling, and staff management.

### Key Features

- **Hospital Management**: Centralized hospital configuration with departments, wards, and resources
- **Patient Management**: Registration, medical records, search, and history tracking
- **Admission System**: Admit, discharge, and transfer patients with bed allocation
- **Bed Management**: Real-time bed availability, allocation, and ward occupancy tracking
- **Operation Scheduling**: Surgical operations scheduling with OR management
- **Staff Management**: Staff registry, scheduling, and role-based management

## Quick Start

### Installation

```bash
cd RisaCare/risa-care-hospital-service
npm install
```

### Development

```bash
npm run dev
```

### Production Build

```bash
npm run build
npm start
```

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `4740` | Server port |
| `NODE_ENV` | `development` | Environment mode |
| `CORS_ORIGIN` | `*` | CORS allowed origin |

## API Reference

### Base URL

```
http://localhost:4740/api
```

### Hospital Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/hospital` | Create hospital |
| `GET` | `/hospital` | Get hospital info |
| `PUT` | `/hospital` | Update hospital |
| `GET` | `/hospital/stats` | Get hospital statistics |

### Department Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/departments` | List departments |
| `POST` | `/departments` | Add department |
| `GET` | `/departments/:id` | Get department |

### Patient Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/patients` | Register patient |
| `GET` | `/patients/:id` | Get patient |
| `GET` | `/patients/search` | Search patients |
| `GET` | `/patients/stats` | Patient statistics |

### Admission Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/admissions` | Admit patient |
| `GET` | `/admissions` | List admissions |
| `GET` | `/admissions/active` | Active admissions |
| `PUT` | `/admissions/:id/discharge` | Discharge patient |
| `POST` | `/admissions/transfer` | Transfer patient |
| `GET` | `/admissions/stats` | Admission statistics |

### Bed Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/beds` | List all beds |
| `GET` | `/beds/available` | Available beds |
| `POST` | `/beds/allocate` | Allocate bed |
| `POST` | `/beds/release` | Release bed |
| `GET` | `/beds/wards` | Ward occupancy |
| `GET` | `/beds/stats` | Bed statistics |

### Operation Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/operations` | List operations |
| `POST` | `/operations` | Schedule operation |
| `PUT` | `/operations/:id` | Update operation |
| `POST` | `/operations/:id/start` | Start operation |
| `POST` | `/operations/:id/complete` | Complete operation |
| `POST` | `/operations/:id/cancel` | Cancel operation |
| `GET` | `/operations/stats` | Operation statistics |

### Staff Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/staff` | List staff |
| `POST` | `/staff` | Add staff |
| `GET` | `/staff/:id` | Get staff |
| `GET` | `/staff/:id/schedule` | Get schedule |
| `PUT` | `/staff/:id/schedule` | Update schedule |
| `GET` | `/staff/doctors` | List doctors |
| `GET` | `/staff/nurses` | List nurses |
| `GET` | `/staff/search` | Search staff |
| `GET` | `/staff/stats` | Staff statistics |

## Data Models

### Hospital

```typescript
interface Hospital {
  hospitalId: string;
  name: string;
  address: Address;
  departments: Department[];
  beds: Bed[];
  operatingRooms: OperatingRoom[];
  emergencyRooms: EmergencyRoom[];
  icuBeds: number;
  totalBeds: number;
  staff: Staff[];
}
```

### Patient

```typescript
interface Patient {
  patientId: string;
  mrn: string; // Medical Record Number
  name: string;
  dob: Date;
  gender: Gender;
  bloodType?: BloodType;
  allergies: string[];
  emergencyContact: EmergencyContact;
  insuranceId?: string;
  admissionHistory: string[];
}
```

### Admission

```typescript
interface Admission {
  admissionId: string;
  patientId: string;
  departmentId: string;
  bedId?: string;
  admissionDate: Date;
  dischargeDate?: Date;
  diagnosis: string;
  attendingDoctorId: string;
  status: AdmissionStatus;
}
```

### Bed

```typescript
interface Bed {
  bedId: string;
  wardId: string;
  bedNumber: string;
  bedType: BedType; // general, private, icu, semi-private
  status: BedStatus; // available, occupied, maintenance, reserved
  currentPatientId?: string;
  pricePerDay: number;
}
```

### Operation

```typescript
interface Operation {
  operationId: string;
  patientId: string;
  surgeonId: string;
  operationType: string;
  scheduledAt: Date;
  duration: number; // minutes
  operatingRoomId: string;
  status: OperationStatus;
}
```

### Staff

```typescript
interface Staff {
  staffId: string;
  employeeId: string;
  name: string;
  role: StaffRole; // doctor, nurse, surgeon, admin, etc.
  departmentId?: string;
  specialization: string[];
  schedule: Schedule[];
  status: StaffStatus; // active, on_leave, inactive
}
```

## Enumerations

### Bed Types
- `general` - General ward beds
- `private` - Private rooms
- `icu` - Intensive Care Unit
- `semi-private` - Shared private rooms

### Bed Status
- `available` - Ready for allocation
- `occupied` - Currently in use
- `maintenance` - Under maintenance
- `reserved` - Reserved for upcoming admission

### Operation Status
- `scheduled` - Booked for future
- `in_progress` - Currently being performed
- `completed` - Successfully completed
- `cancelled` - Cancelled
- `postponed` - Rescheduled to later

### Staff Roles
- `doctor` - General physician
- `nurse` - Nursing staff
- `surgeon` - Surgical specialist
- `specialist` - Medical specialist
- `admin` - Administrative staff
- `technician` - Technical staff
- `receptionist` - Front desk

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    RisaCare Hospital Service                │
├─────────────────────────────────────────────────────────────┤
│  Express.js API Layer (Port 4740)                          │
│  ├── Helmet Security                                       │
│  ├── CORS Configuration                                     │
│  ├── Request Validation (Zod)                              │
│  └── Error Handling                                        │
├─────────────────────────────────────────────────────────────┤
│  Route Controllers                                         │
│  ├── Hospital Routes                                       │
│  ├── Patient Routes                                        │
│  ├── Admission Routes                                      │
│  ├── Bed Routes                                            │
│  ├── Operation Routes                                      │
│  └── Staff Routes                                          │
├─────────────────────────────────────────────────────────────┤
│  Business Logic Services                                   │
│  ├── HospitalService                                       │
│  ├── PatientService                                        │
│  ├── AdmissionService                                      │
│  ├── BedService                                            │
│  ├── OperationService                                      │
│  └── StaffService                                          │
├─────────────────────────────────────────────────────────────┤
│  In-Memory Data Store (Production: Replace with DB)        │
└─────────────────────────────────────────────────────────────┘
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message",
  "details": [] // Validation errors (Zod)
}
```

Success responses:

```json
{
  "success": true,
  "data": {},
  "message": "Operation successful"
}
```

## Health Check

```bash
curl http://localhost:4740/health
```

## Production Deployment

For production, replace the in-memory data store with a persistent database:

1. Add Prisma or TypeORM for database management
2. Configure environment variables for database connection
3. Add authentication middleware
4. Implement rate limiting
5. Set up monitoring and logging

## Integration with HOJAI AI

This service integrates with HOJAI AI infrastructure for:
- AI-powered patient scheduling optimization
- Intelligent bed allocation suggestions
- Operation room utilization analytics
- Staff scheduling optimization

## License

Proprietary - RTNM Group

## Support

For technical support, contact the HOJAI AI team.
