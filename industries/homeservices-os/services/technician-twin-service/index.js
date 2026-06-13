/**
 * Technician Twin Service
 * Manages technician profiles, skills, certifications, and availability
 * Integrates with Housecall Pro and Jobber via REZ CRM
 */

const EventEmitter = require('events');
const { v4: uuidv4 } = require('uuid');

class TechnicianTwinService extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      port: config.port || 3003,
      crmProvider: config.crmProvider || 'housecallpro',
      apiKeys: {
        housecallpro: config.apiKeys?.housecallpro,
        jobber: config.apiKeys?.jobber
      },
      workingHours: config.workingHours || {
        start: '08:00',
        end: '18:00',
        days: [1, 2, 3, 4, 5] // Monday to Friday
      }
    };

    this.technicians = new Map();
    this.skills = new Map();
    this.certifications = new Map();
    this.availabilities = new Map();
    this.scheduleCache = new Map();
    this.logger = this.createLogger();
  }

  createLogger() {
    return {
      info: (msg, meta = {}) => console.log(`[${new Date().toISOString()}] INFO: ${msg}`, meta),
      error: (msg, meta = {}) => console.error(`[${new Date().toISOString()}] ERROR: ${msg}`, meta),
      warn: (msg, meta = {}) => console.warn(`[${new Date().toISOString()}] WARN: ${msg}`, meta),
      debug: (msg, meta = {}) => console.debug(`[${new Date().toISOString()}] DEBUG: ${msg}`, meta)
    };
  }

  /**
   * Initialize the service
   */
  async initialize() {
    this.logger.info('Initializing Technician Twin Service');
    try {
      await this.syncFromCRM();
      this.setupDefaultSkills();
      this.logger.info('Technician Twin Service initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Technician Twin Service', { error: error.message });
      throw error;
    }
  }

  /**
   * Setup default service skills
   */
  setupDefaultSkills() {
    const defaultSkills = [
      { id: 'hvac', name: 'HVAC', category: 'heating_cooling', description: 'Heating, ventilation, and air conditioning' },
      { id: 'plumbing', name: 'Plumbing', category: 'plumbing', description: 'General plumbing repairs and installation' },
      { id: 'electrical', name: 'Electrical', category: 'electrical', description: 'Electrical repairs and installations' },
      { id: 'appliance', name: 'Appliance Repair', category: 'appliance', description: 'Major appliance repair' },
      { id: 'landscaping', name: 'Landscaping', category: 'outdoor', description: 'Lawn care and landscaping' },
      { id: 'cleaning', name: 'Cleaning', category: 'cleaning', description: 'Residential and commercial cleaning' },
      { id: 'pest_control', name: 'Pest Control', category: 'pest', description: 'Pest identification and treatment' },
      { id: 'roofing', name: 'Roofing', category: 'exterior', description: 'Roof repair and replacement' },
      { id: 'painting', name: 'Painting', category: 'interior', description: 'Interior and exterior painting' },
      { id: 'carpentry', name: 'Carpentry', category: 'construction', description: 'Wood work and repairs' }
    ];

    for (const skill of defaultSkills) {
      this.skills.set(skill.id, skill);
    }
  }

  /**
   * Sync technician data from CRM
   */
  async syncFromCRM() {
    this.logger.info('Syncing technician data from CRM', { provider: this.config.crmProvider });

    try {
      if (this.config.crmProvider === 'housecallpro') {
        await this.syncFromHousecallPro();
      } else if (this.config.crmProvider === 'jobber') {
        await this.syncFromJobber();
      }
      this.emit('sync:complete', { provider: this.config.crmProvider });
    } catch (error) {
      this.emit('sync:error', { error: error.message });
      throw error;
    }
  }

  async syncFromHousecallPro() {
    // Housecall Pro technicians/team members API
    this.logger.info('Housecall Pro technician sync - implement actual API');
  }

  async syncFromJobber() {
    // Jobber team members API
    this.logger.info('Jobber technician sync - implement actual API');
  }

  /**
   * Create a new technician profile
   */
  async createTechnician(technicianData) {
    const technicianId = uuidv4();
    const technician = {
      id: technicianId,
      status: 'active',
      hireDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      skills: [],
      certifications: [],
      serviceAreas: [],
      rating: 0,
      totalJobs: 0,
      completedJobs: 0,
      ...technicianData
    };

    this.validateTechnicianData(technician);
    this.technicians.set(technicianId, technician);

    this.logger.info('Technician created', { technicianId, name: `${technician.firstName} ${technician.lastName}` });
    this.emit('technician:created', technician);

    await this.syncToCRM(technician);

    return technician;
  }

  /**
   * Validate technician data
   */
  validateTechnicianData(technician) {
    if (!technician.firstName || !technician.lastName) {
      throw new Error('First name and last name are required');
    }
    if (!technician.email) {
      throw new Error('Email is required');
    }
    if (!technician.phone) {
      throw new Error('Phone number is required');
    }
  }

  /**
   * Get technician by ID
   */
  async getTechnician(technicianId) {
    return this.technicians.get(technicianId) || null;
  }

  /**
   * Update technician profile
   */
  async updateTechnician(technicianId, updates) {
    const technician = this.technicians.get(technicianId);
    if (!technician) {
      throw new Error(`Technician not found: ${technicianId}`);
    }

    const updatedTechnician = {
      ...technician,
      ...updates,
      id: technicianId,
      updatedAt: new Date().toISOString()
    };

    this.technicians.set(technicianId, updatedTechnician);
    this.logger.info('Technician updated', { technicianId });

    this.emit('technician:updated', updatedTechnician);
    await this.syncToCRM(updatedTechnician);

    return updatedTechnician;
  }

  /**
   * Deactivate technician
   */
  async deactivateTechnician(technicianId, reason = '') {
    const technician = this.technicians.get(technicianId);
    if (!technician) {
      throw new Error(`Technician not found: ${technicianId}`);
    }

    technician.status = 'inactive';
    technician.deactivatedAt = new Date().toISOString();
    technician.deactivationReason = reason;
    this.technicians.set(technicianId, technician);

    this.logger.info('Technician deactivated', { technicianId, reason });
    this.emit('technician:deactivated', { technicianId, reason });

    return technician;
  }

  /**
   * Add skill to technician
   */
  async addSkill(technicianId, skillData) {
    const technician = this.technicians.get(technicianId);
    if (!technician) {
      throw new Error(`Technician not found: ${technicianId}`);
    }

    const skillId = skillData.id || uuidv4();
    const skill = {
      id: skillId,
      technicianId,
      name: skillData.name,
      level: skillData.level || 'intermediate', // beginner, intermediate, advanced, expert
      certified: skillData.certified || false,
      yearsExperience: skillData.yearsExperience || 0,
      acquiredAt: new Date().toISOString(),
      ...skillData
    };

    // Add to skills map
    this.skills.set(skillId, skill);

    // Add skill ID to technician's skills array
    if (!technician.skills.includes(skillId)) {
      technician.skills.push(skillId);
      this.technicians.set(technicianId, technician);
    }

    this.logger.info('Skill added to technician', { technicianId, skillId: skill.name });
    this.emit('technician:skill:added', { technicianId, skill });

    return skill;
  }

  /**
   * Remove skill from technician
   */
  async removeSkill(technicianId, skillId) {
    const technician = this.technicians.get(technicianId);
    if (!technician) {
      throw new Error(`Technician not found: ${technicianId}`);
    }

    technician.skills = technician.skills.filter(s => s !== skillId);
    this.skills.delete(skillId);
    this.technicians.set(technicianId, technician);

    this.logger.info('Skill removed from technician', { technicianId, skillId });
    this.emit('technician:skill:removed', { technicianId, skillId });

    return technician;
  }

  /**
   * Get technician skills with details
   */
  async getTechnicianSkills(technicianId) {
    const technician = this.technicians.get(technicianId);
    if (!technician) {
      throw new Error(`Technician not found: ${technicianId}`);
    }

    return technician.skills.map(skillId => this.skills.get(skillId)).filter(Boolean);
  }

  /**
   * Add certification to technician
   */
  async addCertification(technicianId, certData) {
    const technician = this.technicians.get(technicianId);
    if (!technician) {
      throw new Error(`Technician not found: ${technicianId}`);
    }

    const certId = uuidv4();
    const certification = {
      id: certId,
      technicianId,
      name: certData.name,
      issuer: certData.issuer,
      category: certData.category,
      issuedAt: certData.issuedAt || new Date().toISOString(),
      expiresAt: certData.expiresAt,
      licenseNumber: certData.licenseNumber,
      verified: false,
      ...certData
    };

    this.certifications.set(certId, certification);

    if (!technician.certifications.includes(certId)) {
      technician.certifications.push(certId);
      this.technicians.set(technicianId, technician);
    }

    this.logger.info('Certification added', { technicianId, certName: certData.name });
    this.emit('technician:certification:added', { technicianId, certification });

    return certification;
  }

  /**
   * Get technician certifications
   */
  async getTechnicianCertifications(technicianId) {
    const technician = this.technicians.get(technicianId);
    if (!technician) {
      throw new Error(`Technician not found: ${technicianId}`);
    }

    return technician.certifications.map(certId => this.certifications.get(certId)).filter(Boolean);
  }

  /**
   * Update availability
   */
  async updateAvailability(technicianId, availabilityData) {
    const technician = this.technicians.get(technicianId);
    if (!technician) {
      throw new Error(`Technician not found: ${technicianId}`);
    }

    const availability = {
      technicianId,
      weeklySchedule: availabilityData.weeklySchedule || this.getDefaultWeeklySchedule(),
      exceptions: availabilityData.exceptions || [],
      maxJobsPerDay: availabilityData.maxJobsPerDay || 5,
      updatedAt: new Date().toISOString()
    };

    this.availabilities.set(technicianId, availability);

    this.logger.info('Availability updated', { technicianId });
    this.emit('technician:availability:updated', { technicianId, availability });

    return availability;
  }

  /**
   * Get default weekly schedule
   */
  getDefaultWeeklySchedule() {
    const schedule = {};
    for (const day of this.config.workingHours.days) {
      schedule[day] = {
        available: true,
        start: this.config.workingHours.start,
        end: this.config.workingHours.end,
        breaks: [{ start: '12:00', end: '13:00' }]
      };
    }
    return schedule;
  }

  /**
   * Get availability for specific date
   */
  async getAvailabilityForDate(technicianId, date) {
    const availability = this.availabilities.get(technicianId);
    const dateObj = new Date(date);
    const dayOfWeek = dateObj.getDay();

    // Check for exceptions first
    const dateStr = date.split('T')[0];
    const exception = availability?.exceptions?.find(e => e.date === dateStr);

    if (exception) {
      return {
        available: exception.available,
        reason: exception.reason,
        slots: exception.slots || []
      };
    }

    // Return regular schedule
    const daySchedule = availability?.weeklySchedule?.[dayOfWeek];
    if (!daySchedule || !daySchedule.available) {
      return { available: false, reason: 'Not a working day' };
    }

    return {
      available: true,
      start: daySchedule.start,
      end: daySchedule.end,
      breaks: daySchedule.breaks || []
    };
  }

  /**
   * Add time-off / exception
   */
  async addTimeOff(technicianId, timeOffData) {
    const availability = this.availabilities.get(technicianId) || { technicianId, exceptions: [] };

    const exception = {
      id: uuidv4(),
      type: 'time_off',
      date: timeOffData.date,
      available: false,
      reason: timeOffData.reason || 'Time off',
      wholeDay: timeOffData.wholeDay ?? true,
      startTime: timeOffData.startTime,
      endTime: timeOffData.endTime
    };

    availability.exceptions = availability.exceptions || [];
    availability.exceptions.push(exception);
    this.availabilities.set(technicianId, availability);

    this.logger.info('Time off added', { technicianId, date: timeOffData.date });
    this.emit('technician:timeoff:added', { technicianId, exception });

    return exception;
  }

  /**
   * Check if technician is available for job
   */
  async checkAvailability(technicianId, jobData) {
    const technician = this.technicians.get(technicianId);
    if (!technician) {
      throw new Error(`Technician not found: ${technicianId}`);
    }

    if (technician.status !== 'active') {
      return { available: false, reason: 'Technician is not active' };
    }

    // Check skill match
    const hasSkill = technician.skills.some(skillId => {
      const skill = this.skills.get(skillId);
      return skill && skill.name.toLowerCase().includes(jobData.serviceType?.toLowerCase() || '');
    });

    if (!hasSkill && jobData.serviceType) {
      return { available: false, reason: 'Technician does not have required skill' };
    }

    // Check date availability
    const dateAvailability = await this.getAvailabilityForDate(technicianId, jobData.scheduledDate);
    if (!dateAvailability.available) {
      return { available: false, reason: dateAvailability.reason };
    }

    // Check current workload
    const currentJobs = await this.getScheduledJobsCount(technicianId, jobData.scheduledDate);
    const availability = this.availabilities.get(technicianId);
    const maxJobs = availability?.maxJobsPerDay || 5;

    if (currentJobs >= maxJobs) {
      return { available: false, reason: 'Daily job limit reached' };
    }

    return {
      available: true,
      technician,
      dateAvailability,
      currentJobs,
      maxJobs
    };
  }

  /**
   * Get scheduled jobs count for technician on a date
   */
  async getScheduledJobsCount(technicianId, date) {
    // This would typically query the JobTwinService
    // For now, return 0 as placeholder
    return 0;
  }

  /**
   * Find available technicians for a job
   */
  async findAvailableTechnicians(jobData) {
    const availableTechnicians = [];

    for (const technician of this.technicians.values()) {
      if (technician.status !== 'active') continue;

      const availability = await this.checkAvailability(technicianId, jobData);
      if (availability.available) {
        availableTechnicians.push({
          technician,
          ...availability
        });
      }
    }

    // Sort by rating and distance (if available)
    availableTechnicians.sort((a, b) => {
      const ratingDiff = (b.technician.rating || 0) - (a.technician.rating || 0);
      if (ratingDiff !== 0) return ratingDiff;
      return (a.technician.totalJobs || 0) - (b.technician.totalJobs || 0);
    });

    return {
      data: availableTechnicians,
      total: availableTechnicians.length,
      jobRequirements: {
        serviceType: jobData.serviceType,
        date: jobData.scheduledDate,
        location: jobData.propertyLocation
      }
    };
  }

  /**
   * Update technician performance metrics
   */
  async updatePerformanceMetrics(technicianId, metrics) {
    const technician = this.technicians.get(technicianId);
    if (!technician) {
      throw new Error(`Technician not found: ${technicianId}`);
    }

    technician.totalJobs = metrics.totalJobs ?? technician.totalJobs;
    technician.completedJobs = metrics.completedJobs ?? technician.completedJobs;
    technician.rating = metrics.rating ?? technician.rating;
    technician.averageCompletionTime = metrics.averageCompletionTime;
    technician.onTimeRate = metrics.onTimeRate;

    this.technicians.set(technicianId, technician);

    this.emit('technician:metrics:updated', { technicianId, metrics });

    return technician;
  }

  /**
   * Get technician analytics
   */
  async getTechnicianAnalytics(technicianId, dateRange = {}) {
    const technician = this.technicians.get(technicianId);
    if (!technician) {
      throw new Error(`Technician not found: ${technicianId}`);
    }

    return {
      technicianId,
      performance: {
        totalJobs: technician.totalJobs,
        completedJobs: technician.completedJobs,
        completionRate: technician.totalJobs > 0
          ? technician.completedJobs / technician.totalJobs
          : 0,
        rating: technician.rating,
        averageCompletionTime: technician.averageCompletionTime,
        onTimeRate: technician.onTimeRate
      },
      skills: await this.getTechnicianSkills(technicianId),
      certifications: await this.getTechnicianCertifications(technicianId),
      availability: this.availabilities.get(technicianId)
    };
  }

  /**
   * Search technicians
   */
  async searchTechnicians(criteria = {}) {
    const results = [];

    for (const technician of this.technicians.values()) {
      if (technician.status === 'deleted') continue;

      let match = true;

      if (criteria.status && technician.status !== criteria.status) match = false;
      if (criteria.skill && !technician.skills.some(s => {
        const skill = this.skills.get(s);
        return skill && skill.name.toLowerCase().includes(criteria.skill.toLowerCase());
      })) match = false;

      if (criteria.serviceArea && !technician.serviceAreas?.includes(criteria.serviceArea)) match = false;
      if (criteria.minRating && (technician.rating || 0) < criteria.minRating) match = false;

      if (match) results.push(technician);
    }

    return {
      data: results,
      total: results.length,
      criteria
    };
  }

  /**
   * Get all skills catalog
   */
  async getSkillsCatalog() {
    return Array.from(this.skills.values());
  }

  /**
   * Sync to CRM
   */
  async syncToCRM(technician) {
    try {
      if (this.config.crmProvider === 'housecallpro') {
        this.logger.info('Syncing technician to Housecall Pro', { technicianId: technician.id });
      } else if (this.config.crmProvider === 'jobber') {
        this.logger.info('Syncing technician to Jobber', { technicianId: technician.id });
      }
    } catch (error) {
      this.logger.error('CRM sync failed', { error: error.message });
    }
  }

  /**
   * Start the service
   */
  start() {
    return {
      service: 'TechnicianTwinService',
      status: 'running',
      port: this.config.port,
      technicians: this.technicians.size,
      skills: this.skills.size,
      certifications: this.certifications.size
    };
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    this.logger.info('Shutting down Technician Twin Service');
    this.removeAllListeners();
    return { success: true, service: 'TechnicianTwinService' };
  }
}

module.exports = { TechnicianTwinService };