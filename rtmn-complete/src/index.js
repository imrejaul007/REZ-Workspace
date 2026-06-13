/**
 * RTMN Complete - All-in-One Working Platform
 *
 * This single file contains:
 * - API Gateway (routes to all services)
 * - TwinOS Hub (digital twins)
 * - AgentOS Hub (AI agents)
 * - Business Copilot (AI assistant)
 * - BOA Engine (executive intelligence)
 *
 * Run with: node src/index.js
 */

import express from 'express';
import { createServer } from 'http';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';
import Redis from 'ioredis';
import cors from 'cors';
import crypto from 'crypto';
import { initWebSocket, getClientCount } from './websocket.js';

const app = express();
const PORT = process.env.PORT || 3000;
const server = createServer(app);

// Logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()]
});

// Middleware
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  req.requestId = `req_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const start = Date.now();
  res.on('finish', () => {
    logger.info({ method: req.method, path: req.path, duration: Date.now() - start, status: res.statusCode });
  });
  next();
});

// ============================================
// IN-MEMORY DATA STORES
// ============================================

// Sessions store
const sessions = new Map();

// Twin definitions - 24 Industries, 80+ Digital Twins
const twinDefinitions = {
  retail: [
    { id: 'retail-1', industry: 'retail', type: 'customer-twin', name: 'Customer Twin', description: 'Customer profiles, purchase history, loyalty rewards', capabilities: ['profile', 'history', 'loyalty', 'preferences'] },
    { id: 'retail-2', industry: 'retail', type: 'product-twin', name: 'Product Twin', description: 'Product catalog, pricing, variants, suppliers', capabilities: ['catalog', 'pricing', 'variants', 'suppliers'] },
    { id: 'retail-3', industry: 'retail', type: 'inventory-twin', name: 'Inventory Twin', description: 'Stock levels, reorder points, warehouse locations', capabilities: ['stock', 'reorder', 'warehouses', 'transfers'] },
    { id: 'retail-4', industry: 'retail', type: 'order-twin', name: 'Order Twin', description: 'Orders, fulfillment, returns, refunds', capabilities: ['orders', 'fulfillment', 'returns', 'refunds'] },
    { id: 'retail-5', industry: 'retail', type: 'revenue-twin', name: 'Revenue Twin', description: 'Revenue metrics, trends, forecasts', capabilities: ['metrics', 'trends', 'forecasts', 'reports'] },
    { id: 'retail-6', industry: 'retail', type: 'supplier-twin', name: 'Supplier Twin', description: 'Supplier profiles, lead times, performance', capabilities: ['profiles', 'leadtimes', 'performance', 'contracts'] },
    { id: 'retail-7', industry: 'retail', type: 'store-twin', name: 'Store Twin', description: 'Store performance, footfall, staffing', capabilities: ['performance', 'footfall', 'staffing', 'layout'] }
  ],
  restaurant: [
    { id: 'rest-1', industry: 'restaurant', type: 'reservation-twin', name: 'Reservation Twin', description: 'Table reservations, waitlist, seating', capabilities: ['reservations', 'waitlist', 'seating', 'turnover'] },
    { id: 'rest-2', industry: 'restaurant', type: 'menu-twin', name: 'Menu Twin', description: 'Menu items, pricing, allergens, nutrition', capabilities: ['items', 'pricing', 'allergens', 'nutrition'] },
    { id: 'rest-3', industry: 'restaurant', type: 'inventory-twin', name: 'Kitchen Inventory Twin', description: 'Ingredients, suppliers, waste tracking', capabilities: ['ingredients', 'suppliers', 'waste', 'ordering'] },
    { id: 'rest-4', industry: 'restaurant', type: 'staff-twin', name: 'Staff Twin', description: 'Employee scheduling, tips, performance', capabilities: ['schedule', 'tips', 'performance', 'training'] },
    { id: 'rest-5', industry: 'restaurant', type: 'order-twin', name: 'Order Twin', description: 'Order management, kitchen display, delivery', capabilities: ['orders', 'kds', 'delivery', 'tracking'] },
    { id: 'rest-6', industry: 'restaurant', type: 'customer-twin', name: 'Guest Twin', description: 'Guest preferences, dietary, visit history', capabilities: ['preferences', 'dietary', 'visits', 'feedback'] }
  ],
  healthcare: [
    { id: 'health-1', industry: 'healthcare', type: 'patient-twin', name: 'Patient Twin', description: 'Patient profile, history, conditions, preferences', capabilities: ['profile', 'history', 'conditions', 'preferences'] },
    { id: 'health-2', industry: 'healthcare', type: 'appointment-twin', name: 'Appointment Twin', description: 'Appointment scheduling, reminders, telehealth', capabilities: ['scheduling', 'reminders', 'telehealth', 'waiting-list'] },
    { id: 'health-3', industry: 'healthcare', type: 'inventory-twin', name: 'Medical Inventory Twin', description: 'Medical supplies, pharmacy, equipment', capabilities: ['supplies', 'pharmacy', 'equipment', 'ordering'] },
    { id: 'health-4', industry: 'healthcare', type: 'doctor-twin', name: 'Doctor Twin', description: 'Doctor schedules, specializations, availability', capabilities: ['schedule', 'specializations', 'availability', 'ratings'] },
    { id: 'health-5', industry: 'healthcare', type: 'billing-twin', name: 'Billing Twin', description: 'Insurance claims, payments, records', capabilities: ['claims', 'payments', 'records', 'coverage'] }
  ],
  finance: [
    { id: 'fin-1', industry: 'finance', type: 'account-twin', name: 'Account Twin', description: 'Bank accounts, credit cards, investments', capabilities: ['accounts', 'balances', 'transactions', 'budgets'] },
    { id: 'fin-2', industry: 'finance', type: 'invoice-twin', name: 'Invoice Twin', description: 'Invoice generation, tracking, reminders', capabilities: ['generation', 'tracking', 'reminders', 'payment'] },
    { id: 'fin-3', industry: 'finance', type: 'payroll-twin', name: 'Payroll Twin', description: 'Employee payroll, benefits, withholdings', capabilities: ['payroll', 'benefits', 'withholdings', 'reports'] },
    { id: 'fin-4', industry: 'finance', type: 'expense-twin', name: 'Expense Twin', description: 'Expense tracking, categorization, approval', capabilities: ['tracking', 'categorization', 'approval', 'reports'] },
    { id: 'fin-5', industry: 'finance', type: 'tax-twin', name: 'Tax Twin', description: 'Tax calculations, filings, compliance', capabilities: ['calculations', 'filings', 'compliance', 'deductions'] }
  ],
  manufacturing: [
    { id: 'mfg-1', industry: 'manufacturing', type: 'product-twin', name: 'Product Twin', description: 'Product definitions, BOMs, specifications', capabilities: ['definitions', 'boms', 'specs', 'versions'] },
    { id: 'mfg-2', industry: 'manufacturing', type: 'machine-twin', name: 'Machine Twin', description: 'Equipment status, maintenance, IoT sensors', capabilities: ['status', 'maintenance', 'sensors', 'alerts'] },
    { id: 'mfg-3', industry: 'manufacturing', type: 'quality-twin', name: 'Quality Twin', description: 'QC checks, defects, compliance', capabilities: ['qc', 'defects', 'compliance', 'reports'] },
    { id: 'mfg-4', industry: 'manufacturing', type: 'production-twin', name: 'Production Twin', description: 'Production planning, scheduling, output', capabilities: ['planning', 'scheduling', 'output', 'efficiency'] },
    { id: 'mfg-5', industry: 'manufacturing', type: 'supply-twin', name: 'Supply Chain Twin', description: 'Raw materials, suppliers, logistics', capabilities: ['materials', 'suppliers', 'logistics', 'tracking'] }
  ],
  legal: [
    { id: 'legal-1', industry: 'legal', type: 'client-twin', name: 'Legal Client Twin', description: 'Client profile, matters, billing, communications', capabilities: ['profile', 'matters', 'billing', 'documents'] },
    { id: 'legal-2', industry: 'legal', type: 'case-twin', name: 'Case Twin', description: 'Case/matter management, timeline, evidence', capabilities: ['case-management', 'timeline', 'evidence', 'strategy'] },
    { id: 'legal-3', industry: 'legal', type: 'document-twin', name: 'Document Twin', description: 'Legal document repository, templates', capabilities: ['storage', 'versioning', 'templates', 'signing'] },
    { id: 'legal-4', industry: 'legal', type: 'calendar-twin', name: 'Calendar Twin', description: 'Court dates, deadlines, appointments', capabilities: ['court-dates', 'deadlines', 'appointments', 'reminders'] },
    { id: 'legal-5', industry: 'legal', type: 'billing-twin', name: 'Legal Billing Twin', description: 'Time tracking, invoicing, trust accounts', capabilities: ['time-tracking', 'invoicing', 'trust', 'reports'] }
  ],
  hospitality: [
    { id: 'hosp-1', industry: 'hospitality', type: 'guest-twin', name: 'Guest Twin', description: 'Guest profiles, preferences, history', capabilities: ['profile', 'preferences', 'history', 'loyalty'] },
    { id: 'hosp-2', industry: 'hospitality', type: 'booking-twin', name: 'Booking Twin', description: 'Reservations, room assignments, status', capabilities: ['reservations', 'rooms', 'status', 'modifications'] },
    { id: 'hosp-3', industry: 'hospitality', type: 'room-twin', name: 'Room Twin', description: 'Room status, housekeeping, maintenance', capabilities: ['status', 'housekeeping', 'maintenance', 'amenities'] },
    { id: 'hosp-4', industry: 'hospitality', type: 'revenue-twin', name: 'Revenue Twin', description: 'RevPAR, ADR, occupancy metrics', capabilities: ['revpar', 'adr', 'occupancy', 'forecasts'] },
    { id: 'hosp-5', industry: 'hospitality', type: 'staff-twin', name: 'Staff Twin', description: 'Employee scheduling, training, tips', capabilities: ['schedule', 'training', 'tips', 'performance'] }
  ],
  travel: [
    { id: 'travel-1', industry: 'travel', type: 'booking-twin', name: 'Booking Twin', description: 'Flight, hotel, package bookings', capabilities: ['flights', 'hotels', 'packages', 'modifications'] },
    { id: 'travel-2', industry: 'travel', type: 'customer-twin', name: 'Traveler Twin', description: 'Traveler profile, preferences, loyalty', capabilities: ['profile', 'preferences', 'loyalty', 'history'] },
    { id: 'travel-3', industry: 'travel', type: 'itinerary-twin', name: 'Itinerary Twin', description: 'Trip plans, activities, documents', capabilities: ['plans', 'activities', 'documents', 'reminders'] },
    { id: 'travel-4', industry: 'travel', type: 'inventory-twin', name: 'Inventory Twin', description: 'Flights, seats, rooms availability', capabilities: ['availability', 'pricing', 'seats', 'rooms'] }
  ],
  realestate: [
    { id: 're-1', industry: 'realestate', type: 'property-twin', name: 'Property Twin', description: 'Property details, features, valuation', capabilities: ['details', 'features', 'valuation', 'comparables'] },
    { id: 're-2', industry: 'realestate', type: 'lead-twin', name: 'Lead Twin', description: 'Buyer/seller leads, preferences, status', capabilities: ['leads', 'preferences', 'status', 'nurturing'] },
    { id: 're-3', industry: 'realestate', type: 'transaction-twin', name: 'Transaction Twin', description: 'Deals, stages, documents, deadlines', capabilities: ['deals', 'stages', 'documents', 'deadlines'] },
    { id: 're-4', industry: 'realestate', type: 'agent-twin', name: 'Agent Twin', description: 'Agent profiles, performance, territories', capabilities: ['profile', 'performance', 'territories', 'leads'] }
  ],
  education: [
    { id: 'edu-1', industry: 'education', type: 'student-twin', name: 'Student Twin', description: 'Student profile, grades, attendance', capabilities: ['profile', 'grades', 'attendance', 'performance'] },
    { id: 'edu-2', industry: 'education', type: 'course-twin', name: 'Course Twin', description: 'Course catalog, schedules, materials', capabilities: ['catalog', 'schedules', 'materials', 'outcomes'] },
    { id: 'edu-3', industry: 'education', type: 'instructor-twin', name: 'Instructor Twin', description: 'Instructor profiles, schedules, ratings', capabilities: ['profile', 'schedule', 'ratings', 'availability'] },
    { id: 'edu-4', industry: 'education', type: 'enrollment-twin', name: 'Enrollment Twin', description: 'Enrollments, payments, completion', capabilities: ['enrollments', 'payments', 'completion', 'certificates'] }
  ],
  logistics: [
    { id: 'log-1', industry: 'logistics', type: 'shipment-twin', name: 'Shipment Twin', description: 'Shipment tracking, status, ETA', capabilities: ['tracking', 'status', 'eta', 'proof'] },
    { id: 'log-2', industry: 'logistics', type: 'fleet-twin', name: 'Fleet Twin', description: 'Vehicle tracking, maintenance, fuel', capabilities: ['tracking', 'maintenance', 'fuel', 'driver'] },
    { id: 'log-3', industry: 'logistics', type: 'warehouse-twin', name: 'Warehouse Twin', description: 'Warehouse inventory, capacity, operations', capabilities: ['inventory', 'capacity', 'operations', 'automation'] },
    { id: 'log-4', industry: 'logistics', type: 'route-twin', name: 'Route Twin', description: 'Route optimization, delivery windows', capabilities: ['optimization', 'windows', 'traffic', 'efficiency'] }
  ],
  agriculture: [
    { id: 'agri-1', industry: 'agriculture', type: 'field-twin', name: 'Field Twin', description: 'Field data, soil, crop health', capabilities: ['field-data', 'soil', 'crop-health', 'irrigation'] },
    { id: 'agri-2', industry: 'agriculture', type: 'equipment-twin', name: 'Equipment Twin', description: 'Tractors, harvesters, IoT sensors', capabilities: ['tractors', 'harvesters', 'sensors', 'maintenance'] },
    { id: 'agri-3', industry: 'agriculture', type: 'inventory-twin', name: 'Inventory Twin', description: 'Seeds, fertilizers, harvest storage', capabilities: ['seeds', 'fertilizers', 'storage', 'tracking'] },
    { id: 'agri-4', industry: 'agriculture', type: 'weather-twin', name: 'Weather Twin', description: 'Weather data, forecasts, alerts', capabilities: ['weather', 'forecasts', 'alerts', 'planning'] }
  ],
  energy: [
    { id: 'energy-1', industry: 'energy', type: 'grid-twin', name: 'Grid Twin', description: 'Grid status, load, distribution', capabilities: ['status', 'load', 'distribution', 'stability'] },
    { id: 'energy-2', industry: 'energy', type: 'solar-twin', name: 'Solar Twin', description: 'Solar generation, efficiency, panels', capabilities: ['generation', 'efficiency', 'panels', 'performance'] },
    { id: 'energy-3', industry: 'energy', type: 'wind-twin', name: 'Wind Twin', description: 'Wind generation, turbine status', capabilities: ['generation', 'turbines', 'wind-speed', 'performance'] },
    { id: 'energy-4', industry: 'energy', type: 'battery-twin', name: 'Battery Twin', description: 'Battery storage, charge cycles', capabilities: ['storage', 'cycles', 'soh', 'capacity'] },
    { id: 'energy-5', industry: 'energy', type: 'carbon-twin', name: 'Carbon Twin', description: 'Carbon emissions, credits, compliance', capabilities: ['emissions', 'credits', 'compliance', 'reporting'] }
  ],
  automotive: [
    { id: 'auto-1', industry: 'automotive', type: 'vehicle-twin', name: 'Vehicle Twin', description: 'Vehicle specs, service history, warranty', capabilities: ['specs', 'service', 'warranty', 'ownership'] },
    { id: 'auto-2', industry: 'automotive', type: 'customer-twin', name: 'Customer Twin', description: 'Customer profile, preferences, financing', capabilities: ['profile', 'preferences', 'financing', 'loyalty'] },
    { id: 'auto-3', industry: 'automotive', type: 'inventory-twin', name: 'Inventory Twin', description: 'Vehicle inventory, availability, pricing', capabilities: ['inventory', 'availability', 'pricing', 'allocation'] },
    { id: 'auto-4', industry: 'automotive', type: 'service-twin', name: 'Service Twin', description: 'Service appointments, repairs, parts', capabilities: ['appointments', 'repairs', 'parts', 'warranty'] }
  ],
  telecom: [
    { id: 'tel-1', industry: 'telecom', type: 'subscriber-twin', name: 'Subscriber Twin', description: 'Subscriber profile, plan, usage', capabilities: ['profile', 'plan', 'usage', 'billing'] },
    { id: 'tel-2', industry: 'telecom', type: 'network-twin', name: 'Network Twin', description: 'Network status, towers, coverage', capabilities: ['status', 'towers', 'coverage', 'capacity'] },
    { id: 'tel-3', industry: 'telecom', type: 'device-twin', name: 'Device Twin', description: 'Device management, SIM, provisioning', capabilities: ['device', 'sim', 'provisioning', 'compatibility'] },
    { id: 'tel-4', industry: 'telecom', type: 'billing-twin', name: 'Billing Twin', description: 'Billing, payments, recharge', capabilities: ['billing', 'payments', 'recharge', 'plans'] }
  ],
  insurance: [
    { id: 'ins-1', industry: 'insurance', type: 'policy-twin', name: 'Policy Twin', description: 'Policy details, coverage, beneficiaries', capabilities: ['details', 'coverage', 'beneficiaries', 'terms'] },
    { id: 'ins-2', industry: 'insurance', type: 'claim-twin', name: 'Claim Twin', description: 'Claims processing, status, payouts', capabilities: ['processing', 'status', 'payouts', 'documentation'] },
    { id: 'ins-3', industry: 'insurance', type: 'customer-twin', name: 'Customer Twin', description: 'Customer profile, policies, risk', capabilities: ['profile', 'policies', 'risk', 'lifecycle'] },
    { id: 'ins-4', industry: 'insurance', type: 'agent-twin', name: 'Agent Twin', description: 'Agent performance, leads, commissions', capabilities: ['performance', 'leads', 'commissions', 'training'] }
  ],
  construction: [
    { id: 'const-1', industry: 'construction', type: 'project-twin', name: 'Project Twin', description: 'Project timeline, milestones, budget', capabilities: ['timeline', 'milestones', 'budget', 'resources'] },
    { id: 'const-2', industry: 'construction', type: 'worker-twin', name: 'Worker Twin', description: 'Worker profiles, certifications, safety', capabilities: ['profile', 'certifications', 'safety', 'attendance'] },
    { id: 'const-3', industry: 'construction', type: 'equipment-twin', name: 'Equipment Twin', description: 'Equipment tracking, maintenance, rental', capabilities: ['tracking', 'maintenance', 'rental', 'utilization'] },
    { id: 'const-4', industry: 'construction', type: 'material-twin', name: 'Material Twin', description: 'Material inventory, deliveries, costs', capabilities: ['inventory', 'deliveries', 'costs', 'ordering'] }
  ],
  fashion: [
    { id: 'fash-1', industry: 'fashion', type: 'design-twin', name: 'Design Twin', description: 'Design specs, patterns, materials', capabilities: ['specs', 'patterns', 'materials', 'versions'] },
    { id: 'fash-2', industry: 'fashion', type: 'collection-twin', name: 'Collection Twin', description: 'Season collections, lookbooks, trends', capabilities: ['collections', 'lookbooks', 'trends', 'launches'] },
    { id: 'fash-3', industry: 'fashion', type: 'inventory-twin', name: 'Inventory Twin', description: 'Fabric, yarn, finished goods', capabilities: ['fabric', 'yarn', 'finished', 'tracking'] },
    { id: 'fash-4', industry: 'fashion', type: 'supplier-twin', name: 'Supplier Twin', description: 'Supplier quality, lead times, ethics', capabilities: ['quality', 'leadtimes', 'ethics', 'compliance'] }
  ],
  fitness: [
    { id: 'fit-1', industry: 'fitness', type: 'member-twin', name: 'Member Twin', description: 'Member profile, goals, attendance', capabilities: ['profile', 'goals', 'attendance', 'progress'] },
    { id: 'fit-2', industry: 'fitness', type: 'class-twin', name: 'Class Twin', description: 'Class schedules, capacity, instructors', capabilities: ['schedules', 'capacity', 'instructors', 'bookings'] },
    { id: 'fit-3', industry: 'fitness', type: 'equipment-twin', name: 'Equipment Twin', description: 'Gym equipment, maintenance, usage', capabilities: ['equipment', 'maintenance', 'usage', 'replacement'] },
    { id: 'fit-4', industry: 'fitness', type: 'revenue-twin', name: 'Revenue Twin', description: 'Membership revenue, renewals, churn', capabilities: ['revenue', 'renewals', 'churn', 'forecasts'] }
  ],
  events: [
    { id: 'event-1', industry: 'events', type: 'event-twin', name: 'Event Twin', description: 'Event details, schedule, logistics', capabilities: ['details', 'schedule', 'logistics', 'budget'] },
    { id: 'event-2', industry: 'events', type: 'attendee-twin', name: 'Attendee Twin', description: 'Attendee registration, preferences, check-in', capabilities: ['registration', 'preferences', 'checkin', 'feedback'] },
    { id: 'event-3', industry: 'events', type: 'vendor-twin', name: 'Vendor Twin', description: 'Vendor management, contracts, payments', capabilities: ['management', 'contracts', 'payments', 'performance'] },
    { id: 'event-4', industry: 'events', type: 'venue-twin', name: 'Venue Twin', description: 'Venue details, capacity, AV equipment', capabilities: ['details', 'capacity', 'av', 'bookings'] }
  ],
  ecommerce: [
    { id: 'ecom-1', industry: 'ecommerce', type: 'product-twin', name: 'Product Twin', description: 'Product catalog, SEO, images', capabilities: ['catalog', 'seo', 'images', 'variants'] },
    { id: 'ecom-2', industry: 'ecommerce', type: 'order-twin', name: 'Order Twin', description: 'Order processing, fulfillment, returns', capabilities: ['processing', 'fulfillment', 'returns', 'tracking'] },
    { id: 'ecom-3', industry: 'ecommerce', type: 'customer-twin', name: 'Customer Twin', description: 'Customer profile, cart, wishlist', capabilities: ['profile', 'cart', 'wishlist', 'orders'] },
    { id: 'ecom-4', industry: 'ecommerce', type: 'marketing-twin', name: 'Marketing Twin', description: 'Campaigns, conversions, ROI', capabilities: ['campaigns', 'conversions', 'roi', 'attribution'] }
  ],
  media: [
    { id: 'media-1', industry: 'media', type: 'content-twin', name: 'Content Twin', description: 'Content library, metadata, rights', capabilities: ['library', 'metadata', 'rights', 'versions'] },
    { id: 'media-2', industry: 'media', type: 'audience-twin', name: 'Audience Twin', description: 'Audience segments, engagement, demographics', capabilities: ['segments', 'engagement', 'demographics', 'behavior'] },
    { id: 'media-3', industry: 'media', type: 'campaign-twin', name: 'Campaign Twin', description: 'Campaign planning, targeting, performance', capabilities: ['planning', 'targeting', 'performance', 'budget'] },
    { id: 'media-4', industry: 'media', type: 'revenue-twin', name: 'Revenue Twin', description: 'Ad revenue, subscriptions, sponsorships', capabilities: ['ad-revenue', 'subscriptions', 'sponsorships', 'forecasts'] }
  ],
  mining: [
    { id: 'mine-1', industry: 'mining', type: 'site-twin', name: 'Site Twin', description: 'Mining site data, reserves, extraction', capabilities: ['site-data', 'reserves', 'extraction', 'monitoring'] },
    { id: 'mine-2', industry: 'mining', type: 'equipment-twin', name: 'Equipment Twin', description: 'Heavy equipment, maintenance, fuel', capabilities: ['equipment', 'maintenance', 'fuel', 'utilization'] },
    { id: 'mine-3', industry: 'mining', type: 'safety-twin', name: 'Safety Twin', description: 'Safety incidents, training, compliance', capabilities: ['incidents', 'training', 'compliance', 'alerts'] },
    { id: 'mine-4', industry: 'mining', type: 'environmental-twin', name: 'Environmental Twin', description: 'Environmental impact, permits, monitoring', capabilities: ['impact', 'permits', 'monitoring', 'reporting'] }
  ],
  pharmacy: [
    { id: 'pharma-1', industry: 'pharmacy', type: 'drug-twin', name: 'Drug Twin', description: 'Drug database, interactions, dosages', capabilities: ['database', 'interactions', 'dosages', 'formularies'] },
    { id: 'pharma-2', industry: 'pharmacy', type: 'inventory-twin', name: 'Inventory Twin', description: 'Prescription inventory, controlled substances', capabilities: ['inventory', 'controlled', 'expiry', 'ordering'] },
    { id: 'pharma-3', industry: 'pharmacy', type: 'patient-twin', name: 'Patient Twin', description: 'Patient records, prescriptions, allergies', capabilities: ['records', 'prescriptions', 'allergies', 'history'] },
    { id: 'pharma-4', industry: 'pharmacy', type: 'dispensing-twin', name: 'Dispensing Twin', description: 'Dispensing workflow, verification, counseling', capabilities: ['workflow', 'verification', 'counseling', 'compliance'] }
  ]
};

// All twins flat array
const allTwins = Object.values(twinDefinitions).flat();

// Skills definitions
const skillsByIndustry = {
  retail: [
    { id: 'ret-1', name: 'Inventory Management', category: 'inventory', prompts: ['Stock levels', 'Reorder alert'], actions: ['track_stock', 'manage_reorder'] },
    { id: 'ret-2', name: 'POS Operations', category: 'pos', prompts: ['Process return', 'Check transaction'], actions: ['process_transaction', 'handle_payment'] },
    { id: 'ret-3', name: 'Customer Loyalty', category: 'loyalty', prompts: ['Check points', 'Available rewards'], actions: ['manage_rewards', 'track_points'] }
  ],
  restaurant: [
    { id: 'rest-1', name: 'Reservation Management', category: 'reservation', prompts: ['Book table', 'Waitlist'], actions: ['manage_reservation', 'handle_waitlist'] },
    { id: 'rest-2', name: 'Order Processing', category: 'order', prompts: ['Process order', 'Add to order'], actions: ['process_order', 'coordinate_kitchen'] },
    { id: 'rest-3', name: 'Staff Scheduling', category: 'scheduling', prompts: ['Schedule staff', 'Shift coverage'], actions: ['schedule_staff', 'optimize_labor'] }
  ],
  healthcare: [
    { id: 'health-1', name: 'Patient Scheduling', category: 'scheduling', prompts: ['Schedule appointment', 'Find slot'], actions: ['schedule_appointment', 'find_slot'] },
    { id: 'health-2', name: 'Claims Processing', category: 'claims', prompts: ['Check claim', 'Verify insurance'], actions: ['submit_claim', 'verify_eligibility'] }
  ],
  finance: [
    { id: 'fin-1', name: 'Bookkeeping', category: 'bookkeeping', prompts: ['Reconcile accounts', 'Generate report'], actions: ['categorize', 'reconcile'] },
    { id: 'fin-2', name: 'Invoicing', category: 'invoicing', prompts: ['Create invoice', 'Send reminder'], actions: ['create_invoice', 'track_payment'] }
  ]
};

// Demo responses for copilot
const demoResponses = {
  retail: {
    sales: `**Sales Analysis Report**

📊 **Key Metrics:**
- Total sales this week: ₹2,45,000
- Compared to last week: +12% growth
- Top performing category: Electronics (+18%)

🏆 **Top Products:**
1. Smartphone X - 45 units
2. Wireless Earbuds - 78 units
3. Laptop Pro - 23 units

💡 **Recommendations:**
1. Stock up on electronics for festive season
2. Run promotion on underperforming categories
3. Consider extending weekend hours

✅ **Actions:**
- Review inventory for fast-moving items
- Analyze customer feedback
- Plan festive campaign`,
    inventory: `**Inventory Status Report**

⚠️ **Low Stock Alert:**
| Item | Current | Reorder Point |
|------|---------|---------------|
| Product A | 15 units | 50 |
| Product B | 8 units | 30 |
| Product C | 22 units | 100 |

🚨 **Critical (Reorder Now):**
- Product B is critically low

📦 **Actions:**
1. Place emergency order for Product B
2. Generate PO for Products A and C
3. Contact alternate supplier for faster delivery`,
    default: `**Retail Dashboard Overview**

📈 **Today's Performance:**
- Store footfall: 245 customers
- Average transaction: ₹850
- Customer satisfaction: 4.2/5

⏰ **Peak Hours:** 6 PM - 8 PM
📅 **Weekend sales:** 40% higher than weekdays

What specific area would you like to explore?`
  },
  restaurant: {
    orders: `**Today's Order Analysis**

🍽️ **Orders:**
- Total: 127 orders
- Average value: ₹450
- Peak: 12-2 PM, 7-9 PM

🔥 **Popular Items:**
1. Butter Chicken - 45 orders
2. Biryani - 38 orders
3. Naan varieties - 52 orders

⏳ **Kitchen Status:** Busy but manageable

💡 **Recommendations:**
1. Stock up on chicken and rice
2. Consider weekend brunch service
3. Add combo deals for slow periods`,
    inventory: `**Kitchen Inventory Alert**

🚨 **Critical Low:**
| Ingredient | Current | Weekly Need |
|-----------|---------|------------|
| Chicken | 15 kg | 50 kg |
| Basmati Rice | 20 kg | 40 kg |
| Cooking Oil | 5L | 20L |

📞 **Supplier:** Fresh Foods Co.
🚚 **Next Delivery:** Tomorrow 6 AM

⚡ **Action Required:** Place emergency order for chicken immediately!`,
    default: `**Restaurant Dashboard**

📊 **Today:**
- Covers served: 127
- Revenue: ₹57,150
- Table turnover: 2.3x

👨‍🍳 **Kitchen:** Full capacity
🛎️ **Floor:** 4 servers scheduled

What would you like to analyze?`
  },
  healthcare: {
    appointments: `**Appointment Schedule**

📅 **Today:** 24 appointments booked

⏰ **Upcoming:**
- 9:00 AM - Patient Checkup (15 min)
- 9:30 AM - Follow-up Visit (10 min)
- 10:00 AM - New Patient (30 min)

⚠️ **Needs Confirmation:** 2 patients haven't confirmed

📱 **Action:** Send confirmation messages now?`,
    default: `**Healthcare Dashboard**

🏥 **Today:**
- Appointments: 24
- Estimated patients: 28

💊 **Supplies:** All critical items stocked
- Next order: Friday

👨‍⚕️ **Staff:**
- Dr. Sharma: Available
- Nurse Patel: On duty`
  },
  finance: {
    invoices: `**Invoice Status Report**

💰 **Outstanding:**
- Total pending: ₹4,25,000
- Overdue (>30 days): ₹1,20,000
- Average payment time: 25 days

⚠️ **Action Required:**
1. Send reminders for overdue invoices
2. Review payment terms with Client ABC
3. Consider early payment discount

📅 **Collection Forecast:**
- This week: ₹1,80,000 expected
- Next week: ₹1,50,000 expected`,
    default: `**Financial Overview**

💵 **This Month:**
- Revenue: ₹15,80,000
- Expenses: ₹9,20,000
- Net Profit: ₹6,60,000 (42% margin)

💰 **Cash Flow:** Healthy - 2 months runway

💡 **Recommendation:** Consider investing surplus in equipment upgrade.`
  },
  default: {
    general: `**RTMN Business Assistant**

👋 Hello! I'm your RTMN Business Copilot.

I can help you with:
- 📊 **Sales Analytics** - Revenue, trends, forecasts
- 📦 **Inventory Management** - Stock levels, reordering
- 👥 **Customer Insights** - Behavior, preferences
- 💰 **Financial Reports** - Invoices, payments, cash flow

**Supported Industries:**
Retail | Restaurant | Healthcare | Finance | Manufacturing | Legal

What would you like to explore?`
  }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

function searchTwins(query, industry = null) {
  if (!query) return allTwins.slice(0, 10);

  const q = query.toLowerCase();
  const results = allTwins
    .filter(t => !industry || t.industry === industry)
    .map(t => {
      let score = 0;
      if (t.name.toLowerCase().includes(q)) score += 10;
      if (t.type.toLowerCase().includes(q)) score += 5;
      if (t.description.toLowerCase().includes(q)) score += 3;
      if (t.capabilities?.some(c => c.toLowerCase().includes(q))) score += 2;
      return { ...t, score };
    })
    .filter(t => t.score > 0)
    .sort((a, b) => b.score - a.score);

  return results.slice(0, 10);
}

function getSkills(industry) {
  return skillsByIndustry[industry] || skillsByIndustry.retail || [];
}

function generateResponse(message, industry, twins) {
  const m = message.toLowerCase();
  const responses = demoResponses[industry] || demoResponses.default;

  // Determine topic
  if (m.includes('sale') || m.includes('revenue') || m.includes('order')) {
    return responses.sales || responses.default;
  }
  if (m.includes('inventory') || m.includes('stock') || m.includes('product')) {
    return responses.inventory || responses.default;
  }
  if (m.includes('appointment') || m.includes('schedule') || m.includes('patient')) {
    return responses.appointments || responses.default;
  }
  if (m.includes('invoice') || m.includes('payment') || m.includes('billing')) {
    return responses.invoices || responses.default;
  }

  return responses.default || demoResponses.default.general;
}

// ============================================
// HEALTH & METADATA
// ============================================

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'rtmn-complete',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    modules: {
      twinos: { twins: allTwins.length, industries: Object.keys(twinDefinitions).length },
      copilot: { skills: Object.values(skillsByIndustry).flat().length },
      boa: { status: 'active' },
      websocket: { clients: getClientCount(), status: 'active' }
    }
  });
});

app.get('/', (req, res) => {
  res.json({
    name: 'RTMN Complete Platform',
    version: '1.0.0',
    description: 'All-in-one RTMN platform with TwinOS, AgentOS, Business Copilot, and BOA',
    endpoints: {
      health: 'GET /health',
      twins: ['GET /twins', 'GET /twins/:id', 'POST /twins/search'],
      agents: ['GET /agents', 'GET /agents/:id'],
      copilot: ['POST /chat', 'POST /boa/query'],
      skills: ['GET /skills', 'GET /skills/:industry'],
      sessions: ['GET /sessions/:id', 'DELETE /sessions/:id']
    }
  });
});

// ============================================
// TWINOS HUB
// ============================================

// Get all twins or filter by industry
app.get('/twins', (req, res) => {
  const { industry, type } = req.query;
  let twins = allTwins;

  if (industry) twins = twins.filter(t => t.industry === industry);
  if (type) twins = twins.filter(t => t.type === type);

  res.json({
    twins,
    total: twins.length,
    industries: Object.keys(twinDefinitions)
  });
});

// Get single twin
app.get('/twins/:id', (req, res) => {
  const twin = allTwins.find(t => t.id === req.params.id);
  if (!twin) return res.status(404).json({ error: 'Twin not found' });
  res.json(twin);
});

// Search twins (POST - for Business Copilot)
app.post('/twins/search', (req, res) => {
  const { query, industry, limit = 10 } = req.body;
  const twins = searchTwins(query, industry).slice(0, limit);

  res.json({
    twins,
    total: twins.length,
    query,
    industry
  });
});

// Get industries
app.get('/industries', (req, res) => {
  res.json({
    industries: Object.keys(twinDefinitions).map(i => ({
      name: i,
      twinCount: twinDefinitions[i].length
    })),
    totalIndustries: Object.keys(twinDefinitions).length,
    totalTwins: allTwins.length
  });
});

// Twin stats
app.get('/stats', (req, res) => {
  res.json({
    totalTwins: allTwins.length,
    byIndustry: Object.fromEntries(
      Object.entries(twinDefinitions).map(([k, v]) => [k, v.length])
    ),
    totalIndustries: Object.keys(twinDefinitions).length
  });
});

// ============================================
// AGENTOS HUB
// ============================================

const agents = [
  { id: 'agent-1', name: 'Sales Analysis Agent', industry: 'retail', status: 'active', capabilities: ['analyze_sales', 'generate_reports', 'forecast'] },
  { id: 'agent-2', name: 'Inventory Agent', industry: 'retail', status: 'active', capabilities: ['track_stock', 'generate_po', 'monitor_reorder'] },
  { id: 'agent-3', name: 'Customer Agent', industry: 'retail', status: 'active', capabilities: ['profile_analysis', 'loyalty_tracking', 'churn_prediction'] },
  { id: 'agent-4', name: 'Kitchen Agent', industry: 'restaurant', status: 'active', capabilities: ['inventory_tracking', 'order_optimization'] },
  { id: 'agent-5', name: 'Scheduling Agent', industry: 'healthcare', status: 'active', capabilities: ['appointment_scheduling', 'staff_management'] }
];

app.get('/agents', (req, res) => {
  const { industry } = req.query;
  const filtered = industry ? agents.filter(a => a.industry === industry) : agents;
  res.json({ agents: filtered, total: filtered.length });
});

app.get('/agents/:id', (req, res) => {
  const agent = agents.find(a => a.id === req.params.id);
  if (!agent) return res.status(404).json({ error: 'Agent not found' });
  res.json(agent);
});

// ============================================
// BUSINESS COPILOT
// ============================================

// Get skills by industry
app.get('/skills', (req, res) => {
  const { industry } = req.query;
  if (industry) {
    return res.json({ skills: getSkills(industry), industry });
  }
  res.json({
    skills: Object.entries(skillsByIndustry).map(([industry, skills]) => ({ industry, skills })),
    total: Object.values(skillsByIndustry).flat().length
  });
});

app.get('/skills/:industry', (req, res) => {
  const skills = getSkills(req.params.industry);
  res.json({ industry: req.params.industry, skills, total: skills.length });
});

// Main chat endpoint
app.post('/chat', (req, res) => {
  const startTime = Date.now();
  const { message, industry = 'retail', sessionId, context } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message required' });
  }

  // Get or create session
  let session;
  if (sessionId && sessions.has(sessionId)) {
    session = sessions.get(sessionId);
  } else {
    session = {
      id: `sess_${Date.now()}`,
      industry,
      messages: [],
      createdAt: new Date().toISOString()
    };
    sessions.set(session.id, session);
  }

  // Add user message
  session.messages.push({ role: 'user', content: message, timestamp: new Date().toISOString() });

  // Search twins
  const twins = searchTwins(message, industry);

  // Get relevant skills
  const skills = getSkills(industry);

  // Generate response
  const response = generateResponse(message, industry, twins);

  // Add assistant message
  session.messages.push({ role: 'assistant', content: response, timestamp: new Date().toISOString() });

  res.json({
    response,
    sessionId: session.id,
    twins: twins.slice(0, 3),
    skills: skills.slice(0, 3),
    confidence: twins.length > 0 ? 0.85 : 0.6,
    sources: ['twinos-hub', 'copilot-engine'],
    responseTime: Date.now() - startTime
  });
});

// ============================================
// BOA EXECUTIVE INTELLIGENCE
// ============================================

app.post('/boa/query', (req, res) => {
  const startTime = Date.now();
  const { question, industry = 'retail', context } = req.body;

  if (!question) {
    return res.status(400).json({ error: 'Question required' });
  }

  const twins = searchTwins(question, industry);
  const skills = getSkills(industry);
  const response = generateResponse(question, industry, twins);

  // Generate analysis
  const analysis = twins.length > 0
    ? `Found ${twins.length} relevant digital twins. Key entities: ${twins.slice(0, 3).map(t => t.name).join(', ')}`
    : 'Limited data available for this query.';

  // Generate recommendations
  const recommendations = [
    { action: 'Review twin data', priority: twins.length > 0 ? 'medium' : 'low', description: 'Check the connected twins for detailed information' },
    { action: 'Take action', priority: 'high', description: 'Use the suggested skills to take action on insights' }
  ];

  res.json({
    question,
    summary: response.split('\n').slice(0, 5).join('\n'),
    analysis: { content: analysis },
    data: { twinsFound: twins.length },
    recommendations,
    confidence: twins.length > 0 ? 0.85 : 0.5,
    sources: ['twinos-hub', 'nexha-intelligence', 'genie-memory'],
    responseTime: Date.now() - startTime
  });
});

// ============================================
// SESSION MANAGEMENT
// ============================================

app.get('/sessions/:id', (req, res) => {
  const session = sessions.get(req.params.id);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  res.json(session);
});

app.delete('/sessions/:id', (req, res) => {
  if (sessions.has(req.params.id)) {
    sessions.delete(req.params.id);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Session not found' });
  }
});

// ============================================
// START SERVER
// ============================================

// Initialize WebSocket
initWebSocket(server);

server.listen(PORT, () => {
  logger.info(`🚀 RTMN Complete Platform running on port ${PORT}`);
  logger.info(`📊 TwinOS Hub: ${allTwins.length} twins across ${Object.keys(twinDefinitions).length} industries`);
  logger.info(`🤖 AgentOS Hub: ${agents.length} agents`);
  logger.info(`💬 Business Copilot: ${Object.values(skillsByIndustry).flat().length} skills`);
  logger.info(`🧠 BOA Engine: Active`);
  logger.info(`🔌 WebSocket: ws://localhost:${PORT}/ws`);
  logger.info(`\n🌐 Open: http://localhost:${PORT}`);
});

export default app;
