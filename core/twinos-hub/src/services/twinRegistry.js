/**
 * TwinRegistry - Manages all digital twins across 24 industries
 * Contains 113 twins total
 * NOW CONNECTED TO CorpID for universal identity
 */
import { v4 as uuidv4 } from 'uuid';

// CorpID service URL
const CORPID_URL = process.env.CORPID_URL || 'http://localhost:4702';

/**
 * Twin Registry with all industry twins
 * Twins are now linked to CorpID entities
 */
export class TwinRegistry {
  constructor(config = {}) {
    this.redis = config.redis;
    this.logger = config.logger;
    this.twins = new Map();
    this.industryTwins = new Map();
    this.corpIdLinks = new Map(); // twinId -> corpId

    // Twin definitions for all 24 industries
    this.twinDefinitions = this._getTwinDefinitions();
  }

  /**
   * Initialize registry with twin definitions
   */
  async initialize() {
    for (const [industry, twins] of Object.entries(this.twinDefinitions)) {
      this.industryTwins.set(industry, []);

      for (const twin of twins) {
        const twinEntry = {
          id: uuidv4(),
          industry,
          type: twin.type,
          name: twin.name,
          description: twin.description,
          capabilities: twin.capabilities || [],
          schema: twin.schema || {},
          status: 'registered',
          corpId: null, // Will be linked via registerWithCorpId
          createdAt: new Date().toISOString()
        };

        this.twins.set(twinEntry.id, twinEntry);
        this.industryTwins.get(industry).push(twinEntry);
      }
    }

    this.logger?.info(`Registered ${this.twins.size} twins across ${this.industryTwins.size} industries`);
  }

  /**
   * Link twin to CorpID entity
   * This connects the twin to the universal identity system
   */
  async linkToCorpId(twinId, corpId) {
    const twin = this.twins.get(twinId);
    if (!twin) {
      throw new Error('Twin not found');
    }

    // Update twin with CorpID
    twin.corpId = corpId;
    twin.linkedAt = new Date().toISOString();
    this.twins.set(twinId, twin);
    this.corpIdLinks.set(twinId, corpId);

    // Also update in Redis if available
    if (this.redis) {
      await this.redis.set(`twin:corpId:${twinId}`, corpId);
      await this.redis.sadd(`corpId:twins:${corpId}`, twinId);
    }

    // Notify CorpID service of the link
    try {
      await fetch(`${CORPID_URL}/api/relationships`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromCorpId: corpId,
          toCorpId: twinId,
          relationshipType: 'owns_twin',
          properties: { twinType: twin.type, industry: twin.industry }
        })
      });
    } catch (e) {
      this.logger?.warn('Could not notify CorpID of twin link:', e.message);
    }

    this.logger?.info(`Twin ${twinId} linked to CorpID ${corpId}`);
    return twin;
  }

  /**
   * Get twin by CorpID
   */
  getByCorpId(corpId) {
    const results = [];
    for (const [twinId, linkedCorpId] of this.corpIdLinks) {
      if (linkedCorpId === corpId) {
        const twin = this.twins.get(twinId);
        if (twin) results.push(twin);
      }
    }
    return results;
  }

  /**
   * Get CorpID for a twin
   */
  getCorpId(twinId) {
    return this.corpIdLinks.get(twinId) || null;
  }

  /**
   * Register a new entity-specific twin (not a template)
   * This creates a twin and immediately links it to a CorpID
   */
  async registerEntityTwin({ corpId, industry, type, name, data = {} }) {
    const twinId = uuidv4();
    const now = new Date().toISOString();

    const twin = {
      id: twinId,
      industry,
      type,
      name,
      description: `Personal twin for ${name}`,
      capabilities: [],
      schema: data,
      status: 'active',
      corpId,
      ownerCorpId: corpId,
      data,
      createdAt: now,
      updatedAt: now
    };

    this.twins.set(twinId, twin);

    // Add to industry index
    if (!this.industryTwins.has(industry)) {
      this.industryTwins.set(industry, []);
    }
    this.industryTwins.get(industry).push(twin);

    // Link to CorpID
    await this.linkToCorpId(twinId, corpId);

    return twin;
  }

  /**
   * Search twins by query
   */
  search(query, limit = 10) {
    if (!query) {
      return Array.from(this.twins.values()).slice(0, limit);
    }

    const q = query.toLowerCase();
    const results = [];

    for (const twin of this.twins.values()) {
      let score = 0;

      if (twin.name.toLowerCase().includes(q)) score += 10;
      if (twin.type.toLowerCase().includes(q)) score += 5;
      if (twin.description.toLowerCase().includes(q)) score += 3;
      if (twin.capabilities?.some(c => c.toLowerCase().includes(q))) score += 2;
      if (twin.industry.toLowerCase().includes(q)) score += 1;

      if (score > 0) {
        results.push({ ...twin, score });
      }
    }

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Get all twin definitions
   */
  _getTwinDefinitions() {
    return {
      legal: [
        { type: 'client-twin', name: 'Legal Client Twin', description: 'Complete client profile with matters, billing, communications', capabilities: ['profile', 'matters', 'billing', 'documents'] },
        { type: 'case-twin', name: 'Case Twin', description: 'Case/matter management with timeline, evidence, strategy', capabilities: ['case-management', 'timeline', 'evidence', 'strategy'] },
        { type: 'document-twin', name: 'Document Twin', description: 'Legal document repository with versioning, templates, e-signature', capabilities: ['storage', 'versioning', 'templates', 'signing'] },
        { type: 'calendar-twin', name: 'Calendar Twin', description: 'Court dates, deadlines, appointments, reminders', capabilities: ['scheduling', 'deadlines', 'reminders', 'court-dates'] },
        { type: 'billing-twin', name: 'Billing Twin', description: 'Time tracking, invoicing, trust accounts, reporting', capabilities: ['time-tracking', 'invoicing', 'trust-accounts', 'reporting'] }
      ],
      healthcare: [
        { type: 'patient-twin', name: 'Patient Twin', description: 'Comprehensive patient profile with history, conditions, preferences', capabilities: ['profile', 'history', 'conditions', 'preferences'] },
        { type: 'provider-twin', name: 'Provider Twin', description: 'Healthcare provider credentials, schedules, specializations', capabilities: ['profile', 'credentials', 'schedule', 'specializations'] },
        { type: 'appointment-twin', name: 'Appointment Twin', description: 'Appointment scheduling, reminders, telehealth integration', capabilities: ['scheduling', 'reminders', 'telehealth', 'waiting-list'] },
        { type: 'medical-record-twin', name: 'Medical Record Twin', description: 'EHR integration, lab results, imaging, prescriptions', capabilities: ['ehr', 'labs', 'imaging', 'prescriptions'] },
        { type: 'insurance-twin', name: 'Insurance Twin', description: 'Insurance verification, claims, authorizations', capabilities: ['verification', 'claims', 'authorizations', 'eligibility'] }
      ],
      finance: [
        { type: 'account-twin', name: 'Account Twin', description: 'Bank accounts, credit cards, investment accounts', capabilities: ['accounts', 'balances', 'transactions', 'budgets'] },
        { type: 'transaction-twin', name: 'Transaction Twin', description: 'Income, expenses, transfers with categorization', capabilities: ['recording', 'categorization', 'reconciliation', 'splits'] },
        { type: 'invoice-twin', name: 'Invoice Twin', description: 'Invoice generation, tracking, payment reminders', capabilities: ['generation', 'tracking', 'reminders', 'payment'] },
        { type: 'tax-twin', name: 'Tax Twin', description: 'Tax preparation, deductions, compliance tracking', capabilities: ['preparation', 'deductions', 'compliance', 'filings'] },
        { type: 'payroll-twin', name: 'Payroll Twin', description: 'Employee payroll, benefits, tax withholdings', capabilities: ['payroll', 'benefits', 'withholdings', 'reports'] }
      ],
      retail: [
        { type: 'customer-twin', name: 'Customer Twin', description: 'Customer profiles, purchase history, loyalty rewards', capabilities: ['profile', 'history', 'loyalty', 'preferences'] },
        { type: 'product-twin', name: 'Product Twin', description: 'Product catalog, pricing, variants, suppliers', capabilities: ['catalog', 'pricing', 'variants', 'suppliers'] },
        { type: 'inventory-twin', name: 'Inventory Twin', description: 'Stock levels, reorder points, warehouse locations', capabilities: ['stock', 'reorder', 'warehouses', 'transfers'] },
        { type: 'order-twin', name: 'Order Twin', description: 'Orders, fulfillment, returns, refunds', capabilities: ['orders', 'fulfillment', 'returns', 'refunds'] },
        { type: 'pos-twin', name: 'POS Twin', description: 'Point of sale transactions, payments, receipts', capabilities: ['transactions', 'payments', 'receipts', 'shifts'] }
      ],
      education: [
        { type: 'student-twin', name: 'Student Twin', description: 'Student profile, enrollment, progress tracking', capabilities: ['profile', 'enrollment', 'progress', 'grades'] },
        { type: 'course-twin', name: 'Course Twin', description: 'Course materials, assignments, schedules', capabilities: ['materials', 'assignments', 'schedules', 'resources'] },
        { type: 'instructor-twin', name: 'Instructor Twin', description: 'Instructor profile, credentials, schedules', capabilities: ['profile', 'credentials', 'schedule', 'ratings'] },
        { type: 'grade-twin', name: 'Grade Twin', description: 'Grades, transcripts, academic standing', capabilities: ['grades', 'transcripts', 'gpa', 'standing'] },
        { type: 'attendance-twin', name: 'Attendance Twin', description: 'Attendance tracking, participation, engagement', capabilities: ['tracking', 'participation', 'engagement', 'reports'] }
      ],
      manufacturing: [
        { type: 'product-twin', name: 'Product Twin', description: 'Product definitions, BOMs, specifications', capabilities: ['definitions', 'boms', 'specs', 'versions'] },
        { type: 'machine-twin', name: 'Machine Twin', description: 'Equipment status, maintenance, IoT sensors', capabilities: ['status', 'maintenance', 'sensors', 'alerts'] },
        { type: 'workorder-twin', name: 'Work Order Twin', description: 'Production orders, scheduling, tracking', capabilities: ['orders', 'scheduling', 'tracking', 'quality'] },
        { type: 'quality-twin', name: 'Quality Twin', description: 'QC checks, defects, compliance', capabilities: ['qc', 'defects', 'compliance', 'reports'] },
        { type: 'supplychain-twin', name: 'Supply Chain Twin', description: 'Suppliers, inventory, logistics', capabilities: ['suppliers', 'inventory', 'logistics', 'tracking'] }
      ],
      realestate: [
        { type: 'property-twin', name: 'Property Twin', description: 'Property details, features, media', capabilities: ['details', 'features', 'media', 'documents'] },
        { type: 'listing-twin', name: 'Listing Twin', description: 'MLS integration, pricing, status', capabilities: ['mls', 'pricing', 'status', 'showing'] },
        { type: 'lead-twin', name: 'Lead Twin', description: 'Buyer/seller leads, preferences, history', capabilities: ['profile', 'preferences', 'history', 'nurturing'] },
        { type: 'transaction-twin', name: 'Transaction Twin', description: 'Deal tracking, documents, deadlines', capabilities: ['deals', 'documents', 'deadlines', 'commissions'] },
        { type: 'tenant-twin', name: 'Tenant Twin', description: 'Tenant profiles, leases, communications', capabilities: ['profile', 'leases', 'payments', 'maintenance'] }
      ],
      travel: [
        { type: 'booking-twin', name: 'Booking Twin', description: 'Flights, hotels, cars with confirmations', capabilities: ['flights', 'hotels', 'cars', 'confirmations'] },
        { type: 'itinerary-twin', name: 'Itinerary Twin', description: 'Complete trip planning, timeline, notes', capabilities: ['planning', 'timeline', 'notes', 'sharing'] },
        { type: 'loyalty-twin', name: 'Loyalty Twin', description: 'Rewards programs, points, tiers', capabilities: ['rewards', 'points', 'tiers', 'redemptions'] },
        { type: 'expense-twin', name: 'Expense Twin', description: 'Trip expenses, receipts, reports', capabilities: ['expenses', 'receipts', 'reports', 'categories'] },
        { type: 'preference-twin', name: 'Preference Twin', description: 'Travel preferences, seat, meal, hotel', capabilities: ['seats', 'meals', 'hotels', 'airlines'] }
      ],
      restaurant: [
        { type: 'reservation-twin', name: 'Reservation Twin', description: 'Table reservations, waitlist, seating', capabilities: ['reservations', 'waitlist', 'seating', 'turnover'] },
        { type: 'menu-twin', name: 'Menu Twin', description: 'Menu items, pricing, allergens, nutrition', capabilities: ['items', 'pricing', 'allergens', 'nutrition'] },
        { type: 'order-twin', name: 'Order Twin', description: 'Orders, modifications, kitchen display', capabilities: ['orders', 'mods', 'kds', 'timing'] },
        { type: 'inventory-twin', name: 'Inventory Twin', description: 'Ingredients, suppliers, waste tracking', capabilities: ['ingredients', 'suppliers', 'waste', 'ordering'] },
        { type: 'staff-twin', name: 'Staff Twin', description: 'Employee scheduling, tips, performance', capabilities: ['schedule', 'tips', 'performance', 'training'] }
      ],
      fitness: [
        { type: 'member-twin', name: 'Member Twin', description: 'Member profile, goals, health data', capabilities: ['profile', 'goals', 'health', 'preferences'] },
        { type: 'workout-twin', name: 'Workout Twin', description: 'Workout plans, exercises, tracking', capabilities: ['plans', 'exercises', 'tracking', 'progression'] },
        { type: 'class-twin', name: 'Class Twin', description: 'Class schedules, bookings, instructors', capabilities: ['schedule', 'bookings', 'instructors', 'capacity'] },
        { type: 'progress-twin', name: 'Progress Twin', description: 'Weight, measurements, achievements', capabilities: ['weight', 'measurements', 'achievements', 'milestones'] },
        { type: 'billing-twin', name: 'Billing Twin', description: 'Membership billing, packages, renewals', capabilities: ['membership', 'packages', 'renewals', 'pauses'] }
      ],
      automotive: [
        { type: 'vehicle-twin', name: 'Vehicle Twin', description: 'Vehicle details, VIN, specifications', capabilities: ['details', 'vin', 'specs', 'history'] },
        { type: 'service-twin', name: 'Service Twin', description: 'Service records, maintenance, repairs', capabilities: ['records', 'maintenance', 'repairs', 'recalls'] },
        { type: 'owner-twin', name: 'Owner Twin', description: 'Owner info, preferences, communication', capabilities: ['info', 'preferences', 'communication', 'loyalty'] },
        { type: 'warranty-twin', name: 'Warranty Twin', description: 'Warranty coverage, claims, expiration', capabilities: ['coverage', 'claims', 'expiration', 'transfers'] },
        { type: 'dealership-twin', name: 'Dealership Twin', description: 'Inventory, sales, F&I products', capabilities: ['inventory', 'sales', 'f_i', 'leads'] }
      ],
      entertainment: [
        { type: 'event-twin', name: 'Event Twin', description: 'Event details, scheduling, venues', capabilities: ['details', 'schedule', 'venues', 'ticketing'] },
        { type: 'ticket-twin', name: 'Ticket Twin', description: 'Tickets, seat assignments, transfers', capabilities: ['tickets', 'seats', 'transfers', 'resales'] },
        { type: 'artist-twin', name: 'Artist Twin', description: 'Artist profiles, riders, contracts', capabilities: ['profile', 'riders', 'contracts', 'availability'] },
        { type: 'venue-twin', name: 'Venue Twin', description: 'Venue details, capacity, equipment', capabilities: ['details', 'capacity', 'equipment', 'booking'] },
        { type: 'audience-twin', name: 'Audience Twin', description: 'Audience data, preferences, engagement', capabilities: ['data', 'preferences', 'engagement', 'demographics'] }
      ],
      gaming: [
        { type: 'player-twin', name: 'Player Twin', description: 'Player profile, achievements, stats', capabilities: ['profile', 'achievements', 'stats', 'progress'] },
        { type: 'game-twin', name: 'Game Twin', description: 'Game instances, sessions, saves', capabilities: ['instances', 'sessions', 'saves', 'settings'] },
        { type: 'inventory-twin', name: 'Inventory Twin', description: 'Virtual items, currency, cosmetics', capabilities: ['items', 'currency', 'cosmetics', 'trading'] },
        { type: 'match-twin', name: 'Match Twin', description: 'Match history, rankings, teams', capabilities: ['history', 'rankings', 'teams', 'analytics'] },
        { type: 'monetization-twin', name: 'Monetization Twin', description: 'Purchases, subscriptions, revenue', capabilities: ['purchases', 'subscriptions', 'revenue', 'analytics'] }
      ],
      agriculture: [
        { type: 'field-twin', name: 'Field Twin', description: 'Field maps, soil data, crop history', capabilities: ['maps', 'soil', 'crops', 'rotations'] },
        { type: 'crop-twin', name: 'Crop Twin', description: 'Crop details, growth stages, yields', capabilities: ['details', 'stages', 'yields', 'harvest'] },
        { type: 'equipment-twin', name: 'Equipment Twin', description: 'Farm equipment, GPS, IoT sensors', capabilities: ['equipment', 'gps', 'sensors', 'maintenance'] },
        { type: 'weather-twin', name: 'Weather Twin', description: 'Weather data, forecasts, alerts', capabilities: ['data', 'forecasts', 'alerts', 'historical'] },
        { type: 'livestock-twin', name: 'Livestock Twin', description: 'Animal records, health, breeding', capabilities: ['records', 'health', 'breeding', 'tracking'] }
      ],
      construction: [
        { type: 'project-twin', name: 'Project Twin', description: 'Project details, phases, milestones', capabilities: ['details', 'phases', 'milestones', 'budgets'] },
        { type: 'blueprint-twin', name: 'Blueprint Twin', description: 'Plans, drawings, revisions', capabilities: ['plans', 'drawings', 'revisions', 'versions'] },
        { type: 'contractor-twin', name: 'Contractor Twin', description: 'Contractor profiles, licenses, insurance', capabilities: ['profiles', 'licenses', 'insurance', 'performance'] },
        { type: 'resource-twin', name: 'Resource Twin', description: 'Labor, materials, equipment allocation', capabilities: ['labor', 'materials', 'equipment', 'scheduling'] },
        { type: 'safety-twin', name: 'Safety Twin', description: 'Safety records, incidents, compliance', capabilities: ['records', 'incidents', 'compliance', 'training'] }
      ],
      beauty: [
        { type: 'client-twin', name: 'Client Twin', description: 'Client profile, preferences, history', capabilities: ['profile', 'preferences', 'history', 'allergies'] },
        { type: 'service-twin', name: 'Service Twin', description: 'Services, pricing, duration', capabilities: ['services', 'pricing', 'duration', 'products'] },
        { type: 'appointment-twin', name: 'Appointment Twin', description: 'Appointments, availability, reminders', capabilities: ['appointments', 'availability', 'reminders', 'cancellation'] },
        { type: 'product-twin', name: 'Product Twin', description: 'Products, inventory, recommendations', capabilities: ['products', 'inventory', 'recommendations', 'retail'] },
        { type: 'stylist-twin', name: 'Stylist Twin', description: 'Stylist profiles, skills, schedules', capabilities: ['profiles', 'skills', 'schedule', 'performance'] }
      ],
      fashion: [
        { type: 'collection-twin', name: 'Collection Twin', description: 'Fashion collections, seasons, looks', capabilities: ['collections', 'season', 'looks', 'trends'] },
        { type: 'garment-twin', name: 'Garment Twin', description: 'Garment details, sizing, materials', capabilities: ['details', 'sizing', 'materials', 'care'] },
        { type: 'designer-twin', name: 'Designer Twin', description: 'Designer profiles, collections, history', capabilities: ['profiles', 'collections', 'history', 'collaborations'] },
        { type: 'trend-twin', name: 'Trend Twin', description: 'Trend analysis, forecasts, social data', capabilities: ['analysis', 'forecasts', 'social', 'market'] },
        { type: 'inventory-twin', name: 'Inventory Twin', description: 'Warehouse stock, locations, transfers', capabilities: ['stock', 'locations', 'transfers', 'returns'] }
      ],
      sports: [
        { type: 'athlete-twin', name: 'Athlete Twin', description: 'Athlete profile, stats, biometrics', capabilities: ['profile', 'stats', 'biometrics', 'performance'] },
        { type: 'team-twin', name: 'Team Twin', description: 'Team roster, schedules, travel', capabilities: ['roster', 'schedule', 'travel', 'contracts'] },
        { type: 'game-twin', name: 'Game Twin', description: 'Game details, scores, highlights', capabilities: ['details', 'scores', 'highlights', 'analytics'] },
        { type: 'venue-twin', name: 'Venue Twin', description: 'Stadium details, capacity, events', capabilities: ['details', 'capacity', 'events', 'concessions'] },
        { type: 'fan-twin', name: 'Fan Twin', description: 'Fan profiles, tickets, merchandise', capabilities: ['profile', 'tickets', 'merchandise', 'engagement'] }
      ],
      government: [
        { type: 'citizen-twin', name: 'Citizen Twin', description: 'Citizen profile, services, history', capabilities: ['profile', 'services', 'history', 'preferences'] },
        { type: 'permit-twin', name: 'Permit Twin', description: 'Permits, applications, status', capabilities: ['permits', 'applications', 'status', 'inspections'] },
        { type: 'service-twin', name: 'Service Twin', description: 'Government services, forms, status', capabilities: ['services', 'forms', 'status', 'workflows'] },
        { type: 'compliance-twin', name: 'Compliance Twin', description: 'Regulations, audits, reporting', capabilities: ['regulations', 'audits', 'reporting', 'violations'] },
        { type: 'facility-twin', name: 'Facility Twin', description: 'Public facilities, maintenance, scheduling', capabilities: ['facilities', 'maintenance', 'scheduling', 'inspections'] }
      ],
      homeservices: [
        { type: 'customer-twin', name: 'Customer Twin', description: 'Customer profile, property, history', capabilities: ['profile', 'property', 'history', 'preferences'] },
        { type: 'service-twin', name: 'Service Twin', description: 'Service types, pricing, scheduling', capabilities: ['types', 'pricing', 'scheduling', 'technicians'] },
        { type: 'job-twin', name: 'Job Twin', description: 'Job details, status, invoicing', capabilities: ['details', 'status', 'invoicing', 'photos'] },
        { type: 'technician-twin', name: 'Technician Twin', description: 'Technician profile, skills, schedule', capabilities: ['profile', 'skills', 'schedule', 'performance'] },
        { type: 'inventory-twin', name: 'Inventory Twin', description: 'Parts, equipment, reorder alerts', capabilities: ['parts', 'equipment', 'reorder', 'usage'] }
      ],
      professional: [
        { type: 'client-twin', name: 'Client Twin', description: 'Client profile, engagement, communications', capabilities: ['profile', 'engagement', 'communications', 'preferences'] },
        { type: 'project-twin', name: 'Project Twin', description: 'Project details, phases, deliverables', capabilities: ['details', 'phases', 'deliverables', 'timeline'] },
        { type: 'resource-twin', name: 'Resource Twin', description: 'Team members, skills, availability', capabilities: ['members', 'skills', 'availability', 'allocation'] },
        { type: 'deliverable-twin', name: 'Deliverable Twin', description: 'Documents, files, approvals', capabilities: ['documents', 'files', 'approvals', 'versions'] },
        { type: 'timesheet-twin', name: 'Timesheet Twin', description: 'Time tracking, billing, reports', capabilities: ['tracking', 'billing', 'reports', 'approval'] }
      ],
      nonprofit: [
        { type: 'donor-twin', name: 'Donor Twin', description: 'Donor profile, giving history, preferences', capabilities: ['profile', 'giving', 'preferences', 'recognition'] },
        { type: 'donation-twin', name: 'Donation Twin', description: 'Donations, campaigns, receipts', capabilities: ['donations', 'campaigns', 'receipts', 'acknowledgment'] },
        { type: 'volunteer-twin', name: 'Volunteer Twin', description: 'Volunteer profile, skills, availability', capabilities: ['profile', 'skills', 'availability', 'hours'] },
        { type: 'beneficiary-twin', name: 'Beneficiary Twin', description: 'Beneficiary profiles, services, outcomes', capabilities: ['profiles', 'services', 'outcomes', 'demographics'] },
        { type: 'campaign-twin', name: 'Campaign Twin', description: 'Fundraising campaigns, goals, progress', capabilities: ['campaigns', 'goals', 'progress', 'analytics'] }
      ],
      media: [
        { type: 'content-twin', name: 'Content Twin', description: 'Articles, videos, podcasts, metadata', capabilities: ['articles', 'videos', 'podcasts', 'metadata'] },
        { type: 'author-twin', name: 'Author Twin', description: 'Author profiles, contributions, bio', capabilities: ['profile', 'contributions', 'bio', 'social'] },
        { type: 'audience-twin', name: 'Audience Twin', description: 'Reader/viewer profiles, engagement', capabilities: ['profiles', 'engagement', 'demographics', 'preferences'] },
        { type: 'ad-twin', name: 'Ad Twin', description: 'Ad campaigns, targeting, performance', capabilities: ['campaigns', 'targeting', 'performance', 'budgets'] },
        { type: 'subscription-twin', name: 'Subscription Twin', description: 'Subscriptions, plans, renewals', capabilities: ['subscriptions', 'plans', 'renewals', 'churn'] }
      ],
      energy: [
        { type: 'meter-twin', name: 'Meter Twin', description: 'Energy meters, readings, consumption', capabilities: ['meters', 'readings', 'consumption', 'history'] },
        { type: 'facility-twin', name: 'Facility Twin', description: 'Facilities, usage, efficiency', capabilities: ['facilities', 'usage', 'efficiency', 'optimization'] },
        { type: 'production-twin', name: 'Production Twin', description: 'Energy production, sources, output', capabilities: ['production', 'sources', 'output', 'forecasts'] },
        { type: 'grid-twin', name: 'Grid Twin', description: 'Grid status, distribution, outages', capabilities: ['status', 'distribution', 'outages', 'load'] },
        { type: 'sustainability-twin', name: 'Sustainability Twin', description: 'Carbon footprint, renewable credits', capabilities: ['carbon', 'credits', 'reports', 'goals'] }
      ]
    };
  }

  /**
   * Get twin by ID
   */
  get(id) {
    return this.twins.get(id);
  }

  /**
   * Get twins by industry
   */
  getByIndustry(industry) {
    return this.industryTwins.get(industry) || [];
  }

  /**
   * Get twins by type
   */
  getByType(type) {
    const results = [];
    for (const twin of this.twins.values()) {
      if (twin.type === type) {
        results.push(twin);
      }
    }
    return results;
  }

  /**
   * Get total twin count
   */
  getTotalCount() {
    return this.twins.size;
  }

  /**
   * Get industry count
   */
  getIndustryCount() {
    return this.industryTwins.size;
  }

  /**
   * Get count by industry
   */
  getCountByIndustry() {
    const counts = {};
    for (const [industry, twins] of this.industryTwins) {
      counts[industry] = twins.length;
    }
    return counts;
  }

  /**
   * Get count by type
   */
  getCountByType() {
    const counts = {};
    for (const twin of this.twins.values()) {
      counts[twin.type] = (counts[twin.type] || 0) + 1;
    }
    return counts;
  }

  /**
   * Get active twin count (those with recent activity)
   */
  async getActiveCount() {
    // In production, check Redis for active twins
    return Math.floor(this.twins.size * 0.7); // Placeholder
  }

  /**
   * Get full catalog
   */
  getCatalog() {
    const catalog = [];
    for (const [industry, twins] of this.industryTwins) {
      catalog.push({
        industry,
        twinCount: twins.length,
        twins: twins.map(t => ({
          type: t.type,
          name: t.name,
          description: t.description,
          capabilities: t.capabilities
        }))
      });
    }
    return catalog;
  }
}

export default TwinRegistry;
