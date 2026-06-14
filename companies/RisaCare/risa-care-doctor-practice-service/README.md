# RisaCare Doctor Practice Management Service

A production-ready B2B service for independent doctor practices and clinics. Part of the RisaCare healthcare ecosystem under RTNM Group.

## Overview

This service provides a comprehensive practice management solution for doctors, clinics, and healthcare facilities. It handles everything from patient registration to billing and prescription management.

## Features

- **Practice Management**: Setup and manage doctor practices (solo, group, clinic)
- **Doctor Management**: Add doctors with qualifications, specialties, and availability
- **Appointment Scheduling**: Book, cancel, reschedule appointments with slot availability
- **Patient Management**: Register patients, track medical history, manage records
- **Prescriptions**: Create and manage digital prescriptions with renewal support
- **Billing & Invoicing**: Generate bills, process payments, track revenue
- **Schedule Management**: Set availability, block time slots, find next available slots

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Service Configuration

| Property | Value |
|----------|-------|
| Port | 4741 |
| Base URL | `http://localhost:4741/api` |
| Health Check | `http://localhost:4741/health` |

## API Endpoints

### Practice Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/practice` | List all practices |
| POST | `/api/practice` | Create new practice |
| GET | `/api/practice/:practiceId` | Get practice by ID |
| PUT | `/api/practice/:practiceId` | Update practice |
| GET | `/api/practice/:practiceId/stats` | Get practice statistics |

### Doctor Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/doctors` | List all doctors |
| POST | `/api/doctors` | Add new doctor |
| GET | `/api/doctors/:doctorId` | Get doctor details |
| PUT | `/api/doctors/:doctorId` | Update doctor |

### Appointments

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/appointments` | Book appointment |
| GET | `/api/appointments/doctor/:doctorId` | Doctor's appointments |
| GET | `/api/appointments/patient/:patientId` | Patient's appointments |
| GET | `/api/appointments/:appointmentId` | Get appointment |
| PUT | `/api/appointments/:appointmentId/cancel` | Cancel appointment |
| PUT | `/api/appointments/:appointmentId/reschedule` | Reschedule |
| PUT | `/api/appointments/:appointmentId/status` | Update status |
| GET | `/api/appointments/slots/:doctorId` | Available slots |

### Patients

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/patients` | List patients |
| POST | `/api/patients` | Register patient |
| GET | `/api/patients/:patientId` | Get patient |
| PUT | `/api/patients/:patientId` | Update patient |
| GET | `/api/patients/:patientId/records` | Patient records |
| POST | `/api/patients/:patientId/medical-history` | Add medical history |
| GET | `/api/patients/:patientId/history` | Appointment history |

### Prescriptions

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/prescriptions` | Create prescription |
| GET | `/api/prescriptions/:patientId` | Patient prescriptions |
| GET | `/api/prescriptions/detail/:prescriptionId` | Get prescription |
| POST | `/api/prescriptions/:prescriptionId/renew` | Renew prescription |
| GET | `/api/prescriptions/:prescriptionId/print` | Print prescription |

### Billing

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/bills` | Create bill |
| GET | `/api/bills/patient/:patientId` | Patient bills |
| GET | `/api/bills/:billingId` | Get bill |
| PUT | `/api/bills/:billingId/pay` | Process payment |
| GET | `/api/bills/:billingId/invoice` | Generate invoice |
| GET | `/api/revenue` | Revenue statistics |

### Schedule

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/schedule/:doctorId` | Get availability |
| POST | `/api/schedule` | Set availability |
| POST | `/api/schedule/block` | Block time slot |
| POST | `/api/schedule/default` | Set default schedule |
| GET | `/api/schedule/next/:doctorId` | Next available slot |

## Data Models

### Practice

```typescript
{
  practiceId: string;
  name: string;
  type: 'solo' | 'group' | 'clinic';
  specialty: string;
  address: Address;
  doctors: string[];
  staff: StaffMember[];
  operatingHours: OperatingHours[];
  services: Service[];
  phone?: string;
  email?: string;
}
```

### Doctor

```typescript
{
  doctorId: string;
  name: string;
  specialty: string;
  qualifications: string[];
  registrationNumber: string;
  experience: number;
  consultationFee: number;
  languages: string[];
  availability: AvailabilitySlot[];
  profileImage?: string;
  bio?: string;
}
```

### Appointment

```typescript
{
  appointmentId: string;
  patientId: string;
  doctorId: string;
  scheduledAt: string; // ISO datetime
  duration: number; // minutes
  type: 'new' | 'follow_up' | 'procedure';
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  chiefComplaint?: string;
  notes?: string;
}
```

### Patient

```typescript
{
  patientId: string;
  name: string;
  phone: string;
  email?: string;
  dob?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  bloodType?: string;
  allergies: string[];
  medicalHistory: MedicalRecord[];
  medications: Medicine[];
  emergencyContact?: EmergencyContact;
  address?: Address;
}
```

### Prescription

```typescript
{
  prescriptionId: string;
  patientId: string;
  doctorId: string;
  appointmentId?: string;
  medicines: Medicine[];
  diagnosis: string;
  instructions?: string;
  validUntil: string; // ISO datetime
}
```

### Billing

```typescript
{
  billingId: string;
  patientId: string;
  doctorId: string;
  items: BillingItem[];
  subtotal: number;
  tax: number;
  total: number;
  discount: number;
  paymentMethod?: 'cash' | 'card' | 'upi' | 'insurance' | 'wallet';
  status: 'pending' | 'paid' | 'partial' | 'refunded';
  paidAt?: string;
}
```

## Usage Examples

### Create a Practice

```bash
curl -X POST http://localhost:4741/api/practice \
  -H "Content-Type: application/json" \
  -d '{
    "name": "City Medical Center",
    "type": "clinic",
    "specialty": "General Medicine",
    "address": {
      "city": "Mumbai",
      "state": "Maharashtra",
      "zipCode": "400001"
    },
    "phone": "+91-9876543210",
    "email": "info@citymedic.in"
  }'
```

### Add a Doctor

```bash
curl -X POST http://localhost:4741/api/doctors \
  -H "Content-Type: application/json" \
  -d '{
    "practiceId": "<practice-id>",
    "name": "Dr. Priya Sharma",
    "specialty": "Cardiology",
    "qualifications": ["MBBS", "MD", "DM"],
    "registrationNumber": "MCI-12345",
    "experience": 15,
    "consultationFee": 500,
    "languages": ["English", "Hindi", "Marathi"]
  }'
```

### Register a Patient

```bash
curl -X POST http://localhost:4741/api/patients \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Rahul Verma",
    "phone": "+91-9988776655",
    "email": "rahul@example.com",
    "dob": "1985-06-15",
    "gender": "male",
    "bloodType": "B+",
    "allergies": ["Penicillin"]
  }'
```

### Book an Appointment

```bash
curl -X POST http://localhost:4741/api/appointments \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "<patient-id>",
    "doctorId": "<doctor-id>",
    "scheduledAt": "2026-06-15T10:00:00Z",
    "duration": 30,
    "type": "new",
    "chiefComplaint": "Chest pain and shortness of breath"
  }'
```

### Create a Prescription

```bash
curl -X POST http://localhost:4741/api/prescriptions \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "<patient-id>",
    "doctorId": "<doctor-id>",
    "appointmentId": "<appointment-id>",
    "medicines": [
      {
        "name": "Amlodipine",
        "dosage": "5mg",
        "frequency": "Once daily",
        "duration": "30 days",
        "instructions": "Take in the morning with food"
      }
    ],
    "diagnosis": "Hypertension Stage 1",
    "validUntil": "2026-07-15T00:00:00Z"
  }'
```

### Create and Pay a Bill

```bash
# Create bill
curl -X POST http://localhost:4741/api/bills \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "<patient-id>",
    "doctorId": "<doctor-id>",
    "items": [
      {
        "description": "Consultation Fee",
        "quantity": 1,
        "unitPrice": 500
      }
    ],
    "tax": 18
  }'

# Process payment
curl -X PUT http://localhost:4741/api/bills/<billing-id>/pay \
  -H "Content-Type: application/json" \
  -d '{
    "paymentMethod": "upi"
  }'
```

### Set Doctor Availability

```bash
curl -X POST http://localhost:4741/api/schedule \
  -H "Content-Type: application/json" \
  -d '{
    "doctorId": "<doctor-id>",
    "slots": [
      {
        "dayOfWeek": 1,
        "startTime": "09:00",
        "endTime": "13:00",
        "slotDuration": 30
      },
      {
        "dayOfWeek": 1,
        "startTime": "14:00",
        "endTime": "18:00",
        "slotDuration": 30
      }
    ]
  }'
```

## Response Format

All API responses follow a consistent format:

### Success Response

```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response

```json
{
  "success": false,
  "error": "Error message",
  "details": { ... }
}
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 4741 | Server port |
| `NODE_ENV` | development | Environment mode |
| `CORS_ORIGIN` | * | CORS allowed origins |

## Architecture

```
src/
├── index.ts              # Express app entry point
├── routes/
│   └── doctorPracticeRoutes.ts  # All API routes
├── services/
│   ├── practiceService.ts       # Practice management
│   ├── appointmentService.ts    # Appointment handling
│   ├── patientService.ts        # Patient management
│   ├── prescriptionService.ts  # Prescription handling
│   ├── billingService.ts        # Billing & payments
│   └── scheduleService.ts       # Schedule management
├── models/
│   └── store.ts          # In-memory data store
└── types/
    └── schemas.ts        # Zod schemas & types
```

## Production Considerations

For production deployment, consider:

1. **Database**: Replace in-memory store with PostgreSQL or MongoDB
2. **Authentication**: Add JWT-based authentication
3. **Rate Limiting**: Implement rate limiting middleware
4. **Logging**: Add structured logging (e.g., Winston, Pino)
5. **Monitoring**: Add health checks and metrics
6. **Caching**: Add Redis for frequently accessed data
7. **Validation**: Enhanced input validation
8. **Error Tracking**: Integrate Sentry or similar

## License

Part of RisaCare Healthcare Ecosystem. All rights reserved.

---

**RisaCare** | Part of **RTNM Group** | HOJAI AI Infrastructure
