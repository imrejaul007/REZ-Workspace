import mongoose, { Schema, Document, Model } from 'mongoose';

// ==========================================
// KARMA EVENT DOCUMENT INTERFACE
// ==========================================

export interface IKarmaEvent extends Document {
 eventId: string;
 userId: string;
 eventType: string;
 safeQRId?: string;
 shortcode?: string;
 mode?: string;
 points: number;
 reason?: string;
 metadata?: Record<string, unknown>;
 createdAt: Date;
}

// ==========================================
// KARMA EVENT SCHEMA
// ==========================================

const KarmaEventSchema = new Schema<IKarmaEvent>(
 {
   eventId: {
     type: String,
     required: true,
     unique: true,
     index: true,
   },
   userId: {
     type: String,
     required: true,
     index: true,
   },
   eventType: {
     type: String,
     required: true,
     index: true,
   },
   safeQRId: {
     type: String,
     index: true,
   },
   shortcode: {
     type: String,
     index: true,
   },
   mode: {
     type: String,
     index: true,
   },
   points: {
     type: Number,
     required: true,
   },
   reason: {
     type: String,
   },
   metadata: {
     type: Schema.Types.Mixed,
   },
 },
 {
   timestamps: { createdAt: true, updatedAt: false },
   collection: 'karma_events',
 }
);

// ==========================================
// INDEXES
// ==========================================

KarmaEventSchema.index({ userId: 1, createdAt: -1 });
KarmaEventSchema.index({ eventType: 1, createdAt: -1 });
KarmaEventSchema.index({ safeQRId: 1, createdAt: -1 });
KarmaEventSchema.index({ mode: 1, createdAt: -1 });

// ==========================================
// STATICS
// ==========================================

KarmaEventSchema.statics.findByUser = function (userId: string, limit = 50) {
 return this.find({ userId })
   .sort({ createdAt: -1 })
   .limit(limit);
};

KarmaEventSchema.statics.findByEventType = function (eventType: string, limit = 100) {
 return this.find({ eventType })
   .sort({ createdAt: -1 })
   .limit(limit);
};

KarmaEventSchema.statics.getUserTotal = async function (userId: string): Promise<number> {
 const result = await this.aggregate([
   { $match: { userId } },
   { $group: { _id: null, total: { $sum: '$points' } } },
 ]);
 return result[0]?.total || 0;
};

KarmaEventSchema.statics.getRecentEvents = function (limit = 50) {
 return this.find()
   .sort({ createdAt: -1 })
   .limit(limit);
};

// ==========================================
// EXPORT
// ==========================================

export const KarmaEvent: Model<IKarmaEvent> = mongoose.model<IKarmaEvent>('KarmaEvent', KarmaEventSchema);
