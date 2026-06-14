import mongoose, { Schema, Document, Model } from 'mongoose';

// ==========================================
// SAFE QR DOCUMENT INTERFACE
// ==========================================

export interface ISafeQR extends Document {
 shortcode: string;
 qrId: string;
 mode: string;
 ownerId: string;
 status: 'active' | 'lost' | 'inactive';
 profile: Record<string, unknown>;
 settings: {
   allowMessages: boolean;
   allowContactRequests: boolean;
   shareLocationOnScan: boolean;
   notifyOnScan: boolean;
   autoActivateLost: boolean;
   requireApproval: boolean;
 };
 qrPayload: {
   v: number;
   type: string;
   mode: string;
   id: string;
   shortcode: string;
 };
 stats: {
   totalScans: number;
   uniqueScanners: number;
   totalMessages: number;
   lastScanAt?: Date;
 };
 karma: {
   isRegistered: boolean;
   feedPostId?: string;
 };
 lostModeActivatedAt?: Date;
 createdAt: Date;
 updatedAt: Date;
 expiresAt?: Date | null;
}

// ==========================================
// SAFE QR SCHEMA
// ==========================================

const SafeQRSchema = new Schema<ISafeQR>(
 {
   shortcode: {
     type: String,
     required: true,
     unique: true,
     index: true,
     uppercase: true,
     minlength: 6,
     maxlength: 6,
   },
   qrId: {
     type: String,
     required: true,
     unique: true,
     index: true,
   },
   mode: {
     type: String,
     required: true,
     enum: [
       'pet',
       'personal',
       'device',
       'medical',
       'helmet',
       'child',
       'vehicle',
       'bicycle',
       'key',
       'luggage',
       'home',
       'office',
       'event',
       'student',
       'package',
     ],
     index: true,
   },
   ownerId: {
     type: String,
     required: true,
     index: true,
   },
   status: {
     type: String,
     enum: ['active', 'lost', 'inactive'],
     default: 'active',
     index: true,
   },
   profile: {
     type: Schema.Types.Mixed,
     default: {},
   },
   settings: {
     allowMessages: { type: Boolean, default: true },
     allowContactRequests: { type: Boolean, default: true },
     shareLocationOnScan: { type: Boolean, default: false },
     notifyOnScan: { type: Boolean, default: true },
     autoActivateLost: { type: Boolean, default: false },
     requireApproval: { type: Boolean, default: true },
   },
   qrPayload: {
     v: { type: Number, required: true },
     type: { type: String, required: true },
     mode: { type: String, required: true },
     id: { type: String, required: true },
     shortcode: { type: String, required: true },
   },
   stats: {
     totalScans: { type: Number, default: 0 },
     uniqueScanners: { type: Number, default: 0 },
     totalMessages: { type: Number, default: 0 },
     lastScanAt: { type: Date },
   },
   karma: {
     isRegistered: { type: Boolean, default: false },
     feedPostId: { type: String },
   },
   lostModeActivatedAt: { type: Date },
   expiresAt: { type: Date, default: null },
 },
 {
   timestamps: true,
   collection: 'safe_qrs',
 }
);

// ==========================================
// INDEXES
// ==========================================

SafeQRSchema.index({ ownerId: 1, status: 1 });
SafeQRSchema.index({ mode: 1, status: 1 });
SafeQRSchema.index({ status: 1, expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL for temp QRs

// ==========================================
// METHODS
// ==========================================

SafeQRSchema.methods.incrementScan = function (scannerId?: string) {
 this.stats.totalScans += 1;
 this.stats.lastScanAt = new Date();
 // Note: uniqueScanners tracking requires additional logic
 return this.save();
};

SafeQRSchema.methods.activateLostMode = function () {
 this.status = 'lost';
 this.lostModeActivatedAt = new Date();
 return this.save();
};

SafeQRSchema.methods.deactivateLostMode = function () {
 this.status = 'active';
 this.lostModeActivatedAt = undefined;
 return this.save();
};

// ==========================================
// STATICS
// ==========================================

SafeQRSchema.statics.findByShortcode = function (shortcode: string) {
 return this.findOne({ shortcode: shortcode.toUpperCase() });
};

SafeQRSchema.statics.findByOwner = function (ownerId: string) {
 return this.find({ ownerId }).sort({ createdAt: -1 });
};

SafeQRSchema.statics.findByMode = function (mode: string, status?: string) {
 const query: Record<string, unknown> = { mode };
 if (status) query.status = status;
 return this.find(query).sort({ createdAt: -1 });
};

SafeQRSchema.statics.findLostItems = function (mode?: string) {
 const query: Record<string, unknown> = { status: 'lost' };
 if (mode) query.mode = mode;
 return this.find(query).sort({ lostModeActivatedAt: -1 });
};

// ==========================================
// EXPORT
// ==========================================

export const SafeQR: Model<ISafeQR> = mongoose.model<ISafeQR>('SafeQR', SafeQRSchema);
