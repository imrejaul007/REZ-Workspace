import mongoose, { Schema, Document, Model } from 'mongoose';

// ==========================================
// SCAN EVENT DOCUMENT INTERFACE
// ==========================================

export interface IScanEvent extends Document {
 shortcode: string;
 qrId: string;
 mode: string;
 ownerId: string;
 scannerId?: string;
 scannerIp?: string;
 scannerLocation?: {
   type: string;
   coordinates: [number, number];
 };
 scannerUserAgent?: string;
 action: 'view' | 'contact' | 'lost_reported' | 'emergency' | 'template_sent';
 scanSource: 'app' | 'web' | 'unknown';
 sessionId?: string;
 karmaPointsAwarded?: number;
 createdAt: Date;
}

// ==========================================
// SCAN EVENT SCHEMA
// ==========================================

const ScanEventSchema = new Schema<IScanEvent>(
 {
   shortcode: {
     type: String,
     required: true,
     index: true,
   },
   qrId: {
     type: String,
     required: true,
     index: true,
   },
   mode: {
     type: String,
     required: true,
     index: true,
   },
   ownerId: {
     type: String,
     required: true,
     index: true,
   },
   scannerId: {
     type: String,
     index: true,
   },
   scannerIp: {
     type: String,
   },
   scannerLocation: {
     type: {
       type: String,
       enum: ['Point'],
       default: 'Point',
     },
     coordinates: {
       type: [Number],
       default: [0, 0],
     },
   },
   scannerUserAgent: {
     type: String,
   },
   action: {
     type: String,
     enum: ['view', 'contact', 'lost_reported', 'emergency', 'template_sent'],
     default: 'view',
   },
   scanSource: {
     type: String,
     enum: ['app', 'web', 'unknown'],
     default: 'unknown',
   },
   sessionId: {
     type: String,
     index: true,
   },
   karmaPointsAwarded: {
     type: Number,
   },
 },
 {
   timestamps: { createdAt: true, updatedAt: false },
   collection: 'scan_events',
 }
);

// ==========================================
// INDEXES
// ==========================================

ScanEventSchema.index({ qrId: 1, createdAt: -1 });
ScanEventSchema.index({ ownerId: 1, createdAt: -1 });
ScanEventSchema.index({ mode: 1, createdAt: -1 });
ScanEventSchema.index({ scannerId: 1, createdAt: -1 });
ScanEventSchema.index({ action: 1, createdAt: -1 });
ScanEventSchema.index({ createdAt: -1 });

// TTL index - delete scan events older than 90 days
ScanEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

// Geospatial index for location-based queries
ScanEventSchema.index({ scannerLocation: '2dsphere' });

// ==========================================
// STATICS
// ==========================================

ScanEventSchema.statics.findByQR = function (qrId: string, limit = 100) {
 return this.find({ qrId })
   .sort({ createdAt: -1 })
   .limit(limit);
};

ScanEventSchema.statics.findByOwner = function (ownerId: string, limit = 100) {
 return this.find({ ownerId })
   .sort({ createdAt: -1 })
   .limit(limit);
};

ScanEventSchema.statics.getRecentByMode = function (mode: string, limit = 50) {
 return this.find({ mode })
   .sort({ createdAt: -1 })
   .limit(limit);
};

ScanEventSchema.statics.getStats = async function (qrId: string) {
 const stats = await this.aggregate([
   { $match: { qrId } },
   {
     $group: {
       _id: null,
       totalScans: { $sum: 1 },
       contactScans: {
         $sum: { $cond: [{ $eq: ['$action', 'contact'] }, 1, 0] },
       },
       uniqueScanners: { $addToSet: '$scannerId' },
     },
   },
   {
     $project: {
       totalScans: 1,
       contactScans: 1,
       uniqueScanners: { $size: '$uniqueScanners' },
     },
   },
 ]);
 return stats[0] || { totalScans: 0, contactScans: 0, uniqueScanners: 0 };
};

// ==========================================
// EXPORT
// ==========================================

export const ScanEvent: Model<IScanEvent> = mongoose.model<IScanEvent>('ScanEvent', ScanEventSchema);
