/**
 * Job Twin Service
 * Manages service requests, quotes, work orders, and job lifecycle
 * Integrates with Housecall Pro and Jobber via REZ CRM
 */

const EventEmitter = require('events');
const { v4: uuidv4 } = require('uuid');

class JobTwinService extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      port: config.port || 3002,
      crmProvider: config.crmProvider || 'housecallpro',
      apiKeys: {
        housecallpro: config.apiKeys?.housecallpro,
        jobber: config.apiKeys?.jobber
      },
      autoAssignEnabled: config.autoAssignEnabled ?? true,
      quoteValidityDays: config.quoteValidityDays || 30
    };

    this.jobs = new Map();
    this.quotes = new Map();
    this.workOrders = new Map();
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
    this.logger.info('Initializing Job Twin Service');
    try {
      await this.syncFromCRM();
      this.logger.info('Job Twin Service initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Job Twin Service', { error: error.message });
      throw error;
    }
  }

  /**
   * Sync job data from CRM
   */
  async syncFromCRM() {
    this.logger.info('Syncing job data from CRM', { provider: this.config.crmProvider });

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
    // Housecall Pro jobs API
    this.logger.info('Housecall Pro job sync - implement actual API');
  }

  async syncFromJobber() {
    // Jobber jobs API
    this.logger.info('Jobber job sync - implement actual API');
  }

  /**
   * Create a new job/service request
   */
  async createJob(jobData) {
    const jobId = uuidv4();
    const job = {
      id: jobId,
      status: 'pending',
      priority: jobData.priority || 'normal',
      source: jobData.source || 'manual',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      scheduledDate: null,
      assignedTechnicianId: null,
      ...jobData
    };

    this.validateJobData(job);
    this.jobs.set(jobId, job);

    this.logger.info('Job created', { jobId, type: job.serviceType, customerId: job.customerId });
    this.emit('job:created', job);

    // Auto-generate quote if enabled
    if (jobData.autoGenerateQuote !== false) {
      this.emit('job:quote:needed', { jobId, customerId: job.customerId });
    }

    await this.syncToCRM(job);

    return job;
  }

  /**
   * Validate job data
   */
  validateJobData(job) {
    if (!job.customerId) {
      throw new Error('Customer ID is required');
    }
    if (!job.serviceType) {
      throw new Error('Service type is required');
    }
    if (!job.propertyId) {
      throw new Error('Property ID is required');
    }

    const validPriorities = ['low', 'normal', 'high', 'urgent'];
    if (!validPriorities.includes(job.priority)) {
      throw new Error(`Invalid priority. Must be one of: ${validPriorities.join(', ')}`);
    }
  }

  /**
   * Get job by ID
   */
  async getJob(jobId) {
    return this.jobs.get(jobId) || null;
  }

  /**
   * Update job
   */
  async updateJob(jobId, updates) {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Job not found: ${jobId}`);
    }

    const previousStatus = job.status;
    const updatedJob = {
      ...job,
      ...updates,
      id: jobId,
      updatedAt: new Date().toISOString()
    };

    this.validateJobData(updatedJob);
    this.jobs.set(jobId, updatedJob);

    this.logger.info('Job updated', { jobId, previousStatus, newStatus: updatedJob.status });
    this.emit('job:updated', { job: updatedJob, previousStatus });

    await this.syncToCRM(updatedJob);

    return updatedJob;
  }

  /**
   * Update job status with state machine validation
   */
  async updateJobStatus(jobId, newStatus) {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Job not found: ${jobId}`);
    }

    const validTransitions = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['scheduled', 'cancelled'],
      scheduled: ['in_progress', 'cancelled', 'rescheduled'],
      in_progress: ['completed', 'on_hold', 'cancelled'],
      on_hold: ['in_progress', 'cancelled'],
      completed: ['closed', 'invoice_sent'],
      invoice_sent: ['paid', 'overdue'],
      paid: ['closed'],
      closed: [],
      cancelled: [],
      rescheduled: ['scheduled']
    };

    const allowedTransitions = validTransitions[job.status] || [];
    if (!allowedTransitions.includes(newStatus)) {
      throw new Error(`Invalid status transition from '${job.status}' to '${newStatus}'`);
    }

    const statusChange = {
      from: job.status,
      to: newStatus,
      timestamp: new Date().toISOString()
    };

    job.status = newStatus;
    job.statusHistory = job.statusHistory || [];
    job.statusHistory.push(statusChange);
    job.updatedAt = new Date().toISOString();

    this.jobs.set(jobId, job);

    this.logger.info('Job status changed', { jobId, ...statusChange });
    this.emit('job:status:changed', { jobId, ...statusChange });

    await this.syncToCRM(job);

    return job;
  }

  /**
   * Assign technician to job
   */
  async assignTechnician(jobId, technicianId, assignmentData = {}) {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Job not found: ${jobId}`);
    }

    job.assignedTechnicianId = technicianId;
    job.assignedAt = new Date().toISOString();
    job.assignmentNote = assignmentData.note;
    job.updatedAt = new Date().toISOString();

    if (job.status === 'pending') {
      job.status = 'confirmed';
    }

    this.jobs.set(jobId, job);

    this.logger.info('Technician assigned to job', { jobId, technicianId });
    this.emit('job:technician:assigned', { jobId, technicianId });

    await this.syncToCRM(job);

    return job;
  }

  /**
   * Schedule job
   */
  async scheduleJob(jobId, scheduleData) {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Job not found: ${jobId}`);
    }

    job.scheduledDate = scheduleData.date;
    job.scheduledTimeStart = scheduleData.timeStart;
    job.scheduledTimeEnd = scheduleData.timeEnd;
    job.scheduleNote = scheduleData.note;
    job.updatedAt = new Date().toISOString();

    if (job.status === 'confirmed') {
      job.status = 'scheduled';
    }

    this.jobs.set(jobId, job);

    this.logger.info('Job scheduled', {
      jobId,
      date: scheduleData.date,
      timeStart: scheduleData.timeStart,
      timeEnd: scheduleData.timeEnd
    });

    this.emit('job:scheduled', { jobId, ...scheduleData });
    await this.syncToCRM(job);

    return job;
  }

  /**
   * Create quote for job
   */
  async createQuote(jobId, quoteData) {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Job not found: ${jobId}`);
    }

    const quoteId = uuidv4();
    const quote = {
      id: quoteId,
      jobId,
      customerId: job.customerId,
      status: 'draft',
      createdAt: new Date().toISOString(),
      validUntil: new Date(Date.now() + this.config.quoteValidityDays * 24 * 60 * 60 * 1000).toISOString(),
      lineItems: quoteData.lineItems || [],
      laborCost: quoteData.laborCost || 0,
      partsCost: quoteData.partsCost || 0,
      materialsCost: quoteData.materialsCost || 0,
      discount: quoteData.discount || 0,
      tax: quoteData.tax || 0,
      notes: quoteData.notes,
      ...quoteData
    };

    quote.totalAmount = this.calculateQuoteTotal(quote);
    this.quotes.set(quoteId, quote);

    this.logger.info('Quote created', { quoteId, jobId, totalAmount: quote.totalAmount });
    this.emit('quote:created', quote);

    return quote;
  }

  /**
   * Calculate quote total
   */
  calculateQuoteTotal(quote) {
    const subtotal = quote.laborCost + quote.partsCost + quote.materialsCost - quote.discount;
    const taxAmount = subtotal * (quote.taxRate || 0.08);
    return subtotal + taxAmount;
  }

  /**
   * Update quote
   */
  async updateQuote(quoteId, updates) {
    const quote = this.quotes.get(quoteId);
    if (!quote) {
      throw new Error(`Quote not found: ${quoteId}`);
    }

    const updatedQuote = {
      ...quote,
      ...updates,
      id: quoteId,
      updatedAt: new Date().toISOString()
    };

    updatedQuote.totalAmount = this.calculateQuoteTotal(updatedQuote);
    this.quotes.set(quoteId, updatedQuote);

    this.logger.info('Quote updated', { quoteId, totalAmount: updatedQuote.totalAmount });
    this.emit('quote:updated', updatedQuote);

    return updatedQuote;
  }

  /**
   * Send quote to customer
   */
  async sendQuote(quoteId, sendOptions = {}) {
    const quote = this.quotes.get(quoteId);
    if (!quote) {
      throw new Error(`Quote not found: ${quoteId}`);
    }

    quote.status = 'sent';
    quote.sentAt = new Date().toISOString();
    quote.sentVia = sendOptions.method || 'email';
    quote.sentTo = sendOptions.email || quote.customerEmail;
    this.quotes.set(quoteId, quote);

    this.logger.info('Quote sent', { quoteId, sentVia: quote.sentVia });
    this.emit('quote:sent', quote);

    return quote;
  }

  /**
   * Approve quote
   */
  async approveQuote(quoteId, approvalData = {}) {
    const quote = this.quotes.get(quoteId);
    if (!quote) {
      throw new Error(`Quote not found: ${quoteId}`);
    }

    quote.status = 'approved';
    quote.approvedAt = new Date().toISOString();
    quote.approvedBy = approvalData.approvedBy;
    quote.signature = approvalData.signature;
    this.quotes.set(quoteId, quote);

    // Update associated job status
    const job = this.jobs.get(quote.jobId);
    if (job && job.status === 'pending') {
      job.status = 'confirmed';
      job.quoteId = quoteId;
      this.jobs.set(job.id, job);
    }

    this.logger.info('Quote approved', { quoteId });
    this.emit('quote:approved', quote);
    await this.syncToCRM(quote);

    return quote;
  }

  /**
   * Create work order from job
   */
  async createWorkOrder(jobId, workOrderData = {}) {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Job not found: ${jobId}`);
    }

    const workOrderId = uuidv4();
    const workOrder = {
      id: workOrderId,
      jobId,
      customerId: job.customerId,
      propertyId: job.propertyId,
      technicianId: job.assignedTechnicianId,
      status: 'pending',
      createdAt: new Date().toISOString(),
      startedAt: null,
      completedAt: null,
      tasks: workOrderData.tasks || [],
      notes: workOrderData.notes,
      photos: [],
      signatures: [],
      ...workOrderData
    };

    this.workOrders.set(workOrderId, workOrder);

    this.logger.info('Work order created', { workOrderId, jobId });
    this.emit('workorder:created', workOrder);

    return workOrder;
  }

  /**
   * Update work order
   */
  async updateWorkOrder(workOrderId, updates) {
    const workOrder = this.workOrders.get(workOrderId);
    if (!workOrder) {
      throw new Error(`Work order not found: ${workOrderId}`);
    }

    const updatedWorkOrder = {
      ...workOrder,
      ...updates,
      id: workOrderId,
      updatedAt: new Date().toISOString()
    };

    this.workOrders.set(workOrderId, updatedWorkOrder);
    this.emit('workorder:updated', updatedWorkOrder);

    return updatedWorkOrder;
  }

  /**
   * Complete work order
   */
  async completeWorkOrder(workOrderId, completionData = {}) {
    const workOrder = this.workOrders.get(workOrderId);
    if (!workOrder) {
      throw new Error(`Work order not found: ${workOrderId}`);
    }

    workOrder.status = 'completed';
    workOrder.completedAt = new Date().toISOString();
    workOrder.completionNotes = completionData.notes;
    workOrder.photos = completionData.photos || workOrder.photos;
    workOrder.signatures = completionData.signatures || workOrder.signatures;
    workOrder.actualDuration = completionData.actualDuration;
    workOrder.tasks = workOrder.tasks.map(t => ({
      ...t,
      completed: completionData.completedTasks?.includes(t.id) ?? t.completed
    }));

    this.workOrders.set(workOrderId, workOrder);

    // Update job status
    const job = this.jobs.get(workOrder.jobId);
    if (job) {
      job.status = 'completed';
      job.completedAt = new Date().toISOString();
      this.jobs.set(job.id, job);
    }

    this.logger.info('Work order completed', { workOrderId, jobId: workOrder.jobId });
    this.emit('workorder:completed', workOrder);
    await this.syncToCRM(workOrder);

    return workOrder;
  }

  /**
   * Search jobs
   */
  async searchJobs(criteria = {}) {
    const results = [];

    for (const job of this.jobs.values()) {
      let match = true;

      if (criteria.status && job.status !== criteria.status) match = false;
      if (criteria.priority && job.priority !== criteria.priority) match = false;
      if (criteria.customerId && job.customerId !== criteria.customerId) match = false;
      if (criteria.technicianId && job.assignedTechnicianId !== criteria.technicianId) match = false;
      if (criteria.serviceType && job.serviceType !== criteria.serviceType) match = false;

      if (criteria.dateFrom && new Date(job.scheduledDate) < new Date(criteria.dateFrom)) match = false;
      if (criteria.dateTo && new Date(job.scheduledDate) > new Date(criteria.dateTo)) match = false;

      if (match) results.push(job);
    }

    // Sort by priority and date
    results.sort((a, b) => {
      const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(a.scheduledDate || a.createdAt) - new Date(b.scheduledDate || b.createdAt);
    });

    return {
      data: results,
      total: results.length,
      criteria
    };
  }

  /**
   * Get job analytics
   */
  async getJobAnalytics(dateRange = {}) {
    const jobs = Array.from(this.jobs.values());
    let filtered = jobs;

    if (dateRange.start) {
      filtered = filtered.filter(j => new Date(j.createdAt) >= new Date(dateRange.start));
    }
    if (dateRange.end) {
      filtered = filtered.filter(j => new Date(j.createdAt) <= new Date(dateRange.end));
    }

    return {
      totalJobs: filtered.length,
      byStatus: this.groupByStatus(filtered),
      byPriority: this.groupByPriority(filtered),
      byServiceType: this.groupByServiceType(filtered),
      averageCompletionTime: this.calculateAvgCompletionTime(filtered),
      onTimeRate: this.calculateOnTimeRate(filtered),
      revenue: this.calculateRevenue(filtered)
    };
  }

  groupByStatus(jobs) {
    const groups = {};
    for (const job of jobs) {
      groups[job.status] = (groups[job.status] || 0) + 1;
    }
    return groups;
  }

  groupByPriority(jobs) {
    const groups = {};
    for (const job of jobs) {
      groups[job.priority] = (groups[job.priority] || 0) + 1;
    }
    return groups;
  }

  groupByServiceType(jobs) {
    const groups = {};
    for (const job of jobs) {
      groups[job.serviceType] = (groups[job.serviceType] || 0) + 1;
    }
    return groups;
  }

  calculateAvgCompletionTime(jobs) {
    const completed = jobs.filter(j => j.completedAt && j.createdAt);
    if (completed.length === 0) return null;

    const totalMs = completed.reduce((sum, j) => {
      return sum + (new Date(j.completedAt) - new Date(j.createdAt));
    }, 0);

    return totalMs / completed.length / (1000 * 60 * 60); // Return hours
  }

  calculateOnTimeRate(jobs) {
    const completed = jobs.filter(j => j.completedAt && j.scheduledDate);
    if (completed.length === 0) return null;

    const onTime = completed.filter(j =>
      new Date(j.completedAt) <= new Date(j.scheduledDate)
    ).length;

    return onTime / completed.length;
  }

  calculateRevenue(jobs) {
    const completed = jobs.filter(j => j.status === 'completed' || j.status === 'paid');
    return completed.reduce((sum, j) => sum + (j.quote?.totalAmount || j.estimatedAmount || 0), 0);
  }

  /**
   * Sync to CRM
   */
  async syncToCRM(entity) {
    try {
      if (this.config.crmProvider === 'housecallpro') {
        this.logger.info('Syncing to Housecall Pro', { type: entity.jobId ? 'job' : 'quote' });
      } else if (this.config.crmProvider === 'jobber') {
        this.logger.info('Syncing to Jobber', { type: entity.jobId ? 'job' : 'quote' });
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
      service: 'JobTwinService',
      status: 'running',
      port: this.config.port,
      jobs: this.jobs.size,
      quotes: this.quotes.size,
      workOrders: this.workOrders.size
    };
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    this.logger.info('Shutting down Job Twin Service');
    this.removeAllListeners();
    return { success: true, service: 'JobTwinService' };
  }
}

module.exports = { JobTwinService };