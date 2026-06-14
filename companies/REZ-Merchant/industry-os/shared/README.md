# 📦 REZ Industry OS - Shared SDKs

**Version:** 1.0 | **Date:** June 13, 2026

---

## Available SDKs

| SDK | Industry | Services | Status |
|-----|----------|---------|--------|
| `@rez/hotel-sdk` | Hotel | 8 clients | ✅ Ready |
| `@rez/restaurant-sdk` | Restaurant | 7 clients | ✅ Ready |
| `@rez/salon-sdk` | Salon | 4 clients | ✅ Ready |
| `@rez/healthcare-sdk` | Healthcare | 3 clients | ✅ Ready |
| `@rez/fitness-sdk` | Fitness | 2 clients | ✅ Ready |
| `@rez/retail-sdk` | Retail | 4 clients | ✅ Ready |
| `@rez/events-sdk` | Events | 2 clients | ✅ Ready |

---

## Quick Start

```bash
# Install SDK
npm install @rez/hotel-sdk

# Or use from local path
import { createHotelSDK } from '../../shared/rez-hotel-sdk';
```

---

## Hotel SDK Example

```typescript
import { createHotelSDK } from '@rez/hotel-sdk';

const hotel = createHotelSDK({
  baseURL: 'http://localhost:4801',
  internalToken: process.env.INTERNAL_SERVICE_TOKEN
});

// Create booking
const booking = await hotel.booking.createBooking({
  hotelId: 'H1',
  guestId: 'G1',
  checkIn: new Date('2026-06-15'),
  checkOut: new Date('2026-06-17')
});

// Chat with AI concierge
const reply = await hotel.staybot.sendMessage('G1', 'Order room service');
```

---

## Restaurant SDK Example

```typescript
import { createRestaurantSDK } from '@rez/restaurant-sdk';

const restaurant = createRestaurantSDK({
  baseURL: 'http://localhost:4101'
});

// Create order
const order = await restaurant.pos.createOrder({
  tableId: 'T1',
  items: [{ menuItemId: 'M1', name: 'Biryani', quantity: 2, price: 250 }]
});

// Get kitchen tickets
const tickets = await restaurant.kds.getTickets('pending');
```

---

## Salon SDK Example

```typescript
import { createSalonSDK } from '@rez/salon-sdk';

const salon = createSalonSDK({
  baseURL: 'http://localhost:4901'
});

// Book appointment
const appointment = await salon.booking.createAppointment({
  customerId: 'C1',
  stylistId: 'S1',
  serviceId: 'SV1',
  dateTime: new Date('2026-06-15T10:00:00')
});
```

---

## Healthcare SDK Example

```typescript
import { createHealthcareSDK } from '@rez/healthcare-sdk';

const healthcare = createHealthcareSDK({
  baseURL: 'http://localhost:4501'
});

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

## Unified Entry Point

```typescript
// index.ts - Export all SDKs
export { createHotelSDK } from './rez-hotel-sdk';
export { createRestaurantSDK } from './rez-restaurant-sdk';
export { createSalonSDK } from './rez-salon-sdk';
export { createHealthcareSDK } from './rez-healthcare-sdk';
```

---

**Version:** 1.0 | **Updated:** June 13, 2026
