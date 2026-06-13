# Home Services OS SDK

Official SDK libraries for integrating with the Home Services OS platform.

## Available SDKs

| Language | Package | Version |
|----------|---------|---------|
| Node.js | `@homeservices/sdk` | 1.0.0 |
| Python | `homeservices-sdk` | 1.0.0 |
| Go | `github.com/homeservices/sdk-go` | 1.0.0 |

## Node.js SDK

### Installation

```bash
npm install @homeservices/sdk
# or
yarn add @homeservices/sdk
```

### Quick Start

```javascript
const HomeServices = require('@homeservices/sdk');

// Initialize client
const client = new HomeServices({
  apiKey: process.env.HOMESERVICES_API_KEY,
  environment: 'production' // or 'staging'
});

// Use the client
async function main() {
  // Create a customer
  const customer = await client.customers.create({
    firstName: 'John',
    lastName: 'Smith',
    email: 'john@example.com',
    phone: '+1-555-123-4567'
  });

  console.log('Customer created:', customer.id);

  // Create a job
  const job = await client.jobs.create({
    customerId: customer.id,
    propertyId: 'prop_xyz',
    serviceType: 'plumbing',
    description: 'Leaking faucet',
    priority: 'normal'
  });

  // Generate a quote
  const quote = await client.quotes.generate({
    jobId: job.id,
    serviceType: 'plumbing'
  });

  console.log('Quote total:', quote.totalAmount);
}

main().catch(console.error);
```

### Configuration

```javascript
const client = new HomeServices({
  apiKey: 'your-api-key',
  environment: 'production',
  timeout: 30000, // Request timeout in ms
  retries: 3, // Number of retries on failure
  logLevel: 'info' // 'debug', 'info', 'warn', 'error'
});
```

### Customer Service

```javascript
// Create customer
const customer = await client.customers.create({
  firstName: 'John',
  lastName: 'Smith',
  email: 'john@example.com',
  phone: '+1-555-123-4567',
  preferredContactMethod: 'email',
  address: {
    street: '123 Main St',
    city: 'Anytown',
    state: 'CA',
    zip: '90210'
  }
});

// Get customer
const customer = await client.customers.get('cust_abc123');

// Update customer
const updated = await client.customers.update('cust_abc123', {
  phone: '+1-555-999-8888'
});

// Search customers
const results = await client.customers.search({
  query: 'smith',
  status: 'active',
  limit: 20
});

// Add property
const property = await client.customers.addProperty('cust_abc123', {
  name: 'Primary Home',
  type: 'residential',
  address: {
    street: '123 Main St',
    city: 'Anytown',
    state: 'CA',
    zip: '90210'
  },
  bedrooms: 3,
  bathrooms: 2
});

// Get service history
const history = await client.customers.getHistory('cust_abc123', {
  startDate: '2024-01-01',
  endDate: '2024-12-31'
});

// Get analytics
const analytics = await client.customers.getAnalytics('cust_abc123');
```

### Job Service

```javascript
// Create job
const job = await client.jobs.create({
  customerId: 'cust_abc123',
  propertyId: 'prop_xyz',
  serviceType: 'plumbing',
  description: 'Leaking faucet in master bathroom',
  priority: 'high'
});

// Get job
const job = await client.jobs.get('job_abc123');

// Update job
const updated = await client.jobs.update('job_abc123', {
  description: 'Updated description'
});

// Update status
const updated = await client.jobs.updateStatus('job_abc123', {
  status: 'in_progress',
  note: 'Technician on site'
});

// Assign technician
const job = await client.jobs.assign('job_abc123', {
  technicianId: 'tech_xyz789'
});

// Schedule job
const job = await client.jobs.schedule('job_abc123', {
  date: '2024-01-20',
  timeStart: '10:00',
  timeEnd: '12:00'
});

// Search jobs
const jobs = await client.jobs.search({
  status: 'scheduled',
  technicianId: 'tech_xyz',
  dateFrom: '2024-01-01',
  dateTo: '2024-01-31'
});

// Get analytics
const analytics = await client.jobs.getAnalytics({
  start: '2024-01-01',
  end: '2024-01-31'
});
```

### Quote Service

```javascript
// Create quote manually
const quote = await client.quotes.create({
  jobId: 'job_abc123',
  lineItems: [
    { type: 'labor', description: 'Repair work', quantity: 2, unitPrice: 85 },
    { type: 'parts', description: 'Faucet cartridge', quantity: 1, unitPrice: 45 }
  ],
  notes: 'Customer approved'
});

// Generate quote with AI
const quote = await client.quotes.generate({
  jobId: 'job_abc123',
  serviceType: 'plumbing'
});

// Get quote
const quote = await client.quotes.get('qt_abc123');

// Send quote
const sent = await client.quotes.send('qt_abc123', {
  method: 'email',
  email: 'customer@example.com'
});

// Approve quote
const approved = await client.quotes.approve('qt_abc123', {
  approvedBy: 'customer_approval',
  signature: 'data:image/png;base64,...'
});
```

### Technician Service

```javascript
// Create technician
const tech = await client.technicians.create({
  firstName: 'Mike',
  lastName: 'Johnson',
  email: 'mike@company.com',
  phone: '+1-555-987-6543',
  serviceAreas: ['downtown', 'midtown']
});

// Get technician
const tech = await client.technicians.get('tech_abc123');

// Update technician
const updated = await client.technicians.update('tech_abc123', {
  phone: '+1-555-111-2222'
});

// Add skill
const skill = await client.technicians.addSkill('tech_abc123', {
  name: 'Plumbing',
  level: 'advanced',
  certified: true
});

// Add certification
const cert = await client.technicians.addCertification('tech_abc123', {
  name: 'Master Plumber License',
  issuer: 'State Board',
  licenseNumber: 'PLB-123456',
  expiresAt: '2026-12-31'
});

// Update availability
await client.technicians.updateAvailability('tech_abc123', {
  weeklySchedule: {
    1: { available: true, start: '08:00', end: '18:00' },
    2: { available: true, start: '08:00', end: '18:00' },
    // ...
  },
  maxJobsPerDay: 5
});

// Get available slots
const slots = await client.technicians.getSlots('tech_abc123', {
  dateFrom: '2024-01-20',
  dateTo: '2024-01-26',
  duration: 120
});

// Search technicians
const techs = await client.technicians.search({
  skill: 'plumbing',
  serviceArea: 'downtown',
  status: 'active'
});
```

### Inventory Service

```javascript
// Add item
const item = await client.inventory.add({
  name: 'Faucet Cartridge',
  sku: 'FAU-CART-001',
  category: 'parts',
  unitCost: 35,
  unitPrice: 65,
  initialQuantity: 50,
  reorderPoint: 10
});

// Get item
const item = await client.inventory.get('item_abc123');

// Get by SKU
const item = await client.inventory.getBySku('FAU-CART-001');

// Update item
const updated = await client.inventory.update('item_abc123', {
  unitPrice: 70
});

// Adjust quantity
const result = await client.inventory.adjust('item_abc123', {
  adjustment: -2,
  reason: 'Used on job #1234',
  jobId: 'job_xyz'
});

// Reserve items
const item = await client.inventory.reserve('item_abc123', {
  quantity: 5,
  jobId: 'job_xyz'
});

// Consume items
const result = await client.inventory.consume('item_abc123', {
  quantity: 2,
  jobId: 'job_xyz',
  technicianId: 'tech_abc'
});

// Search inventory
const items = await client.inventory.search({
  category: 'parts',
  inStockOnly: true,
  query: 'faucet'
});

// Get low stock items
const lowStock = await client.inventory.getLowStock();

// Get transaction history
const history = await client.inventory.getTransactions('item_abc123', {
  startDate: '2024-01-01'
});
```

### Dispatcher Agent

```javascript
// Dispatch job
const assignment = await client.dispatch.dispatch('job_abc123');

// Dispatch with options
const assignment = await client.dispatch.dispatch('job_abc123', {
  preferTechnicianId: 'tech_xyz',
  autoAssign: true
});

// Reassign job
const result = await client.dispatch.reassign('job_abc123', {
  newTechnicianId: 'tech_new',
  reason: 'Previous tech unavailable'
});

// Get dispatch analytics
const analytics = await client.dispatch.getAnalytics({
  start: '2024-01-01',
  end: '2024-01-31'
});

// Get pending jobs
const pending = await client.dispatch.getPending();
```

### Scheduling Agent

```javascript
// Get available slots
const slots = await client.schedule.getSlots({
  technicianId: 'tech_abc123',
  dateFrom: '2024-01-20',
  dateTo: '2024-01-26',
  duration: 120
});

// Schedule appointment
const appointment = await client.schedule.create({
  jobId: 'job_abc123',
  technicianId: 'tech_abc123',
  date: '2024-01-20',
  timeStart: '10:00',
  timeEnd: '12:00'
});

// Reschedule
const updated = await client.schedule.reschedule('apt_abc123', {
  date: '2024-01-21',
  timeStart: '14:00',
  timeEnd: '16:00',
  reason: 'Customer requested'
});

// Cancel appointment
await client.schedule.cancel('apt_abc123', {
  reason: 'Job cancelled by customer'
});

// Get daily schedule
const schedule = await client.schedule.getDaily('tech_abc123', '2024-01-20');

// Get optimized route
const route = await client.schedule.getRoute('tech_abc123', '2024-01-20');
```

### Customer Retention Agent

```javascript
// Get loyalty status
const status = await client.retention.getLoyaltyStatus('cust_abc123');

// Redeem points
const result = await client.retention.redeem('cust_abc123', {
  points: 250,
  rewardCode: 'CREDIT25'
});

// Record survey response
const survey = await client.retention.recordSurvey('survey_abc123', {
  rating: 5,
  feedback: 'Great service!',
  wouldRecommend: true
});

// Get retention analytics
const analytics = await client.retention.getAnalytics({
  start: '2024-01-01',
  end: '2024-01-31'
});
```

### Event Listeners

```javascript
// Listen for events
client.on('job.created', (event) => {
  console.log('New job created:', event.data);
});

client.on('job.completed', (event) => {
  console.log('Job completed:', event.data);
});

client.on('quote.approved', (event) => {
  console.log('Quote approved:', event.data);
});

client.on('inventory.low_stock', (event) => {
  console.log('Low stock alert:', event.data);
});

// Remove listener
client.off('job.created', handler);

// Once listener
client.once('job.completed', (event) => {
  console.log('First completion:', event.data);
});
```

### Error Handling

```javascript
const { HomeServices, HomeServicesError, ValidationError, NotFoundError } = require('@homeservices/sdk');

try {
  const customer = await client.customers.get('cust_invalid');
} catch (error) {
  if (error instanceof NotFoundError) {
    console.log('Customer not found');
  } else if (error instanceof ValidationError) {
    console.log('Validation failed:', error.details);
  } else if (error instanceof HomeServicesError) {
    console.log('API error:', error.code, error.message);
  } else {
    throw error; // Unknown error
  }
}
```

### TypeScript Support

```typescript
import HomeServices, {
  Customer,
  Job,
  Quote,
  Technician
} from '@homeservices/sdk';

const client = new HomeServices({
  apiKey: process.env.HOMESERVICES_API_KEY
});

// Type-safe responses
const customer: Customer = await client.customers.get('cust_abc123');
const job: Job = await client.jobs.create({
  customerId: customer.id,
  propertyId: 'prop_xyz',
  serviceType: 'plumbing',
  description: 'Leaking faucet',
  priority: 'normal'
});
```

---

## Python SDK

### Installation

```bash
pip install homeservices-sdk
```

### Quick Start

```python
from homeservices import HomeServices

client = HomeServices(
    api_key="your-api-key",
    environment="production"
)

# Create customer
customer = client.customers.create(
    first_name="John",
    last_name="Smith",
    email="john@example.com",
    phone="+1-555-123-4567"
)

# Create job
job = client.jobs.create(
    customer_id=customer.id,
    property_id="prop_xyz",
    service_type="plumbing",
    description="Leaking faucet",
    priority="normal"
)

# Generate quote
quote = client.quotes.generate(
    job_id=job.id,
    service_type="plumbing"
)
```

### API Reference

Python SDK mirrors the Node.js SDK API with Python naming conventions:

- `camelCase` becomes `snake_case`
- Methods use underscores
- Classes use PascalCase

---

## Webhook Integration

### Setting Up Webhooks

```javascript
const client = new HomeServices({
  apiKey: 'your-api-key'
});

// Register webhook
await client.webhooks.register({
  url: 'https://your-server.com/webhooks',
  events: ['job.created', 'job.completed', 'quote.approved'],
  secret: 'your-webhook-secret'
});

// Your webhook handler
app.post('/webhooks', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.headers['x-homeservices-signature'];
  const event = client.webhooks.verify(req.body, signature);

  switch (event.type) {
    case 'job.created':
      handleJobCreated(event.data);
      break;
    case 'job.completed':
      handleJobCompleted(event.data);
      break;
    case 'quote.approved':
      handleQuoteApproved(event.data);
      break;
  }

  res.status(200).send('OK');
});
```

---

## Pagination

```javascript
// Manual pagination
const page1 = await client.customers.search({ limit: 20, offset: 0 });
const page2 = await client.customers.search({ limit: 20, offset: 20 });

// Auto-pagination
for await (const customer of client.customers.searchAll()) {
  console.log(customer.id);
}

// Collect all results
const all = await client.customers.searchAll({ status: 'active' }).toArray();
```

---

## Batch Operations

```javascript
// Create multiple items
const results = await client.jobs.createBatch([
  { customerId: 'cust_1', serviceType: 'plumbing' },
  { customerId: 'cust_2', serviceType: 'electrical' },
  { customerId: 'cust_3', serviceType: 'hvac' }
]);
```

---

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for version history.
