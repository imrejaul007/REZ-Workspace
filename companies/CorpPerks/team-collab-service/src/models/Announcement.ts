import mongoose, { Schema, Document, Model } from 'mongoose';
import { IAnnouncement, AnnouncementCategory, AnnouncementPriority } from '../types/index.js';

export interface AnnouncementDocument extends Omit<IAnnouncement, '_id'>, Document {}

const attachmentSchema = new Schema({
  id: { type: String, required: true },
  filename: { type: String, required: true },
  url: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
  uploadedBy: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
}, { _id: false });

const reactionSchema = new Schema({
  emoji: { type: String, required: true },
  odId: { type: String, required: true },
  userName: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

const announcementSchema = new Schema<AnnouncementDocument>(
  {
    announcementId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      maxlength: 200,
    },
    content: {
      type: String,
      required: true,
      maxlength: 50000,
    },
    summary: {
      type: String,
      maxlength: 500,
    },
    category: {
      type: String,
      enum: ['hr', 'company', 'team', 'event', 'policy', 'milestone'] as AnnouncementCategory[],
      required: true,
      index: true,
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'] as AnnouncementPriority[],
      default: 'normal',
    },
    departmentIds: {
      type: [String],
      default: [],
      index: true,
    },
    companyId: {
      type: String,
      required: true,
      index: true,
    },
    authorId: {
      type: String,
      required: true,
    },
    authorName: {
      type: String,
      required: true,
    },
    authorAvatar: {
      type: String,
    },
    attachments: {
      type: [attachmentSchema],
      default: [],
    },
    views: {
      type: Number,
      default: 0,
    },
    viewedBy: {
      type: [String],
      default: [],
    },
    reactions: {
      type: [reactionSchema],
      default: [],
    },
    scheduledFor: {
      type: Date,
    },
    expiresAt: {
      type: Date,
    },
    isPublished: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
announcementSchema.index({ companyId: 1, isPublished: 1, createdAt: -1 });
announcementSchema.index({ category: 1, priority: 1, createdAt: -1 });
announcementSchema.index({ scheduledFor: 1, isPublished: 1 });
announcementSchema.index({ expiresAt: 1, isPublished: 1 });
announcementSchema.index({ companyId: 1, category: 1, priority: 1 });

// Method to add view
announcementSchema.methods.addView = function (userId: string): void {
  if (!this.viewedBy.includes(userId)) {
    this.views += 1;
    this.viewedBy.push(userId);
  }
};

// Method to check if user has viewed
announcementSchema.methods.hasViewed = function (userId: string): boolean {
  return this.viewedBy.includes(userId);
};

// Method to add reaction
announcementSchema.methods.addReaction = function (emoji: string, userId: string, userName: string): void {
  const existingIndex = this.reactions.findIndex((r: { emoji: string; odId: string }) => r.emoji === emoji && r.odId === userId);
  if (existingIndex === -1) {
    this.reactions.push({ emoji, odId: userId, userName, createdAt: new Date() });
  }
};

// Method to remove reaction
announcementSchema.methods.removeReaction = function (emoji: string, odId: string): void {
  this.reactions = this.reactions.filter((r: { emoji: string; odId: string }) => !(r.emoji === emoji && r.odId === odId));
};

// Method to check if announcement is active
announcementSchema.methods.isActive = function (): boolean {
  if (!this.isPublished) return false;
  const now = new Date();
  if (this.scheduledFor && this.scheduledFor > now) return false;
  if (this.expiresAt && this.expiresAt < now) return false;
  return true;
};

// Static method to get announcements for a company
announcementSchema.statics.findByCompany = async function (
  companyId: string,
  options: {
    category?: AnnouncementCategory;
    priority?: AnnouncementPriority;
    departmentId?: string;
    page?: number;
    limit?: number;
    includeExpired?: boolean;
  } = {}
): Promise<{ announcements: AnnouncementDocument[]; total: number }> {
  const { category, priority, departmentId, page = 1, limit = 20, includeExpired = false } = options;
  const query: Record<string, unknown> = { companyId };

  if (category) query.category = category;
  if (priority) query.priority = priority;
  if (departmentId) query.departmentIds = { $in: [departmentId] };
  if (!includeExpired) {
    query.$and = [
      { $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gte: new Date() } }] },
      { $or: [{ scheduledFor: { $exists: false } }, { scheduledFor: { $lte: new Date() } }] },
    ];
  }

  const [announcements, total] = await Promise.all([
    this.find(query)
      .sort({ priority: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    this.countDocuments(query),
  ]);

  return { announcements, total };
};

// Static method to get unread count for user
announcementSchema.statics.getUnreadCount = async function (
  companyId: string,
  viewedBy: string[]
): Promise<number> {
  return this.countDocuments({
    companyId,
    isPublished: true,
    viewedBy: { $nin: [viewedBy] },
    $or: [
      { scheduledFor: { $exists: false } },
      { scheduledFor: { $lte: new Date() } },
    ],
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gte: new Date() } },
    ],
  });
};

// Static method to get announcement stats
announcementSchema.statics.getStats = async function (
  companyId: string
): Promise<{
  totalAnnouncements: number;
  byCategory: Record<AnnouncementCategory, number>;
  totalViews: number;
  avgViewsPerAnnouncement: number;
  topAnnouncements: Array<{ announcementId: string; title: string; views: number }>;
}> {
  const stats = await this.aggregate([
    { $match: { companyId } },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        views: { $sum: '$views' },
      },
    },
  ]);

  const totalAnnouncements = stats.reduce((sum, s) => sum + s.count, 0);
  const totalViews = stats.reduce((sum, s) => sum + s.views, 0);

  const byCategory: Record<AnnouncementCategory, number> = {
    hr: 0,
    company: 0,
    team: 0,
    event: 0,
    policy: 0,
    milestone: 0,
  };

  stats.forEach((s) => {
    byCategory[s._id as AnnouncementCategory] = s.count;
  });

  const topAnnouncements = await this.find({ companyId })
    .sort({ views: -1 })
    .limit(5)
    .select('announcementId title views');

  return {
    totalAnnouncements,
    byCategory,
    totalViews,
    avgViewsPerAnnouncement: totalAnnouncements > 0 ? totalViews / totalAnnouncements : 0,
    topAnnouncements: topAnnouncements.map((a) => ({
      announcementId: a.announcementId,
      title: a.title,
      views: a.views,
    })),
  };
};

export const Announcement: Model<AnnouncementDocument> = mongoose.model<AnnouncementDocument>(
  'Announcement',
  announcementSchema
);
