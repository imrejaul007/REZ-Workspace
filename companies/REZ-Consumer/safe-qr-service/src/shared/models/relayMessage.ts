import mongoose, { Schema, Document, Model } from 'mongoose';

// ==========================================
// RELAY MESSAGE DOCUMENT INTERFACE
// ==========================================

export interface IRelayMessage extends Document {
 messageId: string;
 sessionId: string;
 senderId: string;
 senderRole: 'finder' | 'owner' | 'system';
 content: string;
 type: 'text' | 'template' | 'location' | 'system';
 templateId?: string;
 locationData?: {
   lat: number;
   lng: number;
   address?: string;
 };
 read: boolean;
 isFlagged: boolean;
 flags: Array<{
   type: 'spam' | 'abuse' | 'reported' | 'suspicious';
   by: string;
   reason?: string;
   at: Date;
 }>;
 karmaAwarded: boolean;
 expiresAt: Date;
 createdAt: Date;
}

// ==========================================
// RELAY MESSAGE SCHEMA
// ==========================================

const RelayMessageSchema = new Schema<IRelayMessage>(
 {
   messageId: {
     type: String,
     required: true,
     unique: true,
     index: true,
   },
   sessionId: {
     type: String,
     required: true,
     index: true,
   },
   senderId: {
     type: String,
     required: true,
     index: true,
   },
   senderRole: {
     type: String,
     enum: ['finder', 'owner', 'system'],
     required: true,
   },
   content: {
     type: String,
     required: true,
   },
   type: {
     type: String,
     enum: ['text', 'template', 'location', 'system'],
     default: 'text',
   },
   templateId: {
     type: String,
   },
   locationData: {
     lat: Number,
     lng: Number,
     address: String,
   },
   read: {
     type: Boolean,
     default: false,
   },
   isFlagged: {
     type: Boolean,
     default: false,
     index: true,
   },
   flags: [
     {
       type: {
         type: String,
         enum: ['spam', 'abuse', 'reported', 'suspicious'],
       },
       by: String,
       reason: String,
       at: { type: Date, default: Date.now },
     },
   ],
   karmaAwarded: {
     type: Boolean,
     default: false,
   },
   expiresAt: {
     type: Date,
     required: true,
   },
 },
 {
   timestamps: { createdAt: true, updatedAt: false },
   collection: 'relay_messages',
 }
);

// ==========================================
// INDEXES
// ==========================================

RelayMessageSchema.index({ sessionId: 1, createdAt: -1 });
RelayMessageSchema.index({ senderId: 1, createdAt: -1 });
RelayMessageSchema.index({ isFlagged: 1, createdAt: -1 });
RelayMessageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL for auto-delete

// ==========================================
// METHODS
// ==========================================

RelayMessageSchema.methods.markAsRead = function () {
 this.read = true;
 return this.save();
};

RelayMessageSchema.methods.flag = function (flaggedBy: string, type: string, reason?: string) {
 this.isFlagged = true;
 this.flags.push({
   type: type as unknown,
   by: flaggedBy,
   reason,
   at: new Date(),
 });
 return this.save();
};

RelayMessageSchema.methods.markKarmaAwarded = function () {
 this.karmaAwarded = true;
 return this.save();
};

// ==========================================
// STATICS
// ==========================================

RelayMessageSchema.statics.findBySession = function (
 sessionId: string,
 limit = 50,
 before?: Date
) {
 const query: Record<string, unknown> = { sessionId };
 if (before) {
   query.createdAt = { $lt: before };
 }
 return this.find(query).sort({ createdAt: -1 }).limit(limit);
};

RelayMessageSchema.statics.getUnreadCount = function (sessionId: string, userId: string) {
 return this.countDocuments({
   sessionId,
   read: false,
   senderId: { $ne: userId },
 });
};

RelayMessageSchema.statics.markSessionRead = function (sessionId: string, userId: string) {
 return this.updateMany(
   {
     sessionId,
     senderId: { $ne: userId },
     read: false,
   },
   {
     $set: { read: true },
   }
 );
};

RelayMessageSchema.statics.getFlaggedMessages = function (limit = 100) {
 return this.find({ isFlagged: true })
   .sort({ createdAt: -1 })
   .limit(limit);
};

// ==========================================
// EXPORT
// ==========================================

export const RelayMessage: Model<IRelayMessage> = mongoose.model<IRelayMessage>('RelayMessage', RelayMessageSchema);
