import mongoose, { Schema, Document, Model } from 'mongoose';

// ==========================================
// RELAY SESSION DOCUMENT INTERFACE
// ==========================================

export interface IRelaySession extends Document {
 sessionId: string;
 shortcode: string;
 qrId: string;
 mode: string;
 ownerId: string;
 ownerRead: boolean;
 finderId?: string;
 finderRead: boolean;
 status: 'active' | 'closed' | 'resolved' | 'expired';
 messageCount: number;
 expiresAt: Date;
 createdAt: Date;
 updatedAt: Date;
 closedAt?: Date;
}

// ==========================================
// RELAY SESSION SCHEMA
// ==========================================

const RelaySessionSchema = new Schema<IRelaySession>(
 {
   sessionId: {
     type: String,
     required: true,
     unique: true,
     index: true,
   },
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
   },
   ownerId: {
     type: String,
     required: true,
     index: true,
   },
   ownerRead: {
     type: Boolean,
     default: false,
   },
   finderId: {
     type: String,
     index: true,
   },
   finderRead: {
     type: Boolean,
     default: false,
   },
   status: {
     type: String,
     enum: ['active', 'closed', 'resolved', 'expired'],
     default: 'active',
     index: true,
   },
   messageCount: {
     type: Number,
     default: 0,
   },
   expiresAt: {
     type: Date,
     required: true,
   },
   closedAt: {
     type: Date,
   },
 },
 {
   timestamps: true,
   collection: 'relay_sessions',
 }
);

// ==========================================
// INDEXES
// ==========================================

RelaySessionSchema.index({ ownerId: 1, status: 1 });
RelaySessionSchema.index({ finderId: 1, status: 1 });
RelaySessionSchema.index({ qrId: 1, status: 1 });
RelaySessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL for auto-delete

// ==========================================
// METHODS
// ==========================================

RelaySessionSchema.methods.incrementMessageCount = function () {
 this.messageCount += 1;
 return this.save();
};

RelaySessionSchema.methods.markOwnerRead = function () {
 this.ownerRead = true;
 return this.save();
};

RelaySessionSchema.methods.markFinderRead = function () {
 this.finderRead = true;
 return this.save();
};

RelaySessionSchema.methods.close = function (status: 'closed' | 'resolved' = 'closed') {
 this.status = status;
 this.closedAt = new Date();
 return this.save();
};

// ==========================================
// STATICS
// ==========================================

RelaySessionSchema.statics.findBySessionId = function (sessionId: string) {
 return this.findOne({ sessionId });
};

RelaySessionSchema.statics.findByOwner = function (ownerId: string, status?: string) {
 const query: Record<string, unknown> = { ownerId };
 if (status) query.status = status;
 return this.find(query).sort({ createdAt: -1 });
};

RelaySessionSchema.statics.findByFinder = function (finderId: string) {
 return this.find({ finderId, status: 'active' }).sort({ createdAt: -1 });
};

RelaySessionSchema.statics.findActiveByQR = function (qrId: string) {
 return this.findOne({ qrId, status: 'active' });
};

RelaySessionSchema.statics.expireOldSessions = function () {
 return this.updateMany(
   {
     status: 'active',
     expiresAt: { $lt: new Date() },
   },
   {
     $set: { status: 'expired' },
   }
 );
};

// ==========================================
// EXPORT
// ==========================================

export const RelaySession: Model<IRelaySession> = mongoose.model<IRelaySession>('RelaySession', RelaySessionSchema);
