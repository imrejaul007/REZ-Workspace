/**
 * Customer Retention Agent
 * Follow-up automation, loyalty programs, and customer satisfaction tracking
 */

const EventEmitter = require('events');
const { v4: uuidv4 } = require('uuid');

class CustomerRetentionAgent extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      // Service dependencies
      customerService: null,
      jobService: null,

      // Retention configuration
      followUpDelayHours: config.followUpDelayHours || 24,
      satisfactionSurveyDelay: config.satisfactionSurveyDelay || 48,
      reEngagementThresholdDays: config.reEngagementThresholdDays || 90,
      loyaltyTiers: config.loyaltyTiers || {
        bronze: { minSpend: 0, minJobs: 0, discount: 0, pointsMultiplier: 1 },
        silver: { minSpend: 2000, minJobs: 5, discount: 0.05, pointsMultiplier: 1.5 },
        gold: { minSpend: 5000, minJobs: 10, discount: 0.10, pointsMultiplier: 2 },
        platinum: { minSpend: 10000, minJobs: 20, discount: 0.15, pointsMultiplier: 3 }
      },

      // Notification settings
      emailEnabled: config.emailEnabled ?? true,
      smsEnabled: config.smsEnabled ?? true,
      pushEnabled: config.pushEnabled ?? true
    };

    this.loyaltyPrograms = new Map();
    this.pointsLedger = new Map();
    this.followUpQueue = new Map();
    this.campaigns = new Map();
    this.logger = this.createLogger();
  }

  createLogger() {
    return {
      info: (msg, meta = {}) => console.log(`[${new Date().toISOString()}] INFO: [Retention] ${msg}`, meta),
      error: (msg, meta = {}) => console.error(`[${new Date().toISOString()}] ERROR: [Retention] ${msg}`, meta),
      warn: (msg, meta = {}) => console.warn(`[${new Date().toISOString()}] WARN: [Retention] ${msg}`, meta),
      debug: (msg, meta = {}) => console.debug(`[${new Date().toISOString()}] DEBUG: [Retention] ${msg}`, meta)
    };
  }

  /**
   * Initialize the retention agent
   */
  async initialize() {
    this.logger.info('Initializing Customer Retention Agent');

    // Subscribe to job events
    if (this.config.jobService) {
      this.config.jobService.on('workorder:completed', (workOrder) =>
        this.handleJobCompleted(workOrder)
      );
      this.config.jobService.on('job:status:changed', (data) =>
        this.handleJobStatusChanged(data)
      );
    }

    // Load active campaigns
    await this.loadActiveCampaigns();

    this.logger.info('Customer Retention Agent initialized successfully');
    return { success: true, agent: 'CustomerRetentionAgent' };
  }

  /**
   * Load active campaigns
   */
  async loadActiveCampaigns() {
    // In production, load from database
    const defaultCampaign = {
      id: 'welcome',
      name: 'Welcome Campaign',
      type: 'onboarding',
      enabled: true,
      triggers: ['new_customer'],
      messages: [
        { step: 1, delay: 0, template: 'welcome_email' },
        { step: 2, delay: 72, template: 'getting_started_guide' }
      ]
    };

    this.campaigns.set(defaultCampaign.id, defaultCampaign);
  }

  /**
   * Handle job completion
   */
  async handleJobCompleted(workOrder) {
    this.logger.info('Job completed - initiating retention workflow', {
      workOrderId: workOrder.id,
      jobId: workOrder.jobId
    });

    const job = await this.config.jobService?.getJob(workOrder.jobId);
    if (!job) return;

    // Record service for customer history
    await this.recordServiceCompletion(job, workOrder);

    // Update loyalty points
    await this.updateLoyaltyPoints(job);

    // Schedule follow-up
    await this.scheduleFollowUp(job);

    // Schedule satisfaction survey
    await this.scheduleSatisfactionSurvey(job);

    // Check for re-engagement eligibility
    await this.checkReEngagement(job.customerId);
  }

  /**
   * Handle job status changes
   */
  async handleJobStatusChanged(data) {
    const { jobId, from, to } = data;

    if (to === 'cancelled') {
      await this.handleCancellation(jobId);
    }
  }

  /**
   * Record service completion in customer history
   */
  async recordServiceCompletion(job, workOrder) {
    const customer = await this.config.customerService?.getCustomer(job.customerId);
    if (!customer) return;

    await this.config.customerService?.recordService(job.customerId, {
      serviceType: job.serviceType,
      jobId: job.id,
      technicianId: workOrder.technicianId,
      amount: job.quote?.totalAmount || 0,
      propertyId: job.propertyId,
      completedAt: workOrder.completedAt
    });

    this.logger.info('Service recorded for customer', {
      customerId: job.customerId,
      serviceType: job.serviceType
    });
  }

  /**
   * Update customer loyalty points
   */
  async updateLoyaltyPoints(job) {
    const customer = await this.config.customerService?.getCustomer(job.customerId);
    if (!customer) return;

    const serviceAmount = job.quote?.totalAmount || 0;
    const loyaltyTier = customer.loyaltyTier || 'bronze';
    const tierConfig = this.config.loyaltyTiers[loyaltyTier];

    // Calculate points (1 point per dollar, multiplied by tier bonus)
    const pointsEarned = Math.floor(serviceAmount * tierConfig.pointsMultiplier);

    // Get or create points ledger entry
    let ledger = this.pointsLedger.get(job.customerId) || {
      customerId: job.customerId,
      totalPoints: 0,
      lifetimePoints: 0,
      redeemedPoints: 0,
      transactions: []
    };

    ledger.totalPoints += pointsEarned;
    ledger.lifetimePoints += pointsEarned;
    ledger.transactions.push({
      id: uuidv4(),
      type: 'earned',
      points: pointsEarned,
      jobId: job.id,
      serviceType: job.serviceType,
      timestamp: new Date().toISOString()
    });

    this.pointsLedger.set(job.customerId, ledger);

    // Check for tier upgrade
    await this.checkAndApplyTierUpgrade(customer, ledger);

    // Check for rewards redemption eligibility
    await this.checkRewardEligibility(job.customerId);

    this.emit('loyalty:points:earned', {
      customerId: job.customerId,
      pointsEarned,
      totalPoints: ledger.totalPoints
    });

    this.logger.info('Loyalty points updated', {
      customerId: job.customerId,
      pointsEarned,
      totalPoints: ledger.totalPoints
    });
  }

  /**
   * Check and apply tier upgrade
   */
  async checkAndApplyTierUpgrade(customer, ledger) {
    const currentTier = customer.loyaltyTier || 'bronze';
    let newTier = currentTier;

    for (const [tierName, config] of Object.entries(this.config.loyaltyTiers)) {
      if (ledger.lifetimePoints >= config.minSpend &&
        (customer.totalServices || 0) >= config.minJobs) {
        // Check if this tier is higher than current
        const tierOrder = ['bronze', 'silver', 'gold', 'platinum'];
        if (tierOrder.indexOf(tierName) > tierOrder.indexOf(newTier)) {
          newTier = tierName;
        }
      }
    }

    if (newTier !== currentTier) {
      await this.config.customerService?.updateCustomer(customer.id, {
        loyaltyTier: newTier
      });

      // Send tier upgrade notification
      await this.sendTierUpgradeNotification(customer, newTier);

      this.emit('loyalty:tier:upgraded', {
        customerId: customer.id,
        previousTier: currentTier,
        newTier
      });

      this.logger.info('Customer tier upgraded', {
        customerId: customer.id,
        previousTier: currentTier,
        newTier
      });
    }
  }

  /**
   * Send tier upgrade notification
   */
  async sendTierUpgradeNotification(customer, newTier) {
    const tierConfig = this.config.loyaltyTiers[newTier];

    this.emit('notification:tier:upgraded', {
      customerId: customer.id,
      customerEmail: customer.email,
      customerName: `${customer.firstName} ${customer.lastName}`,
      newTier,
      discount: tierConfig.discount,
      benefits: this.getTierBenefits(newTier)
    });
  }

  /**
   * Get tier benefits
   */
  getTierBenefits(tier) {
    const benefits = {
      bronze: ['Earn 1x points on purchases', 'Birthday reward'],
      silver: ['Earn 1.5x points on purchases', '5% discount on services', 'Priority scheduling'],
      gold: ['Earn 2x points on purchases', '10% discount on services', 'Priority scheduling', 'Free service call'],
      platinum: ['Earn 3x points on purchases', '15% discount on services', 'VIP scheduling', 'Free service call', 'Annual inspection']
    };
    return benefits[tier] || benefits.bronze;
  }

  /**
   * Check reward eligibility
   */
  async checkRewardEligibility(customerId) {
    const ledger = this.pointsLedger.get(customerId);
    if (!ledger) return null;

    const rewards = [];
    const thresholds = [
      { points: 100, reward: '10% off next service', code: 'REWARD10' },
      { points: 250, reward: '$25 credit', code: 'CREDIT25' },
      { points: 500, reward: 'Free service call', code: 'FREECALL' },
      { points: 1000, reward: '$100 credit', code: 'CREDIT100' }
    ];

    for (const threshold of thresholds) {
      if (ledger.lifetimePoints >= threshold.points &&
        !ledger.redeemedRewards?.includes(threshold.code)) {
        rewards.push(threshold);
      }
    }

    if (rewards.length > 0) {
      this.emit('loyalty:reward:available', {
        customerId,
        rewards,
        currentPoints: ledger.totalPoints
      });
    }

    return rewards;
  }

  /**
   * Schedule follow-up
   */
  async scheduleFollowUp(job) {
    const followUpId = uuidv4();
    const scheduledTime = new Date(Date.now() + this.config.followUpDelayHours * 60 * 60 * 1000);

    const followUp = {
      id: followUpId,
      jobId: job.id,
      customerId: job.customerId,
      type: 'follow_up',
      scheduledFor: scheduledTime.toISOString(),
      status: 'pending',
      attempts: 0,
      maxAttempts: 3,
      createdAt: new Date().toISOString()
    };

    this.followUpQueue.set(followUpId, followUp);

    this.emit('followup:scheduled', followUp);

    this.logger.info('Follow-up scheduled', { followUpId, scheduledFor: scheduledTime });

    return followUp;
  }

  /**
   * Schedule satisfaction survey
   */
  async scheduleSatisfactionSurvey(job) {
    const surveyId = uuidv4();
    const scheduledTime = new Date(Date.now() + this.config.satisfactionSurveyDelay * 60 * 60 * 1000);

    const survey = {
      id: surveyId,
      jobId: job.id,
      customerId: job.customerId,
      type: 'satisfaction_survey',
      scheduledFor: scheduledTime.toISOString(),
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    this.followUpQueue.set(surveyId, survey);

    this.emit('survey:scheduled', survey);

    this.logger.info('Satisfaction survey scheduled', { surveyId });

    return survey;
  }

  /**
   * Execute follow-up
   */
  async executeFollowUp(followUpId) {
    const followUp = this.followUpQueue.get(followUpId);
    if (!followUp) {
      throw new Error(`Follow-up not found: ${followUpId}`);
    }

    if (followUp.status !== 'pending') {
      return { success: false, reason: 'Already processed' };
    }

    const customer = await this.config.customerService?.getCustomer(followUp.customerId);
    if (!customer) {
      followUp.status = 'failed';
      followUp.failureReason = 'Customer not found';
      this.followUpQueue.set(followUpId, followUp);
      return { success: false, reason: 'Customer not found' };
    }

    // Send follow-up notification
    const result = await this.sendFollowUpMessage(followUp, customer);

    followUp.attempts++;
    followUp.lastAttempt = new Date().toISOString();

    if (result.success) {
      followUp.status = 'completed';
      followUp.completedAt = new Date().toISOString();
    } else if (followUp.attempts >= followUp.maxAttempts) {
      followUp.status = 'failed';
      followUp.failureReason = 'Max attempts reached';
    } else {
      // Schedule retry
      followUp.nextRetry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    }

    this.followUpQueue.set(followUpId, followUp);
    this.emit('followup:executed', followUp);

    return result;
  }

  /**
   * Send follow-up message
   */
  async sendFollowUpMessage(followUp, customer) {
    const message = {
      to: customer.phone,
      email: customer.email,
      customerName: `${customer.firstName} ${customer.lastName}`,
      type: followUp.type,
      jobId: followUp.jobId,
      sentAt: new Date().toISOString()
    };

    if (this.config.smsEnabled) {
      // Send SMS
      this.emit('notification:sms:followup', message);
    }

    if (this.config.emailEnabled) {
      // Send email
      this.emit('notification:email:followup', message);
    }

    this.logger.info('Follow-up message sent', {
      followUpId: followUp.id,
      customerId: customer.id,
      type: followUp.type
    });

    return { success: true, message };
  }

  /**
   * Record survey response
   */
  async recordSurveyResponse(surveyId, response) {
    const survey = this.followUpQueue.get(surveyId);
    if (!survey) {
      throw new Error(`Survey not found: ${surveyId}`);
    }

    survey.status = 'completed';
    survey.completedAt = new Date().toISOString();
    survey.response = {
      rating: response.rating,
      feedback: response.feedback,
      wouldRecommend: response.wouldRecommend,
      submittedAt: new Date().toISOString()
    };

    this.followUpQueue.set(surveyId, survey);

    // Update customer rating if provided
    if (response.rating) {
      const customer = await this.config.customerService?.getCustomer(survey.customerId);
      if (customer) {
        await this.updateCustomerRating(survey.customerId, response.rating);
      }
    }

    // Check for negative feedback and trigger escalation
    if (response.rating && response.rating < 3) {
      await this.escalateNegativeFeedback(survey, response);
    }

    // Award bonus points for completing survey
    await this.awardSurveyBonusPoints(survey.customerId);

    this.emit('survey:completed', survey);

    this.logger.info('Survey response recorded', {
      surveyId,
      rating: response.rating
    });

    return survey;
  }

  /**
   * Update customer rating
   */
  async updateCustomerRating(customerId, newRating) {
    const customer = await this.config.customerService?.getCustomer(customerId);
    if (!customer) return;

    const currentRatings = customer.ratings || [];
    currentRatings.push(newRating);

    const averageRating = currentRatings.reduce((a, b) => a + b, 0) / currentRatings.length;

    await this.config.customerService?.updateCustomer(customerId, {
      ratings: currentRatings,
      averageRating: Math.round(averageRating * 10) / 10
    });
  }

  /**
   * Escalate negative feedback
   */
  async escalateNegativeFeedback(survey, response) {
    const escalation = {
      id: uuidv4(),
      surveyId: survey.id,
      customerId: survey.customerId,
      jobId: survey.jobId,
      rating: response.rating,
      feedback: response.feedback,
      priority: response.rating === 1 ? 'urgent' : 'high',
      status: 'open',
      assignedTo: null,
      createdAt: new Date().toISOString()
    };

    this.emit('retention:escalation:created', escalation);

    this.logger.warn('Negative feedback escalated', {
      surveyId: survey.id,
      rating: response.rating,
      priority: escalation.priority
    });

    return escalation;
  }

  /**
   * Award bonus points for survey completion
   */
  async awardSurveyBonusPoints(customerId) {
    const bonusPoints = 50;

    let ledger = this.pointsLedger.get(customerId) || {
      customerId,
      totalPoints: 0,
      lifetimePoints: 0,
      redeemedPoints: 0,
      transactions: []
    };

    ledger.totalPoints += bonusPoints;
    ledger.lifetimePoints += bonusPoints;
    ledger.transactions.push({
      id: uuidv4(),
      type: 'bonus',
      points: bonusPoints,
      reason: 'Survey completion bonus',
      timestamp: new Date().toISOString()
    });

    this.pointsLedger.set(customerId, ledger);

    this.logger.info('Survey bonus points awarded', { customerId, bonusPoints });
  }

  /**
   * Check re-engagement eligibility
   */
  async checkReEngagement(customerId) {
    const customer = await this.config.customerService?.getCustomer(customerId);
    if (!customer) return;

    const lastService = customer.lastServiceDate;
    if (!lastService) return;

    const daysSinceLastService = Math.floor(
      (Date.now() - new Date(lastService)) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceLastService >= this.config.reEngagementThresholdDays) {
      // Trigger re-engagement campaign
      await this.triggerReEngagementCampaign(customer);

      this.emit('retention:reengagement:triggered', {
        customerId,
        daysSinceLastService,
        lastServiceDate: lastService
      });
    }
  }

  /**
   * Trigger re-engagement campaign
   */
  async triggerReEngagementCampaign(customer) {
    const campaign = {
      id: uuidv4(),
      type: 're_engagement',
      customerId: customer.id,
      trigger: 'inactivity',
      priority: 'medium',
      messages: [
        {
          channel: 'email',
          template: 'reengagement_email',
          subject: 'We miss you! Here\'s a special offer'
        },
        {
          channel: 'sms',
          template: 'reengagement_sms',
          delay: 24
        }
      ],
      offer: {
        type: 'discount',
        value: 0.15,
        code: `COMEBACK${Date.now().toString().slice(-6)}`,
        expiresIn: 14
      },
      createdAt: new Date().toISOString()
    };

    // Emit campaign triggers
    for (const message of campaign.messages) {
      this.emit(`notification:${message.channel}:${message.template}`, {
        customerId: customer.id,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        customerName: `${customer.firstName} ${customer.lastName}`,
        offer: campaign.offer
      });
    }

    this.emit('campaign:reengagement:triggered', campaign);

    this.logger.info('Re-engagement campaign triggered', {
      customerId: customer.id,
      campaignId: campaign.id
    });

    return campaign;
  }

  /**
   * Handle job cancellation
   */
  async handleCancellation(jobId) {
    const job = await this.config.jobService?.getJob(jobId);
    if (!job) return;

    // Send cancellation follow-up
    await this.sendCancellationFollowUp(job);

    this.logger.info('Cancellation follow-up sent', { jobId });
  }

  /**
   * Send cancellation follow-up
   */
  async sendCancellationFollowUp(job) {
    const customer = await this.config.customerService?.getCustomer(job.customerId);
    if (!customer) return;

    this.emit('notification:email:cancellation_followup', {
      customerId: customer.id,
      customerEmail: customer.email,
      customerName: `${customer.firstName} ${customer.lastName}`,
      jobId: job.id,
      serviceType: job.serviceType
    });
  }

  /**
   * Redeem loyalty points
   */
  async redeemPoints(customerId, points, rewardCode) {
    const ledger = this.pointsLedger.get(customerId);
    if (!ledger) {
      throw new Error('No loyalty account found');
    }

    if (ledger.totalPoints < points) {
      throw new Error(`Insufficient points. Available: ${ledger.totalPoints}, Required: ${points}`);
    }

    ledger.totalPoints -= points;
    ledger.redeemedPoints += points;
    ledger.transactions.push({
      id: uuidv4(),
      type: 'redeemed',
      points: -points,
      rewardCode,
      timestamp: new Date().toISOString()
    });

    if (!ledger.redeemedRewards) {
      ledger.redeemedRewards = [];
    }
    ledger.redeemedRewards.push(rewardCode);

    this.pointsLedger.set(customerId, ledger);

    this.emit('loyalty:points:redeemed', {
      customerId,
      points,
      rewardCode,
      remainingPoints: ledger.totalPoints
    });

    this.logger.info('Points redeemed', { customerId, points, rewardCode });

    return {
      success: true,
      pointsRedeemed: points,
      remainingPoints: ledger.totalPoints,
      rewardCode
    };
  }

  /**
   * Get customer loyalty status
   */
  async getCustomerLoyaltyStatus(customerId) {
    const customer = await this.config.customerService?.getCustomer(customerId);
    const ledger = this.pointsLedger.get(customerId);

    const currentTier = customer?.loyaltyTier || 'bronze';
    const tierConfig = this.config.loyaltyTiers[currentTier];

    // Calculate progress to next tier
    const nextTier = this.getNextTier(currentTier);
    let progressToNextTier = 100;

    if (nextTier) {
      const nextTierConfig = this.config.loyaltyTiers[nextTier];
      const spendProgress = (ledger?.lifetimePoints || 0) / nextTierConfig.minSpend;
      const jobsProgress = (customer?.totalServices || 0) / nextTierConfig.minJobs;
      progressToNextTier = Math.min(spendProgress, jobsProgress) * 100;
    }

    const eligibleRewards = await this.checkRewardEligibility(customerId);

    return {
      customerId,
      currentTier,
      tierBenefits: this.getTierBenefits(currentTier),
      tierDiscount: tierConfig.discount,
      pointsMultiplier: tierConfig.pointsMultiplier,
      totalPoints: ledger?.totalPoints || 0,
      lifetimePoints: ledger?.lifetimePoints || 0,
      redeemedPoints: ledger?.redeemedPoints || 0,
      progressToNextTier: Math.min(progressToNextTier, 100),
      nextTier,
      nextTierRequirements: nextTier ? this.config.loyaltyTiers[nextTier] : null,
      eligibleRewards,
      recentTransactions: ledger?.transactions?.slice(-5).reverse() || []
    };
  }

  /**
   * Get next tier
   */
  getNextTier(currentTier) {
    const tierOrder = ['bronze', 'silver', 'gold', 'platinum'];
    const currentIndex = tierOrder.indexOf(currentTier);
    return tierOrder[currentIndex + 1] || null;
  }

  /**
   * Get retention analytics
   */
  async getRetentionAnalytics(dateRange = {}) {
    const followUps = Array.from(this.followUpQueue.values());
    let filtered = followUps;

    if (dateRange.start) {
      filtered = filtered.filter(f =>
        new Date(f.createdAt) >= new Date(dateRange.start)
      );
    }
    if (dateRange.end) {
      filtered = filtered.filter(f =>
        new Date(f.createdAt) <= new Date(dateRange.end)
      );
    }

    const completedSurveys = filtered.filter(f => f.type === 'satisfaction_survey' && f.status === 'completed');
    const ratings = completedSurveys.map(s => s.response?.rating).filter(r => r);
    const avgRating = ratings.length > 0
      ? ratings.reduce((a, b) => a + b, 0) / ratings.length
      : 0;

    return {
      followUps: {
        total: filtered.length,
        completed: filtered.filter(f => f.status === 'completed').length,
        pending: filtered.filter(f => f.status === 'pending').length,
        failed: filtered.filter(f => f.status === 'failed').length
      },
      surveys: {
        total: completedSurveys.length,
        averageRating: Math.round(avgRating * 10) / 10,
        ratingDistribution: this.getRatingDistribution(ratings),
        npsScore: this.calculateNPS(completedSurveys)
      },
      loyalty: {
        totalMembers: this.pointsLedger.size,
        byTier: this.getTierDistribution()
      },
      dateRange
    };
  }

  getRatingDistribution(ratings) {
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const rating of ratings) {
      distribution[rating] = (distribution[rating] || 0) + 1;
    }
    return distribution;
  }

  calculateNPS(surveys) {
    const promoters = surveys.filter(s => s.response?.rating >= 4).length;
    const detractors = surveys.filter(s => s.response?.rating <= 2).length;

    if (surveys.length === 0) return null;

    return Math.round(((promoters - detractors) / surveys.length) * 100);
  }

  getTierDistribution() {
    const distribution = {};
    for (const [customerId, ledger] of this.pointsLedger) {
      // This would need customer service lookup for actual tier
      distribution.bronze = (distribution.bronze || 0) + 1;
    }
    return distribution;
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    this.logger.info('Shutting down Customer Retention Agent');
    this.removeAllListeners();
    return { success: true, agent: 'CustomerRetentionAgent' };
  }
}

module.exports = { CustomerRetentionAgent };
