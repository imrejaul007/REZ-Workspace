/**
 * Scout Agent
 * AI-powered player evaluation and recruitment assistant
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

// Evaluation metrics weights
const METRIC_WEIGHTS = {
  technical: 0.30,
  physical: 0.20,
  tactical: 0.25,
  mental: 0.15,
  potential: 0.10
};

class ScoutAgent extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      athleteServiceUrl: process.env.ATHLETE_SERVICE_URL || 'http://localhost:3001',
      teamServiceUrl: process.env.TEAM_SERVICE_URL || 'http://localhost:3002',
      aiEndpoint: process.env.AI_ENDPOINT || 'http://localhost:8080/api/ai',
      cacheTTL: config.cacheTTL || 1800,
      ...config
    };

    this.httpClient = axios.create({
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' }
    });

    this.evaluationCache = new Map();
    this.isRunning = false;
  }

  /**
   * Start the scout agent
   */
  async start() {
    logger.info('Starting Scout Agent...');
    this.isRunning = true;

    // Start background evaluation tasks
    this.startBackgroundTasks();

    this.emit('started');
    logger.info('Scout Agent started successfully');
    return true;
  }

  /**
   * Stop the scout agent
   */
  async stop() {
    logger.info('Stopping Scout Agent...');
    this.isRunning = false;
    this.emit('stopped');
    logger.info('Scout Agent stopped');
  }

  /**
   * Evaluate a player
   * @param {string} athleteId - Athlete ID
   * @param {Object} options - Evaluation options
   * @returns {Object} Evaluation report
   */
  async evaluatePlayer(athleteId, options = {}) {
    try {
      logger.info(`Evaluating player: ${athleteId}`);

      // Fetch athlete data
      const athlete = await this.fetchAthleteData(athleteId);
      if (!athlete) {
        throw new Error(`Athlete not found: ${athleteId}`);
      }

      // Calculate evaluation scores
      const evaluation = await this.calculateEvaluation(athlete, options);

      // Generate detailed report
      const report = {
        athleteId,
        athlete: {
          name: `${athlete.firstName} ${athlete.lastName}`,
          position: athlete.position,
          age: this.calculateAge(athlete.dateOfBirth),
          nationality: athlete.nationality,
          teamId: athlete.contract?.teamId
        },
        evaluation,
        recommendation: this.generateRecommendation(evaluation),
        comparables: options.includeComparables
          ? await this.findComparables(athlete)
          : [],
        projectedDevelopment: this.projectDevelopment(athlete),
        riskAssessment: this.assessRisk(athlete),
        timestamp: new Date().toISOString()
      };

      // Cache evaluation
      this.evaluationCache.set(athleteId, {
        report,
        timestamp: Date.now()
      });

      this.emit('player:evaluated', { athleteId, evaluation });

      return report;
    } catch (error) {
      logger.error(`Failed to evaluate player ${athleteId}:`, error);
      throw error;
    }
  }

  /**
   * Fetch athlete data from service
   */
  async fetchAthleteData(athleteId) {
    try {
      const response = await this.httpClient.get(
        `${this.config.athleteServiceUrl}/athlete/${athleteId}`
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
   * Calculate comprehensive evaluation
   */
  async calculateEvaluation(athlete, options) {
    const { stats, metrics, recentForm } = this.analyzePerformance(athlete);

    // Calculate category scores
    const technicalScore = this.calculateTechnicalScore(stats);
    const physicalScore = this.calculatePhysicalScore(metrics);
    const tacticalScore = this.calculateTacticalScore(athlete);
    const mentalScore = this.calculateMentalScore(athlete, metrics);

    // Calculate overall score
    const overallScore = (
      technicalScore * METRIC_WEIGHTS.technical +
      physicalScore * METRIC_WEIGHTS.physical +
      tacticalScore * METRIC_WEIGHTS.tactical +
      mentalScore * METRIC_WEIGHTS.mental
    );

    // Calculate potential rating
    const potentialRating = this.calculatePotentialRating(athlete);

    // Generate strengths and weaknesses
    const { strengths, weaknesses } = this.identifyStrengthsAndWeaknesses({
      technical: technicalScore,
      physical: physicalScore,
      tactical: tacticalScore,
      mental: mentalScore
    });

    return {
      overall: Math.round(overallScore * 100) / 100,
      breakdown: {
        technical: Math.round(technicalScore * 100) / 100,
        physical: Math.round(physicalScore * 100) / 100,
        tactical: Math.round(tacticalScore * 100) / 100,
        mental: Math.round(mentalScore * 100) / 100,
        potential: potentialRating
      },
      recentForm: recentForm.slice(-5),
      strengths,
      weaknesses,
      marketValue: this.estimateMarketValue(athlete, overallScore),
      salaryRecommendation: this.recommendSalary(athlete, overallScore)
    };
  }

  /**
   * Analyze athlete performance data
   */
  analyzePerformance(athlete) {
    const stats = athlete.stats || {};
    const metrics = athlete.metrics || {};
    const recent = stats.recent || [];

    // Calculate recent form (last 5 matches)
    const recentForm = recent.slice(-5).map(m => m.performance?.rating || 0);

    return { stats, metrics, recentForm };
  }

  /**
   * Calculate technical score
   */
  calculateTechnicalScore(stats) {
    const season = stats.season || {};

    // Weight different stats based on sport
    const goalsPerGame = season.goals / Math.max(season.gamesPlayed, 1);
    const assistsPerGame = season.assists / Math.max(season.gamesPlayed, 1);
    const pointsPerGame = season.points / Math.max(season.gamesPlayed, 1);

    // Normalize to 0-100 scale
    const goalScore = Math.min(goalsPerGame * 25, 40);
    const assistScore = Math.min(assistsPerGame * 30, 30);
    const pointsScore = Math.min(pointsPerGame * 10, 30);

    return (goalScore + assistScore + pointsScore) / 100;
  }

  /**
   * Calculate physical score
   */
  calculatePhysicalScore(metrics) {
    const fitnessLevel = metrics.fitnessLevel || 50;
    const fatigueIndex = metrics.fatigueIndex || 50;
    const injuryHistory = metrics.injuryCount || 0;

    // Fitness contributes 60%, fatigue 25%, injury history 15%
    const fitnessScore = (fitnessLevel / 100) * 0.6;
    const fatigueScore = ((100 - fatigueIndex) / 100) * 0.25;
    const injuryScore = Math.max(0, 1 - injuryHistory * 0.1) * 0.15;

    return Math.min(fitnessScore + fatigueScore + injuryScore, 1);
  }

  /**
   * Calculate tactical score
   */
  calculateTacticalScore(athlete) {
    const season = athlete.stats?.season || {};
    const averageRating = season.averageRating || 5;

    // Use game ratings as proxy for tactical awareness
    // Adjust based on position
    let positionModifier = 1;
    if (athlete.position === 'GK' || athlete.position === 'Goalkeeper') {
      positionModifier = 0.9;
    } else if (athlete.position?.includes('Forward') || athlete.position?.includes('Striker')) {
      positionModifier = 1.1;
    }

    return Math.min((averageRating / 10) * positionModifier, 1);
  }

  /**
   * Calculate mental score
   */
  calculateMentalScore(athlete, metrics) {
    const formRating = metrics.formRating || 5;
    const recentPerformances = athlete.stats?.recent || [];

    // Calculate consistency from recent performances
    const ratings = recentPerformances.slice(-10).map(p => p.performance?.rating || 0);
    const consistency = ratings.length > 1
      ? 1 - (this.calculateStdDev(ratings) / 10)
      : 1;

    // Form contributes 50%, consistency 50%
    const formScore = formRating / 10;
    const consistencyScore = consistency;

    return (formScore + consistencyScore) / 2;
  }

  /**
   * Calculate potential rating
   */
  calculatePotentialRating(athlete) {
    const age = this.calculateAge(athlete.dateOfBirth);
    const currentScore = athlete.metrics?.formRating || 5;
    const peakAge = 27; // Assumed peak performance age

    // Younger players have more potential
    let potentialFactor = 1;
    if (age < 20) {
      potentialFactor = 1.5;
    } else if (age < 24) {
      potentialFactor = 1.3;
    } else if (age < 28) {
      potentialFactor = 1.1;
    } else {
      potentialFactor = 0.9;
    }

    // Potential capped at 100
    return Math.min(currentScore * potentialFactor, 10);
  }

  /**
   * Calculate standard deviation
   */
  calculateStdDev(values) {
    if (values.length === 0) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squareDiffs = values.map(v => Math.pow(v - mean, 2));
    const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / values.length;
    return Math.sqrt(avgSquareDiff);
  }

  /**
   * Generate recommendation
   */
  generateRecommendation(evaluation) {
    const score = evaluation.overall;

    if (score >= 85) {
      return {
        action: 'priority_signing',
        priority: 'high',
        rationale: 'Elite-level talent with exceptional performance metrics'
      };
    } else if (score >= 75) {
      return {
        action: 'recommended_signing',
        priority: 'medium',
        rationale: 'Strong performer with good development potential'
      };
    } else if (score >= 65) {
      return {
        action: 'consider_signing',
        priority: 'low',
        rationale: 'Average performer, evaluate specific needs'
      };
    } else {
      return {
        action: 'not_recommended',
        priority: 'none',
        rationale: 'Below average metrics, not recommended for signing'
      };
    }
  }

  /**
   * Find comparable players
   */
  async findComparables(athlete) {
    // This would search for similar players based on position, age, and stats
    // For now, return placeholder
    return [
      {
        athleteId: 'comp-001',
        name: 'Comparable Player 1',
        similarity: 0.85,
        stats: { goals: 15, assists: 8, rating: 7.5 }
      }
    ];
  }

  /**
   * Project player development
   */
  projectDevelopment(athlete) {
    const age = this.calculateAge(athlete.dateOfBirth);
    const currentForm = athlete.metrics?.formRating || 5;

    const projections = [];
    const peakAge = 27;
    const declineStart = 32;

    for (let year = 0; year <= 5; year++) {
      const futureAge = age + year;
      let projectedRating;

      if (futureAge < peakAge) {
        // Growth phase
        projectedRating = currentForm + (0.2 * (peakAge - futureAge));
      } else if (futureAge < declineStart) {
        // Peak phase
        projectedRating = currentForm;
      } else {
        // Decline phase
        projectedRating = currentForm - (0.15 * (futureAge - declineStart));
      }

      projections.push({
        year,
        age: futureAge,
        projectedRating: Math.min(Math.max(projectedRating, 0), 10)
      });
    }

    return projections;
  }

  /**
   * Assess risk factors
   */
  assessRisk(athlete) {
    const risks = [];
    let riskLevel = 'low';

    // Injury risk
    const recentInjuries = athlete.injuries?.filter(
      i => new Date(i.startDate) > new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
    ) || [];

    if (recentInjuries.length >= 3) {
      risks.push({ type: 'injury', level: 'high', detail: 'Frequent recent injuries' });
      riskLevel = 'high';
    } else if (recentInjuries.length >= 1) {
      risks.push({ type: 'injury', level: 'medium', detail: 'Recent injury history' });
      riskLevel = riskLevel === 'high' ? 'high' : 'medium';
    }

    // Age risk
    const age = this.calculateAge(athlete.dateOfBirth);
    if (age > 33) {
      risks.push({ type: 'age', level: 'medium', detail: 'Approaching retirement age' });
      riskLevel = riskLevel === 'high' ? 'high' : 'medium';
    }

    // Contract risk
    if (!athlete.contract?.endDate) {
      risks.push({ type: 'contract', level: 'low', detail: 'Contract status unclear' });
    }

    // Form risk
    if (athlete.metrics?.formRating < 5) {
      risks.push({ type: 'form', level: 'medium', detail: 'Below average recent form' });
      riskLevel = riskLevel === 'high' ? 'high' : 'medium';
    }

    return { level: riskLevel, factors: risks };
  }

  /**
   * Estimate market value
   */
  estimateMarketValue(athlete, evaluationScore) {
    const baseValue = 1000000; // 1M base
    const positionMultiplier = this.getPositionMultiplier(athlete.position);
    const ageMultiplier = this.getAgeMultiplier(this.calculateAge(athlete.dateOfBirth));
    const leagueMultiplier = athlete.leagueLevel || 1;

    const value = baseValue * evaluationScore * positionMultiplier * ageMultiplier * leagueMultiplier;

    return {
      amount: Math.round(value),
      currency: athlete.contract?.salary?.currency || 'USD',
      confidence: 'medium'
    };
  }

  /**
   * Get position multiplier for market value
   */
  getPositionMultiplier(position) {
    const multipliers = {
      'Forward': 1.5,
      'Striker': 1.5,
      'Midfielder': 1.2,
      'Defender': 1.0,
      'Goalkeeper': 0.8,
      'GK': 0.8
    };
    return multipliers[position] || 1.0;
  }

  /**
   * Get age multiplier for market value
   */
  getAgeMultiplier(age) {
    if (age < 21) return 2.0;
    if (age < 24) return 1.5;
    if (age < 28) return 1.2;
    if (age < 31) return 1.0;
    if (age < 34) return 0.7;
    return 0.4;
  }

  /**
   * Recommend salary range
   */
  recommendSalary(athlete, evaluationScore) {
    const weeklyBase = 5000;
    const weeklySalary = weeklyBase * evaluationScore * 2;

    return {
      weekly: Math.round(weeklySalary),
      annually: Math.round(weeklySalary * 52),
      currency: 'USD',
      recommendation: evaluationScore > 0.8 ? 'premium' : 'standard'
    };
  }

  /**
   * Calculate player age
   */
  calculateAge(dateOfBirth) {
    if (!dateOfBirth) return 25; // Default age
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  /**
   * Identify strengths and weaknesses
   */
  identifyStrengthsAndWeaknesses(scores) {
    const strengths = [];
    const weaknesses = [];

    Object.entries(scores).forEach(([category, score]) => {
      if (score >= 0.8) {
        strengths.push({ category, score: Math.round(score * 100) });
      } else if (score < 0.6) {
        weaknesses.push({ category, score: Math.round(score * 100) });
      }
    });

    return { strengths, weaknesses };
  }

  /**
   * Compare two players
   */
  async comparePlayers(athleteId1, athleteId2) {
    try {
      const [athlete1, athlete2] = await Promise.all([
        this.fetchAthleteData(athleteId1),
        this.fetchAthleteData(athleteId2)
      ]);

      if (!athlete1 || !athlete2) {
        throw new Error('One or both athletes not found');
      }

      const [eval1, eval2] = await Promise.all([
        this.calculateEvaluation(athlete1, {}),
        this.calculateEvaluation(athlete2, {})
      ]);

      const comparison = {
        player1: {
          athleteId: athleteId1,
          name: `${athlete1.firstName} ${athlete1.lastName}`,
          position: athlete1.position,
          evaluation: eval1
        },
        player2: {
          athleteId: athleteId2,
          name: `${athlete2.firstName} ${athlete2.lastName}`,
          position: athlete2.position,
          evaluation: eval2
        },
        differences: {},
        recommendation: this.determineBetterPlayer(eval1, eval2)
      };

      // Calculate differences
      ['technical', 'physical', 'tactical', 'mental'].forEach(category => {
        comparison.differences[category] = {
          player1: eval1.breakdown[category],
          player2: eval2.breakdown[category],
          advantage: eval1.breakdown[category] > eval2.breakdown[category] ? athleteId1 : athleteId2
        };
      });

      return comparison;
    } catch (error) {
      logger.error('Failed to compare players:', error);
      throw error;
    }
  }

  /**
   * Determine better player
   */
  determineBetterPlayer(eval1, eval2) {
    if (eval1.overall > eval2.overall + 5) {
      return { winner: 'player1', margin: eval1.overall - eval2.overall };
    } else if (eval2.overall > eval1.overall + 5) {
      return { winner: 'player2', margin: eval2.overall - eval1.overall };
    } else {
      return { winner: 'tie', margin: Math.abs(eval1.overall - eval2.overall) };
    }
  }

  /**
   * Start background evaluation tasks
   */
  startBackgroundTasks() {
    // Clean cache every hour
    setInterval(() => {
      const now = Date.now();
      for (const [key, value] of this.evaluationCache.entries()) {
        if (now - value.timestamp > this.config.cacheTTL * 1000) {
          this.evaluationCache.delete(key);
        }
      }
      logger.info('Scout Agent cache cleaned');
    }, 3600000); // Every hour
  }

  /**
   * Health check
   */
  async healthCheck() {
    return {
      agent: 'scout-agent',
      status: this.isRunning ? 'healthy' : 'stopped',
      cacheSize: this.evaluationCache.size,
      timestamp: new Date().toISOString()
    };
  }
}

// Export for module usage
module.exports = ScoutAgent;

// Run as standalone agent
if (require.main === module) {
  const agent = new ScoutAgent();

  process.on('SIGTERM', async () => {
    await agent.stop();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    await agent.stop();
    process.exit(0);
  });

  agent.start().catch((error) => {
    logger.error('Failed to start Scout Agent:', error);
    process.exit(1);
  });
}
