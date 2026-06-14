import { HashtagSet, IHashtagSetDocument } from '../models';
import { logger } from 'utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

export interface CreateHashtagSetInput {
  name: string;
  tags: string[];
  createdBy?: string;
  category?: string;
  isPublic?: boolean;
}

export interface HashtagSetResponse {
  id: string;
  name: string;
  tags: string[];
  usageCount: number;
  createdAt: Date;
  createdBy?: string;
  isPublic: boolean;
  category?: string;
}

// List hashtag sets
export const listHashtagSets = async (
  options: {
    limit?: number;
    offset?: number;
    category?: string;
    createdBy?: string;
    isPublic?: boolean;
  } = {}
): Promise<{ sets: HashtagSetResponse[]; total: number }> => {
  const { limit = 20, offset = 0, category, createdBy, isPublic } = options;

  const query: Record<string, unknown> = {};

  if (category) query.category = category;
  if (createdBy) query.createdBy = createdBy;
  if (isPublic !== undefined) query.isPublic = isPublic;

  const [sets, total] = await Promise.all([
    HashtagSet.find(query).sort({ usageCount: -1, createdAt: -1 }).skip(offset).limit(limit).lean(),
    HashtagSet.countDocuments(query),
  ]);

  return {
    sets: sets.map((s) => ({
      id: s.id,
      name: s.name,
      tags: s.tags,
      usageCount: s.usageCount,
      createdAt: (s as unknown as { createdAt: Date }).createdAt,
      createdBy: s.createdBy,
      isPublic: s.isPublic,
      category: s.category,
    })),
    total,
  };
};

// Create hashtag set
export const createHashtagSet = async (input: CreateHashtagSetInput): Promise<HashtagSetResponse> => {
  const id = uuidv4();

  // Normalize tags
  const normalizedTags = input.tags.map((t) => t.toLowerCase().replace(/^#/, ''));

  const set = new HashtagSet({
    id,
    name: input.name,
    tags: normalizedTags,
    createdBy: input.createdBy,
    category: input.category,
    isPublic: input.isPublic ?? true,
    usageCount: 0,
  });

  await set.save();

  logger.info('Created hashtag set', { id, name: input.name, tagCount: normalizedTags.length });

  return {
    id: set.id,
    name: set.name,
    tags: set.tags,
    usageCount: set.usageCount,
    createdAt: (set as unknown as { createdAt: Date }).createdAt,
    createdBy: set.createdBy,
    isPublic: set.isPublic,
    category: set.category,
  };
};

// Get hashtag set by ID
export const getHashtagSetById = async (id: string): Promise<HashtagSetResponse | null> => {
  const set = await HashtagSet.findOne({ id }).lean();

  if (!set) return null;

  return {
    id: set.id,
    name: set.name,
    tags: set.tags,
    usageCount: set.usageCount,
    createdAt: (set as unknown as { createdAt: Date }).createdAt,
    createdBy: set.createdBy,
    isPublic: set.isPublic,
    category: set.category,
  };
};

// Update hashtag set
export const updateHashtagSet = async (
  id: string,
  updates: Partial<CreateHashtagSetInput>
): Promise<HashtagSetResponse | null> => {
  const updateData: Record<string, unknown> = {};

  if (updates.name) updateData.name = updates.name;
  if (updates.category) updateData.category = updates.category;
  if (updates.isPublic !== undefined) updateData.isPublic = updates.isPublic;
  if (updates.tags) {
    updateData.tags = updates.tags.map((t) => t.toLowerCase().replace(/^#/, ''));
  }

  const set = await HashtagSet.findOneAndUpdate({ id }, { $set: updateData }, { new: true }).lean();

  if (!set) return null;

  return {
    id: set.id,
    name: set.name,
    tags: set.tags,
    usageCount: set.usageCount,
    createdAt: (set as unknown as { createdAt: Date }).createdAt,
    createdBy: set.createdBy,
    isPublic: set.isPublic,
    category: set.category,
  };
};

// Delete hashtag set
export const deleteHashtagSet = async (id: string): Promise<boolean> => {
  const result = await HashtagSet.deleteOne({ id });
  return result.deletedCount > 0;
};

// Increment usage count
export const incrementUsageCount = async (id: string): Promise<void> => {
  await HashtagSet.findOneAndUpdate({ id }, { $inc: { usageCount: 1 } });
};

// Search hashtag sets by name
export const searchHashtagSets = async (
  query: string,
  options: { limit?: number; offset?: number } = {}
): Promise<{ sets: HashtagSetResponse[]; total: number }> => {
  const { limit = 20, offset = 0 } = options;

  const [sets, total] = await Promise.all([
    HashtagSet.find({
      name: { $regex: query, $options: 'i' },
      isPublic: true,
    })
      .sort({ usageCount: -1 })
      .skip(offset)
      .limit(limit)
      .lean(),
    HashtagSet.countDocuments({
      name: { $regex: query, $options: 'i' },
      isPublic: true,
    }),
  ]);

  return {
    sets: sets.map((s) => ({
      id: s.id,
      name: s.name,
      tags: s.tags,
      usageCount: s.usageCount,
      createdAt: (s as unknown as { createdAt: Date }).createdAt,
      createdBy: s.createdBy,
      isPublic: s.isPublic,
      category: s.category,
    })),
    total,
  };
};

// Get popular hashtag sets
export const getPopularHashtagSets = async (limit = 10): Promise<HashtagSetResponse[]> => {
  const sets = await HashtagSet.find({ isPublic: true })
    .sort({ usageCount: -1 })
    .limit(limit)
    .lean();

  return sets.map((s) => ({
    id: s.id,
    name: s.name,
    tags: s.tags,
    usageCount: s.usageCount,
    createdAt: (s as unknown as { createdAt: Date }).createdAt,
    createdBy: s.createdBy,
    isPublic: s.isPublic,
    category: s.category,
  }));
};

// Template hashtag sets
export const TEMPLATE_SETS: Record<string, string[]> = {
  'food-blogger': ['foodie', 'foodporn', 'instafood', 'foodstagram', 'foodphotography', 'homemade', 'yummy', 'delicious', 'foodlover', 'eeeeeats'],
  'fashion-influencer': ['fashion', 'style', 'ootd', 'outfitoftheday', 'streetstyle', 'fashionblogger', 'instafashion', 'fashionista', 'lookoftheday', 'whatiwore'],
  'travel-adventure': ['travel', 'wanderlust', 'travelgram', 'travelphotography', 'instatravel', 'adventure', 'explore', 'nature', 'vacation', 'traveling'],
  'fitness-coach': ['fitness', 'workout', 'gym', 'fitnessmotivation', 'fit', 'health', 'healthy', 'fitnessjourney', 'training', 'bodybuilding'],
  'tech-startup': ['tech', 'technology', 'ai', 'startup', 'innovation', 'digital', 'coding', 'programming', 'developer', 'software'],
  'beauty-guru': ['beauty', 'makeup', 'skincare', 'cosmetics', 'beautyblogger', 'makeupartist', 'skincareaddict', 'glam', 'beautycommunity', 'makeuptutorial'],
  'business-mindset': ['business', 'entrepreneur', 'success', 'motivation', 'mindset', 'hustle', 'goals', 'businessowner', 'entrepreneurlife', 'smallbusiness'],
  'lifestyle-daily': ['lifestyle', 'life', 'love', 'happy', 'beautiful', 'instagood', 'photooftheday', 'picoftheday', 'instadaily', 'follow'],
};

// Initialize template sets
export const initializeTemplateSets = async (): Promise<void> => {
  const existingCount = await HashtagSet.countDocuments();

  if (existingCount > 0) {
    logger.info('Hashtag sets already exist, skipping template initialization');
    return;
  }

  logger.info('Initializing template hashtag sets...');

  const templates = Object.entries(TEMPLATE_SETS).map(([name, tags]) => ({
    id: uuidv4(),
    name,
    tags,
    usageCount: Math.floor(Math.random() * 1000),
    createdBy: 'system',
    isPublic: true,
    category: name.split('-')[0],
  }));

  await HashtagSet.insertMany(templates);

  logger.info(`Initialized ${templates.length} template hashtag sets`);
};