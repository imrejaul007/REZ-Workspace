/**
 * Customer Twin Service
 * Manages buyer profiles, preferences, and interaction history
 * Part of the Automotive OS Digital Twin Architecture
 */

const { EventEmitter } = require('events');
const winston = require('winston');
const { v4: uuidv4 } = require('uuid');

// Configure logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Customer data store
const customerStore = new Map();
const eventStore = [];

/**
 * Customer Twin Service Class
 * Handles customer digital twin operations
 */
class CustomerTwinService extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      port: config.port || 3002,
      host: config.host || '0.0.0.0',
      store: customerStore,
      eventStore: eventStore,
      maxHistorySize: config.maxHistorySize || 1000,
      ...config
    };

    this.logger = logger;
    this.startTime = Date.now();
  }

  /**
   * Initialize the service
   */
  async initialize() {
    this.logger.info('Initializing Customer Twin Service', {
      port: this.config.port,
      host: this.config.host
    });

    await this.loadSampleData();

    this.emit('initialized');
    return this;
  }

  /**
   * Load sample customer data
   */
  async loadSampleData() {
    const sampleCustomers = [
      {
        id: 'cust-001',
        firstName: 'Sarah',
        lastName: 'Mitchell',
        email: 'sarah.mitchell@email.com',
        phone: '+1-555-0123',
        type: 'buyer',
        preferences: {
          bodyStyles: ['SUV', 'Crossover'],
          makes: ['Toyota', 'Honda', 'Subaru'],
          maxPrice: 45000,
          maxMileage: 30000,
          fuelTypes: ['Hybrid', 'Electric'],
          features: ['AWD', 'Safety Package', 'Apple CarPlay']
        },
        budget: {
          min: 30000,
          max: 45000,
          preapproved: true,
          preapprovalAmount: 50000,
          financing: true
        },
        location: {
          address: '123 Oak Street',
          city: 'Denver',
          state: 'CO',
          zip: '80202',
          coordinates: { lat: 39.7392, lng: -104.9903 }
        },
        creditScore: 750,
        tradeIn: {
          hasTradeIn: true,
          vin: '2HGFC2F59LH555555',
          make: 'Honda',
          model: 'Civic',
          year: 2018,
          mileage: 45000,
          estimatedValue: 18500,
          condition: 'Good'
        },
        timeline: {
          firstContact: '2024-01-15T10:00:00Z',
          lastContact: '2024-02-20T14:30:00Z',
          nextFollowUp: '2024-03-01T09:00:00Z',
          interactions: []
        },
        status: 'active',
        leadScore: 85,
        source: 'website',
        assignedDealer: 'Metro Honda',
        notes: 'Looking for family SUV, prefers AWD for Colorado weather',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-02-20T14:30:00Z'
      },
      {
        id: 'cust-002',
        firstName: 'James',
        lastName: 'Chen',
        email: 'j.chen@techcorp.com',
        phone: '+1-555-0456',
        type: 'buyer',
        preferences: {
          bodyStyles: ['Sedan'],
          makes: ['Tesla', 'BMW', 'Mercedes-Benz'],
          maxPrice: 80000,
          maxMileage: 15000,
          fuelTypes: ['Electric'],
          features: ['Autopilot', 'Premium Audio', 'Glass Roof', 'Fast Charging']
        },
        budget: {
          min: 50000,
          max: 80000,
          preapproved: true,
          preapprovalAmount: 90000,
          financing: false,
          cashPurchase: true
        },
        location: {
          address: '456 Tech Drive',
          city: 'Austin',
          state: 'TX',
          zip: '78701',
          coordinates: { lat: 30.2672, lng: -97.7431 }
        },
        creditScore: 820,
        tradeIn: {
          hasTradeIn: false
        },
        timeline: {
          firstContact: '2024-02-01T11:00:00Z',
          lastContact: '2024-02-25T16:00:00Z',
          nextFollowUp: '2024-03-05T10:00:00Z',
          interactions: []
        },
        status: 'active',
        leadScore: 92,
        source: 'referral',
        assignedDealer: 'EV Direct',
        notes: 'Tech executive, wants latest EV technology',
        createdAt: '2024-02-01T11:00:00Z',
        updatedAt: '2024-02-25T16:00:00Z'
      },
      {
        id: 'cust-003',
        firstName: 'Maria',
        lastName: 'Garcia',
        email: 'maria.garcia@gmail.com',
        phone: '+1-555-0789',
        type: 'buyer',
        preferences: {
          bodyStyles: ['Sedan', 'Hatchback'],
          makes: ['Volkswagen', 'Mazda', 'Hyundai'],
          maxPrice: 35000,
          maxMileage: 50000,
          fuelTypes: ['Gasoline', 'Hybrid'],
          features: ['Fuel Efficiency', 'Safety Package', 'Infotainment System']
        },
        budget: {
          min: 20000,
          max: 35000,
          preapproved: false,
          financing: true
        },
        location: {
          address: '789 Pine Lane',
          city: 'Phoenix',
          state: 'AZ',
          zip: '85001',
          coordinates: { lat: 33.4484, lng: -112.0740 }
        },
        creditScore: 680,
        tradeIn: {
          hasTradeIn: true,
          vin: '1N4AL3AP4DC123456',
          make: 'Nissan',
          model: 'Altima',
          year: 2015,
          mileage: 85000,
          estimatedValue: 9500,
          condition: 'Fair'
        },
        timeline: {
          firstContact: '2024-02-10T09:00:00Z',
          lastContact: '2024-02-18T11:00:00Z',
          nextFollowUp: '2024-03-01T09:00:00Z',
          interactions: []
        },
        status: 'active',
        leadScore: 68,
        source: 'social_media',
        assignedDealer: 'German Motors',
        notes: 'First-time buyer, needs reliable commuter car',
        createdAt: '2024-02-10T09:00:00Z',
        updatedAt: '2024-02-18T11:00:00Z'
      }
    ];

    for (const customer of sampleCustomers) {
      this.config.store.set(customer.id, customer);
      this.recordEvent('CUSTOMER_CREATED', customer.id, customer);
    }

    this.logger.info(`Loaded ${sampleCustomers.length} sample customers`);
  }

  /**
   * Record an event
   */
  recordEvent(type, customerId, data) {
    const event = {
      id: uuidv4(),
      type,
      customerId,
      data,
      timestamp: new Date().toISOString()
    };
    this.config.eventStore.push(event);

    if (this.config.eventStore.length > this.config.maxHistorySize) {
      this.config.eventStore.shift();
    }

    return event;
  }

  /**
   * Create a new customer twin
   */
  async createCustomer(customerData) {
    try {
      const { email, phone } = customerData;

      // Check for duplicate email or phone
      for (const customer of this.config.store.values()) {
        if (customer.email === email) {
          throw new Error(`Customer with email ${email} already exists`);
        }
        if (phone && customer.phone === phone) {
          throw new Error(`Customer with phone ${phone} already exists`);
        }
      }

      const customer = {
        ...customerData,
        id: customerData.id || `cust-${uuidv4().slice(0, 8)}`,
        timeline: {
          firstContact: new Date().toISOString(),
          lastContact: new Date().toISOString(),
          nextFollowUp: null,
          interactions: []
        },
        status: 'new',
        leadScore: 50,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      this.config.store.set(customer.id, customer);
      this.recordEvent('CUSTOMER_CREATED', customer.id, customer);

      this.logger.info(`Created customer twin: ${customer.id}`);
      this.emit('customer:created', customer);

      return customer;
    } catch (error) {
      this.logger.error('Failed to create customer', { error: error.message });
      throw error;
    }
  }

  /**
   * Get customer by ID
   */
  async getCustomer(id) {
    const customer = this.config.store.get(id);

    if (!customer) {
      throw new Error(`Customer with ID ${id} not found`);
    }

    return customer;
  }

  /**
   * Get customer by email
   */
  async getCustomerByEmail(email) {
    for (const customer of this.config.store.values()) {
      if (customer.email === email) {
        return customer;
      }
    }
    throw new Error(`Customer with email ${email} not found`);
  }

  /**
   * Update customer
   */
  async updateCustomer(id, updates) {
    const customer = await this.getCustomer(id);
    const previousState = { ...customer };

    const updatedCustomer = {
      ...customer,
      ...updates,
      id,
      updatedAt: new Date().toISOString()
    };

    this.config.store.set(id, updatedCustomer);
    this.recordEvent('CUSTOMER_UPDATED', id, {
      previous: previousState,
      current: updatedCustomer,
      changes: updates
    });

    this.logger.info(`Updated customer twin: ${id}`, { changes: Object.keys(updates) });
    this.emit('customer:updated', { previous: previousState, current: updatedCustomer });

    return updatedCustomer;
  }

  /**
   * Delete customer
   */
  async deleteCustomer(id) {
    const customer = await this.getCustomer(id);

    this.config.store.delete(id);
    this.recordEvent('CUSTOMER_DELETED', id, customer);

    this.logger.info(`Deleted customer twin: ${id}`);
    this.emit('customer:deleted', customer);

    return { deleted: true, id };
  }

  /**
   * List customers with filters
   */
  async listCustomers(filters = {}) {
    let customers = Array.from(this.config.store.values());

    if (filters.status) {
      customers = customers.filter(c => c.status === filters.status);
    }

    if (filters.source) {
      customers = customers.filter(c => c.source === filters.source);
    }

    if (filters.assignedDealer) {
      customers = customers.filter(c => c.assignedDealer === filters.assignedDealer);
    }

    if (filters.leadScoreMin) {
      customers = customers.filter(c => c.leadScore >= parseInt(filters.leadScoreMin));
    }

    if (filters.leadScoreMax) {
      customers = customers.filter(c => c.leadScore <= parseInt(filters.leadScoreMax));
    }

    if (filters.budgetMax) {
      customers = customers.filter(c =>
        c.budget && c.budget.max >= parseInt(filters.budgetMax)
      );
    }

    if (filters.preferences) {
      if (filters.preferences.bodyStyle) {
        customers = customers.filter(c =>
          c.preferences && c.preferences.bodyStyles &&
          c.preferences.bodyStyles.some(bs =>
            bs.toLowerCase() === filters.preferences.bodyStyle.toLowerCase()
          )
        );
      }
      if (filters.preferences.make) {
        customers = customers.filter(c =>
          c.preferences && c.preferences.makes &&
          c.preferences.makes.some(m =>
            m.toLowerCase() === filters.preferences.make.toLowerCase()
          )
        );
      }
    }

    // Sorting
    if (filters.sortBy) {
      const sortField = filters.sortBy;
      const sortOrder = filters.sortOrder || 'desc';

      customers.sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];

        if (typeof valA === 'string') {
          valA = valA.toLowerCase();
          valB = valB.toLowerCase();
        }

        if (sortOrder === 'asc') {
          return valA > valB ? 1 : valA < valB ? -1 : 0;
        } else {
          return valA < valB ? 1 : valA > valB ? -1 : 0;
        }
      });
    }

    // Pagination
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 50;
    const start = (page - 1) * limit;
    const end = start + limit;

    return {
      data: customers.slice(start, end),
      pagination: {
        page,
        limit,
        total: customers.length,
        totalPages: Math.ceil(customers.length / limit)
      }
    };
  }

  /**
   * Add interaction to customer timeline
   */
  async addInteraction(id, interaction) {
    const customer = await this.getCustomer(id);

    const newInteraction = {
      id: uuidv4(),
      ...interaction,
      timestamp: new Date().toISOString()
    };

    customer.timeline.interactions = customer.timeline.interactions || [];
    customer.timeline.interactions.push(newInteraction);
    customer.timeline.lastContact = new Date().toISOString();
    customer.updatedAt = new Date().toISOString();

    // Update lead score based on interaction
    customer.leadScore = this.calculateLeadScore(customer);

    this.config.store.set(id, customer);
    this.recordEvent('CUSTOMER_INTERACTION', id, newInteraction);

    this.logger.info(`Added interaction to customer ${id}`);
    this.emit('customer:interaction', { customer, interaction: newInteraction });

    return { customer, interaction: newInteraction };
  }

  /**
   * Calculate lead score based on customer data
   */
  calculateLeadScore(customer) {
    let score = 50;

    if (customer.budget) {
      if (customer.budget.preapproved) score += 15;
      if (customer.budget.max >= 50000) score += 10;
      if (customer.budget.financing) score += 5;
    }

    if (customer.creditScore >= 750) score += 10;
    else if (customer.creditScore >= 700) score += 5;

    if (customer.tradeIn && customer.tradeIn.hasTradeIn) score += 5;

    const daysSinceContact = customer.timeline.lastContact
      ? Math.floor((Date.now() - new Date(customer.timeline.lastContact)) / (1000 * 60 * 60 * 24))
      : 999;

    if (daysSinceContact <= 7) score += 10;
    else if (daysSinceContact <= 14) score += 5;
    else if (daysSinceContact > 30) score -= 10;

    const sourceScores = {
      referral: 10,
      website: 5,
      social_media: 0,
      walk_in: 8,
      phone: 3
    };
    score += sourceScores[customer.source] || 0;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Update customer preferences
   */
  async updatePreferences(id, preferences) {
    const customer = await this.getCustomer(id);

    customer.preferences = {
      ...customer.preferences,
      ...preferences
    };
    customer.updatedAt = new Date().toISOString();

    this.config.store.set(id, customer);
    this.recordEvent('CUSTOMER_PREFERENCES_UPDATED', id, preferences);

    this.logger.info(`Updated preferences for customer ${id}`);
    return customer;
  }

  /**
   * Get customer match criteria for vehicle matching
   */
  async getMatchCriteria(id) {
    const customer = await this.getCustomer(id);

    return {
      customerId: id,
      budget: customer.budget,
      preferences: customer.preferences,
      location: customer.location,
      tradeIn: customer.tradeIn
    };
  }

  /**
   * Get service statistics
   */
  getStats() {
    const customers = Array.from(this.config.store.values());

    const stats = {
      totalCustomers: customers.length,
      byStatus: {},
      bySource: {},
      averageLeadScore: 0,
      byLeadScoreRange: {
        hot: 0,
        warm: 0,
        cold: 0
      }
    };

    let totalScore = 0;

    for (const customer of customers) {
      stats.byStatus[customer.status] = (stats.byStatus[customer.status] || 0) + 1;
      stats.bySource[customer.source] = (stats.bySource[customer.source] || 0) + 1;
      totalScore += customer.leadScore;

      if (customer.leadScore >= 80) stats.byLeadScoreRange.hot++;
      else if (customer.leadScore >= 50) stats.byLeadScoreRange.warm++;
      else stats.byLeadScoreRange.cold++;
    }

    if (customers.length > 0) {
      stats.averageLeadScore = Math.round(totalScore / customers.length);
    }

    return stats;
  }

  /**
   * Health check
   */
  async healthCheck() {
    return {
      status: 'healthy',
      service: 'customer-twin-service',
      uptime: Date.now() - this.startTime,
      timestamp: new Date().toISOString(),
      stats: this.getStats()
    };
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    this.logger.info('Shutting down Customer Twin Service');
    this.emit('shutdown');
    return { shutdown: true, service: 'customer-twin-service' };
  }
}

module.exports = { CustomerTwinService };
module.exports.default = { CustomerTwinService };