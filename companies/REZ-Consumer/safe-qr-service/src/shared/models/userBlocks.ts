import mongoose, { Schema, Document, Model } from 'mongoose';

// ==========================================
// USER BLOCKS DOCUMENT INTERFACE
// ==========================================

export interface IUserBlock extends Document {
 userId: string;
 blockedId: string;
 reason?: string;
 createdAt: Date;
}

// ==========================================
// USER BLOCKS SCHEMA
// ==========================================

const UserBlocksSchema = new Schema<IUserBlock>(
 {
   userId: {
     type: String,
     required: true,
     index: true,
   },
   blockedId: {
     type: String,
     required: true,
     index: true,
   },
   reason: {
     type: String,
     enum: ['spam', 'abuse', 'harassment', 'other'],
   },
 },
 {
   timestamps: { createdAt: true, updatedAt: false },
   collection: 'user_blocks',
 }
);

// Compound unique index
UserBlocksSchema.index({ userId: 1, blockedId: 1 }, { unique: true });

// ==========================================
// STATICS
// ==========================================

UserBlocksSchema.statics.isBlocked = async function (userId: string, blockedId: string): Promise<boolean> {
 const block = await this.findOne({ userId, blockedId });
 return !!block;
};

UserBlocksSchema.statics.getBlockedUsers = function (userId: string) {
 return this.find({ userId }).sort({ createdAt: -1 });
};

UserBlocksSchema.statics.blockUser = function (userId: string, blockedId: string, reason?: string) {
 return this.findOneAndUpdate(
   { userId, blockedId },
   { userId, blockedId, reason },
   { upsert: true, new: true }
 );
};

UserBlocksSchema.statics.unblockUser = function (userId: string, blockedId: string) {
 return this.deleteOne({ userId, blockedId });
};

// ==========================================
// EXPORT
// ==========================================

export const UserBlock: Model<IUserBlock> = mongoose.model<IUserBlock>('UserBlock', UserBlocksSchema);
