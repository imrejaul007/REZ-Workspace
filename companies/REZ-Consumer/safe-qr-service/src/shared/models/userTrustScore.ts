import mongoose, { Schema, Document, Model } from 'mongoose';
import { karmaConfig } from '../../config/karma';

// ==========================================
// USER TRUST SCORE DOCUMENT INTERFACE
// ==========================================

export interface IUserTrustScore extends Document {
 userId: string;
 score: number;
 violations: Array<{
   type: 'spam' | 'abuse' | 'false_emergency' | 'harassment' | 'other';
   count: number;
   lastAt: Date;
 }>;
 rateLimits: {
   messagesPerHour: number;
   contactsPerDay: number;
   blockedUntil?: Date;
 };
 updatedAt: Date;
}

// ==========================================
// USER TRUST SCORE SCHEMA
// ==========================================

const UserTrustScoreSchema = new Schema<IUserTrustScore>(
 {
   userId: {
     type: String,
     required: true,
     unique: true,
     index: true,
   },
   score: {
     type: Number,
     min: karmaConfig.trustScore.min,
     max: karmaConfig.trustScore.max,
     default: karmaConfig.trustScore.default,
   },
   violations: [
     {
       type: {
         type: String,
         enum: ['spam', 'abuse', 'false_emergency', 'harassment', 'other'],
       },
       count: { type: Number, default: 1 },
       lastAt: { type: Date, default: Date.now },
     },
   ],
   rateLimits: {
     messagesPerHour: { type: Number, default: 0 },
     contactsPerDay: { type: Number, default: 0 },
     blockedUntil: Date,
   },
 },
 {
   timestamps: { createdAt: false, updatedAt: true },
   collection: 'user_trust_scores',
 }
);

// ==========================================
// METHODS
// ==========================================

UserTrustScoreSchema.methods.addViolation = function (
 type: 'spam' | 'abuse' | 'false_emergency' | 'harassment' | 'other'
) {
 const existing = this.violations.find((v) => v.type === type);
 if (existing) {
   existing.count += 1;
   existing.lastAt = new Date();
 } else {
   this.violations.push({
     type,
     count: 1,
     lastAt: new Date(),
   });
 }

 // Reduce score based on violation type
 const penalties: Record<string, number> = {
   spam: 10,
   abuse: 15,
   false_emergency: 25,
   harassment: 20,
   other: 5,
 };
 this.score = Math.max(0, this.score - (penalties[type] || 5));

 // Block if score too low
 if (this.score < karmaConfig.trustScore.strictBlock) {
   this.rateLimits.blockedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000); // Block for 24 hours
 }

 return this.save();
};

UserTrustScoreSchema.methods.resetRateLimits = function () {
 this.rateLimits.messagesPerHour = 0;
 this.rateLimits.contactsPerDay = 0;
 return this.save();
};

UserTrustScoreSchema.methods.isBlocked = function (): boolean {
 if (!this.rateLimits.blockedUntil) return false;
 if (this.rateLimits.blockedUntil < new Date()) {
   this.rateLimits.blockedUntil = undefined;
   return false;
 }
 return true;
};

UserTrustScoreSchema.methods.getEffectiveRateLimit = function (
 baseLimit: number
): number {
 const score = this.score;
 if (score >= karmaConfig.trustScore.normal) return baseLimit;
 if (score >= karmaConfig.trustScore.moderateLimit) return Math.floor(baseLimit * 0.75);
 return Math.floor(baseLimit * 0.5);
};

// ==========================================
// STATICS
// ==========================================

UserTrustScoreSchema.statics.findByUser = function (userId: string) {
 return this.findOne({ userId });
};

UserTrustScoreSchema.statics.findOrCreate = async function (userId: string) {
 let score = await this.findOne({ userId });
 if (!score) {
   score = new this({ userId });
   await score.save();
 }
 return score;
};

UserTrustScoreSchema.statics.getLowScoreUsers = function (threshold = 25, limit = 50) {
 return this.find({ score: { $lte: threshold } })
   .sort({ score: 1 })
   .limit(limit);
};

// ==========================================
// EXPORT
// ==========================================

export const UserTrustScore: Model<IUserTrustScore> = mongoose.model<IUserTrustScore>(
 'UserTrustScore',
 UserTrustScoreSchema
);
