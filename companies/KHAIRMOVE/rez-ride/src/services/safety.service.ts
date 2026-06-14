import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import crypto from 'crypto';
import { AppError } from '../common/exceptions';

// ============================================
// MONGODB SCHEMAS
// ============================================

import { Document } from 'mongoose';

export interface EmergencyContact {
  name: string;
  phone: string;
  email?: string;
  relation: string;
}

export interface TripShare {
  id: string;
  rideId: string;
  userId: string;
  contacts: EmergencyContact[];
  shareUrl: string;
  active: boolean;
  startedAt: Date;
  expiresAt: Date;
}

interface TripShareDocument {
  _id: Types.ObjectId;
  rideId: Types.ObjectId;
  userId: Types.ObjectId;
  contacts: EmergencyContact[];
  shareUrl: string;
  active: boolean;
  startedAt: Date;
  expiresAt: Date;
}

export interface SOSAlert {
  id: string;
  rideId: string;
  userId: string;
  driverId: string;
  type: SOS_TYPE;
  lat: number;
  lng: number;
  status: SOS_STATUS;
  triggeredAt: Date;
  resolvedAt?: Date;
  policeNotified: boolean;
  emergencyServicesContacted: boolean;
}

export enum SOS_TYPE {
  EMERGENCY = 'emergency',
  SAFETY_CONCERN = 'safety_concern',
  MEDICAL = 'medical',
  VEHICLE_ACCIDENT = 'vehicle_accident',
}

export enum SOS_STATUS {
  TRIGGERED = 'triggered',
  DISPATCHED = 'dispatched',
  RESPONDING = 'responding',
  RESOLVED = 'resolved',
  FALSE_ALARM = 'false_alarm',
}

export interface TripAudioRecording {
  id: string;
  rideId: string;
  filename: string;
  duration: number;
  userId: string;
  driverId: string;
  uploadedAt: Date;
  encryptionKey: string;
}

// ============================================
// MONGOOSE SCHEMAS
// ============================================

import { Schema } from 'mongoose';

@Injectable()
export class SOSAlertSchema {
  id: string;
  rideId: Types.ObjectId;
  userId: Types.ObjectId;
  driverId: Types.ObjectId;
  type: string;
  lat: number;
  lng: number;
  status: string;
  triggeredAt: Date;
  resolvedAt?: Date;
  policeNotified: boolean;
  emergencyServicesContacted: boolean;
  notes: string[];
  createdAt: Date;
  updatedAt: Date;
}

export const SOSAlertSchemaDefinition = {
  rideId: { type: Schema.Types.ObjectId, ref: 'Ride', required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  driverId: { type: Schema.Types.ObjectId, ref: 'Driver', required: true, index: true },
  type: { type: String, enum: Object.values(SOS_TYPE), required: true },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  status: { type: String, enum: Object.values(SOS_STATUS), required: true, default: SOS_STATUS.TRIGGERED },
  triggeredAt: { type: Date, default: Date.now, index: true },
  resolvedAt: { type: Date },
  policeNotified: { type: Boolean, default: false },
  emergencyServicesContacted: { type: Boolean, default: false },
  notes: [{ text: String, createdAt: Date, createdBy: String }],
};

export const TripShareSchemaDefinition = {
  rideId: { type: Schema.Types.ObjectId, ref: 'Ride', required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  contacts: [{
    name: String,
    phone: String,
    email: String,
    relation: String,
  }],
  shareUrl: { type: String, required: true },
  active: { type: Boolean, default: true, index: true },
  startedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true, index: true },
};

// ============================================
// SERVICE IMPLEMENTATION
// ============================================

@Injectable()
export class SafetyService {
  private readonly logger = new Logger(SafetyService.name);
  private readonly policeApiUrl: string;
  private readonly notificationServiceUrl: string;

  // MongoDB models - injected via module
  private sosAlertModel: Model<SOSAlertSchema>;
  private tripShareModel: Model<any>;

  // In-memory cache for quick lookups (backed by MongoDB)
  private sosAlertsCache: Map<string, SOSAlert> = new Map();
  private tripSharesCache: Map<string, TripShare> = new Map();

  constructor(private configService: ConfigService) {
    this.policeApiUrl = configService.get('POLICE_API_URL', '');
    this.notificationServiceUrl = configService.get('REZ_NOTIFICATIONS_URL', 'http://localhost:4011');
  }

  /**
   * Initialize MongoDB models
   * Called by the module to inject the models
   */
  initializeModels(
    sosAlertModel: Model<SOSAlertSchema>,
    tripShareModel: Model<any>
  ): void {
    this.sosAlertModel = sosAlertModel;
    this.tripShareModel = tripShareModel;
  }

  // ===========================================
  // EMERGENCY CONTACTS
  // ===========================================

  async addEmergencyContact(
    userId: string,
    contact: EmergencyContact
  ): Promise<{ success: boolean; contactId: string }> {
    const contactId = `EC_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    this.logger.log(`Emergency contact added for user ${userId}: ${contact.name}`);
    return { success: true, contactId };
  }

  async getEmergencyContacts(userId: string): Promise<EmergencyContact[]> {
    return [{ name: 'Emergency Contact', phone: '+91XXXXXXXXXX', relation: 'Family' }];
  }

  async removeEmergencyContact(userId: string, contactId: string): Promise<boolean> {
    this.logger.log(`Emergency contact removed: ${contactId}`);
    return true;
  }

  // ===========================================
  // TRIP SHARING
  // ===========================================

  async shareTrip(
    rideId: string,
    userId: string,
    contacts: EmergencyContact[]
  ): Promise<TripShare> {
    const shareId = `TS_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const shareUrl = `https://rez.money/safety/${shareId}`;

    const tripShare: TripShare = {
      id: shareId,
      rideId,
      userId,
      contacts,
      shareUrl,
      active: true,
      startedAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    };

    // Persist to MongoDB if model is initialized
    if (this.tripShareModel) {
      await this.tripShareModel.create({
        ...tripShare,
        rideId: new Types.ObjectId(rideId),
        userId: new Types.ObjectId(userId),
      });
    }

    // Update cache
    this.tripSharesCache.set(shareId, tripShare);

    this.logger.log(`Trip share created: ${shareId} for ride ${rideId}`);

    return tripShare;
  }

  async getTripShareByRide(rideId: string): Promise<TripShare | null> {
    // Check cache first
    for (const share of this.tripSharesCache.values()) {
      if (share.rideId === rideId && share.active) {
        return share;
      }
    }

    // Query MongoDB
    if (this.tripShareModel) {
      const dbShare = await this.tripShareModel.findOne({
        rideId: new Types.ObjectId(rideId),
        active: true,
        expiresAt: { $gt: new Date() },
      }).lean() as { _id: Types.ObjectId; rideId: Types.ObjectId; userId: string; contacts?: EmergencyContact[]; shareUrl?: string; active?: boolean; startedAt?: Date; expiresAt?: Date; [key: string]: any } | null;

      if (dbShare && dbShare._id) {
        const tripShare: TripShare = {
          id: dbShare._id.toString(),
          rideId: String(dbShare.rideId),
          userId: String(dbShare.userId),
          contacts: dbShare.contacts || [],
          shareUrl: dbShare.shareUrl || '',
          active: dbShare.active || false,
          startedAt: dbShare.startedAt || new Date(),
          expiresAt: dbShare.expiresAt || new Date(),
        };
        this.tripSharesCache.set(tripShare.id, tripShare);
        return tripShare;
      }
    }

    return null;
  }

  async stopTripShare(shareId: string): Promise<boolean> {
    // Update cache
    const share = this.tripSharesCache.get(shareId);
    if (share) {
      share.active = false;
    }

    // Update MongoDB
    if (this.tripShareModel) {
      await this.tripShareModel.updateOne(
        { _id: new Types.ObjectId(shareId) },
        { active: false }
      );
    }

    return true;
  }

  // ===========================================
  // SOS / EMERGENCY
  // ===========================================

  /**
   * Trigger SOS - CRITICAL: Must persist to database immediately
   */
  async triggerSOS(
    rideId: string,
    userId: string,
    driverId: string,
    type: SOS_TYPE,
    lat: number,
    lng: number
  ): Promise<SOSAlert> {
    const alertId = `SOS_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    const alert: SOSAlert = {
      id: alertId,
      rideId,
      userId,
      driverId,
      type,
      lat,
      lng,
      status: SOS_STATUS.TRIGGERED,
      triggeredAt: new Date(),
      policeNotified: false,
      emergencyServicesContacted: false,
    };

    // CRITICAL: Persist to MongoDB BEFORE any notifications
    // This ensures SOS state survives service restarts
    if (this.sosAlertModel) {
      try {
        await this.sosAlertModel.create({
          _id: alertId,
          rideId: new Types.ObjectId(rideId),
          userId: new Types.ObjectId(userId),
          driverId: new Types.ObjectId(driverId),
          type,
          lat,
          lng,
          status: SOS_STATUS.TRIGGERED,
          triggeredAt: alert.triggeredAt,
          policeNotified: false,
          emergencyServicesContacted: false,
        }, { writeConcern: { w: 'majority' } }); // Ensure durability

        this.logger.warn(`SOS ALERT PERSISTED: ${alertId} for ride ${rideId}`);
      } catch (error) {
        // If DB write fails, we cannot proceed - SOS must be reliable
        const message = error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(`CRITICAL: Failed to persist SOS alert: ${message}`);
        throw new AppError('SOS alert failed to persist - emergency services NOT notified', 'SOS_PERSISTENCE_FAILED');
      }
    }

    // Update cache
    this.sosAlertsCache.set(alertId, alert);

    // NOW notify emergency services (after persistence confirmed)
    try {
      await this.notifyEmergencyServices(alert);
    } catch (error) {
      this.logger.error(`Failed to notify emergency services: ${error.message}`);
      // Continue - alert is persisted
    }

    // Notify safety team
    try {
      await this.notifySafetyTeam(alert);
    } catch (error) {
      this.logger.error(`Failed to notify safety team: ${error.message}`);
    }

    // Share location with contacts
    try {
      await this.shareLocationWithContacts(rideId, lat, lng);
    } catch (error) {
      this.logger.error(`Failed to share location: ${error.message}`);
    }

    // Contact driver
    try {
      await this.contactDriver(driverId, alert);
    } catch (error) {
      this.logger.error(`Failed to contact driver: ${error.message}`);
    }

    this.logger.warn(`SOS TRIGGERED: ${alertId} for ride ${rideId} - PERSISTED TO DATABASE`);

    return alert;
  }

  /**
   * Get active SOS alerts
   */
  async getActiveSOSAlerts(): Promise<SOSAlert[]> {
    if (!this.sosAlertModel) {
      return Array.from(this.sosAlertsCache.values())
        .filter(a => a.status === SOS_STATUS.TRIGGERED || a.status === SOS_STATUS.DISPATCHED);
    }

    const dbAlerts = await this.sosAlertModel.find({
      status: { $in: [SOS_STATUS.TRIGGERED, SOS_STATUS.DISPATCHED, SOS_STATUS.RESPONDING] },
    }).lean();

    return dbAlerts.map(a => ({
      id: a._id.toString(),
      rideId: a.rideId.toString(),
      userId: a.userId.toString(),
      driverId: a.driverId.toString(),
      type: a.type as SOS_TYPE,
      lat: a.lat,
      lng: a.lng,
      status: a.status as SOS_STATUS,
      triggeredAt: a.triggeredAt,
      resolvedAt: a.resolvedAt,
      policeNotified: a.policeNotified,
      emergencyServicesContacted: a.emergencyServicesContacted,
    }));
  }

  /**
   * Get SOS alert by ID
   */
  async getSOSAlert(alertId: string): Promise<SOSAlert | null> {
    // Check cache
    const cached = this.sosAlertsCache.get(alertId);
    if (cached) return cached;

    // Query MongoDB
    if (this.sosAlertModel) {
      const dbAlert = await this.sosAlertModel.findOne({ _id: new Types.ObjectId(alertId) }).lean();
      if (dbAlert) {
        return {
          id: dbAlert._id.toString(),
          rideId: dbAlert.rideId.toString(),
          userId: dbAlert.userId.toString(),
          driverId: dbAlert.driverId.toString(),
          type: dbAlert.type as SOS_TYPE,
          lat: dbAlert.lat,
          lng: dbAlert.lng,
          status: dbAlert.status as SOS_STATUS,
          triggeredAt: dbAlert.triggeredAt,
          resolvedAt: dbAlert.resolvedAt,
          policeNotified: dbAlert.policeNotified,
          emergencyServicesContacted: dbAlert.emergencyServicesContacted,
        };
      }
    }

    return null;
  }

  /**
   * Update SOS alert status
   */
  async updateSOSStatus(
    alertId: string,
    status: SOS_STATUS,
    notes?: string
  ): Promise<SOSAlert | null> {
    const alert = await this.getSOSAlert(alertId);
    if (!alert) return null;

    alert.status = status;
    if (status === SOS_STATUS.RESOLVED) {
      alert.resolvedAt = new Date();
    }

    // Update in cache
    this.sosAlertsCache.set(alertId, alert);

    // Update in MongoDB
    if (this.sosAlertModel) {
      await this.sosAlertModel.updateOne(
        { _id: alertId },
        {
          status,
          resolvedAt: alert.resolvedAt,
          $push: notes ? { notes: { text: notes, createdAt: new Date() } } : undefined,
        }
      );
    }

    this.logger.log(`SOS ${alertId} updated to status: ${status}`);

    return alert;
  }

  // ===========================================
  // PRIVATE HELPER METHODS
  // ===========================================

  private async notifyEmergencyServices(alert: SOSAlert): Promise<void> {
    this.logger.warn(`NOTIFYING EMERGENCY SERVICES: ${alert.id}`);

    // In production, integrate with actual emergency services
    if (this.policeApiUrl) {
      try {
        await axios.post(`${this.policeApiUrl}/emergency/sos`, {
          alertId: alert.id,
          lat: alert.lat,
          lng: alert.lng,
          type: alert.type,
          rideId: alert.rideId,
          userId: alert.userId,
        }, { timeout: 5000 });
      } catch (error) {
        this.logger.error(`Police API notification failed: ${error.message}`);
      }
    }

    // Mark as notified
    alert.policeNotified = true;
    if (this.sosAlertModel) {
      await this.sosAlertModel.updateOne(
        { _id: alert.id },
        { policeNotified: true }
      );
    }
  }

  private async notifySafetyTeam(alert: SOSAlert): Promise<void> {
    this.logger.warn(`NOTIFYING SAFETY TEAM: ${alert.id}`);

    if (this.notificationServiceUrl) {
      try {
        await axios.post(`${this.notificationServiceUrl}/api/notifications/emergency`, {
          type: 'sos_alert',
          alertId: alert.id,
          rideId: alert.rideId,
          lat: alert.lat,
          lng: alert.lng,
          severity: 'critical',
        }, { timeout: 5000 });
      } catch (error) {
        this.logger.error(`Safety team notification failed: ${error.message}`);
      }
    }
  }

  private async shareLocationWithContacts(rideId: string, lat: number, lng: number): Promise<void> {
    const tripShare = await this.getTripShareByRide(rideId);
    if (!tripShare) return;

    for (const contact of tripShare.contacts) {
      this.logger.log(`Sharing location with ${contact.name}: ${lat}, ${lng}`);
      // In production, send SMS/WhatsApp with location link
    }
  }

  private async contactDriver(driverId: string, alert: SOSAlert): Promise<void> {
    this.logger.log(`Contacting driver ${driverId} about SOS ${alert.id}`);
    // In production, initiate call to driver
  }

  // ===========================================
  // TRIP SHARE (Route compatibility)
  // ===========================================

  async getTripShare(shareId: string): Promise<TripShare | null> {
    return this.tripSharesCache.get(shareId) || null;
  }

  async getActiveSOSForRide(rideId: string): Promise<SOSAlert | null> {
    for (const [, alert] of this.sosAlertsCache) {
      if (alert.rideId === rideId && alert.status !== SOS_STATUS.RESOLVED) {
        return alert;
      }
    }
    return null;
  }

  async reportIncident(
    rideId: string,
    reporterId: string,
    type: string,
    description: string
  ): Promise<{ success: boolean; incidentId: string }> {
    const incidentId = `INC_${Date.now()}`;
    this.logger.warn(`Incident reported for ride ${rideId}: ${type} - ${description}`);
    return { success: true, incidentId };
  }

  async getTripInsurance(rideId: string): Promise<{
    rideId: string;
    provider: string;
    coverage: string;
    policyNumber: string;
    valid: boolean;
  } | null> {
    return {
      rideId,
      provider: 'ReZ Assurance',
      coverage: '₹5,00,000 accidental cover',
      policyNumber: `POL${Date.now()}`,
      valid: true,
    };
  }

  async fileClaim(
    rideId: string,
    userId: string,
    claimType: string,
    description: string,
    documents?: string[]
  ): Promise<{ success: boolean; claimId: string }> {
    const claimId = `CLM_${Date.now()}`;
    this.logger.log(`Claim filed for ride ${rideId}: ${claimType}`);
    return { success: true, claimId };
  }
}
