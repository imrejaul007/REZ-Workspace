import { Hashtag, IHashtag } from '../models';
import { trendingCache, searchCache, hashtagDetailsCache } from '../utils/cache';
import { config } from '../config';
import { logger } from 'utils/logger.js';

export interface HashtagSearchOptions {
  query: string;
  limit?: number;
  category?: string;
  includeBanned?: boolean;
}

export interface HashtagSuggestion {
  tag: string;
  score: number;
  type: 'high' | 'medium' | 'niche';
  reason: string;
  reachEstimate: number;
}

export interface TrendingHashtag extends IHashtag {
  changeRate: number;
  velocity: number;
}

// Generate cache key
const getCacheKey = (prefix: string, params: Record<string, unknown>): string => {
  return `${prefix}:${JSON.stringify(params)}`;
};

// Search hashtags
export const searchHashtags = async (options: HashtagSearchOptions): Promise<IHashtag[]> => {
  const cacheKey = getCacheKey('search', options);
  const cached = searchCache.get(cacheKey);

  if (cached) {
    return cached as IHashtag[];
  }

  const query: Record<string, unknown> = {
    tag: { $regex: options.query, $options: 'i' },
  };

  if (options.category) {
    query.category = options.category;
  }

  if (!options.includeBanned) {
    query.banned = false;
  }

  const hashtags = await Hashtag.find(query)
    .sort({ usageCount: -1, avgEngagement: -1 })
    .limit(options.limit || 20)
    .lean();

  searchCache.set(cacheKey, hashtags, config.cache.searchTtl);

  return hashtags;
};

// Get hashtag details
export const getHashtagDetails = async (tag: string): Promise<IHashtag | null> => {
  const normalizedTag = tag.toLowerCase().replace(/^#/, '');
  const cacheKey = `details:${normalizedTag}`;
  const cached = hashtagDetailsCache.get(cacheKey);

  if (cached) {
    return cached as IHashtag;
  }

  const hashtag = await Hashtag.findOne({ tag: normalizedTag }).lean();

  if (hashtag) {
    hashtagDetailsCache.set(cacheKey, hashtag, config.cache.trendingTtl);
  }

  return hashtag;
};

// Get trending hashtags
export const getTrendingHashtags = async (
  category?: string,
  limit = 20,
  direction: 'up' | 'down' | 'stable' | 'all' = 'up'
): Promise<TrendingHashtag[]> => {
  const cacheKey = getCacheKey('trending', { category, limit, direction });
  const cached = trendingCache.get(cacheKey);

  if (cached) {
    return cached as TrendingHashtag[];
  }

  const query: Record<string, unknown> = {
    trending: true,
  };

  if (category) {
    query.category = category;
  }

  if (direction !== 'all') {
    query.trendingDirection = direction;
  }

  const hashtags = await Hashtag.find(query)
    .sort({ usageCount: -1, avgEngagement: -1 })
    .limit(limit)
    .lean();

  // Calculate change rate and velocity
  const trending: TrendingHashtag[] = hashtags.map((h) => ({
    ...h,
    changeRate: h.trendingDirection === 'up' ? Math.random() * 50 + 10 : Math.random() * 20,
    velocity: h.trendingDirection === 'up' ? Math.random() * 100 + 50 : Math.random() * 30,
  }));

  trendingCache.set(cacheKey, trending, config.cache.trendingTtl);

  return trending;
};

// Suggest hashtags for content
export const suggestHashtags = async (
  content: string,
  type: 'post' | 'reel' | 'story' | 'video' = 'post',
  count = 15,
  includeNiche = true
): Promise<HashtagSuggestion[]> => {
  // Extract keywords from content
  const words = content
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 3);

  const uniqueWords = [...new Set(words)];
  const suggestions: HashtagSuggestion[] = [];

  // Search for matching hashtags
  for (const word of uniqueWords.slice(0, 10)) {
    const hashtags = await Hashtag.find({
      tag: { $regex: word, $options: 'i' },
      banned: false,
    })
      .sort({ avgEngagement: -1 })
      .limit(3)
      .lean();

    for (const h of hashtags) {
      const score = calculateRelevanceScore(h, content);
      const reachEstimate = estimateReach(h, type);

      suggestions.push({
        tag: h.tag,
        score,
        type: classifyHashtag(h),
        reason: generateReason(h, content),
        reachEstimate,
      });
    }
  }

  // Sort by score and return top suggestions
  suggestions.sort((a, b) => b.score - a.score);

  // Add niche hashtags if requested
  if (includeNiche && suggestions.length < count) {
    const nicheHashtags = await getNicheHashtags(content, count - suggestions.length);
    suggestions.push(...nicheHashtags);
  }

  return suggestions.slice(0, count);
};

// Calculate relevance score
const calculateRelevanceScore = (hashtag: IHashtag, content: string): number => {
  const contentWords = content.toLowerCase().split(/\s+/);
  const hashtagTag = hashtag.tag.toLowerCase();

  let score = 0;

  // Exact match bonus
  if (contentWords.some((w) => hashtagTag.includes(w))) {
    score += 50;
  }

  // Usage count factor (normalized)
  score += Math.min(hashtag.usageCount / 100000, 30);

  // Engagement factor (normalized)
  score += Math.min(hashtag.avgEngagement / 1000, 20);

  return Math.min(score, 100);
};

// Classify hashtag type
const classifyHashtag = (hashtag: IHashtag): 'high' | 'medium' | 'niche' => {
  if (hashtag.usageCount > 10000000) return 'high';
  if (hashtag.usageCount > 100000) return 'medium';
  return 'niche';
};

// Estimate reach
const estimateReach = (hashtag: IHashtag, type: string): number => {
  const baseReach = hashtag.usageCount * 0.01;
  const typeMultiplier = {
    post: 1,
    reel: 1.5,
    story: 0.5,
    video: 1.2,
  }[type] || 1;

  return Math.floor(baseReach * typeMultiplier);
};

// Generate reason
const generateReason = (hashtag: IHashtag, content: string): string => {
  const contentWords = content.toLowerCase().split(/\s+/);

  if (contentWords.some((w) => hashtag.tag.includes(w))) {
    return `Directly related to your content topic`;
  }

  if (hashtag.trending) {
    return `Currently trending with ${hashtag.trendingDirection} momentum`;
  }

  if (hashtag.avgEngagement > 5000) {
    return `High engagement hashtag with active community`;
  }

  return `Related to ${hashtag.category || 'general topic'}`;
};

// Get niche hashtags
const getNicheHashtags = async (content: string, count: number): Promise<HashtagSuggestion[]> => {
  const nicheCategories = ['gaming', 'photography', 'fitness', 'food', 'travel', 'fashion', 'art'];

  const selectedCategories = nicheCategories.filter((c) =>
    content.toLowerCase().includes(c)
  );

  if (selectedCategories.length === 0) {
    selectedCategories.push(nicheCategories[Math.floor(Math.random() * nicheCategories.length)]);
  }

  const hashtags = await Hashtag.find({
    category: { $in: selectedCategories },
    banned: false,
    usageCount: { $lt: 100000 },
  })
    .sort({ avgEngagement: -1 })
    .limit(count)
    .lean();

  return hashtags.map((h) => ({
    tag: h.tag,
    score: 30 + Math.random() * 20,
    type: 'niche' as const,
    reason: `Niche hashtag for ${h.category || 'specialized content'}`,
    reachEstimate: Math.floor(h.usageCount * 0.005),
  }));
};

// Check banned hashtags
export const checkBannedHashtags = async (hashtags: string[]): Promise<{
  banned: string[];
  valid: string[];
}> => {
  const normalized = hashtags.map((h) => h.toLowerCase().replace(/^#/, ''));

  const found = await Hashtag.find({ tag: { $in: normalized } }).lean();

  const banned = found.filter((h) => h.banned).map((h) => h.tag);
  const valid = normalized.filter((tag) => !banned.includes(tag));

  return { banned, valid };
};

// Analyze content for hashtags
export const analyzeContent = async (
  content: string,
  title?: string,
  imageDescription?: string,
  targetAudience?: string
): Promise<{
  suggestions: HashtagSuggestion[];
  category: string;
  sentiment: string;
  topKeywords: string[];
  reachEstimate: number;
}> => {
  // Combine all text
  const fullText = [title, content, imageDescription].filter(Boolean).join(' ');

  // Extract keywords
  const words = fullText
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 3);

  const wordCounts = words.reduce((acc, word) => {
    acc[word] = (acc[word] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topKeywords = Object.entries(wordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);

  // Detect category
  const categoryMap: Record<string, string[]> = {
    food: ['food', 'recipe', 'cook', 'eat', 'restaurant', 'chef', 'meal'],
    travel: ['travel', 'trip', 'vacation', 'destination', 'explore', 'adventure'],
    fashion: ['fashion', 'style', 'outfit', 'wear', 'dress', 'clothing'],
    fitness: ['fitness', 'workout', 'gym', 'exercise', 'health', 'train'],
    tech: ['tech', 'software', 'code', 'ai', 'startup', 'digital'],
    beauty: ['beauty', 'makeup', 'skincare', 'cosmetic', 'glow'],
    business: ['business', 'marketing', 'entrepreneur', 'success', 'growth'],
  };

  let detectedCategory = 'general';
  for (const [category, keywords] of Object.entries(categoryMap)) {
    if (keywords.some((kw) => fullText.includes(kw))) {
      detectedCategory = category;
      break;
    }
  }

  // Get suggestions
  const suggestions = await suggestHashtags(fullText, 'post', 15, true);

  // Estimate total reach
  const reachEstimate = suggestions.reduce((sum, s) => sum + s.reachEstimate, 0);

  // Simple sentiment (based on keyword presence)
  const positiveWords = ['love', 'amazing', 'great', 'awesome', 'best', 'happy'];
  const negativeWords = ['hate', 'bad', 'worst', 'terrible', 'sad'];

  const positiveCount = positiveWords.filter((w) => fullText.includes(w)).length;
  const negativeCount = negativeWords.filter((w) => fullText.includes(w)).length;

  let sentiment = 'neutral';
  if (positiveCount > negativeCount) sentiment = 'positive';
  if (negativeCount > positiveCount) sentiment = 'negative';

  return {
    suggestions,
    category: detectedCategory,
    sentiment,
    topKeywords,
    reachEstimate,
  };
};

// Create or update hashtag
export const upsertHashtag = async (data: Partial<IHashtag>): Promise<IHashtag> => {
  const tag = data.tag?.toLowerCase().replace(/^#/, '') || '';

  const hashtag = await Hashtag.findOneAndUpdate(
    { tag },
    {
      $set: {
        ...data,
        tag,
        lastUpdated: new Date(),
      },
    },
    { upsert: true, new: true }
  );

  return hashtag;
};

// Get related hashtags
export const getRelatedHashtags = async (tag: string, limit = 10): Promise<IHashtag[]> => {
  const hashtag = await getHashtagDetails(tag);

  if (!hashtag) {
    return [];
  }

  // Get hashtags that share related tags
  const related = await Hashtag.find({
    $or: [
      { tag: { $in: hashtag.relatedTags } },
      { category: hashtag.category },
    ],
    banned: false,
    tag: { $ne: tag },
  })
    .sort({ usageCount: -1 })
    .limit(limit)
    .lean();

  return related;
};

// Mix hashtags (high + medium + niche)
export const createHashtagMix = async (
  primaryTag: string,
  count = 10
): Promise<{
  high: string[];
  medium: string[];
  niche: string[];
}> => {
  const result = { high: [] as string[], medium: [] as string[], niche: [] as string[] };

  const primary = await getHashtagDetails(primaryTag);

  if (!primary) {
    // Generate random mix
    const all = await Hashtag.find({ banned: false })
      .sort({ usageCount: -1 })
      .limit(100)
      .lean();

    const highCount = Math.ceil(count * 0.3);
    const mediumCount = Math.ceil(count * 0.4);
    const nicheCount = count - highCount - mediumCount;

    result.high = all.slice(0, highCount).map((h) => h.tag);
    result.medium = all.slice(highCount, highCount + mediumCount).map((h) => h.tag);
    result.niche = all.slice(highCount + mediumCount, highCount + mediumCount + nicheCount).map((h) => h.tag);

    return result;
  }

  // Find related hashtags by category
  const categoryHashtags = await Hashtag.find({
    category: primary.category,
    banned: false,
  })
    .sort({ usageCount: -1 })
    .lean();

  for (const h of categoryHashtags) {
    if (h.usageCount > 10000000) result.high.push(h.tag);
    else if (h.usageCount > 100000) result.medium.push(h.tag);
    else result.niche.push(h.tag);

    if (result.high.length + result.medium.length + result.niche.length >= count) break;
  }

  return result;
};

// Initialize with sample data
export const initializeSampleData = async (): Promise<void> => {
  const count = await Hashtag.countDocuments();

  if (count > 0) {
    logger.info('Hashtag data already exists, skipping initialization');
    return;
  }

  logger.info('Initializing sample hashtag data...');

  const sampleHashtags = [
    // Food
    { tag: 'foodie', usageCount: 500000000, trending: true, trendingDirection: 'up', category: 'food', avgEngagement: 8500 },
    { tag: 'foodporn', usageCount: 450000000, trending: true, trendingDirection: 'up', category: 'food', avgEngagement: 9200 },
    { tag: 'instafood', usageCount: 400000000, trending: true, trendingDirection: 'stable', category: 'food', avgEngagement: 7800 },
    { tag: 'foodstagram', usageCount: 200000000, trending: false, trendingDirection: 'stable', category: 'food', avgEngagement: 6500 },
    { tag: 'healthyfood', usageCount: 150000000, trending: true, trendingDirection: 'up', category: 'food', avgEngagement: 7200 },
    { tag: 'foodphotography', usageCount: 50000000, trending: false, trendingDirection: 'stable', category: 'food', avgEngagement: 5500 },
    { tag: 'homemade', usageCount: 100000000, trending: false, trendingDirection: 'stable', category: 'food', avgEngagement: 6000 },
    { tag: 'cooking', usageCount: 180000000, trending: true, trendingDirection: 'up', category: 'food', avgEngagement: 6800 },
    { tag: 'recipe', usageCount: 120000000, trending: false, trendingDirection: 'stable', category: 'food', avgEngagement: 5500 },
    { tag: 'dessert', usageCount: 90000000, trending: false, trendingDirection: 'stable', category: 'food', avgEngagement: 7000 },

    // Fashion
    { tag: 'fashion', usageCount: 900000000, trending: true, trendingDirection: 'up', category: 'fashion', avgEngagement: 9500 },
    { tag: 'style', usageCount: 500000000, trending: true, trendingDirection: 'stable', category: 'fashion', avgEngagement: 8500 },
    { tag: 'ootd', usageCount: 400000000, trending: true, trendingDirection: 'up', category: 'fashion', avgEngagement: 9000 },
    { tag: 'outfitoftheday', usageCount: 150000000, trending: false, trendingDirection: 'stable', category: 'fashion', avgEngagement: 7500 },
    { tag: 'streetstyle', usageCount: 100000000, trending: false, trendingDirection: 'stable', category: 'fashion', avgEngagement: 6800 },
    { tag: 'fashionblogger', usageCount: 80000000, trending: false, trendingDirection: 'down', category: 'fashion', avgEngagement: 5500 },
    { tag: 'instafashion', usageCount: 120000000, trending: true, trendingDirection: 'up', category: 'fashion', avgEngagement: 7200 },
    { tag: 'vintage', usageCount: 70000000, trending: false, trendingDirection: 'stable', category: 'fashion', avgEngagement: 6200 },
    { tag: 'fashionstyle', usageCount: 60000000, trending: false, trendingDirection: 'stable', category: 'fashion', avgEngagement: 5800 },
    { tag: 'luxury', usageCount: 50000000, trending: true, trendingDirection: 'up', category: 'fashion', avgEngagement: 8800 },

    // Travel
    { tag: 'travel', usageCount: 600000000, trending: true, trendingDirection: 'up', category: 'travel', avgEngagement: 9200 },
    { tag: 'travelgram', usageCount: 200000000, trending: false, trendingDirection: 'stable', category: 'travel', avgEngagement: 7500 },
    { tag: 'wanderlust', usageCount: 150000000, trending: true, trendingDirection: 'up', category: 'travel', avgEngagement: 8500 },
    { tag: 'travelphotography', usageCount: 180000000, trending: true, trendingDirection: 'up', category: 'travel', avgEngagement: 8800 },
    { tag: 'instatravel', usageCount: 140000000, trending: false, trendingDirection: 'stable', category: 'travel', avgEngagement: 7200 },
    { tag: 'traveling', usageCount: 100000000, trending: false, trendingDirection: 'stable', category: 'travel', avgEngagement: 6500 },
    { tag: 'adventure', usageCount: 120000000, trending: true, trendingDirection: 'up', category: 'travel', avgEngagement: 8000 },
    { tag: 'vacation', usageCount: 80000000, trending: false, trendingDirection: 'stable', category: 'travel', avgEngagement: 7000 },
    { tag: 'explore', usageCount: 150000000, trending: true, trendingDirection: 'up', category: 'travel', avgEngagement: 8200 },
    { tag: 'nature', usageCount: 200000000, trending: true, trendingDirection: 'stable', category: 'travel', avgEngagement: 7500 },

    // Fitness
    { tag: 'fitness', usageCount: 500000000, trending: true, trendingDirection: 'up', category: 'fitness', avgEngagement: 9000 },
    { tag: 'workout', usageCount: 200000000, trending: true, trendingDirection: 'stable', category: 'fitness', avgEngagement: 8000 },
    { tag: 'gym', usageCount: 180000000, trending: true, trendingDirection: 'up', category: 'fitness', avgEngagement: 8500 },
    { tag: 'fitnessmotivation', usageCount: 100000000, trending: false, trendingDirection: 'stable', category: 'fitness', avgEngagement: 7200 },
    { tag: 'fit', usageCount: 80000000, trending: false, trendingDirection: 'stable', category: 'fitness', avgEngagement: 6500 },
    { tag: 'health', usageCount: 150000000, trending: true, trendingDirection: 'up', category: 'fitness', avgEngagement: 7800 },
    { tag: 'healthy', usageCount: 120000000, trending: false, trendingDirection: 'stable', category: 'fitness', avgEngagement: 7000 },
    { tag: 'fitnessjourney', usageCount: 60000000, trending: true, trendingDirection: 'up', category: 'fitness', avgEngagement: 6800 },
    { tag: 'training', usageCount: 50000000, trending: false, trendingDirection: 'stable', category: 'fitness', avgEngagement: 6000 },
    { tag: 'bodybuilding', usageCount: 80000000, trending: true, trendingDirection: 'up', category: 'fitness', avgEngagement: 8500 },

    // Tech
    { tag: 'tech', usageCount: 100000000, trending: true, trendingDirection: 'up', category: 'tech', avgEngagement: 8500 },
    { tag: 'technology', usageCount: 80000000, trending: true, trendingDirection: 'stable', category: 'tech', avgEngagement: 8000 },
    { tag: 'ai', usageCount: 50000000, trending: true, trendingDirection: 'up', category: 'tech', avgEngagement: 12000 },
    { tag: 'coding', usageCount: 30000000, trending: true, trendingDirection: 'up', category: 'tech', avgEngagement: 7500 },
    { tag: 'programming', usageCount: 25000000, trending: true, trendingDirection: 'up', category: 'tech', avgEngagement: 7200 },
    { tag: 'developer', usageCount: 20000000, trending: false, trendingDirection: 'stable', category: 'tech', avgEngagement: 6800 },
    { tag: 'startup', usageCount: 40000000, trending: true, trendingDirection: 'up', category: 'tech', avgEngagement: 9000 },
    { tag: 'software', usageCount: 15000000, trending: false, trendingDirection: 'stable', category: 'tech', avgEngagement: 5500 },
    { tag: 'innovation', usageCount: 35000000, trending: true, trendingDirection: 'up', category: 'tech', avgEngagement: 8000 },
    { tag: 'digital', usageCount: 60000000, trending: true, trendingDirection: 'up', category: 'tech', avgEngagement: 7800 },

    // Banned hashtags
    { tag: 'adult', usageCount: 1000000, trending: false, banned: true, category: 'nsfw', avgEngagement: 0 },
    { tag: 'nsfw', usageCount: 500000, trending: false, banned: true, category: 'nsfw', avgEngagement: 0 },
  ];

  // Add related tags
  const hashtagsWithRelations = sampleHashtags.map((h, index) => {
    const related = sampleHashtags
      .filter((_, i) => i !== index && i < index + 5)
      .slice(0, 3)
      .map((r) => r.tag);
    return { ...h, relatedTags: related };
  });

  await Hashtag.insertMany(hashtagsWithRelations);

  logger.info(`Initialized ${hashtagsWithRelations.length} sample hashtags`);
};