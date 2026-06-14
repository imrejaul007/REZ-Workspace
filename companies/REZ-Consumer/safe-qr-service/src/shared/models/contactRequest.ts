import mongoose, { Schema, Document, Model } from 'mongoose';

// ==========================================
// CONTACT REQUEST DOCUMENT INTERFACE
// ==========================================

export interface IContactRequest extends Document {
 requestId: string;
 shortcode: string;
 qrId: string;
 mode: string;
 ownerId: string;
 requesterId?: string;
 requesterName: string;
 requesterPhone?: string;
 message?: string;
 type: 'template' | 'custom';
 templateId?: string;
 status: 'pending' | 'approved' | 'rejected' | 'expired';
 sessionId?: string;
 expiresAt: Date;
 createdAt: Date;
 respondedAt?: Date;
}

// ==========================================
// CONTACT REQUEST SCHEMA
// ==========================================

const ContactRequestSchema = new Schema<IContactRequest>(
 {
   requestId: {
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
   requesterId: {
     type: String,
     index: true,
   },
   requesterName: {
     type: String,
     required: true,
   },
   requesterPhone: {
     type: String,
   },
   message: {
     type: String,
   },
   type: {
     type: String,
     enum: ['template', 'custom'],
     default: 'template',
   },
   templateId: {
     type: String,
   },
   status: {
     type: String,
     enum: ['pending', 'approved', 'rejected', 'expired'],
     default: 'pending',
     index: true,
   },
   sessionId: {
     type: String,
   },
   expiresAt: {
     type: Date,
     required: true,
   },
   respondedAt: {
     type: Date,
   },
 },
 {
   timestamps: { createdAt: true, updatedAt: false },
   collection: 'contact_requests',
 }
);

// ==========================================
// INDEXES
// ==========================================

ContactRequestSchema.index({ ownerId: 1, status: 1, createdAt: -1 });
ContactRequestSchema.index({ qrId: 1, status: 1 });
ContactRequestSchema.index({ requesterId: 1, createdAt: -1 });
ContactRequestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL

// ==========================================
// METHODS
// ==========================================

ContactRequestSchema.methods.approve = function (sessionId: string) {
 this.status = 'approved';
 this.sessionId = sessionId;
 this.respondedAt = new Date();
 return this.save();
};

ContactRequestSchema.methods.reject = function () {
 this.status = 'rejected';
 this.respondedAt = new Date();
 return this.save();
};

ContactRequestSchema.methods.expire = function () {
 this.status = 'expired';
 return this.save();
};

// ==========================================
// STATICS
// ==========================================

ContactRequestSchema.statics.findByOwner = function (ownerId: string, status?: string) {
 const query: Record<string, unknown> = { ownerId };
 if (status) query.status = status;
 return this.find(query).sort({ createdAt: -1 });
};

ContactRequestSchema.statics.findByQR = function (qrId: string, status?: string) {
 const query: Record<string, unknown> = { qrId };
 if (status) query.status = status;
 return this.find(query).sort({ createdAt: -1 });
};

ContactRequestSchema.statics.findPendingByOwner = function (ownerId: string) {
 return this.find({ ownerId, status: 'pending' }).sort({ createdAt: -1 });
};

ContactRequestSchema.statics.expireOldRequests = function () {
 return this.updateMany(
   {
     status: 'pending',
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

export const ContactRequest: Model<IContactRequest> = mongoose.model<IContactRequest>(
 'ContactRequest',
 ContactRequestSchema
);
