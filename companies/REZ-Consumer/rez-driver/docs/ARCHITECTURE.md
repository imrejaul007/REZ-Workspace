# REZ Driver App - Architecture & Roadmap

## Overview

The REZ Driver App is a comprehensive mobile application for delivery drivers that supports multiple service types including food delivery, grocery delivery, medicine delivery, courier services, furniture delivery, cab booking, and ride sharing.

This document outlines the architecture, data models, and phased development roadmap.

---

## Architecture

### Technology Stack

- **Framework**: React Native with Expo SDK 52
- **Routing**: expo-router v4
- **State Management**: Zustand v5
- **Navigation**: React Navigation v7
- **Styling**: StyleSheet (React Native)
- **Date Utilities**: date-fns
- **Icons**: Lucide React Native

### Project Structure

```
rez-driver-app/
├── app/                    # Expo Router screens
│   ├── _layout.tsx         # Tab navigation layout
│   ├── deliveries.tsx       # Active deliveries screen
│   ├── delivery/[id].tsx    # Delivery detail screen
│   ├── earnings.tsx         # Earnings screen
│   ├── profile.tsx          # Driver profile screen
│   └── settings.tsx         # Settings screen
├── src/
│   ├── types/              # TypeScript type definitions
│   │   └── index.ts
│   ├── services/            # API services
│   │   ├── api.ts           # Main API client
│   │   └── mockData.ts      # Mock data for development
│   ├── stores/              # Zustand state stores
│   │   └── index.ts
│   ├── components/          # Reusable UI components
│   │   ├── DeliveryCard.tsx
│   │   ├── StatusBadge.tsx
│   │   ├── Card.tsx
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── EarningsCard.tsx
│   │   └── EmptyState.tsx
│   └── utils/               # Utility functions
│       └── index.ts
└── docs/
    └── ARCHITECTURE.md      # This file
```

### Data Flow

1. **API Layer** (`src/services/api.ts`)
   - Connects to Delivery Service (port 4010)
   - Handles all REST API calls
   - Returns standardized `ApiResponse<T>` format

2. **State Store** (`src/stores/index.ts`)
   - Zustand store for global state
   - Manages deliveries, rides, notifications, earnings
   - Provides selectors for computed values

3. **Screens** (`app/*.tsx`)
   - React Native components
   - Use Zustand hooks for state
   - Call API services for data

---

## Delivery Types

### Supported Services

| Type | Description | Icon | Color | Peak Multiplier |
|------|-------------|------|-------|-----------------|
| `food` | Restaurant and food deliveries | 🍔 | #FF6B35 | 1.5x |
| `grocery` | Supermarket and convenience | 🛒 | #4CAF50 | 1.3x |
| `medicine` | Pharmacy and medical supplies | 💊 | #2196F3 | 1.4x |
| `courier` | Documents and packages | 📦 | #9C27B0 | 1.2x |
| `furniture` | Large items and furniture | 🪑 | #795548 | 1.1x |
| `cab` | Premium cab rides | 🚕 | #FFC107 | 2.0x |
| `ride_share` | Shared rides | 🚗 | #00BCD4 | 1.8x |

### Earnings Configuration

```typescript
const DELIVERY_TYPE_CONFIG = {
  food: {
    baseEarning: 5.00,    // Base pickup fee
    perKmRate: 1.50,      // Per kilometer rate
    perKgRate: 0.50,      // Per kilogram rate
    peakMultiplier: 1.5,  // Peak hour bonus
  },
  // ... other types
};
```

---

## Vehicle Types

### Vehicle Categories

| Category | Vehicle Types | Max Weight | Max Volume |
|----------|--------------|------------|------------|
| Bike | bicycle, cargo_bike | 15-50 kg | 50-150 L |
| Motorcycle | motorcycle | 30 kg | 80 L |
| Car | car_sedan, car_suv, car_van, car_pickup | 100-800 kg | 400-1500 L |
| Van | delivery_van, car_van | 500-1000 kg | 1200-2500 L |
| Truck | delivery_truck, flatbed | 3000-5000 kg | 8000-15000 L |

### Vehicle Requirements by Delivery Type

| Delivery Type | Required Vehicles |
|--------------|------------------|
| Food | bike, motorcycle, car, van |
| Grocery | bike, motorcycle, car, van |
| Medicine | bike, motorcycle, car, van |
| Courier | bike, motorcycle, car, van, truck |
| Furniture | van, truck |
| Cab | car |
| Ride Share | car |

---

## API Endpoints

### Base URLs

- **Production**: `https://api.rez.delivery`
- **Delivery Service**: `http://localhost:4010`

### Delivery API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/deliveries/active` | GET | Get active deliveries |
| `/api/v1/deliveries/requests` | GET | Get pending delivery requests |
| `/api/v1/deliveries/history` | GET | Get completed deliveries |
| `/api/v1/deliveries/{id}` | GET | Get delivery details |
| `/api/v1/deliveries/{id}/accept` | POST | Accept delivery |
| `/api/v1/deliveries/{id}/decline` | POST | Decline delivery |
| `/api/v1/deliveries/{id}/status` | PATCH | Update delivery status |
| `/api/v1/deliveries/{id}/proof` | POST | Submit proof of delivery |
| `/api/v1/deliveries/types` | GET | Get available delivery types |

### Ride API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/rides/active` | GET | Get active rides |
| `/api/v1/rides/requests` | GET | Get pending ride requests |
| `/api/v1/rides/history` | GET | Get completed rides |
| `/api/v1/rides/{id}` | GET | Get ride details |
| `/api/v1/rides/{id}/accept` | POST | Accept ride |
| `/api/v1/rides/{id}/status` | PATCH | Update ride status |

### Driver API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/drivers/me` | GET | Get driver profile |
| `/api/v1/drivers/me` | PATCH | Update profile |
| `/api/v1/drivers/location` | POST | Update location |
| `/api/v1/drivers/me/status` | PATCH | Set online/offline |
| `/api/v1/drivers/me/vehicles` | GET | Get registered vehicles |
| `/api/v1/drivers/me/delivery-types` | PATCH | Update delivery types |

### Earnings API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/earnings/today` | GET | Get today's earnings |
| `/api/v1/earnings/week` | GET | Get weekly earnings |
| `/api/v1/earnings/by-type` | GET | Get earnings by delivery type |
| `/api/v1/earnings/transactions` | GET | Get recent transactions |
| `/api/v1/earnings/payout` | POST | Request payout |

---

## Development Roadmap

### Phase 1: Food Delivery (MVP)
**Target**: Core food delivery functionality

#### Features
- [x] Driver authentication
- [x] Online/offline toggle
- [x] Active deliveries list
- [x] Pending delivery requests
- [x] Accept/decline deliveries
- [x] Delivery status updates (accepted → picked_up → in_transit → delivered)
- [x] Proof of delivery (signature, photo)
- [x] Navigation integration (Google Maps, Waze, Apple Maps)
- [x] Call merchant/customer
- [x] Basic earnings tracking

#### Components Built
- `src/types/index.ts` - Delivery and Driver types
- `src/services/api.ts` - Delivery API client
- `src/stores/index.ts` - State management
- `app/deliveries.tsx` - Main deliveries screen
- `app/delivery/[id].tsx` - Delivery detail screen

---

### Phase 2: All Delivery Types
**Target**: Expand beyond food to complete delivery suite

#### Features
- [x] Multi-type delivery support (food, grocery, medicine, courier, furniture)
- [x] Vehicle capacity matching
- [x] Weight/volume tracking
- [x] Type-specific earnings calculation
- [x] Type-specific UI styling
- [x] Delivery type filtering
- [x] Breakdown earnings by type

#### Components Updated
- `src/types/index.ts` - Added `DeliveryType`, `VehicleType`, `VehicleCapacity`
- `src/services/api.ts` - Added type-specific endpoints
- `src/services/mockData.ts` - Added mock data for all types
- `src/stores/index.ts` - Added type filtering
- `src/utils/index.ts` - Added type utilities
- `src/components/DeliveryCard.tsx` - Added type badges and styling

#### New Screens
- Earnings breakdown by delivery type
- Vehicle management

---

### Phase 3: Cab Booking & Ride Sharing
**Target**: Mobility services (cab, rideshare)

#### Features
- [ ] Ride requests (separate from delivery requests)
- [ ] Accept/decline ride requests
- [ ] Real-time trip tracking
- [ ] In-app navigation for rides
- [ ] Trip sharing with emergency contacts
- [ ] Safety features (audio recording)
- [ ] Passenger count tracking
- [ ] Flight/train tracking for airport rides
- [ ] Multi-stop routing

#### New Types
```typescript
interface Ride {
  id: string;
  rideType: 'standard' | 'premium' | 'suv' | 'economy' | 'pool';
  status: RideStatus;
  pickupLocation: Location;
  dropoffLocation: Location;
  passengerCount: number;
  flightNumber?: string;
  // ...
}
```

#### New API Endpoints
- `GET /api/v1/rides/active`
- `GET /api/v1/rides/requests`
- `POST /api/v1/rides/{id}/accept`
- `PATCH /api/v1/rides/{id}/status`

#### New Screens
- `app/rides.tsx` - Active rides screen
- `app/ride/[id].tsx` - Ride detail screen
- `app/rides-history.tsx` - Completed rides

#### New Components
- `RideCard.tsx`
- `RideRequestModal.tsx`
- `TripMap.tsx`

---

### Phase 4: Fleet Management
**Target**: Enterprise features for fleet operators

#### Features
- [ ] Multi-vehicle registration
- [ ] Vehicle assignment
- [ ] Fleet analytics dashboard
- [ ] Driver scheduling
- [ ] Performance metrics
- [ ] Maintenance tracking
- [ ] Fuel/charging tracking
- [ ] Team communication
- [ ] Dispute resolution

#### New Types
```typescript
interface FleetVehicle {
  id: string;
  fleetId: string;
  vehicleInfo: VehicleInfo;
  assignedDriver?: Driver;
  status: 'available' | 'in_use' | 'maintenance' | 'retired';
  currentDelivery?: Delivery;
  currentRide?: Ride;
  odometer: number;
  lastMaintenance?: Date;
  nextMaintenance?: Date;
}

interface Fleet {
  id: string;
  name: string;
  ownerId: string;
  vehicles: FleetVehicle[];
  totalDrivers: number;
  activeDrivers: number;
}
```

#### New API Endpoints
- `GET /api/v1/fleets/{fleetId}`
- `GET /api/v1/fleets/{fleetId}/vehicles`
- `POST /api/v1/fleets/{fleetId}/vehicles/{vehicleId}/assign`
- `GET /api/v1/fleets/{fleetId}/analytics`

#### New Screens
- `app/fleet.tsx` - Fleet overview
- `app/fleet/vehicles.tsx` - Vehicle management
- `app/fleet/analytics.tsx` - Fleet analytics
- `app/fleet/drivers.tsx` - Driver management

#### New Components
- `FleetCard.tsx`
- `VehicleCard.tsx`
- `AnalyticsChart.tsx`
- `DriverList.tsx`

---

## Future Enhancements

### Short-term (Post-Phase 4)
- Real-time location tracking with WebSocket
- Push notification improvements
- In-app chat with customer/merchant
- Order bundling for efficiency
- Scheduled deliveries
- Dynamic pricing based on demand

### Long-term
- AR navigation for pickups
- AI-powered route optimization
- Carbon footprint tracking
- EV charging station integration
- Autonomous vehicle support
- Multi-modal transport (transit + delivery)

---

## Environment Configuration

### Development
```env
EXPO_PUBLIC_API_URL=https://api.rez.delivery
EXPO_PUBLIC_DELIVERY_SERVICE_URL=http://localhost:4010
```

### Production
```env
EXPO_PUBLIC_API_URL=https://api.rez.delivery
EXPO_PUBLIC_DELIVERY_SERVICE_URL=https://delivery.rez.delivery
```

---

## Testing Strategy

### Unit Tests
- Utility functions
- Type transformations
- Earnings calculations

### Integration Tests
- API service calls
- Store state updates
- Screen component rendering

### E2E Tests
- Full delivery flow
- Ride acceptance flow
- Earnings tracking

---

## Performance Considerations

1. **Location Updates**: Throttle to every 5 seconds when stationary, every 1 second when moving
2. **List Rendering**: Use `FlatList` with `getItemLayout` for predictable item heights
3. **State Updates**: Use Zustand selectors to prevent unnecessary re-renders
4. **Image Loading**: Use progressive loading with blur placeholders
5. **API Calls**: Implement request deduplication and caching

---

## Security

1. **Authentication**: JWT tokens with refresh mechanism
2. **Data Encryption**: TLS for all API communication
3. **Local Storage**: Encrypted storage for sensitive data
4. **Safety Features**: Trip sharing, emergency contacts, audio recording
5. **Privacy**: Configurable data sharing preferences

---

## Contributing

When adding new delivery types or features:

1. Update `src/types/index.ts` with new types
2. Add earnings configuration to `DELIVERY_TYPE_CONFIG`
3. Update API service in `src/services/api.ts`
4. Add mock data in `src/services/mockData.ts`
5. Update utilities in `src/utils/index.ts`
6. Add new components if needed
7. Update this documentation

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024-01 | Initial food delivery MVP |
| 1.1.0 | 2024-03 | Phase 2: Multi-delivery type support |
| 1.2.0 | TBD | Phase 3: Cab booking (planned) |
| 1.3.0 | TBD | Phase 4: Fleet management (planned) |

---

## Contact

For questions about the architecture or roadmap, contact the REZ Platform team.
