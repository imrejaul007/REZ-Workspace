/**
 * Quote Generator Agent
 * Intelligent pricing estimates based on service type, location, and historical data
 */

const EventEmitter = require('events');
const { v4: uuidv4 } = require('uuid');

class QuoteGeneratorAgent extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      // Service dependencies
      jobService: null,
      customerService: null,
      inventoryService: null,

      // Pricing configuration
      laborRatePerHour: config.laborRatePerHour || 85,
      minimumCharge: config.minimumCharge || 75,
      travelFeeBase: config.travelFeeBase || 25,
      travelFeePerMile: config.travelFeePerMile || 2,

      // Tax rate (default 8%)
      taxRate: config.taxRate || 0.08,

      // Pricing models for different services
      pricingModels: config.pricingModels || this.getDefaultPricingModels()
    };

    this.quoteTemplates = new Map();
    this.pricingRules = new Map();
    this.logger = this.createLogger();
  }

  createLogger() {
    return {
      info: (msg, meta = {}) => console.log(`[${new Date().toISOString()}] INFO: [QuoteGenerator] ${msg}`, meta),
      error: (msg, meta = {}) => console.error(`[${new Date().toISOString()}] ERROR: [QuoteGenerator] ${msg}`, meta),
      warn: (msg, meta = {}) => console.warn(`[${new Date().toISOString()}] WARN: [QuoteGenerator] ${msg}`, meta),
      debug: (msg, meta = {}) => console.debug(`[${new Date().toISOString()}] DEBUG: [QuoteGenerator] ${msg}`, meta)
    };
  }

  /**
   * Get default pricing models
   */
  getDefaultPricingModels() {
    return {
      hvac: {
        baseRate: 120,
        hourlyRate: 95,
        commonServices: {
          'ac_repair': { minHours: 1, maxHours: 3, baseParts: 150 },
          'furnace_repair': { minHours: 1.5, maxHours: 4, baseParts: 200 },
          'maintenance': { minHours: 0.75, maxHours: 1.5, baseParts: 50 },
          'installation': { minHours: 4, maxHours: 8, baseParts: 800 }
        }
      },
      plumbing: {
        baseRate: 100,
        hourlyRate: 85,
        commonServices: {
          'drain_cleaning': { minHours: 0.5, maxHours: 2, baseParts: 75 },
          'leak_repair': { minHours: 1, maxHours: 3, baseParts: 100 },
          'water_heater': { minHours: 2, maxHours: 5, baseParts: 400 },
          'fixture_install': { minHours: 1, maxHours: 3, baseParts: 150 }
        }
      },
      electrical: {
        baseRate: 110,
        hourlyRate: 100,
        commonServices: {
          'outlet_repair': { minHours: 0.5, maxHours: 2, baseParts: 40 },
          'panel_upgrade': { minHours: 4, maxHours: 8, baseParts: 350 },
          'lighting_install': { minHours: 1, maxHours: 4, baseParts: 100 },
          'safety_inspection': { minHours: 1, maxHours: 2, baseParts: 0 }
        }
      },
      appliance: {
        baseRate: 95,
        hourlyRate: 90,
        commonServices: {
          'washer_repair': { minHours: 1, maxHours: 2, baseParts: 120 },
          'dryer_repair': { minHours: 1, maxHours: 2, baseParts: 100 },
          'refrigerator_repair': { minHours: 1, maxHours: 3, baseParts: 200 },
          'dishwasher_repair': { minHours: 1, maxHours: 2, baseParts: 150 }
        }
      },
      landscaping: {
        baseRate: 75,
        hourlyRate: 65,
        commonServices: {
          'lawn_mowing': { minHours: 0.5, maxHours: 2, baseParts: 0 },
          'tree_trimming': { minHours: 2, maxHours: 6, baseParts: 0 },
          'landscape_install': { minHours: 4, maxHours: 16, baseParts: 300 }
        }
      },
      cleaning: {
        baseRate: 80,
        hourlyRate: 60,
        commonServices: {
          'standard_clean': { minHours: 2, maxHours: 4, baseParts: 0 },
          'deep_clean': { minHours: 3, maxHours: 6, baseParts: 50 },
          'move_out_clean': { minHours: 4, maxHours: 8, baseParts: 100 }
        }
      },
      pest: {
        baseRate: 100,
        hourlyRate: 80,
        commonServices: {
          'inspection': { minHours: 0.5, maxHours: 1.5, baseParts: 0 },
          'treatment': { minHours: 1, maxHours: 3, baseParts: 150 },
          'termite_treatment': { minHours: 2, maxHours: 8, baseParts: 500 }
        }
      },
      roofing: {
        baseRate: 130,
        hourlyRate: 95,
        commonServices: {
          'repair': { minHours: 2, maxHours: 6, baseParts: 200 },
          'inspection': { minHours: 1, maxHours: 3, baseParts: 0 },
          'gutter_clean': { minHours: 1, maxHours: 3, baseParts: 0 }
        }
      },
      painting: {
        baseRate: 100,
        hourlyRate: 75,
        commonServices: {
          'touch_up': { minHours: 1, maxHours: 3, baseParts: 50 },
          'room_paint': { minHours: 4, maxHours: 12, baseParts: 150 },
          'exterior_paint': { minHours: 8, maxHours: 24, baseParts: 400 }
        }
      },
      carpentry: {
        baseRate: 110,
        hourlyRate: 85,
        commonServices: {
          'deck_repair': { minHours: 2, maxHours: 8, baseParts: 150 },
          'door_repair': { minHours: 1, maxHours: 3, baseParts: 75 },
          'framing': { minHours: 4, maxHours: 12, baseParts: 200 }
        }
      }
    };
  }

  /**
   * Initialize the quote generator
   */
  async initialize() {
    this.logger.info('Initializing Quote Generator Agent');

    // Load pricing rules from database or config
    await this.loadPricingRules();

    this.logger.info('Quote Generator Agent initialized successfully');
    return { success: true, agent: 'QuoteGeneratorAgent' };
  }

  /**
   * Load pricing rules
   */
  async loadPricingRules() {
    // In production, load from database or external service
    this.pricingRules.set('peak_hours', {
      multiplier: 1.25,
      hours: { start: '17:00', end: '20:00' },
      days: [6, 0] // Saturday, Sunday
    });

    this.pricingRules.set('holiday', {
      multiplier: 1.5,
      dates: ['12-25', '01-01', '07-04', '11-28']
    });

    this.pricingRules.set('first_time_customer', {
      discount: 0.10
    });

    this.pricingRules.set('loyalty_discount', {
      silver: 0.05,
      gold: 0.10,
      platinum: 0.15
    });
  }

  /**
   * Generate quote for a job
   */
  async generateQuote(jobData) {
    this.logger.info('Generating quote for job', { jobId: jobData.id, serviceType: jobData.serviceType });

    const startTime = Date.now();

    // Get job details
    const job = jobData.id
      ? await this.config.jobService?.getJob(jobData.id)
      : jobData;

    if (!job) {
      throw new Error('Job data is required');
    }

    // Get customer info for pricing adjustments
    const customer = await this.config.customerService?.getCustomer(job.customerId);

    // Get property details for distance/travel fees
    const property = customer?.properties?.find(p => p.id === job.propertyId);

    // Determine service category and get pricing model
    const serviceCategory = this.categorizeService(job.serviceType);
    const pricingModel = this.pricingModels[serviceCategory] || {
      baseRate: 100,
      hourlyRate: 80,
      commonServices: {}
    };

    // Calculate quote components
    const quote = {
      id: uuidv4(),
      jobId: job.id,
      customerId: job.customerId,
      serviceType: job.serviceType,
      serviceCategory,
      lineItems: [],
      laborCost: 0,
      partsCost: 0,
      materialsCost: 0,
      travelCost: 0,
      subtotal: 0,
      discount: 0,
      tax: 0,
      totalAmount: 0,
      breakdown: {},
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      generatedAt: new Date().toISOString()
    };

    // Add base service fee
    quote.lineItems.push({
      type: 'base_fee',
      description: 'Service Call Fee',
      quantity: 1,
      unitPrice: pricingModel.baseRate,
      total: pricingModel.baseRate
    });
    quote.laborCost += pricingModel.baseRate;

    // Estimate labor based on service type
    const estimatedHours = this.estimateLaborHours(job.serviceType, pricingModel);
    const laborCost = estimatedHours * pricingModel.hourlyRate;
    quote.lineItems.push({
      type: 'labor',
      description: `Labor (estimated ${estimatedHours.toFixed(1)} hours)`,
      quantity: estimatedHours,
      unitPrice: pricingModel.hourlyRate,
      total: laborCost
    });
    quote.laborCost += laborCost;
    quote.breakdown.estimatedHours = estimatedHours;

    // Estimate parts cost
    const partsEstimate = this.estimatePartsCost(job.serviceType, pricingModel);
    if (partsEstimate > 0) {
      quote.lineItems.push({
        type: 'parts',
        description: 'Parts & Materials (estimated)',
        quantity: 1,
        unitPrice: partsEstimate,
        total: partsEstimate
      });
      quote.partsCost += partsEstimate;
    }
    quote.breakdown.partsEstimate = partsEstimate;

    // Calculate travel fee if property location available
    if (property?.address) {
      const travelFee = this.calculateTravelFee(property.address);
      if (travelFee > 0) {
        quote.lineItems.push({
          type: 'travel',
          description: 'Travel Fee',
          quantity: 1,
          unitPrice: travelFee,
          total: travelFee
        });
        quote.travelCost += travelFee;
      }
    }

    // Apply time-based pricing adjustments
    const timeAdjustment = this.calculateTimeAdjustment(job.scheduledDate);
    if (timeAdjustment.multiplier > 1) {
      quote.breakdown.timeAdjustment = timeAdjustment;
      const adjustedLabor = quote.laborCost * (timeAdjustment.multiplier - 1);
      quote.lineItems.push({
        type: 'adjustment',
        description: `After-hours service charge (${timeAdjustment.reason})`,
        quantity: 1,
        unitPrice: adjustedLabor,
        total: adjustedLabor
      });
      quote.laborCost += adjustedLabor;
    }

    // Calculate customer discounts
    const customerDiscount = await this.calculateCustomerDiscount(customer);
    if (customerDiscount > 0) {
      quote.discount = quote.laborCost * customerDiscount;
      quote.lineItems.push({
        type: 'discount',
        description: `Customer Discount (${(customerDiscount * 100).toFixed(0)}%)`,
        quantity: 1,
        unitPrice: -quote.discount,
        total: -quote.discount
      });
    }

    // Calculate totals
    quote.subtotal = quote.laborCost + quote.partsCost + quote.travelCost - quote.discount;
    quote.tax = quote.subtotal * this.taxRate;
    quote.totalAmount = quote.subtotal + quote.tax;

    // Apply minimum charge
    if (quote.totalAmount < this.config.minimumCharge) {
      quote.lineItems.push({
        type: 'minimum_charge',
        description: 'Minimum Service Charge',
        quantity: 1,
        unitPrice: this.config.minimumCharge - quote.totalAmount,
        total: this.config.minimumCharge - quote.totalAmount
      });
      quote.totalAmount = this.config.minimumCharge;
    }

    // Round to 2 decimal places
    quote.totalAmount = Math.round(quote.totalAmount * 100) / 100;
    quote.breakdown.generationTimeMs = Date.now() - startTime;

    this.logger.info('Quote generated', {
      quoteId: quote.id,
      jobId: job.id,
      total: quote.totalAmount
    });

    // Store quote in job service
    if (this.config.jobService) {
      await this.config.jobService.createQuote(job.id, quote);
    }

    this.emit('quote:generated', quote);

    return quote;
  }

  /**
   * Categorize service type to pricing category
   */
  categorizeService(serviceType) {
    const serviceLower = serviceType.toLowerCase();

    const categories = {
      hvac: ['hvac', 'heating', 'cooling', 'ac', 'air conditioning', 'furnace', 'heat pump'],
      plumbing: ['plumb', 'pipe', 'drain', 'water', 'leak', 'toilet', 'faucet', 'sewer'],
      electrical: ['electric', 'wiring', 'outlet', 'switch', 'panel', 'light'],
      appliance: ['appliance', 'washer', 'dryer', 'refrigerator', 'dishwasher', 'oven'],
      landscaping: ['landscape', 'lawn', 'tree', 'grass', 'gardening', 'yard'],
      cleaning: ['clean', 'maid', 'janitor', 'housekeeping'],
      pest: ['pest', 'termite', 'rodent', 'bug', 'ant', 'roach'],
      roofing: ['roof', 'shingle', 'gutter', 'siding'],
      painting: ['paint', 'drywall', 'wall', 'stain'],
      carpentry: ['carpenter', 'wood', 'framing', 'deck', 'fence']
    };

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(k => serviceLower.includes(k))) {
        return category;
      }
    }

    return 'general';
  }

  /**
   * Estimate labor hours for service
   */
  estimateLaborHours(serviceType, pricingModel) {
    const serviceLower = serviceType.toLowerCase();
    const commonServices = pricingModel.commonServices || {};

    for (const [key, config] of Object.entries(commonServices)) {
      if (serviceLower.includes(key.replace('_', ' '))) {
        return (config.minHours + config.maxHours) / 2;
      }
    }

    // Default estimation based on keywords
    if (serviceLower.includes('repair') || serviceLower.includes('fix')) {
      return 1.5;
    }
    if (serviceLower.includes('install')) {
      return 3;
    }
    if (serviceLower.includes('inspect') || serviceLower.includes('check')) {
      return 0.75;
    }
    if (serviceLower.includes('emergency') || serviceLower.includes('urgent')) {
      return 2;
    }

    return 2; // Default 2 hours
  }

  /**
   * Estimate parts cost
   */
  estimatePartsCost(serviceType, pricingModel) {
    const serviceLower = serviceType.toLowerCase();
    const commonServices = pricingModel.commonServices || {};

    for (const [key, config] of Object.entries(commonServices)) {
      if (serviceLower.includes(key.replace('_', ' '))) {
        return config.baseParts || 0;
      }
    }

    return 0;
  }

  /**
   * Calculate travel fee
   */
  calculateTravelFee(address) {
    // In production, calculate based on actual distance
    // For now, return base travel fee
    const distance = address.distance || 10; // miles
    const fee = this.config.travelFeeBase + (distance * this.config.travelFeePerMile);
    return Math.round(fee * 100) / 100;
  }

  /**
   * Calculate time-based pricing adjustment
   */
  calculateTimeAdjustment(scheduledDate) {
    if (!scheduledDate) {
      return { multiplier: 1, reason: null };
    }

    const date = new Date(scheduledDate);
    const hour = date.getHours();
    const dayOfWeek = date.getDay();

    // Check peak hours rule
    const peakRule = this.pricingRules.get('peak_hours');
    if (peakRule) {
      const isPeakTime = hour >= peakRule.hours.start.replace(':', '') / 100 &&
        hour <= peakRule.hours.end.replace(':', '') / 100;
      const isWeekend = peakRule.days.includes(dayOfWeek);

      if (isPeakTime || isWeekend) {
        return {
          multiplier: peakRule.multiplier,
          reason: isWeekend ? 'Weekend service' : 'After-hours service'
        };
      }
    }

    // Check holiday rule
    const holidayRule = this.pricingRules.get('holiday');
    if (holidayRule) {
      const monthDay = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      if (holidayRule.dates.includes(monthDay)) {
        return {
          multiplier: holidayRule.multiplier,
          reason: 'Holiday service'
        };
      }
    }

    return { multiplier: 1, reason: null };
  }

  /**
   * Calculate customer discount
   */
  async calculateCustomerDiscount(customer) {
    if (!customer) return 0;

    // Check for loyalty discount
    const loyaltyRule = this.pricingRules.get('loyalty_discount');
    if (loyaltyRule && customer.loyaltyTier) {
      const discount = loyaltyRule[customer.loyaltyTier] || 0;
      if (discount > 0) {
        return discount;
      }
    }

    // First-time customer discount
    const firstTimeRule = this.pricingRules.get('first_time_customer');
    if (firstTimeRule && (customer.totalServices || 0) === 0 && firstTimeRule.discount) {
      return firstTimeRule.discount;
    }

    return 0;
  }

  /**
   * Revise quote based on actual work done
   */
  async reviseQuote(quoteId, revisionData) {
    // This would be called after job completion with actual hours/parts used
    this.logger.info('Quote revision requested', { quoteId, revisionData });

    const revision = {
      id: uuidv4(),
      quoteId,
      originalQuoteId: quoteId,
      ...revisionData,
      revisedAt: new Date().toISOString()
    };

    this.emit('quote:revised', revision);

    return revision;
  }

  /**
   * Compare quotes for competitive analysis
   */
  async compareQuotes(quoteIds) {
    const quotes = [];

    for (const id of quoteIds) {
      // In production, fetch from job service
      // For now, return placeholder
      quotes.push({ id, status: 'pending' });
    }

    return {
      comparison: quotes,
      analyzedAt: new Date().toISOString()
    };
  }

  /**
   * Get quote analytics
   */
  async getQuoteAnalytics(dateRange = {}) {
    // In production, aggregate from job service quotes
    return {
      totalQuotes: 0,
      averageQuoteValue: 0,
      conversionRate: 0,
      byServiceType: {},
      dateRange
    };
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    this.logger.info('Shutting down Quote Generator Agent');
    this.removeAllListeners();
    return { success: true, agent: 'QuoteGeneratorAgent' };
  }
}

module.exports = { QuoteGeneratorAgent };
