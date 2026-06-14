# REZ Purchase Order Mobile App

A complete Expo/React Native mobile application for managing purchase orders in the REZ ecosystem.

## Features

### Core Features
- **View Purchase Orders** - Browse all POs with filtering, sorting, and search
- **Create New POs** - Full-featured form with supplier selection, line items, and delivery details
- **Approve/Reject POs** - Quick approval workflow with reason tracking
- **Track Delivery Status** - Real-time delivery tracking with photo capture
- **Supplier Search** - Search and select from verified suppliers
- **Price Comparison** - Compare prices across multiple suppliers
- **Photo Capture** - Capture delivery, damage, and signature photos
- **Offline Mode** - Full offline support with automatic sync

### Dashboard
- Overview statistics (total POs, pending approval, in transit, delivered)
- Financial summary with pending value tracking
- Performance metrics (average delivery time, on-time rate)
- Quick actions for common tasks

### PO Management
- Multi-status filtering (draft, pending, approved, rejected, in transit, delivered)
- Priority levels (low, medium, high, urgent)
- Tags and notes for organization
- Complete audit trail and history

### Delivery Tracking
- Multiple photo types (delivery, damage, receiving, signature)
- Delivery attempt logging
- GPS-enabled address capture
- Real-time status updates

## Tech Stack

- **Framework**: Expo SDK 51 with React Native 0.74
- **Navigation**: React Navigation 6 (native-stack + bottom-tabs)
- **State Management**: Zustand with persistence
- **Data Fetching**: TanStack Query (React Query)
- **UI Components**: React Native Paper + custom components
- **Icons**: Material Community Icons
- **HTTP Client**: Axios with interceptors
- **Camera**: expo-camera
- **Image Picker**: expo-image-picker
- **Secure Storage**: expo-secure-store
- **Network Status**: @react-native-community/netinfo

## Project Structure

```
REZ-purchase-order-mobile/
├── App.tsx                    # Main app with navigation
├── app.json                   # Expo configuration
├── package.json               # Dependencies
├── tsconfig.json             # TypeScript config
├── babel.config.js           # Babel config
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── common.tsx        # Common components (StatusBadge, SearchBar, etc.)
│   │   └── poCard.tsx        # Purchase order card component
│   ├── contexts/
│   │   └── store.ts          # Zustand store with persistence
│   ├── screens/              # App screens
│   │   ├── dashboard.tsx     # Dashboard with stats
│   │   ├── poList.tsx        # PO list with filters
│   │   ├── poDetail.tsx      # PO detail view
│   │   ├── createPO.tsx      # Create/edit PO form
│   │   ├── supplierSearch.tsx # Supplier search
│   │   ├── productSearch.tsx # Product search
│   │   ├── camera.tsx        # Photo capture
│   │   └── settings.tsx      # App settings
│   ├── services/
│   │   └── api.ts            # API service with offline sync
│   ├── types/
│   │   └── index.ts          # TypeScript types
│   └── utils/                # Utility functions
└── assets/                   # Images and fonts
```

## Installation

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android
```

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
EXPO_PUBLIC_API_URL=https://api.rezapp.com
```

### Required Environment Variables for Production

| Variable | Description | Required |
|----------|-------------|----------|
| `EXPO_PUBLIC_API_URL` | Base URL for API endpoints | Yes |

### Native Configuration

#### iOS (Info.plist)
```xml
<key>NSCameraUsageDescription</key>
<string>REZ Purchase Order needs camera access to capture delivery photos</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>REZ Purchase Order needs photo library access to attach images</string>
```

#### Android (AndroidManifest.xml)
```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

## API Integration

The app connects to the REZ Purchase Order Service. Configure the API URL in the service:

```typescript
// src/services/api.ts
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.rezapp.com';
```

### Authentication

All API requests require the `X-Internal-Token` header. Token management is handled automatically by the API service using `expo-secure-store`.

### Offline Sync

The app implements a robust offline sync system:

1. All changes are saved locally first
2. When online, changes are synced automatically
3. Failed syncs are queued for retry
4. Visual indicators show sync status

## Navigation

### Stack Navigator
- `Main` - Tab navigator container
- `PODetail` - Purchase order detail view
- `CreatePO` - Create new PO (modal presentation)
- `EditPO` - Edit existing PO
- `SupplierSearch` - Supplier search and selection
- `ProductSearch` - Product search and selection
- `PriceComparison` - Price comparison view
- `Camera` - Photo capture (full-screen modal)
- `DeliveryTracking` - Delivery tracking view

### Tab Navigator
- Dashboard - Home with statistics
- Orders - Purchase order list
- Create - Quick create action
- Alerts - Notifications
- Settings - App settings

## State Management

The app uses Zustand for state management with the following stores:

### POStore
- Purchase orders list and filters
- Current selected PO
- Supplier and product search results
- Dashboard statistics
- Network status and sync state

## Component Library

### Common Components
- `StatusBadge` - PO and payment status badges
- `LoadingSpinner` - Loading states
- `EmptyState` - Empty list states
- `NetworkBanner` - Offline indicator
- `SearchBar` - Search input
- `FilterChip` - Filter selection chips
- `StatsCard` - Dashboard statistics
- `ConfirmModal` - Confirmation dialogs
- `QuantitySelector` - Quantity +/- control
- `FAB` - Floating action button

### POCard
Reusable card component for displaying purchase orders:
- PO number and status
- Supplier info
- Items summary
- Amount display
- Payment status
- Priority indicator
- Approval actions (when applicable)

## Data Types

### PurchaseOrder
```typescript
interface PurchaseOrder {
  id: string;
  poNumber: string;
  status: POStatus;
  paymentStatus: PaymentStatus;
  supplier: Supplier;
  items: POItem[];
  grandTotal: number;
  // ... more fields
}
```

### POStatus
- `draft` - Not yet submitted
- `pending_approval` - Awaiting approval
- `approved` - Approved by manager
- `rejected` - Rejected
- `sent` - Sent to supplier
- `acknowledged` - Acknowledged by supplier
- `in_transit` - Being delivered
- `delivered` - Successfully delivered
- `cancelled` - Cancelled

### Supplier
```typescript
interface Supplier {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: Address;
  rating: number;
  isVerified: boolean;
  // ... more fields
}
```

## Best Practices

### Performance
- Memoize components with `React.memo`
- Use `useCallback` for event handlers
- Implement pagination for large lists
- Use FlatList for virtualized rendering

### Offline Support
- Always save changes locally first
- Queue failed API calls for retry
- Show clear sync status indicators
- Handle network state changes

### Security
- Store tokens in secure storage
- Validate all user input
- Use parameterized queries
- Implement proper error handling

### UX
- Show loading states
- Handle empty states
- Provide feedback for actions
- Support pull-to-refresh
- Implement proper navigation patterns

## Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test -- --coverage
```

## Build

### iOS
```bash
# Build for iOS
expo build:ios

# Or with EAS
eas build --platform ios
```

### Android
```bash
# Build for Android
expo build:android

# Or with EAS
eas build --platform android
```

## Deployment

### EAS Build
```bash
# Configure EAS
eas build:configure

# Build for production
eas build --platform all --profile production
```

### Submit to Stores
```bash
# Submit to App Store
eas submit --platform ios

# Submit to Play Store
eas submit --platform android
```

## License

Proprietary - RABTUL Technologies

## Support

For support, contact:
- Email: support@rezapp.com
- Documentation: docs.rezapp.com
