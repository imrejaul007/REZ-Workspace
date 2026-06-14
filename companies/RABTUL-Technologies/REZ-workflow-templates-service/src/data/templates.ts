import { WorkflowTemplate } from '../models/template';

export const templates: WorkflowTemplate[] = [
  // RESTAURANT Templates
  {
    id: 'rest-order-flow',
    name: 'Restaurant Order Flow',
    description: 'Complete order-to-delivery workflow for restaurants',
    category: 'commerce',
    industry: 'restaurant',
    tags: ['orders', 'delivery', 'kitchen', 'pos'],
    estimatedTime: '15 min setup',
    difficulty: 'beginner',
    popularity: 98,
    uses: 15420,
    rating: 4.8,
    prerequisites: ['QR code setup', 'POS integration'],
    integrations: ['REZ QR Cloud', 'POS System', 'Delivery Partner API'],
    nodes: [
      { id: 'n1', type: 'trigger', position: { x: 0, y: 100 }, data: { label: 'New Order', description: 'Triggered on new order' } },
      { id: 'n2', type: 'action', position: { x: 200, y: 100 }, data: { label: 'Send to Kitchen', description: 'Push to kitchen display' } },
      { id: 'n3', type: 'delay', position: { x: 400, y: 100 }, data: { label: 'Wait 15 min', description: 'Average prep time' } },
      { id: 'n4', type: 'condition', position: { x: 600, y: 100 }, data: { label: 'Delivery?', description: 'Check order type' } },
      { id: 'n5', type: 'action', position: { x: 800, y: 50 }, data: { label: 'Assign Driver', description: 'Find available driver' } },
      { id: 'n6', type: 'action', position: { x: 800, y: 150 }, data: { label: 'Notify Pickup', description: 'SMS ready for pickup' } },
      { id: 'n7', type: 'action', position: { x: 1000, y: 100 }, data: { label: 'Collect Payment', description: 'Process payment' } }
    ],
    edges: [
      { id: 'e1', source: 'n1', target: 'n2' },
      { id: 'e2', source: 'n2', target: 'n3' },
      { id: 'e3', source: 'n3', target: 'n4' },
      { id: 'e4', source: 'n4', target: 'n5', label: 'Yes' },
      { id: 'e5', source: 'n4', target: 'n6', label: 'No' },
      { id: 'e6', source: 'n5', target: 'n7' },
      { id: 'e7', source: 'n6', target: 'n7' }
    ],
    trigger: { type: 'event', config: { event: 'order.created' } },
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-06-01T00:00:00Z'
  },
  {
    id: 'rest-reservation',
    name: 'Table Reservation',
    description: 'Automated booking, reminder, and check-in flow',
    category: 'commerce',
    industry: 'restaurant',
    tags: ['reservations', 'reminders', 'waitlist'],
    estimatedTime: '10 min setup',
    difficulty: 'beginner',
    popularity: 85,
    uses: 8930,
    rating: 4.7,
    prerequisites: [],
    integrations: ['WhatsApp', 'SMS Gateway'],
    nodes: [
      { id: 'n1', type: 'trigger', position: { x: 0, y: 100 }, data: { label: 'Booking Created', description: 'New reservation' } },
      { id: 'n2', type: 'action', position: { x: 200, y: 100 }, data: { label: 'Send Confirmation', description: 'WhatsApp + Email' } },
      { id: 'n3', type: 'delay', position: { x: 400, y: 100 }, data: { label: 'Wait 24h', description: 'Day before reminder' } },
      { id: 'n4', type: 'action', position: { x: 600, y: 100 }, data: { label: 'Send Reminder', description: '24h reminder' } },
      { id: 'n5', type: 'action', position: { x: 800, y: 100 }, data: { label: 'Check-in', description: 'Mark arrival' } }
    ],
    edges: [
      { id: 'e1', source: 'n1', target: 'n2' },
      { id: 'e2', source: 'n2', target: 'n3' },
      { id: 'e3', source: 'n3', target: 'n4' },
      { id: 'e4', source: 'n4', target: 'n5' }
    ],
    trigger: { type: 'form', config: { formId: 'reservation' } },
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-06-01T00:00:00Z'
  },
  // HEALTHCARE Templates
  {
    id: 'health-appointment',
    name: 'Healthcare Appointment',
    description: 'Book → Reminder → Check-in → Treatment flow',
    category: 'operations',
    industry: 'healthcare',
    tags: ['appointments', 'reminders', 'patient'],
    estimatedTime: '20 min setup',
    difficulty: 'intermediate',
    popularity: 92,
    uses: 12450,
    rating: 4.9,
    prerequisites: ['Patient management system'],
    integrations: ['Calendar', 'SMS', 'Email'],
    nodes: [
      { id: 'n1', type: 'trigger', position: { x: 0, y: 100 }, data: { label: 'Appointment Booked', description: 'New booking' } },
      { id: 'n2', type: 'action', position: { x: 200, y: 100 }, data: { label: 'Send Confirmation', description: 'SMS + Email' } },
      { id: 'n3', type: 'delay', position: { x: 400, y: 100 }, data: { label: 'Wait 1 day', description: 'Pre-appointment reminder' } },
      { id: 'n4', type: 'action', position: { x: 600, y: 100 }, data: { label: 'Send Reminder', description: 'Day before reminder' } },
      { id: 'n5', type: 'condition', position: { x: 800, y: 100 }, data: { label: 'Patient Arrived?', description: 'Check-in status' } },
      { id: 'n6', type: 'action', position: { x: 1000, y: 50 }, data: { label: 'Start Treatment', description: 'Begin consultation' } },
      { id: 'n7', type: 'action', position: { x: 1000, y: 150 }, data: { label: 'Reschedule', description: 'Offer new time' } },
      { id: 'n8', type: 'delay', position: { x: 1200, y: 100 }, data: { label: 'Wait 7 days', description: 'Follow-up period' } },
      { id: 'n9', type: 'action', position: { x: 1400, y: 100 }, data: { label: 'Send Feedback', description: 'Request review' } }
    ],
    edges: [
      { id: 'e1', source: 'n1', target: 'n2' },
      { id: 'e2', source: 'n2', target: 'n3' },
      { id: 'e3', source: 'n3', target: 'n4' },
      { id: 'e4', source: 'n4', target: 'n5' },
      { id: 'e5', source: 'n5', target: 'n6', label: 'Yes' },
      { id: 'e6', source: 'n5', target: 'n7', label: 'No' },
      { id: 'e7', source: 'n6', target: 'n8' },
      { id: 'e8', source: 'n8', target: 'n9' }
    ],
    trigger: { type: 'form', config: { formId: 'appointment_booking' } },
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-06-01T00:00:00Z'
  },
  // FINANCE Templates
  {
    id: 'fin-loan-application',
    name: 'Loan Application',
    description: 'Apply → Verify → Underwrite → Approve → Disburse',
    category: 'finance',
    industry: 'finance',
    tags: ['loan', 'kyc', 'credit', 'underwriting'],
    estimatedTime: '30 min setup',
    difficulty: 'advanced',
    popularity: 95,
    uses: 23400,
    rating: 4.9,
    prerequisites: ['Credit bureau API', 'KYC service'],
    integrations: ['CIBIL API', 'Aadhaar API', 'Bank Statement Parser'],
    nodes: [
      { id: 'n1', type: 'trigger', position: { x: 0, y: 100 }, data: { label: 'Application Received', description: 'New loan application' } },
      { id: 'n2', type: 'action', position: { x: 200, y: 100 }, data: { label: 'Collect Docs', description: 'KYC + Income proof' } },
      { id: 'n3', type: 'action', position: { x: 400, y: 100 }, data: { label: 'Verify KYC', description: 'Document verification' } },
      { id: 'n4', type: 'action', position: { x: 600, y: 100 }, data: { label: 'Credit Check', description: 'CIBIL score fetch' } },
      { id: 'n5', type: 'condition', position: { x: 800, y: 100 }, data: { label: 'Score >= 700?', description: 'Credit threshold' } },
      { id: 'n6', type: 'action', position: { x: 1000, y: 50 }, data: { label: 'Underwrite', description: 'Risk assessment' } },
      { id: 'n7', type: 'action', position: { x: 1000, y: 150 }, data: { label: 'Reject', description: 'Send rejection' } },
      { id: 'n8', type: 'action', position: { x: 1200, y: 100 }, data: { label: 'Disburse', description: 'Transfer funds' } }
    ],
    edges: [
      { id: 'e1', source: 'n1', target: 'n2' },
      { id: 'e2', source: 'n2', target: 'n3' },
      { id: 'e3', source: 'n3', target: 'n4' },
      { id: 'e4', source: 'n4', target: 'n5' },
      { id: 'e5', source: 'n5', target: 'n6', label: 'Yes' },
      { id: 'e6', source: 'n5', target: 'n7', label: 'No' },
      { id: 'e7', source: 'n6', target: 'n8' },
      { id: 'e8', source: 'n7', target: 'n8' }
    ],
    trigger: { type: 'api', config: { endpoint: '/api/loans/apply' } },
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-06-01T00:00:00Z'
  },
  // RETAIL Templates
  {
    id: 'retail-order-fulfillment',
    name: 'Retail Order Fulfillment',
    description: 'Order → Pick → Pack → Ship → Deliver',
    category: 'commerce',
    industry: 'retail',
    tags: ['orders', 'fulfillment', 'shipping'],
    estimatedTime: '20 min setup',
    difficulty: 'intermediate',
    popularity: 94,
    uses: 19800,
    rating: 4.8,
    prerequisites: ['Inventory system', 'Shipping API'],
    integrations: ['Inventory', 'Delhivery', 'Shiprocket'],
    nodes: [
      { id: 'n1', type: 'trigger', position: { x: 0, y: 100 }, data: { label: 'Order Placed', description: 'New order' } },
      { id: 'n2', type: 'action', position: { x: 200, y: 100 }, data: { label: 'Check Inventory', description: 'Verify stock' } },
      { id: 'n3', type: 'condition', position: { x: 400, y: 100 }, data: { label: 'In Stock?', description: '' } },
      { id: 'n4', type: 'action', position: { x: 600, y: 50 }, data: { label: 'Pick & Pack', description: 'Warehouse ops' } },
      { id: 'n5', type: 'action', position: { x: 600, y: 150 }, data: { label: 'Notify Backorder', description: 'Tell customer' } },
      { id: 'n6', type: 'action', position: { x: 800, y: 50 }, data: { label: 'Generate Label', description: 'Shipping label' } },
      { id: 'n7', type: 'action', position: { x: 1000, y: 50 }, data: { label: 'Ship Order', description: 'Hand to courier' } },
      { id: 'n8', type: 'action', position: { x: 1200, y: 50 }, data: { label: 'Confirm Delivery', description: 'Notify customer' } }
    ],
    edges: [
      { id: 'e1', source: 'n1', target: 'n2' },
      { id: 'e2', source: 'n2', target: 'n3' },
      { id: 'e3', source: 'n3', target: 'n4', label: 'Yes' },
      { id: 'e4', source: 'n3', target: 'n5', label: 'No' },
      { id: 'e5', source: 'n4', target: 'n6' },
      { id: 'e6', source: 'n6', target: 'n7' },
      { id: 'e7', source: 'n7', target: 'n8' }
    ],
    trigger: { type: 'event', config: { event: 'order.created' } },
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-06-01T00:00:00Z'
  },
  {
    id: 'retail-abandoned-cart',
    name: 'Abandoned Cart Recovery',
    description: 'Recover abandoned carts with smart reminders',
    category: 'marketing',
    industry: 'retail',
    tags: ['cart', 'recovery', 'marketing'],
    estimatedTime: '10 min setup',
    difficulty: 'beginner',
    popularity: 90,
    uses: 21300,
    rating: 4.6,
    prerequisites: [],
    integrations: ['Email', 'WhatsApp', 'SMS'],
    nodes: [
      { id: 'n1', type: 'trigger', position: { x: 0, y: 100 }, data: { label: 'Cart Abandoned', description: 'Checkout started but not completed' } },
      { id: 'n2', type: 'delay', position: { x: 200, y: 100 }, data: { label: 'Wait 1 hour', description: '' } },
      { id: 'n3', type: 'action', position: { x: 400, y: 100 }, data: { label: 'Send Reminder', description: 'First reminder' } },
      { id: 'n4', type: 'delay', position: { x: 600, y: 100 }, data: { label: 'Wait 24 hours', description: '' } },
      { id: 'n5', type: 'condition', position: { x: 800, y: 100 }, data: { label: 'Recovered?', description: 'Check if cart was converted' } },
      { id: 'n6', type: 'action', position: { x: 1000, y: 50 }, data: { label: 'Send 2nd Reminder', description: 'With 5% discount' } },
      { id: 'n7', type: 'action', position: { x: 1000, y: 150 }, data: { label: 'Celebrate!', description: 'Cart recovered!' } }
    ],
    edges: [
      { id: 'e1', source: 'n1', target: 'n2' },
      { id: 'e2', source: 'n2', target: 'n3' },
      { id: 'e3', source: 'n3', target: 'n4' },
      { id: 'e4', source: 'n4', target: 'n5' },
      { id: 'e5', source: 'n5', target: 'n6', label: 'No' },
      { id: 'e6', source: 'n5', target: 'n7', label: 'Yes' }
    ],
    trigger: { type: 'event', config: { event: 'cart.abandoned' } },
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-06-01T00:00:00Z'
  },
  // HR Templates
  {
    id: 'hr-onboarding',
    name: 'Employee Onboarding',
    description: 'Hire → Docs → Setup → Train → Live',
    category: 'hr',
    industry: 'general',
    tags: ['onboarding', 'hr', 'documents'],
    estimatedTime: '25 min setup',
    difficulty: 'intermediate',
    popularity: 93,
    uses: 8900,
    rating: 4.8,
    prerequisites: ['HRIS integration'],
    integrations: ['HRIS', 'Slack', 'Google Workspace'],
    nodes: [
      { id: 'n1', type: 'trigger', position: { x: 0, y: 100 }, data: { label: 'Offer Accepted', description: 'New hire' } },
      { id: 'n2', type: 'action', position: { x: 200, y: 100 }, data: { label: 'Send Welcome', description: 'Welcome email' } },
      { id: 'n3', type: 'action', position: { x: 400, y: 100 }, data: { label: 'Collect Docs', description: 'KYC & certificates' } },
      { id: 'n4', type: 'action', position: { x: 600, y: 100 }, data: { label: 'Create Accounts', description: 'Email, Slack, tools' } },
      { id: 'n5', type: 'action', position: { x: 800, y: 100 }, data: { label: 'Schedule Training', description: 'Day 1 orientation' } },
      { id: 'n6', type: 'delay', position: { x: 1000, y: 100 }, data: { label: 'Wait 7 days', description: 'First week' } },
      { id: 'n7', type: 'action', position: { x: 1200, y: 100 }, data: { label: 'Check-in', description: 'Week 1 feedback' } }
    ],
    edges: [
      { id: 'e1', source: 'n1', target: 'n2' },
      { id: 'e2', source: 'n2', target: 'n3' },
      { id: 'e3', source: 'n3', target: 'n4' },
      { id: 'e4', source: 'n4', target: 'n5' },
      { id: 'e5', source: 'n5', target: 'n6' },
      { id: 'e6', source: 'n6', target: 'n7' }
    ],
    trigger: { type: 'api', config: { endpoint: '/api/hr/onboarding/start' } },
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-06-01T00:00:00Z'
  }
];

// Add isFeatured dynamically
templates.forEach(t => {
  (t as any).isFeatured = (t.popularity || 0) >= 90;
});

export const getTemplatesByCategory = (category: string): WorkflowTemplate[] => {
  return templates.filter(t => t.category === category);
};

export const getTemplateById = (id: string): WorkflowTemplate | undefined => {
  return templates.find(t => t.id === id);
};

export const searchTemplates = (
  query: string,
  filters?: { category?: string; industry?: string; complexity?: string }
): WorkflowTemplate[] => {
  const q = query.toLowerCase();
  return templates.filter(t => {
    const matchesQuery =
      t.name.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.tags.some(tag => tag.toLowerCase().includes(q));
    const matchesCategory = !filters?.category || t.category === filters.category;
    const matchesIndustry = !filters?.industry || t.industry === filters.industry;
    const matchesComplexity = !filters?.complexity || t.difficulty === filters.complexity;
    return matchesQuery && matchesCategory && matchesIndustry && matchesComplexity;
  });
};

export default templates;
