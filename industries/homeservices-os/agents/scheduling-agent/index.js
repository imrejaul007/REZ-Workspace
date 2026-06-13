/**
 * Scheduling Agent
 * Intelligent appointment booking, calendar management, and scheduling optimization
 */

const EventEmitter = require('events');
const { v4: uuidv4 } = require('uuid');

class SchedulingAgent extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      // Service dependencies
      jobService: null,
      technicianService: null,
      customerService: null,

      // Scheduling configuration
      defaultSlotDuration: config.defaultSlotDuration || 120, // minutes
      minAdvanceBooking: config.minAdvanceBooking || 2, // hours
      maxAdvanceBooking: config.maxAdvanceBooking || 30, // days
      bufferTimeBetweenJobs: config.bufferTimeBetweenJobs || 30, // minutes
      workingHours: config.workingHours || {
        start: '08:00',
        end: '18:00',
        days: [1, 2, 3, 4, 5] // Monday to Friday
      },

      // Optimization settings
      optimizeRoutes: config.optimizeRoutes ?? true,
      maxDriveTime: config.maxDriveTime || 45, // minutes
      clusterJobsByArea: config.clusterJobsByArea ?? true
    };

    this.appointments = new Map();
    this.scheduleCache = new Map();
    this.blockedSlots = new Map();
    this.logger = this.createLogger();
  }

  createLogger() {
    return {
      info: (msg, meta = {}) => console.log(`[${new Date().toISOString()}] INFO: [Scheduler] ${msg}`, meta),
      error: (msg, meta = {}) => console.error(`[${new Date().toISOString()}] ERROR: [Scheduler] ${msg}`, meta),
      warn: (msg, meta = {}) => console.warn(`[${new Date().toISOString()}] WARN: [Scheduler] ${msg}`, meta),
      debug: (msg, meta = {}) => console.debug(`[${new Date().toISOString()}] DEBUG: [Scheduler] ${msg}`, meta)
    };
  }

  /**
   * Initialize the scheduling agent
   */
  async initialize() {
    this.logger.info('Initializing Scheduling Agent');

    // Subscribe to job events
    if (this.config.jobService) {
      this.config.jobService.on('job:created', (job) => this.handleNewJob(job));
    }

    this.logger.info('Scheduling Agent initialized successfully');
    return { success: true, agent: 'SchedulingAgent' };
  }

  /**
   * Handle new job for scheduling
   */
  async handleNewJob(job) {
    this.logger.info('New job received for scheduling', { jobId: job.id });

    if (job.scheduledDate) {
      await this.scheduleJob(job.id, { date: job.scheduledDate });
    }
  }

  /**
   * Get available time slots for a date range
   */
  async getAvailableSlots(technicianId, dateRange, options = {}) {
    const slots = [];

    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);

    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      const dateStr = date.toISOString().split('T')[0];

      // Check if it's a working day
      if (!this.config.workingHours.days.includes(date.getDay())) {
        continue;
      }

      // Get technician's availability for this day
      const techAvailability = await this.config.technicianService?.getAvailabilityForDate(
        technicianId,
        dateStr
      );

      if (!techAvailability?.available) {
        continue;
      }

      // Get existing appointments for this day
      const dayAppointments = await this.getTechnicianAppointments(technicianId, dateStr);

      // Generate time slots
      const daySlots = this.generateTimeSlots(
        dateStr,
        techAvailability.start,
        techAvailability.end,
        dayAppointments,
        options.duration || this.config.defaultSlotDuration
      );

      slots.push(...daySlots);
    }

    return {
      technicianId,
      slots,
      totalSlots: slots.length,
      availableSlots: slots.filter(s => s.available).length
    };
  }

  /**
   * Generate time slots for a day
   */
  generateTimeSlots(dateStr, startTime, endTime, appointments, slotDuration) {
    const slots = [];

    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);

    let currentTime = startHour * 60 + startMin;
    const dayEnd = endHour * 60 + endMin;

    while (currentTime + slotDuration <= dayEnd) {
      const slotStart = currentTime;
      const slotEnd = currentTime + slotDuration;

      // Check if slot conflicts with existing appointments
      const conflicts = appointments.filter(apt => {
        const aptStart = this.timeToMinutes(apt.scheduledTimeStart);
        const aptEnd = this.timeToMinutes(apt.scheduledTimeEnd);
        return (
          (slotStart >= aptStart && slotStart < aptEnd) ||
          (slotEnd > aptStart && slotEnd <= aptEnd) ||
          (slotStart <= aptStart && slotEnd >= aptEnd)
        );
      });

      // Check for buffer time
      const hasBufferConflict = appointments.some(apt => {
        const aptStart = this.timeToMinutes(apt.scheduledTimeStart);
        const aptEnd = this.timeToMinutes(apt.scheduledTimeEnd);
        const buffer = this.config.bufferTimeBetweenJobs;
        return (
          (slotEnd > aptStart - buffer && slotEnd <= aptStart) ||
          (slotStart >= aptEnd && slotStart < aptEnd + buffer)
        );
      });

      const slotTime = this.minutesToTime(slotStart);
      const slotTimeEnd = this.minutesToTime(slotEnd);

      slots.push({
        date: dateStr,
        startTime: slotTime,
        endTime: slotTimeEnd,
        duration: slotDuration,
        available: conflicts.length === 0 && !hasBufferConflict,
        conflictingAppointments: conflicts.map(c => c.id),
        hasBufferConflict
      });

      // Move to next slot (15-minute increments)
      currentTime += 15;
    }

    return slots;
  }

  timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  minutesToTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  }

  /**
   * Get technician's appointments for a specific date
   */
  async getTechnicianAppointments(technicianId, dateStr) {
    // Query job service for scheduled jobs
    const jobs = await this.config.jobService?.searchJobs({
      technicianId,
      status: 'scheduled',
      dateFrom: dateStr,
      dateTo: dateStr
    });

    return (jobs?.data || []).map(job => ({
      id: job.id,
      scheduledDate: job.scheduledDate,
      scheduledTimeStart: job.scheduledTimeStart,
      scheduledTimeEnd: job.scheduledTimeEnd,
      duration: this.calculateDuration(job.scheduledTimeStart, job.scheduledTimeEnd)
    }));
  }

  /**
   * Calculate duration between two time strings
   */
  calculateDuration(startTime, endTime) {
    const start = this.timeToMinutes(startTime);
    const end = this.timeToMinutes(endTime);
    return end - start;
  }

  /**
   * Schedule a job
   */
  async scheduleJob(jobId, scheduleData) {
    this.logger.info('Scheduling job', { jobId, ...scheduleData });

    const job = await this.config.jobService?.getJob(jobId);
    if (!job) {
      throw new Error(`Job not found: ${jobId}`);
    }

    if (!job.assignedTechnicianId) {
      throw new Error('Job must be assigned to a technician before scheduling');
    }

    // Validate the time slot
    const isValid = await this.validateSlot(
      job.assignedTechnicianId,
      scheduleData.date,
      scheduleData.timeStart,
      scheduleData.timeEnd
    );

    if (!isValid.valid) {
      throw new Error(`Invalid time slot: ${isValid.reason}`);
    }

    // Create appointment record
    const appointmentId = uuidv4();
    const appointment = {
      id: appointmentId,
      jobId,
      customerId: job.customerId,
      technicianId: job.assignedTechnicianId,
      date: scheduleData.date,
      timeStart: scheduleData.timeStart,
      timeEnd: scheduleData.timeEnd,
      duration: this.calculateDuration(scheduleData.timeStart, scheduleData.timeEnd),
      status: 'confirmed',
      notes: scheduleData.notes,
      createdAt: new Date().toISOString(),
      reminderSent: false
    };

    this.appointments.set(appointmentId, appointment);

    // Update job in job service
    await this.config.jobService?.scheduleJob(jobId, {
      date: scheduleData.date,
      timeStart: scheduleData.timeStart,
      timeEnd: scheduleData.timeEnd,
      note: scheduleData.notes
    });

    // Send confirmation
    await this.sendAppointmentConfirmation(appointment, job);

    this.logger.info('Job scheduled', { jobId, appointmentId, ...scheduleData });
    this.emit('job:scheduled', appointment);

    return appointment;
  }

  /**
   * Validate time slot availability
   */
  async validateSlot(technicianId, date, timeStart, timeEnd) {
    // Check if within working hours
    const availability = await this.config.technicianService?.getAvailabilityForDate(
      technicianId,
      date
    );

    if (!availability?.available) {
      return { valid: false, reason: 'Technician not available on this day' };
    }

    const startMins = this.timeToMinutes(timeStart);
    const endMins = this.timeToMinutes(timeEnd);
    const availStart = this.timeToMinutes(availability.start);
    const availEnd = this.timeToMinutes(availability.end);

    if (startMins < availStart || endMins > availEnd) {
      return { valid: false, reason: 'Outside of working hours' };
    }

    // Check for conflicts
    const appointments = await this.getTechnicianAppointments(technicianId, date);
    const slotDuration = endMins - startMins;

    for (const apt of appointments) {
      const aptStart = this.timeToMinutes(apt.scheduledTimeStart);
      const aptEnd = this.timeToMinutes(apt.scheduledTimeEnd);
      const buffer = this.config.bufferTimeBetweenJobs;

      // Direct conflict
      if ((startMins >= aptStart && startMins < aptEnd) ||
        (endMins > aptStart && endMins <= aptEnd)) {
        return { valid: false, reason: 'Time conflicts with existing appointment' };
      }

      // Buffer conflict
      if ((endMins > aptStart - buffer && endMins <= aptStart) ||
        (startMins >= aptEnd && startMins < aptEnd + buffer)) {
        return { valid: false, reason: 'Insufficient buffer time from previous appointment' };
      }
    }

    return { valid: true };
  }

  /**
   * Reschedule appointment
   */
  async rescheduleAppointment(appointmentId, newSchedule) {
    const appointment = this.appointments.get(appointmentId);
    if (!appointment) {
      throw new Error(`Appointment not found: ${appointmentId}`);
    }

    // Validate new slot
    const isValid = await this.validateSlot(
      appointment.technicianId,
      newSchedule.date,
      newSchedule.timeStart,
      newSchedule.timeEnd
    );

    if (!isValid.valid) {
      throw new Error(`Invalid time slot: ${isValid.reason}`);
    }

    const previousSchedule = {
      date: appointment.date,
      timeStart: appointment.timeStart,
      timeEnd: appointment.timeEnd
    };

    // Update appointment
    appointment.date = newSchedule.date;
    appointment.timeStart = newSchedule.timeStart;
    appointment.timeEnd = newSchedule.timeEnd;
    appointment.duration = this.calculateDuration(newSchedule.timeStart, newSchedule.timeEnd);
    appointment.rescheduledAt = new Date().toISOString();
    appointment.rescheduleReason = newSchedule.reason;

    this.appointments.set(appointmentId, appointment);

    // Update job
    await this.config.jobService?.scheduleJob(appointment.jobId, {
      date: newSchedule.date,
      timeStart: newSchedule.timeStart,
      timeEnd: newSchedule.timeEnd,
      note: `Rescheduled: ${newSchedule.reason}`
    });

    // Send rescheduling notification
    await this.sendRescheduleNotification(appointment, previousSchedule);

    this.emit('appointment:rescheduled', {
      appointment,
      previousSchedule,
      newSchedule
    });

    this.logger.info('Appointment rescheduled', {
      appointmentId,
      previousSchedule,
      newSchedule
    });

    return appointment;
  }

  /**
   * Cancel appointment
   */
  async cancelAppointment(appointmentId, reason) {
    const appointment = this.appointments.get(appointmentId);
    if (!appointment) {
      throw new Error(`Appointment not found: ${appointmentId}`);
    }

    appointment.status = 'cancelled';
    appointment.cancelledAt = new Date().toISOString();
    appointment.cancellationReason = reason;

    this.appointments.set(appointmentId, appointment);

    // Update job status
    await this.config.jobService?.updateJobStatus(appointment.jobId, 'cancelled');

    // Send cancellation notification
    await this.sendCancellationNotification(appointment, reason);

    this.emit('appointment:cancelled', { appointment, reason });

    this.logger.info('Appointment cancelled', { appointmentId, reason });

    return appointment;
  }

  /**
   * Get optimized route for multiple jobs
   */
  async getOptimizedRoute(technicianId, date, jobIds) {
    const jobs = [];
    for (const jobId of jobIds) {
      const job = await this.config.jobService?.getJob(jobId);
      if (job && job.scheduledDate === date) {
        jobs.push(job);
      }
    }

    if (jobs.length === 0) {
      return { route: [], totalDistance: 0, totalTime: 0 };
    }

    // Get customer locations
    for (const job of jobs) {
      const customer = await this.config.customerService?.getCustomer(job.customerId);
      const property = customer?.properties?.find(p => p.id === job.propertyId);
      job.property = property;
    }

    // Simple routing optimization (in production, use a proper routing API)
    const optimizedRoute = this.optimizeJobOrder(jobs);

    let totalDriveTime = 0;
    let previousLocation = null;

    for (const job of optimizedRoute) {
      if (previousLocation && job.property?.address?.coordinates) {
        const distance = await this.calculateDistance(previousLocation, job.property.address);
        totalDriveTime += distance ? distance * 2 : 15; // Estimate 2 min per mile
      }
      previousLocation = job.property?.address;
    }

    return {
      technicianId,
      date,
      route: optimizedRoute.map((job, index) => ({
        order: index + 1,
        jobId: job.id,
        customerName: `${job.property?.firstName || ''} ${job.property?.lastName || ''}`,
        address: job.property?.address,
        scheduledTime: job.scheduledTimeStart
      })),
      totalJobs: jobs.length,
      totalDriveTime,
      estimatedTotalDuration: jobs.reduce((sum, j) => sum + j.duration, 0) + totalDriveTime
    };
  }

  /**
   * Optimize job order based on location
   */
  optimizeJobOrder(jobs) {
    // Nearest neighbor algorithm for simplicity
    if (jobs.length <= 1) return jobs;

    const optimized = [];
    const remaining = [...jobs];

    // Start with first job
    optimized.push(remaining.shift());

    while (remaining.length > 0) {
      const current = optimized[optimized.length - 1];
      const currentLoc = current.property?.address?.coordinates;

      if (!currentLoc) {
        optimized.push(remaining.shift());
        continue;
      }

      // Find nearest
      let nearestIdx = 0;
      let nearestDist = Infinity;

      for (let i = 0; i < remaining.length; i++) {
        const loc = remaining[i].property?.address?.coordinates;
        if (!loc) continue;

        const dist = this.calculateSimpleDistance(currentLoc, loc);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestIdx = i;
        }
      }

      optimized.push(remaining.splice(nearestIdx, 1)[0]);
    }

    return optimized;
  }

  calculateSimpleDistance(loc1, loc2) {
    const [lon1, lat1] = loc1;
    const [lon2, lat2] = loc2;
    return Math.sqrt(Math.pow(lon2 - lon1, 2) + Math.pow(lat2 - lat1, 2));
  }

  async calculateDistance(loc1, loc2) {
    // Haversine formula
    const R = 3959;
    const dLat = this.toRad(loc2[1] - loc1[1]);
    const dLon = this.toRad(loc2[0] - loc1[0]);

    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(this.toRad(loc1[1])) * Math.cos(this.toRad(loc2[1])) *
      Math.sin(dLon / 2) ** 2;

    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  toRad(deg) {
    return deg * (Math.PI / 180);
  }

  /**
   * Block time slot
   */
  async blockTimeSlot(technicianId, blockData) {
    const blockId = uuidv4();
    const block = {
      id: blockId,
      technicianId,
      date: blockData.date,
      timeStart: blockData.timeStart,
      timeEnd: blockData.timeEnd,
      type: blockData.type || 'blocked', // blocked, break, meeting
      reason: blockData.reason,
      createdAt: new Date().toISOString()
    };

    this.blockedSlots.set(blockId, block);

    this.logger.info('Time slot blocked', { blockId, technicianId, ...blockData });

    return block;
  }

  /**
   * Send appointment confirmation
   */
  async sendAppointmentConfirmation(appointment, job) {
    // In production, integrate with notification service
    this.logger.info('Sending appointment confirmation', { appointmentId: appointment.id });

    appointment.confirmationSent = true;
    appointment.confirmationSentAt = new Date().toISOString();
    this.appointments.set(appointment.id, appointment);

    this.emit('notification:appointment:confirmed', { appointment, job });
  }

  /**
   * Send reschedule notification
   */
  async sendRescheduleNotification(appointment, previousSchedule) {
    this.logger.info('Sending reschedule notification', { appointmentId: appointment.id });

    this.emit('notification:appointment:rescheduled', {
      appointment,
      previousSchedule
    });
  }

  /**
   * Send cancellation notification
   */
  async sendCancellationNotification(appointment, reason) {
    this.logger.info('Sending cancellation notification', { appointmentId: appointment.id });

    this.emit('notification:appointment:cancelled', { appointment, reason });
  }

  /**
   * Get daily schedule for technician
   */
  async getDailySchedule(technicianId, date) {
    const appointments = await this.getTechnicianAppointments(technicianId, date);

    // Get blocked slots
    const blocks = Array.from(this.blockedSlots.values()).filter(
      b => b.technicianId === technicianId && b.date === date
    );

    return {
      technicianId,
      date,
      appointments,
      blockedSlots: blocks,
      summary: {
        totalAppointments: appointments.length,
        totalBlocked: blocks.length,
        utilizationRate: this.calculateUtilization(appointments, blocks, date)
      }
    };
  }

  /**
   * Calculate utilization rate
   */
  calculateUtilization(appointments, blocks, date) {
    const availability = this.config.workingHours;
    const startMins = this.timeToMinutes(availability.start);
    const endMins = this.timeToMinutes(availability.end);
    const totalMinutes = endMins - startMins;

    let bookedMinutes = 0;
    for (const apt of appointments) {
      bookedMinutes += this.timeToMinutes(apt.scheduledTimeEnd) -
        this.timeToMinutes(apt.scheduledTimeStart);
    }
    for (const block of blocks) {
      bookedMinutes += this.timeToMinutes(block.timeEnd) -
        this.timeToMinutes(block.timeStart);
    }

    return Math.round((bookedMinutes / totalMinutes) * 100);
  }

  /**
   * Get scheduling analytics
   */
  async getSchedulingAnalytics(dateRange = {}) {
    const appointments = Array.from(this.appointments.values());
    let filtered = appointments;

    if (dateRange.start) {
      filtered = filtered.filter(a => new Date(a.date) >= new Date(dateRange.start));
    }
    if (dateRange.end) {
      filtered = filtered.filter(a => new Date(a.date) <= new Date(dateRange.end));
    }

    return {
      totalAppointments: filtered.length,
      byStatus: this.groupByStatus(filtered),
      averageUtilization: this.calculateAverageUtilization(filtered),
      popularTimes: this.getPopularTimeSlots(filtered),
      dateRange
    };
  }

  groupByStatus(appointments) {
    const groups = {};
    for (const apt of appointments) {
      groups[apt.status] = (groups[apt.status] || 0) + 1;
    }
    return groups;
  }

  calculateAverageUtilization(appointments) {
    // Calculate average across days
    const byDate = {};
    for (const apt of appointments) {
      byDate[apt.date] = byDate[apt.date] || [];
      byDate[apt.date].push(apt);
    }

    const utilizations = Object.values(byDate).map(apts => {
      const totalMins = apts.reduce((sum, a) => sum + a.duration, 0);
      const workMins = 10 * 60; // 10 hours
      return totalMins / workMins;
    });

    if (utilizations.length === 0) return 0;
    return Math.round(utilizations.reduce((a, b) => a + b, 0) / utilizations.length * 100);
  }

  getPopularTimeSlots(appointments) {
    const timeCounts = {};
    for (const apt of appointments) {
      const hour = apt.timeStart.split(':')[0];
      timeCounts[hour] = (timeCounts[hour] || 0) + 1;
    }

    return Object.entries(timeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([hour, count]) => ({ hour: `${hour}:00`, count }));
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    this.logger.info('Shutting down Scheduling Agent');
    this.removeAllListeners();
    return { success: true, agent: 'SchedulingAgent' };
  }
}

module.exports = { SchedulingAgent };
