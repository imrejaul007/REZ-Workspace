/**
 * Team Twin Service
 * Manages team rosters, schedules, and organizational data
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

// Team Schema
const teamSchema = new mongoose.Schema({
  teamId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  shortName: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  sport: { type: String, required: true },
  league: String,
  division: String,
  founded: Number,
  arena: {
    name: String,
    city: String,
    country: String,
    capacity: Number
  },
  colors: {
    primary: String,
    secondary: String,
    tertiary: String
  },
  logo: String,
  website: String,
  socialMedia: {
    twitter: String,
    instagram: String,
    facebook: String,
    youtube: String
  },
  roster: [{
    athleteId: String,
    position: String,
    jerseyNumber: Number,
    status: { type: String, enum: ['active', 'injured', 'suspended', 'loan', 'transfer'] },
    joinedDate: Date
  }],
  staff: [{
    staffId: String,
    name: String,
    role: String,
    position: String
  }],
  schedule: [{
    matchId: String,
    opponentId: String,
    opponentName: String,
    date: Date,
    venue: String,
    homeAway: { type: String, enum: ['home', 'away'] },
    competition: String,
    status: { type: String, enum: ['scheduled', 'live', 'completed', 'postponed', 'cancelled'] },
    score: {
      team: Number,
      opponent: Number
    }
  }],
  standings: {
    rank: Number,
    played: Number,
    won: Number,
    drawn: Number,
    lost: Number,
    goalsFor: Number,
    goalsAgainst: Number,
    points: Number
  },
  performance: {
    currentForm: [String],
    winRate: Number,
    averageAttendance: Number
  },
  metadata: {
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    version: { type: Number, default: 1 }
  }
});

// Indexes
teamSchema.index({ sport: 1 });
teamSchema.index({ league: 1 });
teamSchema.index({ 'standings.rank': 1 });
teamSchema.index({ slug: 1 });

class TeamTwinService extends EventEmitter {
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
      logger.info('Initializing Team Twin Service...');

      // Connect to MongoDB
      await mongoose.connect(this.config.mongodbUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      this.models.Team = mongoose.model('Team', teamSchema);

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
      logger.info('Team Twin Service initialized successfully');

      this.emit('initialized');
      return true;
    } catch (error) {
      logger.error('Failed to initialize Team Twin Service:', error);
      throw error;
    }
  }

  /**
   * Create a new team
   * @param {Object} teamData - Team data
   * @returns {Object} Created team
   */
  async createTeam(teamData) {
    try {
      const teamId = teamData.teamId || uuidv4();
      const slug = teamData.slug || teamData.name.toLowerCase().replace(/\s+/g, '-');

      const team = new this.models.Team({
        ...teamData,
        teamId,
        slug,
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          version: 1
        }
      });

      await team.save();

      await this.cacheTeam(teamId, team.toObject());

      logger.info(`Team created: ${teamId}`);
      this.emit('team:created', team.toObject());

      return team.toObject();
    } catch (error) {
      logger.error('Failed to create team:', error);
      throw error;
    }
  }

  /**
   * Get team by ID
   * @param {string} teamId - Team ID
   * @returns {Object} Team data
   */
  async getTeam(teamId) {
    try {
      const cached = await this.getCachedTeam(teamId);
      if (cached) {
        return cached;
      }

      const team = await this.models.Team.findOne({ teamId });
      if (!team) {
        throw new Error(`Team not found: ${teamId}`);
      }

      await this.cacheTeam(teamId, team.toObject());

      return team.toObject();
    } catch (error) {
      logger.error(`Failed to get team ${teamId}:`, error);
      throw error;
    }
  }

  /**
   * Get team by slug
   * @param {string} slug - Team slug
   * @returns {Object} Team data
   */
  async getTeamBySlug(slug) {
    try {
      const cacheKey = `team:slug:${slug}`;
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const team = await this.models.Team.findOne({ slug });
      if (!team) {
        throw new Error(`Team not found: ${slug}`);
      }

      await this.redis.setex(cacheKey, this.config.cacheTTL, JSON.stringify(team.toObject()));

      return team.toObject();
    } catch (error) {
      logger.error(`Failed to get team by slug ${slug}:`, error);
      throw error;
    }
  }

  /**
   * Update team roster
   * @param {string} teamId - Team ID
   * @param {Object} rosterUpdate - Roster changes
   * @returns {Object} Updated team
   */
  async updateRoster(teamId, rosterUpdate) {
    try {
      const { action, athleteId, position, jerseyNumber, status } = rosterUpdate;

      const team = await this.models.Team.findOne({ teamId });
      if (!team) {
        throw new Error(`Team not found: ${teamId}`);
      }

      if (action === 'add') {
        const existingAthlete = team.roster.find(r => r.athleteId === athleteId);
        if (existingAthlete) {
          throw new Error(`Athlete ${athleteId} already in roster`);
        }

        team.roster.push({
          athleteId,
          position,
          jerseyNumber,
          status: status || 'active',
          joinedDate: new Date()
        });
      } else if (action === 'remove') {
        team.roster = team.roster.filter(r => r.athleteId !== athleteId);
      } else if (action === 'update') {
        const athlete = team.roster.find(r => r.athleteId === athleteId);
        if (athlete) {
          if (position) athlete.position = position;
          if (jerseyNumber) athlete.jerseyNumber = jerseyNumber;
          if (status) athlete.status = status;
        }
      }

      team.metadata.updatedAt = new Date();
      team.metadata.version += 1;

      await team.save();
      await this.invalidateCache(teamId);

      logger.info(`Roster updated for team: ${teamId}`);
      this.emit('team:roster:updated', { teamId, roster: team.roster });

      return team.toObject();
    } catch (error) {
      logger.error(`Failed to update roster for ${teamId}:`, error);
      throw error;
    }
  }

  /**
   * Add match to schedule
   * @param {string} teamId - Team ID
   * @param {Object} matchData - Match details
   * @returns {Object} Updated team
   */
  async addMatch(teamId, matchData) {
    try {
      const matchId = matchData.matchId || uuidv4();

      const team = await this.models.Team.findOne({ teamId });
      if (!team) {
        throw new Error(`Team not found: ${teamId}`);
      }

      team.schedule.push({
        matchId,
        opponentId: matchData.opponentId,
        opponentName: matchData.opponentName,
        date: matchData.date,
        venue: matchData.venue,
        homeAway: matchData.homeAway,
        competition: matchData.competition,
        status: 'scheduled',
        score: { team: 0, opponent: 0 }
      });

      team.metadata.updatedAt = new Date();
      await team.save();
      await this.invalidateCache(teamId);

      logger.info(`Match added to schedule for team: ${teamId}`);
      this.emit('team:match:added', { teamId, matchId });

      return team.toObject();
    } catch (error) {
      logger.error(`Failed to add match for ${teamId}:`, error);
      throw error;
    }
  }

  /**
   * Update match result
   * @param {string} teamId - Team ID
   * @param {string} matchId - Match ID
   * @param {Object} result - Match result
   * @returns {Object} Updated team
   */
  async updateMatchResult(teamId, matchId, result) {
    try {
      const team = await this.models.Team.findOne({ teamId });
      if (!team) {
        throw new Error(`Team not found: ${teamId}`);
      }

      const match = team.schedule.find(m => m.matchId === matchId);
      if (!match) {
        throw new Error(`Match not found: ${matchId}`);
      }

      match.score = result.score;
      match.status = 'completed';

      // Update standings
      team.standings.played += 1;
      if (result.score.team > result.score.opponent) {
        team.standings.won += 1;
        team.standings.points += 3;
        team.performance.currentForm.push('W');
      } else if (result.score.team < result.score.opponent) {
        team.standings.lost += 1;
        team.performance.currentForm.push('L');
      } else {
        team.standings.drawn += 1;
        team.standings.points += 1;
        team.performance.currentForm.push('D');
      }

      team.standings.goalsFor += result.score.team;
      team.standings.goalsAgainst += result.score.opponent;

      // Keep only last 5 form results
      if (team.performance.currentForm.length > 5) {
        team.performance.currentForm = team.performance.currentForm.slice(-5);
      }

      // Calculate win rate
      team.performance.winRate = (team.standings.won / team.standings.played) * 100;

      team.metadata.updatedAt = new Date();
      team.metadata.version += 1;

      await team.save();
      await this.invalidateCache(teamId);

      logger.info(`Match result updated for team: ${teamId}, match: ${matchId}`);
      this.emit('team:match:completed', { teamId, matchId, result });

      return team.toObject();
    } catch (error) {
      logger.error(`Failed to update match result:`, error);
      throw error;
    }
  }

  /**
   * Get teams by league
   * @param {string} league - League name
   * @returns {Array} List of teams
   */
  async getTeamsByLeague(league) {
    try {
      const cacheKey = `league:${league}:teams`;
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const teams = await this.models.Team.find({ league })
        .sort({ 'standings.rank': 1 });

      const result = teams.map(t => t.toObject());
      await this.redis.setex(cacheKey, 600, JSON.stringify(result));

      return result;
    } catch (error) {
      logger.error(`Failed to get teams for league ${league}:`, error);
      throw error;
    }
  }

  /**
   * Get teams by sport
   * @param {string} sport - Sport type
   * @returns {Array} List of teams
   */
  async getTeamsBySport(sport) {
    try {
      const teams = await this.models.Team.find({ sport })
        .select('teamId name shortName logo colors sport league');

      return teams.map(t => t.toObject());
    } catch (error) {
      logger.error(`Failed to get teams for sport ${sport}:`, error);
      throw error;
    }
  }

  /**
   * Get upcoming matches for team
   * @param {string} teamId - Team ID
   * @param {number} limit - Number of matches
   * @returns {Array} Upcoming matches
   */
  async getUpcomingMatches(teamId, limit = 10) {
    try {
      const team = await this.models.Team.findOne({ teamId });
      if (!team) {
        throw new Error(`Team not found: ${teamId}`);
      }

      const now = new Date();
      const upcoming = team.schedule
        .filter(m => m.status === 'scheduled' && new Date(m.date) > now)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, limit);

      return upcoming;
    } catch (error) {
      logger.error(`Failed to get upcoming matches for ${teamId}:`, error);
      throw error;
    }
  }

  /**
   * Update standings
   * @param {string} teamId - Team ID
   * @param {Object} standings - Standings data
   * @returns {Object} Updated team
   */
  async updateStandings(teamId, standings) {
    try {
      const team = await this.models.Team.findOneAndUpdate(
        { teamId },
        {
          $set: {
            standings,
            'metadata.updatedAt': new Date()
          }
        },
        { new: true }
      );

      if (!team) {
        throw new Error(`Team not found: ${teamId}`);
      }

      await this.invalidateCache(teamId);

      logger.info(`Standings updated for team: ${teamId}`);
      this.emit('team:standings:updated', { teamId, standings });

      return team.toObject();
    } catch (error) {
      logger.error(`Failed to update standings for ${teamId}:`, error);
      throw error;
    }
  }

  /**
   * Cache team data
   */
  async cacheTeam(teamId, data) {
    const cacheKey = `team:${teamId}`;
    await this.redis.setex(cacheKey, this.config.cacheTTL, JSON.stringify(data));
  }

  /**
   * Get cached team
   */
  async getCachedTeam(teamId) {
    const cacheKey = `team:${teamId}`;
    const cached = await this.redis.get(cacheKey);
    return cached ? JSON.parse(cached) : null;
  }

  /**
   * Invalidate team cache
   */
  async invalidateCache(teamId) {
    const cacheKey = `team:${teamId}`;
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
        service: 'team-twin-service',
        status: mongoStatus === 'connected' && redisStatus === 'ready' ? 'healthy' : 'degraded',
        mongodb: mongoStatus,
        redis: redisStatus,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Health check failed:', error);
      return {
        service: 'team-twin-service',
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
    logger.info('Shutting down Team Twin Service...');

    try {
      await mongoose.disconnect();
      if (this.redis) {
        this.redis.disconnect();
      }
      this.isConnected = false;
      logger.info('Team Twin Service shut down successfully');
    } catch (error) {
      logger.error('Error during shutdown:', error);
      throw error;
    }
  }
}

// Export for module usage
module.exports = TeamTwinService;

// Run as standalone service
if (require.main === module) {
  const service = new TeamTwinService();

  process.on('SIGTERM', async () => {
    await service.shutdown();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    await service.shutdown();
    process.exit(0);
  });

  service.initialize().then(() => {
    const port = process.env.PORT || 3002;
    logger.info(`Team Twin Service running on port ${port}`);
  }).catch((error) => {
    logger.error('Failed to start service:', error);
    process.exit(1);
  });
}
