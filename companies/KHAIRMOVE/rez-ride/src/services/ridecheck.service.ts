import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { randomInt } from 'crypto';
import { Ride } from '../models/ride.model';
import { Driver } from '../models/driver.model';
import { NotFoundError } from '../common/exceptions';

export interface RideCheck {
  id: string;
  rideId: string;
  type: RIDECHECK_TYPE;
  status: RIDECHECK_STATUS;
  triggeredAt: Date;
  completedAt?: Date;
  response?: RIDECHECK_RESPONSE;
  responseTime?: number; // seconds
  flags: SafetyFlag[];
}

export enum RIDECHECK_TYPE {
  LATE_START = 'late_start',           // Didn't start after arrival
  LONG_STOP = 'long_stop',             // Extended stop during ride
  ROUTE_DEVIATION = 'route_deviation', // Deviated from route
  UNUSUAL_SPEED = 'unusual_speed',     // Speeding or very slow
  ACCIDENT_DETECTED = 'accident_detected',
  SOS_TRIGGERED = 'sos_triggered',
}

export enum RIDECHECK_STATUS {
  TRIGGERED = 'triggered',
  CHECKING = 'checking',
  RESPONDED_SAFE = 'responded_safe',
  RESPONDED_ISSUE = 'responded_issue',
  RESOLVED = 'resolved',
  ESCALATED = 'escalated',
}

export enum RIDECHECK_RESPONSE {
  ALL_OK = 'all_ok',
  NEED_HELP = 'need_help',
  ACCIDENT = 'accident',
  HARASSMENT = 'harassment',
  MEDICAL = 'medical',
  NO_RESPONSE = 'no_response',
}

export interface SafetyFlag {
  type: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  evidence?: any;
}

@Injectable()
export class RideCheckService {
  private readonly logger = new Logger(RideCheckService.name);

  // In-memory store
  private activeChecks: Map<string, RideCheck> = new Map();
  private checkHistory: RideCheck[] = [];

  constructor(
    @InjectModel(Ride.name) private rideModel: Model<Ride>,
    @InjectModel(Driver.name) private driverModel: Model<Driver>,
  ) {
    // Start background checks
    this.startBackgroundChecks();
  }

  // ===========================================
  // RIDE CHECK TRIGGERS
  // ===========================================

  /**
   * Trigger automatic ride check
   */
  async triggerCheck(
    rideId: string,
    type: RIDECHECK_TYPE,
    flags: SafetyFlag[] = []
  ): Promise<RideCheck> {
    const check: RideCheck = {
      id: `RC_${Date.now()}`,
      rideId,
      type,
      status: RIDECHECK_STATUS.TRIGGERED,
      triggeredAt: new Date(),
      flags,
    };

    this.activeChecks.set(check.id, check);

    // Determine severity
    const hasHighSeverity = flags.some(f => f.severity === 'high');
    const hasMediumSeverity = flags.some(f => f.severity === 'medium');

    if (hasHighSeverity || type === RIDECHECK_TYPE.SOS_TRIGGERED) {
      await this.escalateCheck(check);
    } else if (hasMediumSeverity) {
      await this.initiateCheck(check);
    } else {
      // Low severity - just log
      this.logger.warn(`Ride check ${check.id} triggered: ${type}`);
    }

    return check;
  }

  /**
   * Initiate check process
   */
  private async initiateCheck(check: RideCheck): Promise<void> {
    check.status = RIDECHECK_STATUS.CHECKING;
    this.activeChecks.set(check.id, check);

    // Send push notification to user
    await this.sendCheckNotification(check);

    // Schedule timeout response
    setTimeout(() => {
      this.checkTimeout(check.id);
    }, 5 * 60 * 1000); // 5 minutes

    this.logger.log(`Ride check ${check.id} initiated for ride ${check.rideId}`);
  }

  /**
   * Escalate check immediately
   */
  private async escalateCheck(check: RideCheck): Promise<void> {
    check.status = RIDECHECK_STATUS.ESCALATED;
    this.activeChecks.set(check.id, check);

    // Immediate actions
    await this.notifyEmergencyServices(check);
    await this.notifySafetyTeam(check);
    await this.recordEvidence(check);

    this.logger.warn(`Ride check ${check.id} ESCALATED for ride ${check.rideId}`);
  }

  /**
   * Send check notification
   */
  private async sendCheckNotification(check: RideCheck): Promise<void> {
    // Get ride details
    const ride = await this.rideModel.findById(check.rideId);

    if (!ride) return;

    // Send push notification based on check type
    let title = 'Safety Check';
    let message = 'Is your ride going okay?';

    switch (check.type) {
      case RIDECHECK_TYPE.LATE_START:
        title = 'Ride not started';
        message = 'Your driver hasn\'t started the trip. Is everything okay?';
        break;
      case RIDECHECK_TYPE.LONG_STOP:
        title = 'Long stop detected';
        message = 'We noticed a long stop. Do you need help?';
        break;
      case RIDECHECK_TYPE.ROUTE_DEVIATION:
        title = 'Route change';
        message = 'The route has changed. Are you safe?';
        break;
    }

    // In production, send via notification service
    this.logger.log(`Safety notification sent to ride ${check.rideId}: ${message}`);
  }

  /**
   * Handle check timeout (no response)
   */
  private async checkTimeout(checkId: string): Promise<void> {
    const check = this.activeChecks.get(checkId);
    if (!check) return;

    if (check.status === RIDECHECK_STATUS.CHECKING) {
      check.status = RIDECHECK_STATUS.ESCALATED;
      check.response = RIDECHECK_RESPONSE.NO_RESPONSE;
      check.responseTime = 300; // 5 minutes
      this.activeChecks.set(checkId, check);

      await this.escalateCheck(check);

      this.logger.warn(`Ride check ${checkId} timed out with no response`);
    }
  }

  // ===========================================
  // USER RESPONSE
  // ===========================================

  /**
   * Record user response to check
   */
  async recordResponse(
    checkId: string,
    response: RIDECHECK_RESPONSE
  ): Promise<RideCheck> {
    const check = this.activeChecks.get(checkId);
    if (!check) {
      throw new NotFoundError('Check', checkId);
    }

    check.response = response;
    check.responseTime = Math.round(
      (Date.now() - check.triggeredAt.getTime()) / 1000
    );

    switch (response) {
      case RIDECHECK_RESPONSE.ALL_OK:
        check.status = RIDECHECK_STATUS.RESPONDED_SAFE;
        break;
      case RIDECHECK_RESPONSE.NEED_HELP:
      case RIDECHECK_RESPONSE.ACCIDENT:
      case RIDECHECK_RESPONSE.HARASSMENT:
      case RIDECHECK_RESPONSE.MEDICAL:
        check.status = RIDECHECK_STATUS.RESPONDED_ISSUE;
        await this.handleIssueResponse(check);
        break;
    }

    // Move to history
    this.activeChecks.delete(checkId);
    this.checkHistory.push(check);

    // Keep only last 1000 checks
    if (this.checkHistory.length > 1000) {
      this.checkHistory.shift();
    }

    return check;
  }

  /**
   * Handle issue response
   */
  private async handleIssueResponse(check: RideCheck): Promise<void> {
    // Escalate based on response type
    if (check.response === RIDECHECK_RESPONSE.ACCIDENT) {
      await this.handleAccident(check);
    } else if (check.response === RIDECHECK_RESPONSE.HARASSMENT) {
      await this.handleHarassment(check);
    } else {
      await this.sendSupportAssistance(check);
    }
  }

  /**
   * Handle accident response
   */
  private async handleAccident(check: RideCheck): Promise<void> {
    check.status = RIDECHECK_STATUS.ESCALATED;

    // Contact emergency services
    await this.notifyEmergencyServices(check);

    // Contact safety team
    await this.notifySafetyTeam(check);

    // Open support ticket
    await this.createSupportTicket(check, 'accident');

    this.logger.error(`ACCIDENT reported for ride ${check.rideId}`);
  }

  /**
   * Handle harassment response
   */
  private async handleHarassment(check: RideCheck): Promise<void> {
    check.status = RIDECHECK_STATUS.ESCALATED;

    // Contact safety team immediately
    await this.notifySafetyTeam(check);

    // Dispatch immediate support
    await this.dispatchSupport(check);

    // Block driver temporarily
    await this.temporarilyBlockDriver(check);

    this.logger.error(`HARASSMENT reported for ride ${check.rideId}`);
  }

  /**
   * Send support assistance
   */
  private async sendSupportAssistance(check: RideCheck): Promise<void> {
    await this.createSupportTicket(check, 'general');

    // In production, connect to live support
    this.logger.log(`Support assistance requested for ride ${check.rideId}`);
  }

  // ===========================================
  // BACKGROUND CHECKS
  // ===========================================

  /**
   * Start background check monitoring
   */
  private startBackgroundChecks(): void {
    // Check every 30 seconds
    setInterval(() => {
      this.performBackgroundChecks();
    }, 30000);
  }

  /**
   * Perform background checks on active rides
   */
  private async performBackgroundChecks(): Promise<void> {
    try {
      // Get all active rides
      const activeRides = await this.rideModel.find({
        status: { $in: ['in_progress'] }
      });

      for (const ride of activeRides) {
        // Check 1: Late start
        if (ride.status === 'in_progress' && ride.startedAt) {
          const startDelay = Date.now() - ride.startedAt.getTime();
          if (startDelay > 30 * 60 * 1000) { // 30 minutes
            await this.triggerCheck(ride._id.toString(), RIDECHECK_TYPE.LATE_START, [{
              type: 'long_start_delay',
              severity: 'medium',
              description: 'Trip started 30+ minutes after driver arrival',
            }]);
          }
        }

        // Check 2: Route deviation (mock)
        if (randomInt(0, 100) > 99) { // 1% chance
          await this.triggerCheck(ride._id.toString(), RIDECHECK_TYPE.ROUTE_DEVIATION, [{
            type: 'gps_deviation',
            severity: 'medium',
            description: 'Vehicle deviated from expected route',
          }]);
        }
      }
    } catch (error) {
      this.logger.error(`Background check error: ${error.message}`);
    }
  }

  // ===========================================
  // EMERGENCY HANDLING
  // ===========================================

  /**
   * Notify emergency services
   */
  private async notifyEmergencyServices(check: RideCheck): Promise<void> {
    const ride = await this.rideModel.findById(check.rideId);

    if (!ride) return;

    // Contact 112
    this.logger.warn(`Notifying 112 for check ${check.id}`);
    // In production: Integrate with government emergency services

    // Contact police
    this.logger.warn(`Notifying police for check ${check.id}`);
    // In production: Integrate with local police API
  }

  /**
   * Notify safety team
   */
  private async notifySafetyTeam(check: RideCheck): Promise<void> {
    // In production: Send to Slack, PagerDuty, etc.
    this.logger.error(`Safety team notified for check ${check.id}`);
  }

  /**
   * Record evidence
   */
  private async recordEvidence(check: RideCheck): Promise<void> {
    const ride = await this.rideModel.findById(check.rideId);

    if (!ride) return;

    // Store ride data as evidence
    this.logger.log(`Evidence recorded for check ${check.id}:`, {
      rideId: check.rideId,
      userId: ride.userId,
      driverId: ride.driverId,
      pickup: ride.pickup,
      drop: ride.drop,
      checkType: check.type,
      timestamp: new Date(),
    });
  }

  // ===========================================
  // SUPPORT HANDLING
  // ===========================================

  /**
   * Create support ticket
   */
  private async createSupportTicket(
    check: RideCheck,
    category: string
  ): Promise<string> {
    const ticketId = `TKT_${Date.now()}`;

    // In production: Create ticket in support system
    this.logger.log(`Support ticket ${ticketId} created for check ${check.id}`);

    return ticketId;
  }

  /**
   * Dispatch immediate support
   */
  private async dispatchSupport(check: RideCheck): Promise<void> {
    // Connect to live support agent
    this.logger.log(`Immediate support dispatched for check ${check.id}`);
  }

  /**
   * Temporarily block driver
   */
  private async temporarilyBlockDriver(check: RideCheck): Promise<void> {
    const ride = await this.rideModel.findById(check.rideId);
    if (!ride?.driverId) return;

    // Block driver for 24 hours
    await this.driverModel.findByIdAndUpdate(ride.driverId, {
      $set: { status: 'suspended' },
      $push: {
        flags: {
          type: 'safety_hold',
          reason: check.response,
          until: new Date(Date.now() + 24 * 60 * 60 * 1000),
        }
      }
    });

    this.logger.warn(`Driver ${ride.driverId} temporarily blocked`);
  }

  // ===========================================
  // GETTERS
  // ===========================================

  /**
   * Get active check for ride
   */
  async getActiveCheck(rideId: string): Promise<RideCheck | null> {
    for (const check of this.activeChecks.values()) {
      if (check.rideId === rideId) {
        return check;
      }
    }
    return null;
  }

  /**
   * Get check by ID
   */
  async getCheck(checkId: string): Promise<RideCheck | null> {
    return this.activeChecks.get(checkId) || null;
  }

  /**
   * Get ride check history
   */
  async getRideCheckHistory(rideId: string): Promise<RideCheck[]> {
    return this.checkHistory.filter(c => c.rideId === rideId);
  }

  /**
   * Get safety analytics
   */
  async getSafetyAnalytics(): Promise<{
    totalChecks: number;
    responseRate: number;
    escalationRate: number;
    avgResponseTime: number;
    topIssues: { type: string; count: number }[];
  }> {
    const total = this.checkHistory.length;
    const responded = this.checkHistory.filter(
      c => c.response && c.response !== RIDECHECK_RESPONSE.NO_RESPONSE
    ).length;
    const escalated = this.checkHistory.filter(
      c => c.status === RIDECHECK_STATUS.ESCALATED
    ).length;
    const avgResponse = this.checkHistory
      .filter(c => c.responseTime)
      .reduce((sum, c) => sum + (c.responseTime || 0), 0) / total;

    // Top issues
    const issueCounts = new Map<string, number>();
    for (const check of this.checkHistory) {
      if (check.response && check.response !== RIDECHECK_RESPONSE.ALL_OK) {
        const count = issueCounts.get(check.response) || 0;
        issueCounts.set(check.response, count + 1);
      }
    }

    const topIssues = Array.from(issueCounts.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalChecks: total,
      responseRate: total > 0 ? Math.round(responded / total * 100) : 0,
      escalationRate: total > 0 ? Math.round(escalated / total * 100) : 0,
      avgResponseTime: Math.round(avgResponse),
      topIssues,
    };
  }
}
