/**
 * Fan Twin Service
 * Manages fan profiles, preferences, and engagement data
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

// Fan Schema
const fanSchema = new mongoose.Schema({
  fanId: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true, unique: true },
  firstName: String,
  lastName: String,
  phone: String,
  dateOfBirth: Date,
  gender: String,
  location: {
    city: String,
    state: String,
    country: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  preferences: {
    favoriteTeams: [{ type: String }],
    favoriteSports: [{ type: String }],
    favoritePlayers: [{ type: String }],
    preferredSeats: {
      section: String,
      row: String,
      seatType: { type: String, enum: ['courtside', 'lower-bowl', 'upper-bowl', 'standing'] }
    },
    notificationChannels: [{ type: String, enum: ['email', 'sms', 'push', 'whatsapp'] }],
    marketingOptIn: { type: Boolean, default: true }
  },
  engagement: {
    loyaltyTier: { type: String, enum: ['bronze', 'silver', 'gold', 'platinum', 'vip'], default: 'bronze' },
    loyaltyPoints: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    ticketsPurchased: { type: Number, default: 0 },
    gamesAttended: { type: Number, default: 0 },
    lastPurchaseDate: Date,
    lastAttendanceDate: Date,
    favoriteMerchandise: [{ itemId: String, name: String }]
  },
  socialConnections: {
    facebook: String,
    twitter: String,
    instagram: String,
    linkedIn: String
  },
  ticketHistory: [{
    ticketId: String,
    eventId: String,
    eventName: String,
    teamId: String,
    purchaseDate: Date,
    price: { amount: Number, currency: String },
    seat: { section: String, row: String, seat: String },
    status: { type: String, enum: ['purchased', 'used', 'cancelled', 'refunded'] }
  }],
  interactions: [{
    type: { type: String, enum: ['view', 'click', 'purchase', 'attendance', 'social', 'survey'] },
    targetId: String,
    targetType: String,
    timestamp: Date,
    metadata: mongoose.Schema.Types.Mixed
  }],
  analytics: {
    engagementScore: { type: Number, default: 0 },
    sentimentScore: { type: Number, default: 0 },
    churnRisk: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
    lifetimeValue: { type: Number, default: 0 }
  },
  metadata: {
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    version: { type: Number, default: 1 },
    source: { type: String, default: 'direct' }
  }
});

// Indexes
fanSchema.index({ email: 1 });
fanSchema.index({ 'preferences.favoriteTeams': 1 });
fanSchema.index({ 'engagement.loyaltyTier': 1 });
fanSchema.index({ 'analytics.churnRisk': 1 });
fanSchema.index({ 'analytics.engagementScore': -1 });

class FanTwinService extends EventEmitter {
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
      logger.info('Initializing Fan Twin Service...');

      // Connect to MongoDB
      await mongoose.connect(this.config.mongodbUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      this.models.Fan = mongoose.model('Fan', fanSchema);

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
      logger.info('Fan Twin Service initialized successfully');

      this.emit('initialized');
      return true;
    } catch (error) {
      logger.error('Failed to initialize Fan Twin Service:', error);
      throw error;
    }
  }

  /**
   * Create a new fan profile
   * @param {Object} fanData - Fan data
   * @returns {Object} Created fan
   */
  async createFan(fanData) {
    try {
      const fanId = fanData.fanId || uuidv4();

      const fan = new this.models.Fan({
        ...fanData,
        fanId,
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          version: 1,
          source: fanData.source || 'direct'
        }
      });

      await fan.save();

      await this.cacheFan(fanId, fan.toObject());

      logger.info(`Fan profile created: ${fanId}`);
      this.emit('fan:created', fan.toObject());

      return fan.toObject();
    } catch (error) {
      logger.error('Failed to create fan profile:', error);
      throw error;
    }
  }

  /**
   * Get fan by ID
   * @param {string} fanId - Fan ID
   * @returns {Object} Fan data
   */
  async getFan(fanId) {
    try {
      const cached = await this.getCachedFan(fanId);
      if (cached) {
        return cached;
      }

      const fan = await this.models.Fan.findOne({ fanId });
      if (!fan) {
        throw new Error(`Fan not found: ${fanId}`);
      }

      await this.cacheFan(fanId, fan.toObject());

      return fan.toObject();
    } catch (error) {
      logger.error(`Failed to get fan ${fanId}:`, error);
      throw error;
    }
  }

  /**
   * Get fan by email
   * @param {string} email - Fan email
   * @returns {Object} Fan data
   */
  async getFanByEmail(email) {
    try {
      const fan = await this.models.Fan.findOne({ email });
      if (!fan) {
        throw new Error(`Fan not found with email: ${email}`);
      }

      return fan.toObject();
    } catch (error) {
      logger.error(`Failed to get fan by email ${email}:`, error);
      throw error;
    }
  }

  /**
   * Update fan preferences
   * @param {string} fanId - Fan ID
   * @param {Object} preferences - Preferences to update
   * @returns {Object} Updated fan
   */
  async updatePreferences(fanId, preferences) {
    try {
      const fan = await this.models.Fan.findOneAndUpdate(
        { fanId },
        {
          $set: {
            preferences: { ...preferences },
            'metadata.updatedAt': new Date()
          }
        },
        { new: true }
      );

      if (!fan) {
        throw new Error(`Fan not found: ${fanId}`);
      }

      await this.invalidateCache(fanId);

      logger.info(`Preferences updated for fan: ${fanId}`);
      this.emit('fan:preferences:updated', { fanId, preferences });

      return fan.toObject();
    } catch (error) {
      logger.error(`Failed to update preferences for ${fanId}:`, error);
      throw error;
    }
  }

  /**
   * Record ticket purchase
   * @param {string} fanId - Fan ID
   * @param {Object} ticketData - Ticket purchase data
   * @returns {Object} Updated fan
   */
  async recordTicketPurchase(fanId, ticketData) {
    try {
      const fan = await this.models.Fan.findOne({ fanId });
      if (!fan) {
        throw new Error(`Fan not found: ${fanId}`);
      }

      const ticketId = ticketData.ticketId || uuidv4();

      // Add to ticket history
      fan.ticketHistory.push({
        ticketId,
        eventId: ticketData.eventId,
        eventName: ticketData.eventName,
        teamId: ticketData.teamId,
        purchaseDate: new Date(),
        price: ticketData.price,
        seat: ticketData.seat,
        status: 'purchased'
      });

      // Update engagement metrics
      fan.engagement.ticketsPurchased += 1;
      fan.engagement.totalSpent += ticketData.price.amount;
      fan.engagement.lastPurchaseDate = new Date();

      // Award loyalty points
      const pointsEarned = Math.floor(ticketData.price.amount);
      fan.engagement.loyaltyPoints += pointsEarned;

      // Update loyalty tier
      fan.engagement.loyaltyTier = this.calculateLoyaltyTier(fan.engagement.loyaltyPoints);

      // Record interaction
      fan.interactions.push({
        type: 'purchase',
        targetId: ticketId,
        targetType: 'ticket',
        timestamp: new Date(),
        metadata: { amount: ticketData.price.amount }
      });

      fan.metadata.updatedAt = new Date();
      fan.metadata.version += 1;

      await fan.save();
      await this.invalidateCache(fanId);

      logger.info(`Ticket purchase recorded for fan: ${fanId}`);
      this.emit('fan:ticket:purchased', { fanId, ticketId, pointsEarned });

      return fan.toObject();
    } catch (error) {
      logger.error(`Failed to record ticket purchase for ${fanId}:`, error);
      throw error;
    }
  }

  /**
   * Record game attendance
   * @param {string} fanId - Fan ID
   * @param {Object} attendanceData - Attendance data
   * @returns {Object} Updated fan
   */
  async recordAttendance(fanId, attendanceData) {
    try {
      const fan = await this.models.Fan.findOne({ fanId });
      if (!fan) {
        throw new Error(`Fan not found: ${fanId}`);
      }

      // Update ticket status to used
      const ticket = fan.ticketHistory.find(t => t.ticketId === attendanceData.ticketId);
      if (ticket) {
        ticket.status = 'used';
      }

      // Update engagement metrics
      fan.engagement.gamesAttended += 1;
      fan.engagement.lastAttendanceDate = new Date();

      // Award attendance points
      fan.engagement.loyaltyPoints += 50;
      fan.engagement.loyaltyTier = this.calculateLoyaltyTier(fan.engagement.loyaltyPoints);

      // Record interaction
      fan.interactions.push({
        type: 'attendance',
        targetId: attendanceData.eventId,
        targetType: 'event',
        timestamp: new Date()
      });

      fan.metadata.updatedAt = new Date();
      await fan.save();
      await this.invalidateCache(fanId);

      logger.info(`Attendance recorded for fan: ${fanId}`);
      this.emit('fan:attendance:recorded', { fanId, eventId: attendanceData.eventId });

      return fan.toObject();
    } catch (error) {
      logger.error(`Failed to record attendance for ${fanId}:`, error);
      throw error;
    }
  }

  /**
   * Record interaction
   * @param {string} fanId - Fan ID
   * @param {Object} interactionData - Interaction data
   * @returns {Object} Updated fan
   */
  async recordInteraction(fanId, interactionData) {
    try {
      const fan = await this.models.Fan.findOne({ fanId });
      if (!fan) {
        throw new Error(`Fan not found: ${fanId}`);
      }

      fan.interactions.push({
        type: interactionData.type,
        targetId: interactionData.targetId,
        targetType: interactionData.targetType,
        timestamp: new Date(),
        metadata: interactionData.metadata
      });

      // Update engagement score
      fan.analytics.engagementScore = this.calculateEngagementScore(fan);

      fan.metadata.updatedAt = new Date();
      await fan.save();
      await this.invalidateCache(fanId);

      logger.info(`Interaction recorded for fan: ${fanId}`);
      this.emit('fan:interaction:recorded', { fanId, type: interactionData.type });

      return fan.toObject();
    } catch (error) {
      logger.error(`Failed to record interaction for ${fanId}:`, error);
      throw error;
    }
  }

  /**
   * Get fans by team
   * @param {string} teamId - Team ID
   * @returns {Array} List of fans
   */
  async getFansByTeam(teamId) {
    try {
      const cacheKey = `team:${teamId}:fans`;
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const fans = await this.models.Fan.find({
        'preferences.favoriteTeams': teamId
      });

      const result = fans.map(f => f.toObject());
      await this.redis.setex(cacheKey, 300, JSON.stringify(result));

      return result;
    } catch (error) {
      logger.error(`Failed to get fans for team ${teamId}:`, error);
      throw error;
    }
  }

  /**
   * Get high-value fans
   * @param {number} limit - Number of fans to return
   * @returns {Array} High-value fans
   */
  async getHighValueFans(limit = 100) {
    try {
      const fans = await this.models.Fan.find({})
        .sort({ 'analytics.lifetimeValue': -1 })
        .limit(limit);

      return fans.map(f => ({
        fanId: f.fanId,
        name: `${f.firstName} ${f.lastName}`,
        email: f.email,
        loyaltyTier: f.engagement.loyaltyTier,
        lifetimeValue: f.analytics.lifetimeValue,
        totalSpent: f.engagement.totalSpent
      }));
    } catch (error) {
      logger.error('Failed to get high-value fans:', error);
      throw error;
    }
  }

  /**
   * Get fans at churn risk
   * @param {string} riskLevel - Risk level
   * @returns {Array} Fans at risk
   */
  async getFansAtRisk(riskLevel = 'high') {
    try {
      const fans = await this.models.Fan.find({
        'analytics.churnRisk': riskLevel
      });

      return fans.map(f => f.toObject());
    } catch (error) {
      logger.error('Failed to get fans at risk:', error);
      throw error;
    }
  }

  /**
   * Calculate loyalty tier based on points
   */
  calculateLoyaltyTier(points) {
    if (points >= 10000) return 'vip';
    if (points >= 5000) return 'platinum';
    if (points >= 2000) return 'gold';
    if (points >= 500) return 'silver';
    return 'bronze';
  }

  /**
   * Calculate engagement score
   */
  calculateEngagementScore(fan) {
    let score = 0;

    // Weight factors
    score += fan.engagement.ticketsPurchased * 10;
    score += fan.engagement.gamesAttended * 5;
    score += fan.interactions.length * 2;

    // Recency factor
    const daysSinceLastActivity = fan.metadata.updatedAt
      ? Math.floor((Date.now() - new Date(fan.metadata.updatedAt)) / (1000 * 60 * 60 * 24))
      : 0;
    score -= daysSinceLastActivity * 0.5;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Update analytics
   * @param {string} fanId - Fan ID
   * @param {Object} analytics - Analytics data
   * @returns {Object} Updated fan
   */
  async updateAnalytics(fanId, analytics) {
    try {
      const fan = await this.models.Fan.findOneAndUpdate(
        { fanId },
        {
          $set: {
            analytics: { ...fan.analytics, ...analytics },
            'metadata.updatedAt': new Date()
          }
        },
        { new: true }
      );

      if (!fan) {
        throw new Error(`Fan not found: ${fanId}`);
      }

      await this.invalidateCache(fanId);

      logger.info(`Analytics updated for fan: ${fanId}`);
      this.emit('fan:analytics:updated', { fanId, analytics });

      return fan.toObject();
    } catch (error) {
      logger.error(`Failed to update analytics for ${fanId}:`, error);
      throw error;
    }
  }

  /**
   * Cache fan data
   */
  async cacheFan(fanId, data) {
    const cacheKey = `fan:${fanId}`;
    await this.redis.setex(cacheKey, this.config.cacheTTL, JSON.stringify(data));
  }

  /**
   * Get cached fan
   */
  async getCachedFan(fanId) {
    const cacheKey = `fan:${fanId}`;
    const cached = await this.redis.get(cacheKey);
    return cached ? JSON.parse(cached) : null;
  }

  /**
   * Invalidate fan cache
   */
  async invalidateCache(fanId) {
    const cacheKey = `fan:${fanId}`;
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
        service: 'fan-twin-service',
        status: mongoStatus === 'connected' && redisStatus === 'ready' ? 'healthy' : 'degraded',
        mongodb: mongoStatus,
        redis: redisStatus,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Health check failed:', error);
      return {
        service: 'fan-twin-service',
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
    logger.info('Shutting down Fan Twin Service...');

    try {
      await mongoose.disconnect();
      if (this.redis) {
        this.redis.disconnect();
      }
      this.isConnected = false;
      logger.info('Fan Twin Service shut down successfully');
    } catch (error) {
      logger.error('Error during shutdown:', error);
      throw error;
    }
  }
}

// Export for module usage
module.exports = FanTwinService;

// Run as standalone service
if (require.main === module) {
  const service = new FanTwinService();

  process.on('SIGTERM', async () => {
    await service.shutdown();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    await service.shutdown();
    process.exit(0);
  });

  service.initialize().then(() => {
    const port = process.env.PORT || 3003;
    logger.info(`Fan Twin Service running on port ${port}`);
  }).catch((error) => {
    logger.error('Failed to start service:', error);
    process.exit(1);
  });
}
