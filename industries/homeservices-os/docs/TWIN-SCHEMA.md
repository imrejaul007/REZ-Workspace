# Home Services OS Twin Schema

Digital twin schemas for the Home Services OS platform. These schemas define the data models for customer profiles, jobs, technicians, and inventory.

---

## Customer Twin Schema

```typescript
interface CustomerTwin {
  // Core identification
  id: string;                    // Unique identifier (UUID)
  externalId?: string;           // CRM integration ID (Housecall Pro / Jobber)

  // Personal information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  preferredContactMethod: 'email' | 'phone' | 'sms';

  // Account status
  status: 'active' | 'inactive' | 'deleted';
  createdAt: string;            // ISO 8601 timestamp
  updatedAt: string;
  deletedAt?: string;

  // Loyalty program
  loyaltyTier: 'bronze' | 'silver' | 'gold' | 'platinum';
  totalServices: number;
  totalSpent: number;
  averageRating?: number;
  lastServiceDate?: string;

  // Properties
  properties: PropertyTwin[];

  // Metadata
  metadata: {
    source: 'manual' | 'import' | 'api' | 'crm';
    crmProvider?: 'housecallpro' | 'jobber';
    tags?: string[];
  };
}

interface PropertyTwin {
  id: string;
  customerId: string;

  // Property details
  name: string;                  // e.g., "Primary Residence"
  type: 'residential' | 'commercial' | 'industrial';

  // Address
  address: {
    street: string;
    unit?: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };

  // Property characteristics
  bedrooms?: number;
  bathrooms?: number;
  squareFeet?: number;
  yearBuilt?: number;
  lotSize?: number;
  propertyType?: string;         // e.g., "single_family", "condo", "townhouse"

  // Access information
  gateCode?: string;
  parkingInstructions?: string;
  petInfo?: string;
  specialInstructions?: string;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

interface ServiceHistoryRecord {
  id: string;
  customerId: string;
  propertyId: string;
  jobId: string;
  technicianId: string;

  serviceType: string;
  description: string;
  amount: number;
  rating?: number;

  performedAt: string;
  createdAt: string;
}
```

---

## Job Twin Schema

```typescript
interface JobTwin {
  // Core identification
  id: string;
  externalId?: string;            // CRM integration ID
  customerId: string;
  propertyId: string;

  // Job details
  serviceType: string;           // e.g., "plumbing", "hvac", "electrical"
  description: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: JobStatus;

  // Assignment
  assignedTechnicianId?: string;
  assignedAt?: string;

  // Scheduling
  scheduledDate?: string;        // YYYY-MM-DD
  scheduledTimeStart?: string;    // HH:mm
  scheduledTimeEnd?: string;     // HH:mm

  // Quote reference
  quoteId?: string;

  // Work order
  workOrderId?: string;

  // Financial
  estimatedAmount?: number;
  finalAmount?: number;

  // Tracking
  statusHistory: StatusChangeRecord[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  cancelledAt?: string;

  // Source tracking
  source: 'customer_portal' | 'phone' | 'api' | 'crm' | 'repeat';

  // Metadata
  metadata: {
    technicianNotes?: string;
    customerFeedback?: string;
    tags?: string[];
  };
}

type JobStatus =
  | 'pending'
  | 'confirmed'
  | 'scheduled'
  | 'in_progress'
  | 'on_hold'
  | 'completed'
  | 'invoice_sent'
  | 'paid'
  | 'closed'
  | 'cancelled'
  | 'rescheduled';

interface StatusChangeRecord {
  from: JobStatus;
  to: JobStatus;
  timestamp: string;
  note?: string;
}

interface QuoteTwin {
  id: string;
  jobId: string;
  customerId: string;

  status: 'draft' | 'sent' | 'approved' | 'rejected' | 'expired' | 'revised';

  // Line items
  lineItems: QuoteLineItem[];

  // Costs
  laborCost: number;
  partsCost: number;
  materialsCost: number;
  travelCost: number;
  discount: number;
  subtotal: number;
  tax: number;
  totalAmount: number;

  // Validity
  validUntil: string;

  // Approval
  sentAt?: string;
  sentVia?: 'email' | 'sms' | 'portal';
  approvedAt?: string;
  approvedBy?: string;
  signature?: string;

  // Timestamps
  createdAt: string;
  updatedAt: string;

  notes?: string;
}

interface QuoteLineItem {
  id: string;
  type: 'base_fee' | 'labor' | 'parts' | 'materials' | 'travel' | 'discount' | 'adjustment';
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface WorkOrderTwin {
  id: string;
  jobId: string;
  customerId: string;
  propertyId: string;
  technicianId: string;

  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';

  // Tasks
  tasks: WorkOrderTask[];

  // Timing
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  actualDuration?: number;        // minutes

  // Signatures and photos
  photos: {
    id: string;
    url: string;
    caption?: string;
    takenAt: string;
  }[];

  signatures: {
    type: 'customer' | 'technician';
    imageUrl: string;
    signedAt: string;
  }[];

  // Notes
  notes?: string;
  completionNotes?: string;
}

interface WorkOrderTask {
  id: string;
  description: string;
  status: 'pending' | 'completed' | 'skipped';
  completedAt?: string;
  notes?: string;
}
```

---

## Technician Twin Schema

```typescript
interface TechnicianTwin {
  // Core identification
  id: string;
  externalId?: string;
  employeeId?: string;

  // Personal information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;

  // Status
  status: 'active' | 'inactive' | 'on_leave' | 'terminated';
  hireDate: string;
  deactivatedAt?: string;
  deactivationReason?: string;

  // Location
  location?: {
    address: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
    lastUpdated: string;
  };

  // Service areas
  serviceAreas: string[];        // e.g., ["downtown", "midtown", "westside"]

  // Skills and certifications
  skills: TechnicianSkill[];
  certifications: Certification[];

  // Performance
  rating: number;                // 0-5
  totalJobs: number;
  completedJobs: number;
  averageCompletionTime?: number; // minutes
  onTimeRate?: number;           // percentage

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

interface TechnicianSkill {
  id: string;
  technicianId: string;
  name: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  certified: boolean;
  yearsExperience: number;
  acquiredAt: string;
}

interface Certification {
  id: string;
  technicianId: string;
  name: string;
  issuer: string;
  category: string;
  licenseNumber?: string;
  issuedAt: string;
  expiresAt?: string;
  verified: boolean;
}

interface TechnicianAvailability {
  technicianId: string;

  // Weekly schedule
  weeklySchedule: {
    [dayOfWeek: number]: {
      available: boolean;
      start: string;             // HH:mm
      end: string;                // HH:mm
      breaks?: {
        start: string;
        end: string;
      }[];
    };
  };

  // Exceptions (time off, holidays, etc.)
  exceptions: AvailabilityException[];

  // Job limits
  maxJobsPerDay: number;
  maxHoursPerDay: number;

  updatedAt: string;
}

interface AvailabilityException {
  id: string;
  date: string;                  // YYYY-MM-DD
  type: 'time_off' | 'holiday' | 'blocked' | 'special';
  available: boolean;
  reason?: string;
  wholeDay: boolean;
  startTime?: string;
  endTime?: string;
}
```

---

## Inventory Twin Schema

```typescript
interface InventoryItemTwin {
  // Core identification
  id: string;
  sku: string;
  externalId?: string;           // ERP integration ID

  // Item details
  name: string;
  description?: string;
  category: InventoryCategory;
  subcategory?: string;

  // Status
  status: 'active' | 'discontinued' | 'deleted';

  // Pricing
  unitCost: number;              // Cost to company
  unitPrice: number;              // Selling price
  taxRate?: number;

  // Quantity tracking
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;      // Computed: quantity - reservedQuantity

  // Reorder settings
  reorderPoint: number;
  reorderQuantity: number;
  reorderSupplierId?: string;

  // Location
  warehouseId: string;
  binLocation?: string;           // Shelf/bin location

  // Images
  images?: {
    id: string;
    url: string;
    isPrimary: boolean;
  }[];

  // Suppliers
  preferredSupplierId?: string;
  supplierSKUs?: {
    supplierId: string;
    sku: string;
  }[];

  // Timestamps
  createdAt: string;
  updatedAt: string;
  lastRestockedAt?: string;
}

type InventoryCategory =
  | 'parts'
  | 'supplies'
  | 'equipment'
  | 'tools'
  | 'consumables'
  | 'other';

interface InventoryTransaction {
  id: string;
  itemId: string;
  type: TransactionType;

  // Quantity change
  quantity: number;              // Always positive
  previousQuantity: number;
  newQuantity: number;

  // Context
  jobId?: string;
  technicianId?: string;
  purchaseOrderId?: string;
  reason?: string;
  performedBy?: string;

  // Timestamps
  timestamp: string;
}

type TransactionType =
  | 'adjustment_in'
  | 'adjustment_out'
  | 'reservation'
  | 'release'
  | 'consumption'
  | 'return'
  | 'transfer';

interface PurchaseOrderTwin {
  id: string;
  status: 'draft' | 'submitted' | 'approved' | 'shipped' | 'received' | 'cancelled';

  // Supplier
  supplierId: string;

  // Destination
  warehouseId: string;

  // Line items
  items: PurchaseOrderItem[];

  // Totals
  subtotal: number;
  shippingCost?: number;
  tax?: number;
  totalAmount: number;

  // Delivery
  expectedDelivery?: string;
  receivedAt?: string;
  receivedItems?: {
    itemId: string;
    quantity: number;
  }[];

  // Notes
  notes?: string;

  // Timestamps
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
}

interface PurchaseOrderItem {
  itemId: string;
  sku: string;
  name: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
}

interface WarehouseTwin {
  id: string;
  name: string;
  status: 'active' | 'inactive';

  // Address
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };

  // Capacity
  capacity: number;
  currentUtilization: number;

  // Contact
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

interface SupplierTwin {
  id: string;
  name: string;
  status: 'active' | 'inactive';

  // Contact
  contactName?: string;
  email: string;
  phone?: string;

  // Address
  address?: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };

  // Account
  accountNumber?: string;
  paymentTerms?: string;
  rating?: number;
  totalOrders: number;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}
```

---

## Agent Data Structures

### Dispatcher Agent

```typescript
interface DispatchAssignment {
  id: string;
  jobId: string;
  customerId: string;
  technicianId: string;
  technicianName: string;

  status: 'assigned' | 'in_progress' | 'completed' | 'cancelled' | 'reassigned';

  // Matching
  matchScore: number;
  scoreBreakdown: {
    skillMatch: number;
    distance: number;
    availability: number;
    workload: number;
    rating: number;
    experience: number;
  };

  // Alternatives considered
  alternatives: {
    technicianId: string;
    technicianName: string;
    score: number;
  }[];

  // Timing
  assignedAt: string;
  estimatedArrival?: string;
  startedAt?: string;
  completedAt?: string;

  // Cancellation
  cancelledAt?: string;
  cancellationReason?: string;
}
```

### Quote Generator Agent

```typescript
interface GeneratedQuote {
  id: string;
  jobId: string;
  customerId: string;
  serviceType: string;
  serviceCategory: string;

  // Breakdown
  lineItems: QuoteLineItem[];
  laborCost: number;
  partsCost: number;
  travelCost: number;
  subtotal: number;
  discount: number;
  tax: number;
  totalAmount: number;

  // Generation details
  breakdown: {
    estimatedHours: number;
    partsEstimate: number;
    timeAdjustment?: {
      multiplier: number;
      reason: string;
    };
    generationTimeMs: number;
  };

  // Validity
  validUntil: string;
  generatedAt: string;
}
```

### Scheduling Agent

```typescript
interface Appointment {
  id: string;
  jobId: string;
  customerId: string;
  technicianId: string;

  // Schedule
  date: string;
  timeStart: string;
  timeEnd: string;
  duration: number;

  status: 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'rescheduled';

  // Rescheduling
  rescheduledAt?: string;
  rescheduleReason?: string;
  previousSchedule?: {
    date: string;
    timeStart: string;
    timeEnd: string;
  };

  // Notifications
  confirmationSent: boolean;
  confirmationSentAt?: string;
  reminderSent: boolean;
  reminderSentAt?: string;

  // Cancellation
  cancelledAt?: string;
  cancellationReason?: string;

  // Notes
  notes?: string;
  createdAt: string;
}

interface TimeSlot {
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  available: boolean;
  conflictingAppointments: string[];
  hasBufferConflict: boolean;
}
```

### Customer Retention Agent

```typescript
interface LoyaltyAccount {
  customerId: string;
  currentTier: 'bronze' | 'silver' | 'gold' | 'platinum';

  // Points
  totalPoints: number;
  lifetimePoints: number;
  redeemedPoints: number;

  // Transactions
  transactions: LoyaltyTransaction[];

  // Status
  enrolledAt: string;
  lastActivity: string;
}

interface LoyaltyTransaction {
  id: string;
  type: 'earned' | 'redeemed' | 'bonus' | 'expired';
  points: number;
  balance: number;

  context?: {
    jobId?: string;
    serviceType?: string;
    rewardCode?: string;
    reason?: string;
  };

  timestamp: string;
}

interface FollowUp {
  id: string;
  jobId: string;
  customerId: string;
  type: 'follow_up' | 'satisfaction_survey';

  scheduledFor: string;
  status: 'pending' | 'sent' | 'completed' | 'failed';
  attempts: number;
  maxAttempts: number;
  lastAttempt?: string;
  nextRetry?: string;

  // Survey response (if applicable)
  response?: {
    rating?: number;
    feedback?: string;
    wouldRecommend?: boolean;
    submittedAt: string;
  };

  createdAt: string;
  completedAt?: string;
}
```

---

## Enumerations

### Service Types

```typescript
const SERVICE_TYPES = [
  'hvac',
  'plumbing',
  'electrical',
  'appliance',
  'landscaping',
  'cleaning',
  'pest_control',
  'roofing',
  'painting',
  'carpentry',
  'general'
] as const;

type ServiceType = typeof SERVICE_TYPES[number];
```

### Priority Levels

```typescript
const PRIORITY_LEVELS = ['low', 'normal', 'high', 'urgent'] as const;
type Priority = typeof PRIORITY_LEVELS[number];
```

### Loyalty Tiers

```typescript
const LOYALTY_TIERS = ['bronze', 'silver', 'gold', 'platinum'] as const;
type LoyaltyTier = typeof LOYALTY_TIERS[number];

interface LoyaltyTierConfig {
  minSpend: number;
  minJobs: number;
  discount: number;
  pointsMultiplier: number;
  benefits: string[];
}
```

---

## Indexes

Recommended database indexes for optimal query performance:

### Customer Twin
- `email` (unique)
- `phone`
- `status`
- `loyaltyTier`
- `lastServiceDate`
- `createdAt`

### Job Twin
- `customerId`
- `propertyId`
- `assignedTechnicianId`
- `status`
- `priority`
- `scheduledDate`
- `createdAt`

### Technician Twin
- `email` (unique)
- `status`
- `skills.name`
- `serviceAreas`

### Inventory Twin
- `sku` (unique)
- `category`
- `status`
- `warehouseId`
- `quantity` (for low stock queries)

---

## Relationships

```
CustomerTwin (1) ────── (*) PropertyTwin
    │
    │
    └─── (*) ServiceHistoryRecord
    │
    └─── (*) JobTwin (1) ────── (*) QuoteTwin
                │
                │
                └─── (*) WorkOrderTwin ────── TechnicianTwin (1)
                │
                └─── TechnicianTwin (*)

InventoryTwin (1) ────── (*) InventoryTransaction
    │
    └─── WarehouseTwin (1)

LoyaltyAccount (1) ────── (*) LoyaltyTransaction
    │
    └─── CustomerTwin (1)
```
