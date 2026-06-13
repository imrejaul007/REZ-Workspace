# Government OS SDK Documentation

The Government OS SDK provides a unified interface for integrating with the Government OS platform.

## Installation

### Node.js / TypeScript

```bash
npm install @government-os/sdk
```

```typescript
import { GovernmentOSClient } from '@government-os/sdk';
```

### Python

```bash
pip install government-os-sdk
```

```python
from government_os import GovernmentOSClient
```

### Go

```bash
go get github.com/government-os/sdk-go
```

```go
import "github.com/government-os/sdk-go"
```

---

## Quick Start

### Node.js / TypeScript

```typescript
import { GovernmentOSClient } from '@government-os/sdk';

// Initialize client
const client = new GovernmentOSClient({
  baseUrl: 'https://api.government-os.example.com',
  apiKey: 'your-api-key',
  environment: 'production'
});

// Create a citizen profile
const citizen = await client.citizenTwins.create({
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  phone: '+1-555-123-4567',
  dateOfBirth: '1985-06-15',
  address: {
    street: '123 Main St',
    city: 'Springfield',
    state: 'IL',
    zipCode: '62701'
  },
  citizenType: 'standard'
});

// Search for eligible services
const services = await client.services.findEligible({
  residentId: citizen.residentId,
  dateOfBirth: citizen.dateOfBirth,
  citizenType: citizen.citizenType,
  residencyVerified: true
});

// Submit a permit application
const application = await client.applications.submit({
  residentId: citizen.residentId,
  permitId: services[0].serviceId,
  permitType: services[0].metadata.permitType,
  personalInfo: {
    firstName: citizen.firstName,
    lastName: citizen.lastName,
    email: citizen.email,
    phone: citizen.phone
  }
});

console.log('Application submitted:', application.applicationId);
```

### Python

```python
from government_os import GovernmentOSClient

# Initialize client
client = GovernmentOSClient(
    base_url='https://api.government-os.example.com',
    api_key='your-api-key',
    environment='production'
)

# Create a citizen profile
citizen = client.citizen_twins.create(
    first_name='John',
    last_name='Doe',
    email='john.doe@example.com',
    phone='+1-555-123-4567',
    date_of_birth='1985-06-15',
    address={
        'street': '123 Main St',
        'city': 'Springfield',
        'state': 'IL',
        'zip_code': '62701'
    },
    citizen_type='standard'
)

# Search for eligible services
services = client.services.find_eligible(
    resident_id=citizen['resident_id'],
    date_of_birth=citizen['date_of_birth'],
    citizen_type=citizen['citizen_type'],
    residency_verified=True
)

# Submit a permit application
application = client.applications.submit(
    resident_id=citizen['resident_id'],
    permit_id=services[0]['service_id'],
    permit_type=services[0]['metadata']['permit_type'],
    personal_info={
        'first_name': citizen['first_name'],
        'last_name': citizen['last_name'],
        'email': citizen['email'],
        'phone': citizen['phone']
    }
)

print(f'Application submitted: {application["application_id"]}')
```

---

## Client Configuration

### Configuration Options

```typescript
interface ClientConfig {
  // Required
  baseUrl: string;           // API base URL
  apiKey: string;            // API key or access token

  // Optional
  environment?: 'production' | 'staging' | 'development';
  timeout?: number;          // Request timeout in ms (default: 30000)
  maxRetries?: number;       // Max retry attempts (default: 3)
  retryDelay?: number;       // Delay between retries in ms (default: 1000)
  logger?: Logger;           // Custom logger instance
  cacheEnabled?: boolean;    // Enable response caching (default: true)
  cacheTTL?: number;         // Cache TTL in seconds (default: 300)
}
```

### Environment Variables

```bash
# .env file
GOVERNMENT_OS_BASE_URL=https://api.government-os.example.com
GOVERNMENT_OS_API_KEY=your-api-key
GOVERNMENT_OS_ENVIRONMENT=production
GOVERNMENT_OS_TIMEOUT=30000
GOVERNMENT_OS_MAX_RETRIES=3
```

```typescript
// Load from environment variables
const client = new GovernmentOSClient({
  // Will read from GOVERNMENT_OS_* environment variables
});
```

---

## Citizen Twin Service

### Operations

```typescript
// Create or update citizen profile
const citizen = await client.citizenTwins.upsert({
  residentId: 'optional-existing-id',
  firstName: 'string',
  lastName: 'string',
  email: 'string',
  phone: 'string',
  dateOfBirth: 'YYYY-MM-DD',
  ssn: 'string (optional)',
  address: {
    street: 'string',
    city: 'string',
    state: 'string',
    zipCode: 'string'
  },
  citizenType: 'standard | senior | veteran | low_income'
});

// Get citizen by ID
const citizen = await client.citizenTwins.get('resident-id');

// Search citizens
const results = await client.citizenTwins.search({
  email: 'john@example.com',
  lastName: 'Doe',
  citizenType: 'standard'
});

// Update citizen needs
await client.citizenTwins.updateNeeds('resident-id', {
  addServices: ['service-1', 'service-2'],
  removeServices: ['service-3'],
  pendingApplications: ['app-1'],
  flaggedNeeds: ['housing', 'healthcare']
});

// Record interaction
await client.citizenTwins.recordInteraction('resident-id', {
  type: 'service_inquiry',
  channel: 'web',
  service: 'service-id',
  outcome: 'resolved',
  sentiment: 'positive',
  duration: 300
});

// Get engagement score
const score = await client.citizenTwins.getEngagementScore('resident-id');
```

### TypeScript Types

```typescript
interface CitizenTwin {
  residentId: string;
  demographics: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    ssn?: string;
    email: string;
    phone: string;
    address: Address;
  };
  profile: {
    verifiedStatus: 'pending' | 'verified' | 'rejected';
    citizenType: string;
    eligibilityFlags: string[];
  };
  needs: {
    currentServices: string[];
    pendingApplications: string[];
    activePermits: string[];
    upcomingRenewals: string[];
    flaggedNeeds: string[];
  };
  journey: {
    interactions: Interaction[];
    touchpoints: Touchpoint[];
    serviceHistory: ServiceHistory[];
    engagementScore: number;
  };
  metadata: {
    createdAt: string;
    updatedAt: string;
    version: number;
  };
}

interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
}

interface Interaction {
  id: string;
  type: string;
  channel: string;
  service: string;
  timestamp: string;
  outcome: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  duration: number;
}
```

---

## Service Twin Service

### Operations

```typescript
// Create or update service
const service = await client.services.upsert({
  name: 'Building Permit',
  description: 'Permit for residential construction',
  category: 'permits',
  subcategory: 'construction',
  tags: ['building', 'construction', 'residential'],
  eligibility: {
    citizenTypes: ['all'],
    ageRequirements: { min: 18 },
    residencyRequirements: { required: true, minimumYears: 1 },
    prerequisiteServices: []
  },
  requiredDocuments: ['proof_of_ownership', 'architectural_plans'],
  processSteps: [
    { name: 'Application', description: 'Submit application' },
    { name: 'Review', description: 'Plan review' },
    { name: 'Inspection', description: 'Site inspection' },
    { name: 'Approval', description: 'Permit approval' }
  ],
  estimatedDuration: '14 days',
  onlineAvailable: true,
  feeAmount: 500.00,
  waiverAvailable: true
});

// Get service by ID
const service = await client.services.get('service-id');

// Search services
const services = await client.services.search({
  category: 'permits',
  keywords: ['building', 'construction'],
  onlineAvailable: true
});

// Find eligible services for citizen
const eligible = await client.services.findEligible({
  residentId: 'resident-id',
  dateOfBirth: '1985-06-15',
  citizenType: 'standard',
  residencyVerified: true,
  yearsInJurisdiction: 5,
  currentServices: [],
  criminalRecord: null,
  outstandingFines: 0
});

// Get service categories
const categories = await client.services.getCategories();

// Update service metrics
await client.services.updateMetrics('service-id', {
  totalApplications: 100,
  averageProcessingTime: 12,
  satisfactionScore: 4.5,
  successRate: 0.85
});
```

---

## Permit Twin Service

### Operations

```typescript
// Create or update permit type
const permit = await client.permits.upsert({
  name: 'Business License',
  description: 'General business operating license',
  permitType: 'business_license',
  category: 'licenses',
  eligibilityCriteria: ['business_registration'],
  requiredDocuments: ['business_registration', 'zoning_verification'],
  applicationFee: 100.00,
  estimatedDays: 30,
  duration: 1,
  durationUnit: 'years',
  renewalRequired: true,
  renewalNoticeDays: 60
});

// Submit application
const application = await client.applications.submit({
  residentId: 'resident-id',
  permitId: 'permit-id',
  permitType: 'business_license',
  submissionMethod: 'online',
  personalInfo: {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: '+1-555-123-4567'
  },
  businessInfo: {
    name: 'Doe Enterprises LLC',
    type: 'LLC',
    ein: '12-3456789'
  },
  documents: [
    { id: 'doc-1', type: 'business_registration', name: 'registration.pdf' }
  ]
});

// Get application
const application = await client.applications.get('application-id');

// Get applications by resident
const applications = await client.applications.getByResident('resident-id', {
  status: 'pending',
  permitType: 'business_license'
});

// Update application status
await client.applications.updateStatus('application-id', {
  status: 'under_review',
  currentStage: 'document_review',
  assignedTo: 'agent-id',
  notes: 'Additional documents requested'
});

// Make decision
await client.applications.makeDecision('application-id', {
  outcome: 'approved',
  decidedBy: 'agent-id',
  reason: 'All requirements met'
});

// Issue permit
const permit = await client.applications.issue('application-id', {
  effectiveDate: '2024-01-15',
  deliveryMethod: 'digital'
});

// Track application status
const status = await client.applications.track('application-id');
```

---

## Compliance Twin Service

### Operations

```typescript
// Create or update regulation
const regulation = await client.regulations.upsert({
  title: 'Building Safety Code',
  description: 'Safety requirements for commercial buildings',
  regulationType: 'statute',
  category: 'safety',
  jurisdiction: 'IL',
  authority: 'Department of Building Safety',
  effectiveDate: '2024-01-01',
  mandatoryCompliance: true,
  complianceDeadline: '2024-06-01',
  entityTypes: ['business'],
  businessTypes: ['construction', 'real_estate'],
  reportingRequired: true,
  reportingFrequency: 'annual',
  inspectionRequired: true,
  associatedPermits: ['building_permit']
});

// Search regulations
const regulations = await client.regulations.search({
  jurisdiction: 'IL',
  category: 'safety',
  keywords: ['building', 'safety']
});

// Create compliance record
const record = await client.compliance.createRecord({
  entityId: 'business-id',
  entityType: 'business',
  entityName: 'Doe Construction LLC',
  regulationId: 'regulation-id',
  regulationTitle: 'Building Safety Code'
});

// Assess compliance
await client.compliance.assess('record-id', {
  assessedBy: 'inspector-id',
  result: 'compliant',
  findings: [],
  riskLevel: 'low',
  verificationMethod: 'inspection',
  verifiedBy: 'inspector-id'
});

// Get compliance status
const status = await client.compliance.getStatus('business-id', 'business');

// Check overall compliance
const compliance = await client.compliance.checkOverall('business-id', 'business');

// Complete remediation
await client.compliance.completeRemediation('record-id', {
  completedBy: 'business-id',
  notes: 'All violations resolved'
});
```

---

## Agents

### Service Navigator

```typescript
// Initialize navigator
const navigator = client.navigator;

// Discover services
const discovery = await navigator.discover({
  residentId: 'resident-id',
  needs: ['housing', 'healthcare'],
  keywords: ['permit', 'license']
});

// Check eligibility
const eligibility = await navigator.checkEligibility({
  residentId: 'resident-id',
  serviceId: 'service-id'
});

// Get recommendations
const recommendations = await navigator.getRecommendations({
  residentId: 'resident-id',
  context: {
    recentSearches: ['housing'],
    currentServices: []
  }
});

// Get application assistance
const assistance = await navigator.getApplicationAssistance({
  residentId: 'resident-id',
  serviceId: 'service-id',
  step: 0
});

// Handle renewal reminder
const reminder = await navigator.handleRenewalReminder({
  residentId: 'resident-id',
  permitId: 'permit-id'
});
```

### Application Processor

```typescript
// Initialize processor
const processor = client.applications;

// Process submission
const result = await processor.process({
  residentId: 'resident-id',
  permitId: 'permit-id',
  permitType: 'business_license',
  submissionMethod: 'online',
  data: {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com'
  },
  documents: [
    { id: 'doc-1', type: 'registration', name: 'reg.pdf' }
  ]
});

// Validate submission
const validation = await processor.validate({
  residentId: 'resident-id',
  permitId: 'permit-id',
  data: { ... }
});

// Check eligibility
const eligibility = await processor.checkEligibility({
  residentId: 'resident-id',
  permitId: 'permit-id'
});
```

### Compliance Checker

```typescript
// Initialize checker
const checker = client.compliance;

// Perform full check
const check = await checker.check({
  entityId: 'business-id',
  entityType: 'business',
  checkType: 'full'
});

// Check document compliance
const docCheck = await checker.checkDocuments({
  entityId: 'resident-id',
  documents: [
    { id: 'doc-1', type: 'drivers_license', number: 'D1234567' }
  ]
});

// Check business compliance
const businessCheck = await checker.checkBusiness({
  businessId: 'business-id',
  businessType: 'restaurant',
  checks: ['insurance', 'licensing', 'registration']
});

// Check permit prerequisites
const prereqs = await checker.checkPrerequisites({
  residentId: 'resident-id',
  permitId: 'permit-id'
});
```

### Notification Agent

```typescript
// Initialize notifications
const notifications = client.notifications;

// Send notification
const result = await notifications.send({
  residentId: 'resident-id',
  type: 'application_approved',
  data: {
    applicationId: 'app-id',
    applicationType: 'Business License'
  }
});

// Send bulk notifications
const bulk = await notifications.sendBulk([
  { residentId: 'id-1', type: 'permit_expiring', data: { ... } },
  { residentId: 'id-2', type: 'permit_expiring', data: { ... } }
]);

// Schedule notification
const scheduled = await notifications.schedule({
  residentId: 'resident-id',
  type: 'renewal_reminder',
  data: { permitId: 'permit-id' }
}, {
  scheduledFor: '2024-02-01T09:00:00Z',
  recurring: 'yearly'
});

// Cancel scheduled
await notifications.cancelScheduled('schedule-id');

// Get history
const history = await notifications.getHistory('resident-id', {
  limit: 50,
  unreadOnly: false
});

// Mark as read
await notifications.markAsRead('notification-id', 'resident-id');
```

---

## Error Handling

```typescript
import { 
  GovernmentOSError, 
  ValidationError, 
  NotFoundError, 
  RateLimitError 
} from '@government-os/sdk';

try {
  const citizen = await client.citizenTwins.get('non-existent-id');
} catch (error) {
  if (error instanceof NotFoundError) {
    console.log('Citizen not found:', error.message);
  } else if (error instanceof ValidationError) {
    console.log('Validation failed:', error.details);
  } else if (error instanceof RateLimitError) {
    console.log('Rate limited. Retry after:', error.retryAfter);
  } else if (error instanceof GovernmentOSError) {
    console.log('API error:', error.code, error.message);
  }
}
```

### Error Types

```typescript
class GovernmentOSError extends Error {
  code: string;
  statusCode: number;
  requestId: string;
  details?: Record<string, any>;
}

class ValidationError extends GovernmentOSError {
  errors: ValidationErrorDetail[];
}

class NotFoundError extends GovernmentOSError {}

class UnauthorizedError extends GovernmentOSError {}

class ForbiddenError extends GovernmentOSError {}

class RateLimitError extends GovernmentOSError {
  retryAfter: number;
  limit: number;
  remaining: number;
}

class ServiceUnavailableError extends GovernmentOSError {}
```

---

## Pagination

```typescript
// Automatic pagination
const allCitizens = await client.citizenTwins.search({}, {
  autoPaginate: true,
  pageSize: 100
});

// Manual pagination
const page1 = await client.citizenTwins.search({}, { page: 1, pageSize: 20 });
const page2 = await client.citizenTwins.search({}, { page: 2, pageSize: 20 });

// Cursor-based pagination
const cursor = await client.citizenTwins.search({}, { cursor: undefined });
while (cursor.hasMore) {
  const results = cursor.items;
  cursor = await cursor.next();
}
```

---

## Caching

```typescript
const client = new GovernmentOSClient({
  cacheEnabled: true,
  cacheTTL: 300 // 5 minutes
});

// Clear cache
client.clearCache();

// Cache specific operations
const citizen = await client.citizenTwins.get('id', {
  cache: true,
  cacheTTL: 600
});

// Bypass cache
const fresh = await client.citizenTwins.get('id', {
  cache: false
});
```

---

## Logging

```typescript
import { Logger } from '@government-os/sdk';

const logger: Logger = {
  debug: (message, context) => console.debug('[DEBUG]', message, context),
  info: (message, context) => console.info('[INFO]', message, context),
  warn: (message, context) => console.warn('[WARN]', message, context),
  error: (message, context) => console.error('[ERROR]', message, context)
};

const client = new GovernmentOSClient({
  apiKey: 'key',
  baseUrl: 'url',
  logger
});
```

---

## Webhooks

```typescript
// Configure webhook handler
client.webhooks.on('application.approved', async (event) => {
  console.log('Application approved:', event.data.applicationId);
  // Send notification, update systems, etc.
});

client.webhooks.on('permit.issued', async (event) => {
  console.log('Permit issued:', event.data.documentNumber);
});

// Start webhook server
await client.webhooks.start({
  port: 3001,
  path: '/webhooks'
});
```

---

## Batch Operations

```typescript
// Batch create citizens
const citizens = await client.citizenTwins.batchCreate([
  { firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
  { firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com' }
]);

// Batch update applications
const results = await client.applications.batchUpdate([
  { applicationId: 'app-1', status: 'approved' },
  { applicationId: 'app-2', status: 'denied' }
]);
```

---

## Metrics

```typescript
// Get client metrics
const metrics = client.getMetrics();
console.log('Requests:', metrics.totalRequests);
console.log('Errors:', metrics.totalErrors);
console.log('Cache hits:', metrics.cacheHits);
console.log('Average latency:', metrics.averageLatency);

// Reset metrics
client.resetMetrics();
```
