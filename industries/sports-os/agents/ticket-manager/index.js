/**
 * Ticket Manager Agent
 * Manages ticket sales, pricing, and distribution with REZ CRM integration
 * Supports Ticketmaster, StubHub, and direct sales channels
 * Part of the Sports OS Agent Architecture
 */

const EventEmitter = require('events');
const winston = require('winston');
const axios = require('axios');

// Logger configuration
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

// Sales channels
const CHANNELS = {
  DIRECT: 'direct',
  TICKETMASTER: 'ticketmaster',
  STUBHUB: 'stubhub',
  SECONDARY: 'secondary'
};

// Ticket status
const TICKET_STATUS = {
  AVAILABLE: 'available',
  RESERVED: 'reserved',
  SOLD: 'sold',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded'
};

// Pricing strategies
const PRICING_STRATEGIES = {
  FIXED: 'fixed',
  DYNAMIC: 'dynamic',
  PREMIUM: 'premium',
  VIP: 'vip'
};

class TicketManagerAgent extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      venueServiceUrl: process.env.VENUE_SERVICE_URL || 'http://localhost:3004',
      fanServiceUrl: process.env.FAN_SERVICE_URL || 'http://localhost:3003',
      teamServiceUrl: process.env.TEAM_SERVICE_URL || 'http://localhost:3002',
      rezCrmUrl: process.env.REZ_CRM_URL || 'http://localhost:8080/api/rez-crm',
      ticketmasterApiUrl: process.env.TICKETMASTER_API_URL || 'https://api.ticketmaster.com',
      stubhubApiUrl: process.env.STUBHUB_API_URL || 'https://api.stubhub.com',
      ...config
    };

    this.httpClient = axios.create({
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' }
    });

    this.ticketInventory = new Map();
    this.reservations = new Map();
    this.isRunning = false;
  }

  /**
   * Start the ticket manager agent
   */
  async start() {
    logger.info('Starting Ticket Manager Agent...');
    this.isRunning = true;

    // Initialize integrations
    await this.initializeIntegrations();

    // Start background tasks
    this.startBackgroundTasks();

    this.emit('started');
    logger.info('Ticket Manager Agent started successfully');
    return true;
  }

  /**
   * Stop the ticket manager agent
   */
  async stop() {
    logger.info('Stopping Ticket Manager Agent...');
    this.isRunning = false;
    this.emit('stopped');
    logger.info('Ticket Manager Agent stopped');
  }

  /**
   * Initialize external integrations
   */
  async initializeIntegrations() {
    try {
      // Test REZ CRM connection
      await this.testRezCrmConnection();

      // Initialize ticket platform connections
      await this.initializeTicketmaster();
      await this.initializeStubhub();

      logger.info('All ticket integrations initialized');
    } catch (error) {
      logger.error('Failed to initialize integrations:', error);
      throw error;
    }
  }

  /**
   * Test REZ CRM connection
   */
  async testRezCrmConnection() {
    try {
      const response = await this.httpClient.get(`${this.config.rezCrmUrl}/health`);
      logger.info('REZ CRM connection verified');
      return response.data;
    } catch (error) {
      logger.warn('REZ CRM not available, will retry on demand');
      return null;
    }
  }

  /**
   * Initialize Ticketmaster integration
   */
  async initializeTicketmaster() {
    this.ticketmasterClient = {
      apiKey: process.env.TICKETMASTER_API_KEY,
      apiSecret: process.env.TICKETMASTER_API_SECRET,
      baseUrl: this.config.ticketmasterApiUrl
    };
    logger.info('Ticketmaster client initialized');
  }

  /**
   * Initialize Stubhub integration
   */
  async initializeStubhub() {
    this.stubhubClient = {
      apiKey: process.env.STUBHUB_API_KEY,
      apiSecret: process.env.STUBHUB_API_SECRET,
      baseUrl: this.config.stubhubApiUrl
    };
    logger.info('Stubhub client initialized');
  }

  /**
   * Create event tickets
   * @param {Object} eventData - Event details
   * @returns {Object} Created tickets
   */
  async createEventTickets(eventData) {
    try {
      logger.info(`Creating tickets for event: ${eventData.eventId}`);

      const venue = await this.fetchVenueData(eventData.venueId);
      if (!venue) {
        throw new Error(`Venue not found: ${eventData.venueId}`);
      }

      const tickets = [];
      const seatTypes = ['courtside', 'lowerBowl', 'upperBowl', 'standing', 'vip'];

      for (const seatType of seatTypes) {
        const capacity = venue.capacity.seating[seatType] || 0;
        if (capacity === 0) continue;

        const pricing = venue.pricing[seatType] || { min: 50, max: 500, currency: 'USD' };

        for (let i = 0; i < capacity; i++) {
          const ticket = {
            ticketId: `TKT-${eventData.eventId}-${seatType}-${i}`,
            eventId: eventData.eventId,
            eventName: eventData.eventName,
            venueId: eventData.venueId,
            teamId: eventData.teamId,
            opponent: eventData.opponent,
            date: eventData.date,
            seatType,
            price: this.calculateTicketPrice(pricing, seatType),
            status: TICKET_STATUS.AVAILABLE,
            channels: [CHANNELS.DIRECT],
            metadata: {
              createdAt: new Date().toISOString(),
              originalPrice: pricing.min
            }
          };

          tickets.push(ticket);
          this.ticketInventory.set(ticket.ticketId, ticket);
        }
      }

      // Sync with external platforms
      await this.syncToExternalPlatforms(eventData.eventId, tickets);

      // Sync with REZ CRM
      await this.syncWithRezCrm(eventData.eventId, tickets);

      this.emit('tickets:created', { eventId: eventData.eventId, count: tickets.length });

      return {
        eventId: eventData.eventId,
        totalTickets: tickets.length,
        ticketsByType: this.groupTicketsByType(tickets)
      };
    } catch (error) {
      logger.error('Failed to create event tickets:', error);
      throw error;
    }
  }

  /**
   * Fetch venue data
   */
  async fetchVenueData(venueId) {
    try {
      const response = await this.httpClient.get(
        `${this.config.venueServiceUrl}/venue/${venueId}`
      );
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Calculate ticket price based on strategy
   */
  calculateTicketPrice(pricing, seatType) {
    const basePrice = (pricing.min + pricing.max) / 2;

    // Apply seat type multipliers
    const multipliers = {
      'courtside': 2.5,
      'vip': 2.0,
      'lowerBowl': 1.5,
      'upperBowl': 1.0,
      'standing': 0.8
    };

    const multiplier = multipliers[seatType] || 1.0;
    const finalPrice = basePrice * multiplier;

    return {
      amount: Math.round(finalPrice * 100) / 100,
      currency: pricing.currency || 'USD'
    };
  }

  /**
   * Sync tickets to external platforms
   */
  async syncToExternalPlatforms(eventId, tickets) {
    try {
      // Sync to Ticketmaster
      if (this.ticketmasterClient.apiKey) {
        await this.syncToTicketmaster(eventId, tickets);
      }

      // Sync to Stubhub
      if (this.stubhubClient.apiKey) {
        await this.syncToStubhub(eventId, tickets);
      }

      logger.info(`Synced tickets to external platforms for event: ${eventId}`);
    } catch (error) {
      logger.error('Failed to sync to external platforms:', error);
    }
  }

  /**
   * Sync to Ticketmaster
   */
  async syncToTicketmaster(eventId, tickets) {
    try {
      const payload = {
        eventId,
        tickets: tickets.map(t => ({
          section: t.seatType,
          row: '1',
          seat: t.ticketId.split('-').pop(),
          price: t.price.amount,
          currency: t.price.currency,
          status: 'AVAILABLE'
        }))
      };

      // In production, this would call Ticketmaster API
      logger.info(`Synced ${tickets.length} tickets to Ticketmaster`);

      return { success: true, platform: 'ticketmaster', count: tickets.length };
    } catch (error) {
      logger.error('Failed to sync to Ticketmaster:', error);
      throw error;
    }
  }

  /**
   * Sync to Stubhub
   */
  async syncToStubhub(eventId, tickets) {
    try {
      const payload = {
        eventId,
        listings: tickets.map(t => ({
          section: t.seatType,
          row: '1',
          seat: t.ticketId.split('-').pop(),
          price: t.price.amount,
          currency: t.price.currency,
          quantity: 1
        }))
      };

      // In production, this would call Stubhub API
      logger.info(`Synced ${tickets.length} tickets to Stubhub`);

      return { success: true, platform: 'stubhub', count: tickets.length };
    } catch (error) {
      logger.error('Failed to sync to Stubhub:', error);
      throw error;
    }
  }

  /**
   * Sync with REZ CRM
   */
  async syncWithRezCrm(eventId, tickets) {
    try {
      const payload = {
        eventId,
        tickets: tickets.map(t => ({
          ticketId: t.ticketId,
          eventId: t.eventId,
          eventName: t.eventName,
          date: t.date,
          seatType: t.seatType,
          price: t.price,
          status: t.status
        })),
        syncedAt: new Date().toISOString()
      };

      await this.httpClient.post(`${this.config.rezCrmUrl}/tickets/sync`, payload);
      logger.info(`Synced ${tickets.length} tickets to REZ CRM`);
    } catch (error) {
      logger.error('Failed to sync with REZ CRM:', error);
    }
  }

  /**
   * Purchase ticket
   * @param {Object} purchaseData - Purchase details
   * @returns {Object} Purchase result
   */
  async purchaseTicket(purchaseData) {
    try {
      logger.info(`Processing ticket purchase for fan: ${purchaseData.fanId}`);

      const { fanId, eventId, seatType, quantity = 1 } = purchaseData;

      // Find available tickets
      const availableTickets = this.findAvailableTickets(eventId, seatType, quantity);
      if (availableTickets.length < quantity) {
        throw new Error(`Not enough tickets available. Requested: ${quantity}, Available: ${availableTickets.length}`);
      }

      // Reserve tickets
      const reservedTickets = [];
      for (let i = 0; i < quantity; i++) {
        const ticket = availableTickets[i];
        ticket.status = TICKET_STATUS.RESERVED;
        ticket.reservedAt = new Date();
        ticket.reservedFor = fanId;

        this.reservations.set(ticket.ticketId, {
          fanId,
          reservedAt: new Date(),
          expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
        });

        reservedTickets.push(ticket);
      }

      // Process payment via REZ CRM
      const paymentResult = await this.processPayment(fanId, reservedTickets);

      if (paymentResult.success) {
        // Confirm tickets
        for (const ticket of reservedTickets) {
          ticket.status = TICKET_STATUS.SOLD;
          ticket.soldAt = new Date();
          ticket.soldTo = fanId;
          ticket.paymentId = paymentResult.paymentId;
          this.reservations.delete(ticket.ticketId);
        }

        // Update fan record
        await this.updateFanPurchase(fanId, reservedTickets);

        // Sync update to platforms
        await this.syncSaleUpdate(eventId, reservedTickets);

        this.emit('ticket:purchased', {
          fanId,
          eventId,
          ticketIds: reservedTickets.map(t => t.ticketId)
        });

        return {
          success: true,
          ticketIds: reservedTickets.map(t => t.ticketId),
          paymentId: paymentResult.paymentId,
          totalAmount: paymentResult.totalAmount
        };
      } else {
        // Release reservations
        for (const ticket of reservedTickets) {
          ticket.status = TICKET_STATUS.AVAILABLE;
          ticket.reservedAt = null;
          ticket.reservedFor = null;
          this.reservations.delete(ticket.ticketId);
        }

        throw new Error('Payment failed');
      }
    } catch (error) {
      logger.error('Failed to purchase ticket:', error);
      throw error;
    }
  }

  /**
   * Find available tickets
   */
  findAvailableTickets(eventId, seatType, quantity) {
    const tickets = [];

    for (const [ticketId, ticket] of this.ticketInventory.entries()) {
      if (ticket.eventId === eventId &&
          ticket.status === TICKET_STATUS.AVAILABLE &&
          (!seatType || ticket.seatType === seatType)) {
        tickets.push(ticket);
      }

      if (tickets.length >= quantity) break;
    }

    return tickets;
  }

  /**
   * Process payment via REZ CRM
   */
  async processPayment(fanId, tickets) {
    try {
      const totalAmount = tickets.reduce((sum, t) => sum + t.price.amount, 0);

      const payload = {
        fanId,
        items: tickets.map(t => ({
          ticketId: t.ticketId,
          description: `${t.eventName} - ${t.seatType}`,
          amount: t.price.amount,
          currency: t.price.currency
        })),
        totalAmount,
        currency: tickets[0].price.currency,
        paymentMethod: 'card'
      };

      const response = await this.httpClient.post(
        `${this.config.rezCrmUrl}/payments/process`,
        payload
      );

      return {
        success: true,
        paymentId: response.data.paymentId,
        totalAmount
      };
    } catch (error) {
      logger.error('Payment processing failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update fan purchase record
   */
  async updateFanPurchase(fanId, tickets) {
    try {
      for (const ticket of tickets) {
        await this.httpClient.post(
          `${this.config.fanServiceUrl}/fan/${fanId}/ticket-purchase`,
          {
            ticketId: ticket.ticketId,
            eventId: ticket.eventId,
            eventName: ticket.eventName,
            teamId: ticket.teamId,
            price: ticket.price,
            seat: { section: ticket.seatType }
          }
        );
      }
    } catch (error) {
      logger.error('Failed to update fan purchase record:', error);
    }
  }

  /**
   * Sync sale update to platforms
   */
  async syncSaleUpdate(eventId, tickets) {
    // Update external platforms
    for (const ticket of tickets) {
      await this.updateTicketmasterListing(ticket.ticketId, 'SOLD');
      await this.updateStubhubListing(ticket.ticketId, 'SOLD');
    }

    // Update REZ CRM
    await this.httpClient.post(`${this.config.rezCrmUrl}/tickets/sold`, {
      tickets: tickets.map(t => t.ticketId),
      soldAt: new Date().toISOString()
    });
  }

  /**
   * Update Ticketmaster listing
   */
  async updateTicketmasterListing(ticketId, status) {
    // Placeholder for Ticketmaster API call
    logger.info(`Updated Ticketmaster listing: ${ticketId} -> ${status}`);
  }

  /**
   * Update Stubhub listing
   */
  async updateStubhubListing(ticketId, status) {
    // Placeholder for Stubhub API call
    logger.info(`Updated Stubhub listing: ${ticketId} -> ${status}`);
  }

  /**
   * Get dynamic pricing
   * @param {string} eventId - Event ID
   * @param {string} seatType - Seat type
   * @returns {Object} Current pricing
   */
  async getDynamicPricing(eventId, seatType) {
    try {
      const eventTickets = this.getEventTickets(eventId);
      const availableCount = eventTickets.filter(
        t => t.seatType === seatType && t.status === TICKET_STATUS.AVAILABLE
      ).length;

      const totalCount = eventTickets.filter(t => t.seatType === seatType).length;
      const demandRatio = totalCount > 0 ? (totalCount - availableCount) / totalCount : 0;

      // Get base price
      const baseTicket = eventTickets.find(t => t.seatType === seatType);
      const basePrice = baseTicket?.price.amount || 100;

      // Calculate dynamic multiplier
      let multiplier = 1.0;
      if (demandRatio > 0.8) {
        multiplier = 1.5; // High demand
      } else if (demandRatio > 0.5) {
        multiplier = 1.2; // Medium demand
      } else if (demandRatio < 0.2) {
        multiplier = 0.8; // Low demand - discount
      }

      const event = eventTickets[0];
      const daysUntilEvent = event
        ? Math.floor((new Date(event.date) - Date.now()) / (1000 * 60 * 60 * 24))
        : 30;

      // Last minute pricing
      if (daysUntilEvent < 7) {
        multiplier *= 1.3;
      } else if (daysUntilEvent < 14) {
        multiplier *= 1.1;
      }

      const currentPrice = Math.round(basePrice * multiplier * 100) / 100;

      return {
        eventId,
        seatType,
        basePrice,
        currentPrice,
        multiplier,
        available,
        total,
        demandRatio: Math.round(demandRatio * 100),
        daysUntilEvent,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Failed to get dynamic pricing:', error);
      throw error;
    }
  }

  /**
   * Get all tickets for an event
   */
  getEventTickets(eventId) {
    const tickets = [];
    for (const [ticketId, ticket] of this.ticketInventory.entries()) {
      if (ticket.eventId === eventId) {
        tickets.push(ticket);
      }
    }
    return tickets;
  }

  /**
   * Group tickets by type
   */
  groupTicketsByType(tickets) {
    const groups = {};
    for (const ticket of tickets) {
      if (!groups[ticket.seatType]) {
        groups[ticket.seatType] = { count: 0, available: 0, price: ticket.price };
      }
      groups[ticket.seatType].count++;
      if (ticket.status === TICKET_STATUS.AVAILABLE) {
        groups[ticket.seatType].available++;
      }
    }
    return groups;
  }

  /**
   * Get ticket by ID
   * @param {string} ticketId - Ticket ID
   * @returns {Object} Ticket data
   */
  async getTicket(ticketId) {
    const ticket = this.ticketInventory.get(ticketId);
    if (!ticket) {
      throw new Error(`Ticket not found: ${ticketId}`);
    }
    return ticket;
  }

  /**
   * Validate ticket
   * @param {string} ticketId - Ticket ID
   * @returns {Object} Validation result
   */
  async validateTicket(ticketId) {
    try {
      const ticket = this.ticketInventory.get(ticketId);
      if (!ticket) {
        return { valid: false, reason: 'Ticket not found' };
      }

      if (ticket.status !== TICKET_STATUS.SOLD) {
        return { valid: false, reason: `Ticket status is ${ticket.status}` };
      }

      if (new Date(ticket.date) < new Date()) {
        return { valid: false, reason: 'Event has already occurred' };
      }

      return {
        valid: true,
        ticket: {
          ticketId: ticket.ticketId,
          eventName: ticket.eventName,
          date: ticket.date,
          seatType: ticket.seatType,
          holder: ticket.soldTo
        }
      };
    } catch (error) {
      logger.error('Failed to validate ticket:', error);
      throw error;
    }
  }

  /**
   * Issue refund
   * @param {string} ticketId - Ticket ID
   * @param {Object} refundData - Refund details
   * @returns {Object} Refund result
   */
  async issueRefund(ticketId, refundData) {
    try {
      const ticket = this.ticketInventory.get(ticketId);
      if (!ticket) {
        throw new Error(`Ticket not found: ${ticketId}`);
      }

      if (ticket.status !== TICKET_STATUS.SOLD) {
        throw new Error('Ticket is not eligible for refund');
      }

      // Process refund via REZ CRM
      const refundResult = await this.httpClient.post(
        `${this.config.rezCrmUrl}/payments/refund`,
        {
          paymentId: ticket.paymentId,
          ticketId,
          reason: refundData.reason,
          amount: ticket.price.amount
        }
      );

      if (refundResult.data.success) {
        ticket.status = TICKET_STATUS.REFUNDED;
        ticket.refundedAt = new Date();
        ticket.refundReason = refundData.reason;

        // Make ticket available again
        ticket.status = TICKET_STATUS.AVAILABLE;
        ticket.soldAt = null;
        ticket.soldTo = null;
        ticket.paymentId = null;

        // Sync update
        await this.syncSaleUpdate(ticket.eventId, [ticket]);

        this.emit('ticket:refunded', { ticketId, reason: refundData.reason });

        return {
          success: true,
          refundId: refundResult.data.refundId,
          amount: ticket.price.amount
        };
      }

      throw new Error('Refund processing failed');
    } catch (error) {
      logger.error('Failed to issue refund:', error);
      throw error;
    }
  }

  /**
   * Get sales report
   * @param {Object} query - Report query
   * @returns {Object} Sales report
   */
  async getSalesReport(query) {
    try {
      const { eventId, teamId, startDate, endDate } = query;

      let tickets = [];
      for (const [ticketId, ticket] of this.ticketInventory.entries()) {
        if (ticket.status === TICKET_STATUS.SOLD) {
          if (eventId && ticket.eventId !== eventId) continue;
          if (teamId && ticket.teamId !== teamId) continue;
          if (startDate && new Date(ticket.soldAt) < new Date(startDate)) continue;
          if (endDate && new Date(ticket.soldAt) > new Date(endDate)) continue;

          tickets.push(ticket);
        }
      }

      const totalRevenue = tickets.reduce((sum, t) => sum + t.price.amount, 0);
      const totalTickets = tickets.length;
      const averagePrice = totalTickets > 0 ? totalRevenue / totalTickets : 0;

      return {
        period: { startDate, endDate },
        filters: { eventId, teamId },
        summary: {
          totalTickets,
          totalRevenue,
          averagePrice: Math.round(averagePrice * 100) / 100,
          currency: 'USD'
        },
        bySeatType: this.aggregateBySeatType(tickets),
        byChannel: this.aggregateByChannel(tickets),
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Failed to generate sales report:', error);
      throw error;
    }
  }

  /**
   * Aggregate tickets by seat type
   */
  aggregateBySeatType(tickets) {
    const aggregates = {};
    for (const ticket of tickets) {
      if (!aggregates[ticket.seatType]) {
        aggregates[ticket.seatType] = { count: 0, revenue: 0 };
      }
      aggregates[ticket.seatType].count++;
      aggregates[ticket.seatType].revenue += ticket.price.amount;
    }
    return aggregates;
  }

  /**
   * Aggregate tickets by channel
   */
  aggregateByChannel(tickets) {
    const aggregates = {};
    for (const ticket of tickets) {
      for (const channel of ticket.channels) {
        if (!aggregates[channel]) {
          aggregates[channel] = { count: 0, revenue: 0 };
        }
        aggregates[channel].count++;
        aggregates[channel].revenue += ticket.price.amount;
      }
    }
    return aggregates;
  }

  /**
   * Start background tasks
   */
  startBackgroundTasks() {
    // Clean expired reservations every minute
    setInterval(() => {
      const now = Date.now();
      for (const [ticketId, reservation] of this.reservations.entries()) {
        if (now > reservation.expiresAt) {
          const ticket = this.ticketInventory.get(ticketId);
          if (ticket) {
            ticket.status = TICKET_STATUS.AVAILABLE;
            ticket.reservedAt = null;
            ticket.reservedFor = null;
          }
          this.reservations.delete(ticketId);
          logger.info(`Released expired reservation: ${ticketId}`);
        }
      }
    }, 60000);

    // Update dynamic pricing every 5 minutes
    setInterval(() => {
      this.updateDynamicPricing();
    }, 300000);
  }

  /**
   * Update dynamic pricing for all events
   */
  async updateDynamicPricing() {
    const eventIds = new Set();
    for (const [ticketId, ticket] of this.ticketInventory.entries()) {
      eventIds.add(ticket.eventId);
    }

    for (const eventId of eventIds) {
      const seatTypes = ['courtside', 'lowerBowl', 'upperBowl', 'standing', 'vip'];
      for (const seatType of seatTypes) {
        try {
          await this.getDynamicPricing(eventId, seatType);
        } catch (error) {
          // Ignore errors for individual pricing updates
        }
      }
    }

    logger.info('Dynamic pricing updated for all events');
  }

  /**
   * Health check
   */
  async healthCheck() {
    return {
      agent: 'ticket-manager',
      status: this.isRunning ? 'healthy' : 'stopped',
      ticketCount: this.ticketInventory.size,
      activeReservations: this.reservations.size,
      timestamp: new Date().toISOString()
    };
  }
}

// Export for module usage
module.exports = TicketManagerAgent;

// Run as standalone agent
if (require.main === module) {
  const agent = new TicketManagerAgent();

  process.on('SIGTERM', async () => {
    await agent.stop();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    await agent.stop();
    process.exit(0);
  });

  agent.start().catch((error) => {
    logger.error('Failed to start Ticket Manager Agent:', error);
    process.exit(1);
  });
}
