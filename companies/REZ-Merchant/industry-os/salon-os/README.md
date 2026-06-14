# 💇 REZ Salon OS

**Unified Salon & Spa Management Platform**
**Version:** 2.0 | **Date:** June 14, 2026

---

## 📁 Structure

```
salon-os/
├── .env.example              ← Environment template
├── core/
│   ├── rez-salon/           ← Main service (4901)
│   ├── rez-mind-salon/      ← AI recommendations (4010)
│   ├── REZ-salon-app/       ← Mobile app
│   └── rez-salon-whatsapp/  ← WhatsApp booking
├── pos/
│   └── rez-salon-pos/       ← Salon POS (4902)
├── crm/
│   └── rez-salon-crm/        ← Customer management (4903)
├── appointments/
│   └── rez-salon-booking/   ← Online booking
├── membership/
│   └── rez-salon-membership/ ← Plans & packages (4904)
└── integrations/
    └── rez-salon-qr/        ← QR payments
```

---

## 🔌 Ports

| Service | Port | Description |
|---------|------|-------------|
| rez-salon | 4901 | Main API |
| rez-salon-pos | 4902 | POS |
| rez-salon-crm | 4903 | CRM |
| rez-salon-membership | 4904 | Membership |
| rez-salon-whatsapp | 3005 | WhatsApp |
| **GlamAI (HOJAI AI)** | **3000** | **Salon Intelligence OS** |

---

## 🧠 AI Integration

### GlamAI - Salon Intelligence OS (Port 3000)

**Location:** `hojai-ai/industry-ai/glamai/`
**Tagline:** "The brain that makes the salon know you better than you know yourself."

GlamAI connects to REZ Salon OS via bridges:

| Bridge | Connects To |
|--------|-------------|
| SalonBridge | CRM (4903), Booking, POS (4902), Inventory |
| MindSalonBridge | REZ Mind Salon AI (4010) |

### GlamAI Features

| Feature | Description |
|---------|-------------|
| **Beauty Memory** | Hair color formulas, stylist notes, product reactions |
| **Service Plan** | AI-generated personalized service plans |
| **Customer Intelligence** | Unified view from CRM + Memory + Mind Salon |
| **Stylist Service** | Stylist-facing APIs for service delivery |
| **Recommendations** | Overdue services, seasonal, profile-based |
| **Inventory** | Stock alerts, reorder automation |
| **Beauty Genie** | Beauty-specific AI conversations |
| **Training Academy** | Stylist certification and training |

### Beauty Memory Capabilities

- Hair type, texture, scalp condition, skin type
- Hair color history with formulas (color, brand, developer, processing time)
- Stylist notes (treatment, preference, allergy, concern, general)
- Product reactions (loved, liked, neutral, disliked, allergic)
- Service details with products used
- At-home regimen recommendations

### Related Salon AI Agents

| Agent | Port | Purpose |
|-------|------|---------|
| Treatment Advisor | 4813 | Bundle suggestions, upsells |
| Inventory Alert Agent | 4814 | Stock alerts, forecasting |

---

## 🚀 Quick Start

```bash
# Start REZ Salon Services
cd core/rez-salon && npm install && npm run dev  # Port 4901
cd crm/rez-salon-crm && npm install && npm run dev  # Port 4903
cd pos/rez-salon-pos && npm install && npm run dev  # Port 4902

# Start GlamAI (HOJAI AI)
cd hojai-ai/industry-ai/glamai && npm install && npm run dev  # Port 3000
```

---

## 📦 SDK

```typescript
import { createSalonSDK } from '../../shared/rez-salon-sdk';

const salon = createSalonSDK({ baseURL: 'http://localhost:4901' });

// Book appointment
const appointment = await salon.booking.createAppointment({
  customerId: 'C1',
  stylistId: 'S1',
  serviceId: 'SV1',
  dateTime: new Date('2026-06-15T10:00:00')
});

// Get customer
const customer = await salon.crm.getCustomer('C1');

// Get beauty profile (via GlamAI)
const beauty = await fetch('http://localhost:3000/api/customers/C1/profile');

// Record hair color (via GlamAI)
await fetch('http://localhost:3000/api/memory/hair-color', {
  method: 'POST',
  body: JSON.stringify({
    customerId: 'C1',
    colorFormula: { color: 'Dark Brown', brand: 'L\'Oreal', developer: '20 Vol', processingTime: 30 }
  })
});
```

---

## 🔗 Connected Services

| Service | Port | Connected Via |
|---------|------|---------------|
| REZ Salon CRM | 4903 | GlamAI SalonBridge |
| REZ Salon Booking | 4201 | GlamAI SalonBridge |
| REZ Salon POS | 4902 | GlamAI SalonBridge |
| REZ Mind Salon | 4010 | GlamAI MindSalonBridge |
| Genie Memory | 4703 | GlamAI GenieBridge |
| Nexha | 5000 | GlamAI NexhaBridge |

---

**Version:** 2.0 | **Updated:** June 14, 2026