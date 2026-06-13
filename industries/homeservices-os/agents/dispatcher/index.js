/**
 * Dispatcher Agent
 * Intelligent job assignment and routing based on technician skills, availability, and location
 */

const EventEmitter = require('events');
const { v4: uuidv4 } = require('uuid');

class DispatcherAgent extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      // Service dependencies - would be injected in production
      jobService: null,
      technicianService: null,
      customerService: null,
      inventoryService: null,

      // Dispatching configuration
      autoAssignEnabled: config.autoAssignEnabled ?? true,
      considerDistance: config.considerDistance ?? true,
      considerSkillLevel: config.considerSkillLevel ?? true,
      considerWorkload: config.considerWorkload ?? true,
      maxDistanceMiles: config.maxDistanceMiles || 50,

      // Retry configuration
      maxRetryAttempts: config.maxRetryAttempts || 3,
      retryDelayMs: config.retryDelayMs || 5000
    };

    this.dispatchHistory = new Map();
    this.pendingJobs = new Map();
    this.activeAssignments = new Map();
    this.logger = this.createLogger();
  }

  createLogger() {
    return {
      info: (msg, meta = {}) => console.log(`[${new Date().toISOString()}] INFO: [Dispatcher] ${msg}`, meta),
      error: (msg, meta = {}) => console.error(`[${new Date().toISOString()}] ERROR: [Dispatcher] ${msg}`, meta),
      warn: (msg, meta = {}) => console.warn(`[${new Date().toISOString()}] WARN: [Dispatcher] ${msg}`, meta),
      debug: (msg, meta = {}) => console.debug(`[${new Date().toISOString()}] DEBUG: [Dispatcher] ${msg}`, meta)
    };
  }

  /**
   * Initialize the dispatcher
   */
  async initialize() {
    this.logger.info('Initializing Dispatcher Agent');

    // Subscribe to job events
    if (this.config.jobService) {
      this.config.jobService.on('job:created', (job) => this.handleNewJob(job));
      this.config.jobService.on('job:quote:needed', (data) => this.handleQuoteNeeded(data));
    }

    this.logger.info('Dispatcher Agent initialized successfully');
    return { success: true, agent: 'DispatcherAgent' };
  }

  /**
   * Handle new job creation
   */
  async handleNewJob(job) {
    this.logger.info('New job received for dispatch', { jobId: job.id, serviceType: job.serviceType });

    this.pendingJobs.set(job.id, {
      job,
      receivedAt: new Date().toISOString(),
      attempts: 0
    });

    if (this.config.autoAssignEnabled) {
      await this.attemptDispatch(job.id);
    }
  }

  /**
   * Handle quote needed event
   */
  async handleQuoteNeeded(data) {
    this.logger.info('Quote needed for job', { jobId: data.jobId });
    this.emit('quote:requested', data);
  }

  /**
   * Main dispatch logic - find best technician for job
   */
  async dispatchJob(jobId, options = {}) {
    const job = options.job || await this.config.jobService?.getJob(jobId);
    if (!job) {
      throw new Error(`Job not found: ${jobId}`);
    }

    this.logger.info('Starting dispatch for job', { jobId, serviceType: job.serviceType });

    // Get customer and property details
    const customer = await this.config.customerService?.getCustomer(job.customerId);
    const property = customer?.properties?.find(p => p.id === job.propertyId);

    // Find available technicians
    const availableTechnicians = await this.findBestTechnicians({
      job,
      customer,
      property,
      options
    });

    if (availableTechnicians.length === 0) {
      this.logger.warn('No available technicians for job', { jobId });
      await this.handleNoTechnicianAvailable(jobId);
      return { success: false, reason: 'no_technicians_available' };
    }

    // Select best technician based on scoring
    const selectedTechnician = this.selectBestTechnician(availableTechnicians, job);

    // Create assignment
    const assignment = await this.createAssignment(job, selectedTechnician, availableTechnicians);

    this.pendingJobs.delete(jobId);
    this.activeAssignments.set(assignment.id, assignment);

    this.logger.info('Job dispatched successfully', {
      jobId,
      technicianId: selectedTechnician.id,
      technicianName: `${selectedTechnician.firstName} ${selectedTechnician.lastName}`,
      score: selectedTechnician.matchScore
    });

    this.emit('job:dispatched', assignment);

    return {
      success: true,
      assignment,
      technician: selectedTechnician,
      alternatives: availableTechnicians.slice(1, 4)
    };
  }

  /**
   * Find best technicians for a job
   */
  async findBestTechnicians({ job, customer, property, options = {} }) {
    const technicians = await this.config.technicianService?.searchTechnicians({
      status: 'active'
    });

    if (!technicians || technicians.data.length === 0) {
      return [];
    }

    const scoredTechnicians = [];

    for (const tech of technicians.data) {
      const score = await this.scoreTechnician(tech, { job, customer, property });

      if (score.isEligible) {
        scoredTechnicians.push({
          ...tech,
          matchScore: score.total,
          scoreBreakdown: score.breakdown
        });
      }
    }

    // Sort by score descending
    scoredTechnicians.sort((a, b) => b.matchScore - a.matchScore);

    return scoredTechnicians;
  }

  /**
   * Score a technician for a specific job
   */
  async scoreTechnician(technician, { job, customer, property }) {
    const breakdown = {
      skillMatch: 0,
      distance: 0,
      availability: 0,
      workload: 0,
      rating: 0,
      experience: 0
    };

    // Skill match (0-30 points)
    const hasRequiredSkill = await this.checkSkillMatch(technician, job.serviceType);
    breakdown.skillMatch = hasRequiredSkill ? 30 : 0;

    // Distance (0-25 points) - closer is better
    if (this.config.considerDistance && property?.address) {
      const distance = await this.calculateDistance(
        technician.location,
        property.address
      );
      breakdown.distance = this.scoreDistance(distance);
    } else {
      breakdown.distance = 15; // Default if no distance data
    }

    // Availability (0-20 points)
    const availability = await this.config.technicianService?.checkAvailability(
      technician.id,
      { serviceType: job.serviceType, scheduledDate: job.scheduledDate }
    );
    breakdown.availability = availability?.available ? 20 : 0;

    // Workload balance (0-15 points) - prefer less busy technicians
    if (this.config.considerWorkload) {
      const workloadScore = this.scoreWorkload(technician);
      breakdown.workload = workloadScore;
    } else {
      breakdown.workload = 10;
    }

    // Rating (0-10 points)
    breakdown.rating = Math.min((technician.rating || 0) * 2, 10);

    // Experience (0-5 points)
    breakdown.experience = Math.min((technician.totalJobs || 0) / 20, 5);

    const total = Object.values(breakdown).reduce((sum, val) => sum + val, 0);

    return {
      total: Math.round(total * 100) / 100,
      breakdown,
      isEligible: breakdown.skillMatch > 0 && breakdown.availability > 0
    };
  }

  /**
   * Check if technician has required skill
   */
  async checkSkillMatch(technician, serviceType) {
    if (!technician.skills || technician.skills.length === 0) return false;

    const skills = await this.config.technicianService?.getTechnicianSkills(technician.id);
    if (!skills) return false;

    const serviceTypeLower = serviceType.toLowerCase();

    return skills.some(skill => {
      const skillName = skill.name.toLowerCase();
      return (
        skillName.includes(serviceTypeLower) ||
        serviceTypeLower.includes(skillName) ||
        this.areRelatedSkills(skillName, serviceTypeLower)
      );
    });
  }

  /**
   * Check if skills are related
   */
  areRelatedSkills(skill1, skill2) {
    const skillGroups = {
      hvac: ['heating', 'cooling', 'ac', 'air conditioning', 'furnace', 'heat pump'],
      plumbing: ['plumber', 'pipe', 'drain', 'water', 'leak', 'toilet', 'faucet'],
      electrical: ['electric', 'wiring', 'outlet', 'switch', 'panel'],
      appliance: ['appliance', 'washer', 'dryer', 'refrigerator', 'dishwasher'],
      landscaping: ['landscape', 'lawn', 'tree', 'grass', 'gardening'],
      cleaning: ['clean', 'maid', 'janitor'],
      pest: ['pest', 'termite', 'rodent', 'bug'],
      roofing: ['roof', 'shingle', 'gutter'],
      painting: ['paint', 'drywall', 'wall'],
      carpentry: ['carpenter', 'wood', 'framing', 'deck']
    };

    for (const [category, keywords] of Object.entries(skillGroups)) {
      const inGroup1 = keywords.some(k => skill1.includes(k)) || skill1.includes(category);
      const inGroup2 = keywords.some(k => skill2.includes(k)) || skill2.includes(category);
      if (inGroup1 && inGroup2) return true;
    }

    return false;
  }

  /**
   * Calculate distance between two locations
   */
  async calculateDistance(location1, location2) {
    // Haversine formula implementation
    if (!location1?.coordinates || !location2?.coordinates) {
      return null; // Return null if coordinates not available
    }

    const [lon1, lat1] = location1.coordinates;
    const [lon2, lat2] = location2.coordinates;

    const R = 3959; // Earth's radius in miles
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  toRad(deg) {
    return deg * (Math.PI / 180);
  }

  /**
   * Score distance (closer = better)
   */
  scoreDistance(distance) {
    if (distance === null) return 15; // Default if no distance data
    if (distance <= 5) return 25;
    if (distance <= 10) return 22;
    if (distance <= 20) return 18;
    if (distance <= 30) return 14;
    if (distance <= 50) return 10;
    return 5;
  }

  /**
   * Score technician workload
   */
  scoreWorkload(technician) {
    const jobsPerWeek = technician.jobsThisWeek || 0;
    if (jobsPerWeek <= 3) return 15;
    if (jobsPerWeek <= 5) return 12;
    if (jobsPerWeek <= 8) return 8;
    return 4;
  }

  /**
   * Select best technician from scored list
   */
  selectBestTechnician(technicians, job) {
    // For urgent jobs, prioritize availability over other factors
    if (job.priority === 'urgent') {
      const available = technicians.find(t => t.breakdown.availability === 20);
      if (available) return available;
    }

    return technicians[0];
  }

  /**
   * Create assignment record
   */
  async createAssignment(job, technician, alternatives) {
    const assignmentId = uuidv4();
    const assignment = {
      id: assignmentId,
      jobId: job.id,
      customerId: job.customerId,
      technicianId: technician.id,
      technicianName: `${technician.firstName} ${technician.lastName}`,
      status: 'assigned',
      matchScore: technician.matchScore,
      scoreBreakdown: technician.scoreBreakdown,
      alternatives: alternatives.slice(1, 4).map(t => ({
        technicianId: t.id,
        technicianName: `${t.firstName} ${t.lastName}`,
        score: t.matchScore
      })),
      assignedAt: new Date().toISOString(),
      estimatedArrival: await this.estimateArrival(technician, job),
      notes: []
    };

    this.dispatchHistory.set(assignmentId, assignment);

    return assignment;
  }

  /**
   * Estimate arrival time
   */
  async estimateArrival(technician, job) {
    // Simple estimation - in production would use routing API
    const baseTime = 30; // minutes
    return new Date(Date.now() + baseTime * 60 * 1000).toISOString();
  }

  /**
   * Handle no technician available
   */
  async handleNoTechnicianAvailable(jobId) {
    const job = await this.config.jobService?.getJob(jobId);
    if (!job) return;

    // Update job priority to urgent if it wasn't already
    if (job.priority !== 'urgent') {
      await this.config.jobService?.updateJob(jobId, { priority: 'high' });
    }

    // Notify escalation
    this.emit('dispatch:failed', {
      jobId,
      reason: 'no_technicians_available',
      timestamp: new Date().toISOString()
    });

    // Log for manual review
    this.logger.warn('Job requires manual dispatch', { jobId });
  }

  /**
   * Attempt dispatch with retries
   */
  async attemptDispatch(jobId) {
    const pending = this.pendingJobs.get(jobId);
    if (!pending) return;

    try {
      const result = await this.dispatchJob(jobId, { job: pending.job });
      if (!result.success) {
        pending.attempts++;
        if (pending.attempts < this.config.maxRetryAttempts) {
          setTimeout(() => this.attemptDispatch(jobId), this.config.retryDelayMs);
        }
      }
    } catch (error) {
      this.logger.error('Dispatch attempt failed', { jobId, error: error.message });
      pending.attempts++;
    }
  }

  /**
   * Reassign job to different technician
   */
  async reassignJob(jobId, newTechnicianId, reason) {
    const job = await this.config.jobService?.getJob(jobId);
    if (!job) {
      throw new Error(`Job not found: ${jobId}`);
    }

    const previousTechnicianId = job.assignedTechnicianId;

    // Update job assignment
    await this.config.jobService?.assignTechnician(jobId, newTechnicianId, {
      note: `Reassigned: ${reason}`
    });

    // Find replacement if possible
    const alternatives = await this.findBestTechnicians({
      job,
      options: { excludeTechnicianIds: [newTechnicianId] }
    });

    this.emit('job:reassigned', {
      jobId,
      previousTechnicianId,
      newTechnicianId,
      reason,
      alternatives
    });

    this.logger.info('Job reassigned', { jobId, previousTechnicianId, newTechnicianId });

    return { success: true, job, newTechnicianId, alternatives };
  }

  /**
   * Cancel assignment
   */
  async cancelAssignment(assignmentId, reason) {
    const assignment = this.dispatchHistory.get(assignmentId);
    if (!assignment) {
      throw new Error(`Assignment not found: ${assignmentId}`);
    }

    assignment.status = 'cancelled';
    assignment.cancelledAt = new Date().toISOString();
    assignment.cancellationReason = reason;

    this.dispatchHistory.set(assignmentId, assignment);

    this.emit('assignment:cancelled', assignment);

    this.logger.info('Assignment cancelled', { assignmentId, reason });

    return assignment;
  }

  /**
   * Get dispatch analytics
   */
  async getDispatchAnalytics(dateRange = {}) {
    const assignments = Array.from(this.dispatchHistory.values());

    let filtered = assignments;
    if (dateRange.start) {
      filtered = filtered.filter(a => new Date(a.assignedAt) >= new Date(dateRange.start));
    }
    if (dateRange.end) {
      filtered = filtered.filter(a => new Date(a.assignedAt) <= new Date(dateRange.end));
    }

    const avgScore = filtered.length > 0
      ? filtered.reduce((sum, a) => sum + a.matchScore, 0) / filtered.length
      : 0;

    return {
      totalDispatches: filtered.length,
      averageMatchScore: Math.round(avgScore * 100) / 100,
      byStatus: this.groupByStatus(filtered),
      byScoreRange: this.groupByScoreRange(filtered),
      topTechnicians: this.getTopTechnicians(filtered)
    };
  }

  groupByStatus(assignments) {
    const groups = {};
    for (const a of assignments) {
      groups[a.status] = (groups[a.status] || 0) + 1;
    }
    return groups;
  }

  groupByScoreRange(assignments) {
    return {
      excellent: assignments.filter(a => a.matchScore >= 80).length,
      good: assignments.filter(a => a.matchScore >= 60 && a.matchScore < 80).length,
      fair: assignments.filter(a => a.matchScore >= 40 && a.matchScore < 60).length,
      poor: assignments.filter(a => a.matchScore < 40).length
    };
  }

  getTopTechnicians(assignments) {
    const techCounts = {};
    for (const a of assignments) {
      techCounts[a.technicianId] = (techCounts[a.technicianId] || 0) + 1;
    }

    return Object.entries(techCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([techId, count]) => ({ technicianId: techId, assignments: count }));
  }

  /**
   * Get pending jobs
   */
  getPendingJobs() {
    return Array.from(this.pendingJobs.values()).map(p => ({
      jobId: p.job.id,
      serviceType: p.job.serviceType,
      priority: p.job.priority,
      receivedAt: p.receivedAt,
      attempts: p.attempts
    }));
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    this.logger.info('Shutting down Dispatcher Agent');
    this.removeAllListeners();
    return { success: true, agent: 'DispatcherAgent' };
  }
}

module.exports = { DispatcherAgent };
