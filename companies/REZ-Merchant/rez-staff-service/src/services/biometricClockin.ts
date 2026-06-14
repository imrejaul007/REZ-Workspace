/**
 * Biometric & Geo-fence Staff Clock-in Service
 * Supports fingerprint, face recognition, and location-based attendance
 */

import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BiometricData {
  type: 'fingerprint' | 'face' | 'iris';
  template: string; // Encrypted biometric template
  enrolledAt: Date;
  lastUsed?: Date;
  quality: number; // 0-100
}

export interface GeoFence {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number; // meters
  storeId: string;
  isActive: boolean;
}

export interface ClockInRecord {
  id: string;
  staffId: string;
  storeId: string;
  clockIn: {
    time: Date;
    method: 'fingerprint' | 'face' | 'pin' | 'qr' | 'geofence' | 'manual';
    location?: {
      latitude: number;
      longitude: number;
      accuracy: number;
    };
    deviceId?: string;
    geoFenceId?: string;
    withinGeoFence: boolean;
  };
  clockOut?: {
    time: Date;
    method: 'fingerprint' | 'face' | 'pin' | 'qr' | 'geofence' | 'manual';
    location?: {
      latitude: number;
      longitude: number;
      accuracy: number;
    };
    deviceId?: string;
    geoFenceId?: string;
    withinGeoFence: boolean;
  };
  totalHours: number;
  breakMinutes: number;
  status: 'active' | 'completed' | 'missed_clock_out';
  notes?: string;
}

export interface StaffBiometric {
  staffId: string;
  biometrics: BiometricData[];
  pin?: string; // Hashed
  qrCode?: string; // For QR-based clock-in
  emergencyContacts: Array<{
    name: string;
    phone: string;
    relationship: string;
  }>;
  verificationThreshold: number; // 0-100, minimum match score
}

// ── MongoDB Models ─────────────────────────────────────────────────────────────

const StaffBiometricSchema = new Schema({
  staffId: { type: String, required: true, unique: true, index: true },
  biometrics: [{
    type: { type: String, enum: ['fingerprint', 'face', 'iris'] },
    template: { type: String, required: true },
    enrolledAt: { type: Date, default: Date.now },
    lastUsed: Date,
    quality: { type: Number, default: 80 },
  }],
  pin: String, // Hashed
  qrCode: String,
  emergencyContacts: [{
    name: String,
    phone: String,
    relationship: String,
  }],
  verificationThreshold: { type: Number, default: 80 },
}, { timestamps: true });

const GeoFenceSchema = new Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  radius: { type: Number, required: true }, // meters
  storeId: { type: String, required: true, index: true },
  isActive: { type: Boolean, default: true },
  polygon?: { // For complex shapes
    type: { type: String, enum: ['polygon'], default: 'polygon' },
    coordinates: [[Number]], // Array of [lat, lng] pairs
  },
}, { timestamps: true });

GeoFenceSchema.index({ storeId: 1, isActive: 1 });
GeoFenceSchema.index({ latitude: 1, longitude: 1 });

const ClockInRecordSchema = new Schema({
  id: { type: String, required: true, unique: true },
  staffId: { type: String, required: true, index: true },
  storeId: { type: String, required: true, index: true },
  clockIn: {
    time: { type: Date, required: true },
    method: { type: String, enum: ['fingerprint', 'face', 'pin', 'qr', 'geofence', 'manual'] },
    location: {
      latitude: Number,
      longitude: Number,
      accuracy: Number,
    },
    deviceId: String,
    geoFenceId: String,
    withinGeoFence: Boolean,
  },
  clockOut: {
    time: Date,
    method: String,
    location: {
      latitude: Number,
      longitude: Number,
      accuracy: Number,
    },
    deviceId: String,
    geoFenceId: String,
    withinGeoFence: Boolean,
  },
  totalHours: Number,
  breakMinutes: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'completed', 'missed_clock_out'], default: 'active' },
  notes: String,
}, { timestamps: true });

ClockInRecordSchema.index({ staffId: 1, clockIn: -1 });
ClockInRecordSchema.index({ storeId: 1, 'clockIn.time': -1 });

export const StaffBiometric = mongoose.models.StaffBiometric || mongoose.model('StaffBiometric', StaffBiometricSchema);
export const GeoFence = mongoose.models.GeoFence || mongoose.model('GeoFence', GeoFenceSchema);
export const ClockInRecord = mongoose.models.ClockInRecord || mongoose.model('ClockInRecord', ClockInRecordSchema);

// ── Utility Functions ─────────────────────────────────────────────────────────

/**
 * Calculate distance between two points using Haversine formula
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Check if point is inside polygon (Ray casting algorithm)
 */
function isInsidePolygon(point: [number, number], polygon: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];

    const intersect = ((yi > point[1]) !== (yj > point[1])) &&
      (point[0] < (xj - xi) * (point[1] - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

// ── Biometric Clock-in Service ──────────────────────────────────────────────────

class BiometricClockInService {
  // ── Biometric Enrollment ──────────────────────────────────────────────────────

  /**
   * Enroll biometric for staff
   */
  async enrollBiometric(params: {
    staffId: string;
    type: 'fingerprint' | 'face' | 'iris';
    template: string; // Raw biometric data from device
    quality?: number;
  }): Promise<StaffBiometric> {
    let biometric = await StaffBiometric.findOne({ staffId: params.staffId });

    if (!biometric) {
      biometric = new StaffBiometric({
        staffId: params.staffId,
        biometrics: [],
      });
    }

    // Check if already enrolled with this type
    const existingIndex = biometric.biometrics.findIndex(b => b.type === params.type);
    if (existingIndex >= 0) {
      // Update existing
      biometric.biometrics[existingIndex] = {
        type: params.type,
        template: params.template,
        enrolledAt: new Date(),
        quality: params.quality || 80,
      };
    } else {
      // Add new
      biometric.biometrics.push({
        type: params.type,
        template: params.template,
        enrolledAt: new Date(),
        quality: params.quality || 80,
      });
    }

    await biometric.save();
    return biometric;
  }

  /**
   * Verify biometric
   */
  async verifyBiometric(params: {
    staffId: string;
    type: 'fingerprint' | 'face' | 'iris';
    template: string;
  }): Promise<{ verified: boolean; score: number }> {
    const biometric = await StaffBiometric.findOne({ staffId: params.staffId });
    if (!biometric) {
      return { verified: false, score: 0 };
    }

    const enrolled = biometric.biometrics.find(b => b.type === params.type);
    if (!enrolled) {
      return { verified: false, score: 0 };
    }

    // In production, this would use a proper biometric matching library
    // For now, we'll do a simple comparison
    const score = this.calculateMatchScore(params.template, enrolled.template);
    const verified = score >= biometric.verificationThreshold;

    // Update last used
    if (verified) {
      enrolled.lastUsed = new Date();
      await biometric.save();
    }

    return { verified, score };
  }

  /**
   * Simple match score calculation (placeholder for real biometric SDK)
   */
  private calculateMatchScore(template1: string, template2: string): number {
    // This would use actual biometric matching algorithm
    // For demo, return 100 if templates are identical, otherwise lower
    if (template1 === template2) return 100;

    // Calculate similarity
    let matches = 0;
    const len = Math.min(template1.length, template2.length);
    for (let i = 0; i < len; i++) {
      if (template1[i] === template2[i]) matches++;
    }
    return Math.round((matches / len) * 100);
  }

  /**
   * Set PIN for staff
   */
  async setPin(staffId: string, pin: string): Promise<void> {
    let biometric = await StaffBiometric.findOne({ staffId });

    if (!biometric) {
      biometric = new StaffBiometric({ staffId, biometrics: [] });
    }

    biometric.pin = await bcrypt.hash(pin, 10);
    await biometric.save();
  }

  /**
   * Verify PIN
   */
  async verifyPin(staffId: string, pin: string): Promise<boolean> {
    const biometric = await StaffBiometric.findOne({ staffId });
    if (!biometric?.pin) return false;

    return bcrypt.compare(pin, biometric.pin);
  }

  /**
   * Generate QR code for clock-in
   */
  async generateQRCode(staffId: string): Promise<string> {
    let biometric = await StaffBiometric.findOne({ staffId });

    if (!biometric) {
      biometric = new StaffBiometric({ staffId, biometrics: [] });
    }

    const qrCode = uuidv4();
    biometric.qrCode = await bcrypt.hash(qrCode, 10); // Store hash, not plain
    await biometric.save();

    return qrCode; // Return plain code (would be shown as QR)
  }

  /**
   * Verify QR code
   */
  async verifyQRCode(staffId: string, qrCode: string): Promise<boolean> {
    const biometric = await StaffBiometric.findOne({ staffId });
    if (!biometric?.qrCode) return false;

    return bcrypt.compare(qrCode, biometric.qrCode);
  }

  // ── Geo-fence Management ────────────────────────────────────────────────────

  /**
   * Create geo-fence
   */
  async createGeoFence(params: {
    name: string;
    latitude: number;
    longitude: number;
    radius: number;
    storeId: string;
    polygon?: [number, number][];
  }): Promise<GeoFence> {
    const geoFence = new GeoFence({
      id: `gf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...params,
      isActive: true,
    });

    await geoFence.save();
    return geoFence;
  }

  /**
   * Get geo-fences for a store
   */
  async getGeoFencesForStore(storeId: string): Promise<GeoFence[]> {
    return GeoFence.find({ storeId, isActive: true });
  }

  /**
   * Check if location is within any geo-fence for store
   */
  async checkLocation(params: {
    latitude: number;
    longitude: number;
    storeId: string;
  }): Promise<{ withinFence: boolean; geoFence?: GeoFence; distance?: number }> {
    const geoFences = await this.getGeoFencesForStore(params.storeId);

    for (const fence of geoFences) {
      // Check circular geo-fence
      if (fence.radius) {
        const distance = calculateDistance(
          params.latitude, params.longitude,
          fence.latitude, fence.longitude
        );

        if (distance <= fence.radius) {
          return { withinFence: true, geoFence: fence, distance };
        }
      }

      // Check polygon geo-fence
      if (fence.polygon?.coordinates) {
        if (isInsidePolygon([params.latitude, params.longitude], fence.polygon.coordinates[0])) {
          return { withinFence: true, geoFence: fence };
        }
      }
    }

    return { withinFence: false };
  }

  // ── Clock In/Out ────────────────────────────────────────────────────────────

  /**
   * Clock in
   */
  async clockIn(params: {
    staffId: string;
    storeId: string;
    method: 'fingerprint' | 'face' | 'pin' | 'qr' | 'geofence' | 'manual';
    location?: { latitude: number; longitude: number; accuracy: number };
    deviceId?: string;
    biometricTemplate?: string;
    pin?: string;
    qrCode?: string;
  }): Promise<ClockInRecord> {
    // Verify if method requires verification
    if (params.method === 'fingerprint' || params.method === 'face') {
      if (!params.biometricTemplate) {
        throw new Error('Biometric template required for biometric clock-in');
      }
      const verified = await this.verifyBiometric({
        staffId: params.staffId,
        type: params.method,
        template: params.biometricTemplate,
      });
      if (!verified.verified) {
        throw new Error('Biometric verification failed');
      }
    }

    if (params.method === 'pin') {
      if (!params.pin) throw new Error('PIN required');
      const valid = await this.verifyPin(params.staffId, params.pin);
      if (!valid) throw new Error('Invalid PIN');
    }

    if (params.method === 'qr') {
      if (!params.qrCode) throw new Error('QR code required');
      const valid = await this.verifyQRCode(params.staffId, params.qrCode);
      if (!valid) throw new Error('Invalid QR code');
    }

    // Check geo-fence if location provided
    let withinGeoFence = false;
    let geoFenceId: string | undefined;

    if (params.location) {
      const geoCheck = await this.checkLocation({
        latitude: params.location.latitude,
        longitude: params.location.longitude,
        storeId: params.storeId,
      });
      withinGeoFence = geoCheck.withinFence;
      geoFenceId = geoCheck.geoFence?.id;
    }

    // Check for existing active clock-in
    const existing = await ClockInRecord.findOne({
      staffId: params.staffId,
      status: 'active',
    });

    if (existing) {
      throw new Error('Already clocked in. Please clock out first.');
    }

    // Create clock-in record
    const record = new ClockInRecord({
      id: `ci_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      staffId: params.staffId,
      storeId: params.storeId,
      clockIn: {
        time: new Date(),
        method: params.method,
        location: params.location,
        deviceId: params.deviceId,
        geoFenceId,
        withinGeoFence,
      },
      status: 'active',
    });

    await record.save();
    return record;
  }

  /**
   * Clock out
   */
  async clockOut(params: {
    staffId: string;
    method: 'fingerprint' | 'face' | 'pin' | 'qr' | 'geofence' | 'manual';
    location?: { latitude: number; longitude: number; accuracy: number };
    deviceId?: string;
    biometricTemplate?: string;
    pin?: string;
    qrCode?: string;
    notes?: string;
  }): Promise<ClockInRecord> {
    // Find active clock-in
    const record = await ClockInRecord.findOne({
      staffId: params.staffId,
      status: 'active',
    });

    if (!record) {
      throw new Error('Not clocked in');
    }

    // Verify method if needed
    if (params.method === 'fingerprint' || params.method === 'face') {
      if (!params.biometricTemplate) throw new Error('Biometric template required');
      const verified = await this.verifyBiometric({
        staffId: params.staffId,
        type: params.method,
        template: params.biometricTemplate,
      });
      if (!verified.verified) throw new Error('Biometric verification failed');
    }

    if (params.method === 'pin') {
      if (!params.pin) throw new Error('PIN required');
      const valid = await this.verifyPin(params.staffId, params.pin);
      if (!valid) throw new Error('Invalid PIN');
    }

    if (params.method === 'qr') {
      if (!params.qrCode) throw new Error('QR code required');
      const valid = await this.verifyQRCode(params.staffId, params.qrCode);
      if (!valid) throw new Error('Invalid QR code');
    }

    // Check geo-fence
    let withinGeoFence = false;
    let geoFenceId: string | undefined;

    if (params.location) {
      const geoCheck = await this.checkLocation({
        latitude: params.location.latitude,
        longitude: params.location.longitude,
        storeId: record.storeId,
      });
      withinGeoFence = geoCheck.withinFence;
      geoFenceId = geoCheck.geoFence?.id;
    }

    // Update record
    record.clockOut = {
      time: new Date(),
      method: params.method,
      location: params.location,
      deviceId: params.deviceId,
      geoFenceId,
      withinGeoFence,
    };

    // Calculate hours
    const clockInTime = record.clockIn.time.getTime();
    const clockOutTime = record.clockOut.time.getTime();
    const totalMs = clockOutTime - clockInTime;
    record.totalHours = Math.round((totalMs / (1000 * 60 * 60)) * 100) / 100;

    record.status = 'completed';
    record.notes = params.notes;

    await record.save();
    return record;
  }

  /**
   * Get attendance records
   */
  async getAttendance(params: {
    staffId?: string;
    storeId?: string;
    fromDate?: Date;
    toDate?: Date;
    status?: 'active' | 'completed' | 'missed_clock_out';
  }): Promise<ClockInRecord[]> {
    const query: any = {};

    if (params.staffId) query.staffId = params.staffId;
    if (params.storeId) query.storeId = params.storeId;
    if (params.status) query.status = params.status;

    if (params.fromDate || params.toDate) {
      query['clockIn.time'] = {};
      if (params.fromDate) query['clockIn.time'].$gte = params.fromDate;
      if (params.toDate) query['clockIn.time'].$lte = params.toDate;
    }

    return ClockInRecord.find(query).sort({ 'clockIn.time': -1 });
  }

  /**
   * Get current status
   */
  async getCurrentStatus(staffId: string): Promise<{
    isClockedIn: boolean;
    record?: ClockInRecord;
    hoursToday: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const active = await ClockInRecord.findOne({
      staffId,
      status: 'active',
    });

    const todayRecords = await ClockInRecord.find({
      staffId,
      'clockIn.time': { $gte: today },
    });

    const hoursToday = todayRecords.reduce((sum, r) => sum + (r.totalHours || 0), 0);

    return {
      isClockedIn: !!active,
      record: active || undefined,
      hoursToday: Math.round(hoursToday * 100) / 100,
    };
  }

  /**
   * Mark missed clock-outs (runs daily)
   */
  async markMissedClockOuts(): Promise<number> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(23, 59, 59, 999);

    const result = await ClockInRecord.updateMany({
      status: 'active',
      'clockIn.time': { $lt: yesterday },
    }, {
      status: 'missed_clock_out',
      $set: { totalHours: 0 },
    });

    return result.modifiedCount;
  }

  // ── Reports ────────────────────────────────────────────────────────────────

  /**
   * Get attendance summary
   */
  async getAttendanceSummary(params: {
    staffId: string;
    fromDate: Date;
    toDate: Date;
  }): Promise<{
    totalDays: number;
    daysWorked: number;
    totalHours: number;
    avgHoursPerDay: number;
    lateArrivals: number;
    earlyLeaves: number;
    geoFenceViolations: number;
  }> {
    const records = await this.getAttendance({
      staffId: params.staffId,
      fromDate: params.fromDate,
      toDate: params.toDate,
      status: 'completed',
    });

    const daysWorked = records.length;
    const totalHours = records.reduce((sum, r) => sum + (r.totalHours || 0), 0);
    const lateArrivals = records.filter(r => {
      const hour = r.clockIn.time.getHours();
      return hour >= 10; // Late if after 10 AM
    }).length;
    const earlyLeaves = records.filter(r => {
      if (!r.clockOut?.time) return false;
      const hour = r.clockOut.time.getHours();
      return hour < 18; // Early if before 6 PM
    }).length;
    const geoFenceViolations = records.filter(r =>
      r.clockIn.withinGeoFence === false ||
      (r.clockOut && r.clockOut.withinGeoFence === false)
    ).length;

    // Calculate total days in period
    const msPerDay = 24 * 60 * 60 * 1000;
    const totalDays = Math.ceil((params.toDate.getTime() - params.fromDate.getTime()) / msPerDay);

    return {
      totalDays,
      daysWorked,
      totalHours: Math.round(totalHours * 100) / 100,
      avgHoursPerDay: daysWorked > 0 ? Math.round((totalHours / daysWorked) * 100) / 100 : 0,
      lateArrivals,
      earlyLeaves,
      geoFenceViolations,
    };
  }
}

export const biometricClockInService = new BiometricClockInService();
export default biometricClockInService;
