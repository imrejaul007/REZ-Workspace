# 🏥 REZ Healthcare OS

**Unified Healthcare & Pharmacy Platform**  
**Version:** 1.0 | **Date:** June 13, 2026

---

## 📁 Structure

```
healthcare-os/
├── .env.example              ← Environment template
├── core/
│   ├── rez-healthcare/       ← Main service (4501)
│   ├── rez-mind-healthcare/  ← AI diagnostics
│   ├── REZ-healthcare-app/   ← Patient app
│   └── rez-healthcare-admin/ ← Admin web
├── pharmacy/
│   ├── rez-pharmacy/         ← Pharmacy (4502)
│   ├── rez-pharmacy-prescription/ ← E-prescriptions (4503)
│   └── REZ-pharmacy-admin/    ← Pharmacy admin
├── appointments/
│   ├── rez-healthcare-appointment/ ← Doctor booking
│   └── rez-healthcare-patient/ ← Patient records
└── analytics/
    └── rez-healthcare-billing/ ← Billing & claims
```

---

## 🔌 Ports

| Service | Port | Description |
|---------|------|-------------|
| rez-healthcare | 4501 | Main API |
| rez-pharmacy | 4502 | Pharmacy |
| rez-prescription | 4503 | E-prescriptions |
| rez-mind-healthcare | 4504 | AI |

---

## 🚀 Quick Start

```bash
cd core/rez-healthcare
npm install
npm run dev  # Port 4501
```

---

## 📦 SDK

```typescript
import { createHealthcareSDK } from '../../shared/rez-healthcare-sdk';

const healthcare = createHealthcareSDK({ baseURL: 'http://localhost:4501' });

// Book appointment
const appointment = await healthcare.appointments.bookAppointment({
  patientId: 'P1',
  doctorId: 'D1',
  dateTime: new Date('2026-06-15T10:00:00')
});

// Search medicines
const medicines = await healthcare.pharmacy.searchMedicines('paracetamol');
```

---

**Version:** 1.0 | **Updated:** June 13, 2026
