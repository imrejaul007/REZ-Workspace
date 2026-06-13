/**
 * Venue Twin Service
 * Manages stadiums, arenas, capacity, and event scheduling
 * Part of the Sports OS Digital Twin Architecture
 */

const EventEmitter = require('events');
const { v4: uuidv4 } = require('uuid');
const winston = require('winston');
const Redis = require('ioredis');
const mongoose = require('mongoose');

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

// Venue Schema
const venueSchema = new mongoose.Schema({
  venueId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  shortName: String,
  slug: { type: String, required: true, unique: true },
  type: { type: String, enum: ['stadium', 'arena', 'field', 'court', 'track', 'other'], required: true },
  sport: { type: String, required: true },
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    postalCode: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  capacity: {
    total: { type: Number, required: true },
    seating: {
      courtside: { type: Number, default: 0 },
      lowerBowl: { type: Number, default: 0 },
      upperBowl: { type: Number, default: 0 },
      standing: { type: Number, default: 0 },
      vip: { type: Number, default: 0 }
    },
    suites: { type: Number, default: 0 },
    boxes: { type: Number, default: 0 }
  },
  facilities: {
    parking: { type: Boolean, default: false },
    parkingSpaces: Number,
    restrooms: Number,
    concessions: Number,
    merchandiseStores: Number,
    firstAid: Boolean,
    accessibility: Boolean,
    wifi: Boolean,
    airConditioning: Boolean
  },
  operatingHours: {
    monday: { open: String, close: String },
    tuesday: { open: String, close: String },
    wednesday: { open: String, close: String },
    thursday: { open: String, close: String },
    friday: { open: String, close: String },
    saturday: { open: String, close: String },
    sunday: { open: String, close: String }
  },
  pricing: {
    courtside: { min: Number, max: Number, currency: { type: String, default: 'USD' } },
    lowerBowl: { min: Number, max: Number, currency: { type: String, default: 'USD' } },
    upperBowl: { min: Number, max: Number, currency: { type: String, default: 'USD' } },
    standing: { min: Number, max: Number, currency: { type: String, default: 'USD' } },
    vip: { min: Number, max: Number, currency: { type: String, default: 'USD' } },
    suite: { min: Number, max: Number, currency: { type: String, default: 'USD' } }
  },
  images: {
    exterior: [String],
    interior: [String],
    seats: [String]
  },
  teams: [{
    teamId: String,
    teamName: String,
    isPrimary: { type: Boolean, default: false }
  }],
  events: [{
    eventId: String,
    eventName: String,
    eventType: { type: String, enum: ['match', 'concert', 'conference', 'other'] },
    teamId: String,
    opponent: String,
    date: Date,
    endDate: Date,
    status: { type: String, enum: ['scheduled', 'live', 'completed', 'cancelled'] },
    attendance: { type: Number, default: 0 },
    revenue: { amount: Number, currency: String }
  }],
  metrics: {
    averageAttendance: { type: Number, default: 0 },
    occupancyRate: { type: Number, default: 0 },
    revenueYTD: { type: Number, default: 0 },
    eventsThisYear: { type: Number, default: 0 }
  },
  metadata: {
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    version: { type: Number, default: 1 }
  }
});

// Indexes
venueSchema.index({ slug: 1 });
venueSchema.index({ type: 1 });
venueSchema.index({ sport: 1 });
venueSchema.index({ 'address.city': 1 });
venueSchema.index({ 'address.country': 1 });
venueSchema.index({ 'capacity.total': -1 });

class VenueTwinService extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/sports_os',
      redisHost: process.env.REDIS_HOST || 'localhost',
      redisPort: process.env.REDIS_PORT || 6379,
      cacheTTL: config.cacheTTL || 3600,
      ...config
    };

    this.redis = null;
    this.models = {};
    this.isConnected = false;
  }

  /**
   * Initialize database connections
   */
  async initialize() {
    try {
      logger.info('Initializing Venue Twin Service...');

      // Connect to MongoDB
      await mongoose.connect(this.config.mongodbUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      this.models.Venue = mongoose.model('Venue', venueSchema);

      // Connect to Redis
      this.redis = new Redis({
        host: this.config.redisHost,
        port: this.config.redisPort,
        retryStrategy: (times) => Math.min(times * 50, 2000)
      });

      this.redis.on('error', (err) => {
        logger.error('Redis connection error:', err);
      });

      this.isConnected = true;
      logger.info('Venue Twin Service initialized successfully');

      this.emit('initialized');
      return true;
    } catch (error) {
      logger.error('Failed to initialize Venue Twin Service:', error);
      throw error;
    }
  }

  /**
   * Create a new venue
   * @param {Object} venueData - Venue data
   * @returns {Object} Created venue
   */
  async createVenue(venueData) {
    try {
      const venueId = venueData.venueId || uuidv4();
      const slug = venueData.slug || venueData.name.toLowerCase().replace(/\s+/g, '-');

      const venue = new this.models.Venue({
        ...venueData,
        venueId,
        slug,
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          version: 1
        }
      });

      await venue.save();

      await this.cacheVenue(venueId, venue.toObject());

      logger.info(`Venue created: ${venueId}`);
      this.emit('venue:created', venue.toObject());

      return venue.toObject();
    } catch (error) {
      logger.error('Failed to create venue:', error);
      throw error;
    }
  }

  /**
   * Get venue by ID
   * @param {string} venueId - Venue ID
   * @returns {Object} Venue data
   */
  async getVenue(venueId) {
    try {
      const cached = await this.getCachedVenue(venueId);
      if (cached) {
        return cached;
      }

      const venue = await this.models.Venue.findOne({ venueId });
      if (!venue) {
        throw new Error(`Venue not found: ${venueId}`);
      }

      await this.cacheVenue(venueId, venue.toObject());

      return venue.toObject();
    } catch (error) {
      logger.error(`Failed to get venue ${venueId}:`, error);
      throw error;
    }
  }

  /**
   * Get venue by slug
   * @param {string} slug - Venue slug
   * @returns {Object} Venue data
   */
  async getVenueBySlug(slug) {
    try {
      const cacheKey = `venue:slug:${slug}`;
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const venue = await this.models.Venue.findOne({ slug });
      if (!venue) {
        throw new Error(`Venue not found: ${slug}`);
      }

      await this.redis.setex(cacheKey, this.config.cacheTTL, JSON.stringify(venue.toObject()));

      return venue.toObject();
    } catch (error) {
      logger.error(`Failed to get venue by slug ${slug}:`, error);
      throw error;
    }
  }

  /**
   * Add event to venue
   * @param {string} venueId - Venue ID
   * @param {Object} eventData - Event details
   * @returns {Object} Updated venue
   */
  async addEvent(venueId, eventData) {
    try {
      const eventId = eventData.eventId || uuidv4();

      const venue = await this.models.Venue.findOne({ venueId });
      if (!venue) {
        throw new Error(`Venue not found: ${venueId}`);
      }

      // Check for scheduling conflicts
      const conflictingEvent = venue.events.find(e => {
        if (e.status !== 'completed' && e.status !== 'cancelled') {
          const existingStart = new Date(e.date);
          const existingEnd = new Date(e.endDate || e.date);
          const newStart = new Date(eventData.date);
          const newEnd = new Date(eventData.endDate || eventData.date);
          return (newStart < existingEnd && newEnd > existingStart);
        }
        return false;
      });

      if (conflictingEvent) {
        throw new Error(`Scheduling conflict with event: ${conflictingEvent.eventName}`);
      }

      venue.events.push({
        eventId,
        eventName: eventData.eventName,
        eventType: eventData.eventType,
        teamId: eventData.teamId,
        opponent: eventData.opponent,
        date: eventData.date,
        endDate: eventData.endDate,
        status: 'scheduled',
        attendance: 0,
        revenue: { amount: 0, currency: 'USD' }
      });

      venue.metadata.updatedAt = new Date();
      venue.metadata.version += 1;

      await venue.save();
      await this.invalidateCache(venueId);

      logger.info(`Event added to venue: ${venueId}`);
      this.emit('venue:event:added', { venueId, eventId });

      return venue.toObject();
    } catch (error) {
      logger.error(`Failed to add event to venue ${venueId}:`, error);
      throw error;
    }
  }

  /**
   * Update event attendance
   * @param {string} venueId - Venue ID
   * @param {string} eventId - Event ID
   * @param {Object} attendanceData - Attendance data
   * @returns {Object} Updated venue
   */
  async updateEventAttendance(venueId, eventId, attendanceData) {
    try {
      const venue = await this.models.Venue.findOne({ venueId });
      if (!venue) {
        throw new Error(`Venue not found: ${venueId}`);
      }

      const event = venue.events.find(e => e.eventId === eventId);
      if (!event) {
        throw new Error(`Event not found: ${eventId}`);
      }

      event.attendance = attendanceData.attendance;
      if (attendanceData.revenue) {
        event.revenue = attendanceData.revenue;
      }

      // Update venue metrics
      const completedEvents = venue.events.filter(e => e.status === 'completed');
      const totalAttendance = completedEvents.reduce((sum, e) => sum + e.attendance, 0);
      venue.metrics.averageAttendance = totalAttendance / completedEvents.length;
      venue.metrics.occupancyRate = (event.attendance / venue.capacity.total) * 100;

      venue.metadata.updatedAt = new Date();
      await venue.save();
      await this.invalidateCache(venueId);

      logger.info(`Event attendance updated: ${eventId}`);
      this.emit('venue:event:attendance:updated', { venueId, eventId, attendance: event.attendance });

      return venue.toObject();
    } catch (error) {
      logger.error(`Failed to update event attendance:`, error);
      throw error;
    }
  }

  /**
   * Complete event
   * @param {string} venueId - Venue ID
   * @param {string} eventId - Event ID
   * @param {Object} eventData - Final event data
   * @returns {Object} Updated venue
   */
  async completeEvent(venueId, eventId, eventData) {
    try {
      const venue = await this.models.Venue.findOne({ venueId });
      if (!venue) {
        throw new Error(`Venue not found: ${venueId}`);
      }

      const event = venue.events.find(e => e.eventId === eventId);
      if (!event) {
        throw new Error(`Event not found: ${eventId}`);
      }

      event.status = 'completed';
      if (eventData.attendance) event.attendance = eventData.attendance;
      if (eventData.revenue) event.revenue = eventData.revenue;

      // Update venue metrics
      venue.metrics.eventsThisYear += 1;
      venue.metrics.revenueYTD += event.revenue?.amount || 0;

      const completedEvents = venue.events.filter(e => e.status === 'completed');
      const totalAttendance = completedEvents.reduce((sum, e) => sum + e.attendance, 0);
      venue.metrics.averageAttendance = totalAttendance / completedEvents.length;

      venue.metadata.updatedAt = new Date();
      venue.metadata.version += 1;

      await venue.save();
      await this.invalidateCache(venueId);

      logger.info(`Event completed: ${eventId}`);
      this.emit('venue:event:completed', { venueId, eventId });

      return venue.toObject();
    } catch (error) {
      logger.error(`Failed to complete event:`, error);
      throw error;
    }
  }

  /**
   * Get upcoming events at venue
   * @param {string} venueId - Venue ID
   * @param {number} limit - Number of events
   * @returns {Array} Upcoming events
   */
  async getUpcomingEvents(venueId, limit = 10) {
    try {
      const venue = await this.models.Venue.findOne({ venueId });
      if (!venue) {
        throw new Error(`Venue not found: ${venueId}`);
      }

      const now = new Date();
      const upcoming = venue.events
        .filter(e => e.status === 'scheduled' && new Date(e.date) > now)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, limit);

      return upcoming;
    } catch (error) {
      logger.error(`Failed to get upcoming events for venue ${venueId}:`, error);
      throw error;
    }
  }

  /**
   * Get venues by city
   * @param {string} city - City name
   * @returns {Array} List of venues
   */
  async getVenuesByCity(city) {
    try {
      const cacheKey = `city:${city}:venues`;
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const venues = await this.models.Venue.find({
        'address.city': { $regex: city, $options: 'i' }
      });

      const result = venues.map(v => v.toObject());
      await this.redis.setex(cacheKey, 600, JSON.stringify(result));

      return result;
    } catch (error) {
      logger.error(`Failed to get venues in ${city}:`, error);
      throw error;
    }
  }

  /**
   * Get venues by sport
   * @param {string} sport - Sport type
   * @returns {Array} List of venues
   */
  async getVenuesBySport(sport) {
    try {
      const venues = await this.models.Venue.find({ sport })
        .select('venueId name slug type capacity.total address sport');

      return venues.map(v => v.toObject());
    } catch (error) {
      logger.error(`Failed to get venues for sport ${sport}:`, error);
      throw error;
    }
  }

  /**
   * Get available seats for event
   * @param {string} venueId - Venue ID
   * @param {string} eventId - Event ID
   * @param {string} seatType - Seat type
   * @returns {Object} Available seats info
   */
  async getAvailableSeats(venueId, eventId, seatType) {
    try {
      const venue = await this.models.Venue.findOne({ venueId });
      if (!venue) {
        throw new Error(`Venue not found: ${venueId}`);
      }

      const event = venue.events.find(e => e.eventId === eventId);
      if (!event) {
        throw new Error(`Event not found: ${eventId}`);
      }

      const capacity = venue.capacity.seating[seatType] || 0;
      const reservedSeats = await this.getReservedSeats(eventId, seatType);
      const available = capacity - reservedSeats;

      return {
        venueId,
        eventId,
        seatType,
        totalCapacity: capacity,
        reserved: reservedSeats,
        available,
        priceRange: venue.pricing[seatType]
      };
    } catch (error) {
      logger.error(`Failed to get available seats:`, error);
      throw error;
    }
  }

  /**
   * Get reserved seats (placeholder - integrate with ticket service)
   */
  async getReservedSeats(eventId, seatType) {
    // This would integrate with the ticket-manager service
    // For now, return placeholder
    return 0;
  }

  /**
   * Update venue pricing
   * @param {string} venueId - Venue ID
   * @param {Object} pricing - Pricing data
   * @returns {Object} Updated venue
   */
  async updatePricing(venueId, pricing) {
    try {
      const venue = await this.models.Venue.findOneAndUpdate(
        { venueId },
        {
          $set: {
            pricing: { ...venue.pricing, ...pricing },
            'metadata.updatedAt': new Date()
          }
        },
        { new: true }
      );

      if (!venue) {
        throw new Error(`Venue not found: ${venueId}`);
      }

      await this.invalidateCache(venueId);

      logger.info(`Pricing updated for venue: ${venueId}`);
      this.emit('venue:pricing:updated', { venueId, pricing });

      return venue.toObject();
    } catch (error) {
      logger.error(`Failed to update pricing for ${venueId}:`, error);
      throw error;
    }
  }

  /**
   * Get venue metrics
   * @param {string} venueId - Venue ID
   * @returns {Object} Venue metrics
   */
  async getVenueMetrics(venueId) {
    try {
      const venue = await this.models.Venue.findOne({ venueId });
      if (!venue) {
        throw new Error(`Venue not found: ${venueId}`);
      }

      return {
        venueId,
        venueName: venue.name,
        metrics: venue.metrics,
        capacity: venue.capacity,
        totalEvents: venue.events.length,
        upcomingEvents: venue.events.filter(e => e.status === 'scheduled').length
      };
    } catch (error) {
      logger.error(`Failed to get metrics for ${venueId}:`, error);
      throw error;
    }
  }

  /**
   * Cache venue data
   */
  async cacheVenue(venueId, data) {
    const cacheKey = `venue:${venueId}`;
    await this.redis.setex(cacheKey, this.config.cacheTTL, JSON.stringify(data));
  }

  /**
   * Get cached venue
   */
  async getCachedVenue(venueId) {
    const cacheKey = `venue:${venueId}`;
    const cached = await this.redis.get(cacheKey);
    return cached ? JSON.parse(cached) : null;
  }

  /**
   * Invalidate venue cache
   */
  async invalidateCache(venueId) {
    const cacheKey = `venue:${venueId}`;
    await this.redis.del(cacheKey);
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
      const redisStatus = this.redis?.status || 'disconnected';

      return {
        service: 'venue-twin-service',
        status: mongoStatus === 'connected' && redisStatus === 'ready' ? 'healthy' : 'degraded',
        mongodb: mongoStatus,
        redis: redisStatus,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Health check failed:', error);
      return {
        service: 'venue-twin-service',
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    logger.info('Shutting down Venue Twin Service...');

    try {
      await mongoose.disconnect();
      if (this.redis) {
        this.redis.disconnect();
      }
      this.isConnected = false;
      logger.info('Venue Twin Service shut down successfully');
    } catch (error) {
      logger.error('Error during shutdown:', error);
      throw error;
    }
  }
}

// Export for module usage
module.exports = VenueTwinService;

// Run as standalone service
if (require.main === module) {
  const service = new VenueTwinService();

  process.on('SIGTERM', async () => {
    await service.shutdown();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    await service.shutdown();
    process.exit(0);
  });

  service.initialize().then(() => {
    const port = process.env.PORT || 3004;
    logger.info(`Venue Twin Service running on port ${port}`);
  }).catch((error) => {
    logger.error('Failed to start service:', error);
    process.exit(1);
  });
}
