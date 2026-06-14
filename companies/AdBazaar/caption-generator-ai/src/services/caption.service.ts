/**
 * Caption Service - AI-powered caption generation logic
 */

import OpenAI from 'openai';
import { BrandVoice, CaptionHistory, TranslationCache, PLATFORM_LIMITS } from '../models/schemas';
import logger from '../utils/logger';

// Simple ID generator
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 10);
}

// Types
interface GenerateCaptionsOptions {
  content: string;
  brandVoice?: string;
  style?: 'casual' | 'professional' | 'witty' | 'inspirational' | 'educational';
  tone?: 'friendly' | 'bold' | 'luxury' | 'playful' | 'professional';
  length?: 'short' | 'medium' | 'long';
  includeHashtags?: boolean;
  includeCTA?: boolean;
  platforms?: string[];
  variations?: number;
}

interface GeneratedCaption {
  caption: string;
  hashtags: string[];
  suggestedCTA: string;
  tone: string;
  characterCount: number;
  platformOptimized: { [platform: string]: string };
}

interface Variation {
  caption: string;
  hashtags: string[];
  suggestedCTA: string;
  description: string;
}

interface StoryHook {
  hook: string;
  type: 'question' | 'statement' | 'number' | 'story' | 'controversial';
  emoji: string;
}

interface CTA {
  text: string;
  type: 'shop' | 'learn' | 'join' | 'share' | 'comment' | 'dm';
  emoji: string;
}

interface BrandVoiceData {
  brandId: string;
  name: string;
  style?: string;
  tone?: string;
  commonPhrases: string[];
  avoidPhrases: string[];
  personality: string[];
}

interface TranslationResult {
  translatedCaption: string;
  targetLanguage: string;
  originalCaption: string;
}

export class CaptionService {
  private openai: OpenAI;

  constructor(openai: OpenAI) {
    this.openai = openai;
  }

  /**
   * Generate captions with AI
   */
  async generateCaptions(options: GenerateCaptionsOptions): Promise<GeneratedCaption[]> {
    const {
      content,
      brandVoice,
      style = 'casual',
      tone = 'friendly',
      length = 'medium',
      includeHashtags = true,
      includeCTA = true,
      platforms = ['instagram'],
      variations = 1,
    } = options;

    const results: GeneratedCaption[] = [];

    // Get brand voice if specified
    let brandContext = '';
    if (brandVoice) {
      const bv = await BrandVoice.findOne({ brandId: brandVoice });
      if (bv) {
        brandContext = this.buildBrandContext(bv);
      }
    }

    // Generate each variation
    for (let i = 0; i < variations; i++) {
      const caption = await this.generateSingleCaption({
        content,
        brandContext,
        style,
        tone,
        length,
        includeHashtags,
        includeCTA,
 });

      // Optimize for each platform
      const platformOptimized: { [platform: string]: string } = {};
      for (const platform of platforms) {
        platformOptimized[platform] = this.optimizeForPlatform(caption.caption, platform, includeHashtags ? caption.hashtags : []);
      }

      results.push({
        ...caption,
        platformOptimized,
      });
    }

    return results;
  }

  /**
   * Generate a single caption
   */
  private async generateSingleCaption(options: {
    content: string;
    brandContext: string;
    style: string;
    tone: string;
    length: string;
    includeHashtags: boolean;
    includeCTA: boolean;
  }): Promise<Omit<GeneratedCaption, 'platformOptimized'>> {
    const { content, brandContext, style, tone, length, includeHashtags, includeCTA } = options;

    const lengthMap: { [key: string]: string } = {
      short: 'under 100 characters',
      medium: '100-200 characters',
      long: '200-400 characters',
    };

    const prompt = `You are an expert social media caption writer.

${brandContext}

Write a ${style} style caption in a ${tone} tone for the following content:
"${content}"

Requirements:
- Length: ${lengthMap[length]}
- Include relevant emojis where appropriate
- Make it engaging and memorable
- ${includeHashtags ? 'Include 5-10 relevant hashtags' : 'Do not include hashtags'}
- ${includeCTA ? 'Include a compelling call-to-action at the end' : 'Do not include a call-to-action'}

Return your response as a JSON object with this exact structure:
{
  "caption": "your generated caption here",
  "hashtags": ["#hashtag1", "#hashtag2", ...],
  "suggestedCTA": "call to action text or empty string if not requested"
}`;

    try {
      const response = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a creative social media caption writer. Always respond with valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: parseInt(process.env.OPENAI_MAX_TOKENS || '500', 10),
        temperature: 0.8,
      });

      const text = response.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim());

      return {
        caption: parsed.caption || content,
        hashtags: parsed.hashtags || [],
        suggestedCTA: parsed.suggestedCTA || '',
        tone: tone,
        characterCount: (parsed.caption || content).length,
      };
    } catch (error) {
      logger.error('OpenAI generation error:', { error: error instanceof Error ? error.message : 'Unknown' });
      // Fallback to simple caption
      return {
        caption: content,
        hashtags: includeHashtags ? this.generateSimpleHashtags(content) : [],
        suggestedCTA: includeCTA ? 'Check out our profile for more!' : '',
        tone: tone,
        characterCount: content.length,
      };
    }
  }

  /**
   * Generate A/B variations
   */
  async generateVariations(content: string, count: number, style?: string): Promise<Variation[]> {
    const styles = style
      ? [style]
      : ['casual', 'professional', 'witty', 'inspirational', 'educational'];

    const variations: Variation[] = [];

    for (let i = 0; i < count && i < styles.length; i++) {
      const caption = await this.generateSingleCaption({
        content,
        brandContext: '',
        style: styles[i],
        tone: 'friendly',
        length: 'medium',
        includeHashtags: true,
        includeCTA: true,
      });

      variations.push({
        caption: caption.caption,
        hashtags: caption.hashtags,
        suggestedCTA: caption.suggestedCTA,
        description: `Style: ${styles[i]}`,
      });
    }

    return variations;
  }

  /**
   * Generate story hooks
   */
  async generateStoryHooks(topic: string, count: number, style?: string): Promise<StoryHook[]> {
    const prompt = `Generate ${count} compelling story hooks for the topic: "${topic}"

Create hooks that make people want to keep reading. Vary the types:
- Question hooks (make them curious)
- Statement hooks (bold claims)
- Number hooks (lists, statistics)
- Story hooks (narrative beginnings)
- Controversial hooks (provocative takes)

Return as JSON array:
{
  "hooks": [
    {
      "hook": "the hook text",
      "type": "question|statement|number|story|controversial",
      "emoji": "relevant emoji"
    }
  ]
}`;

    try {
      const response = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a creative storyteller and content strategist.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 500,
        temperature: 0.9,
      });

      const text = response.choices[0]?.message?.content || '{"hooks":[]}';
      const parsed = JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim());

      return parsed.hooks || [];
    } catch (error) {
      logger.error('Generate hooks error:', { error: error instanceof Error ? error.message : 'Unknown' });
      return [
        { hook: `What if I told you ${topic} could change everything?`, type: 'question', emoji: '🤔' },
        { hook: `The truth about ${topic} that nobody talks about`, type: 'statement', emoji: '😱' },
        { hook: `3 things about ${topic} that will surprise you`, type: 'number', emoji: '🔢' },
      ];
    }
  }

  /**
   * Generate hashtags
   */
  async generateHashtags(content: string, count: number, includeTrending: boolean): Promise<string[]> {
    const prompt = `Generate ${count} relevant hashtags for this content:
"${content}"

${includeTrending ? 'Include some trending hashtags mixed with niche ones.' : 'Focus on relevant niche hashtags.'}

Return as JSON array:
{
  "hashtags": ["#tag1", "#tag2", ...]
}`;

    try {
      const response = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a social media marketing expert specializing in hashtag strategy.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 200,
        temperature: 0.7,
      });

      const text = response.choices[0]?.message?.content || '{"hashtags":[]}';
      const parsed = JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim());

      return parsed.hashtags || this.generateSimpleHashtags(content);
    } catch (error) {
      logger.error('Generate hashtags error:', { error: error instanceof Error ? error.message : 'Unknown' });
      return this.generateSimpleHashtags(content);
    }
  }

  /**
   * Generate CTAs
   */
  async generateCTAs(context: string, count: number, style?: string): Promise<CTA[]> {
    const prompt = `Generate ${count} compelling call-to-action options for this context:
"${context}"

Types of CTAs to include:
- Shop/Buy CTAs
- Learn More CTAs
- Join/Follow CTAs
- Share/Save CTAs
- Comment/Engage CTAs
- DM/Contact CTAs

Return as JSON array:
{
  "ctas": [
    {
      "text": "CTA text",
      "type": "shop|learn|join|share|comment|dm",
      "emoji": "📱"
    }
  ]
}`;

    try {
      const response = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert conversion copywriter.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 300,
        temperature: 0.8,
      });

      const text = response.choices[0]?.message?.content || '{"ctas":[]}';
      const parsed = JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim());

      return parsed.ctas || [];
    } catch (error) {
      logger.error('Generate CTAs error:', { error: error instanceof Error ? error.message : 'Unknown' });
      return [
        { text: 'Shop now!', type: 'shop', emoji: '🛒' },
        { text: 'Learn more', type: 'learn', emoji: '📚' },
        { text: 'Follow for more', type: 'join', emoji: '👆' },
      ];
    }
  }

  /**
   * Translate caption
   */
  async translateCaption(caption: string, targetLanguage: string, preserveEmojis: boolean): Promise<TranslationResult> {
    // Check cache first
    const cached = await TranslationCache.findOne({
      sourceText: caption,
      targetLanguage,
      preservedEmojis,
    });

    if (cached) {
      return {
        translatedCaption: cached.translatedText,
        targetLanguage,
        originalCaption: caption,
      };
    }

    const languageNames: { [key: string]: string } = {
      en: 'English', hi: 'Hindi', es: 'Spanish', fr: 'French', de: 'German',
      pt: 'Portuguese', it: 'Italian', ja: 'Japanese', ko: 'Korean', zh: 'Chinese',
      ar: 'Arabic', ru: 'Russian', ta: 'Tamil', te: 'Telugu', bn: 'Bengali',
      mr: 'Marathi', gu: 'Gujarati', kn: 'Kannada', ml: 'Malayalam', pa: 'Punjabi',
    };

    const prompt = `Translate this caption to ${languageNames[targetLanguage] || targetLanguage}.

Caption: "${caption}"

${preserveEmojis ? 'IMPORTANT: Preserve all emojis in their original positions.' : ''}

Return as JSON:
{
  "translatedCaption": "translated text"
}`;

    try {
      const response = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert translator. Always respond with valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 500,
        temperature: 0.3,
      });

      const text = response.choices[0]?.message?.content || '{"translatedCaption":""}';
      const parsed = JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim());

      // Cache the result
      await TranslationCache.create({
        sourceText: caption,
        targetLanguage,
        translatedText: parsed.translatedCaption,
        preservedEmojis,
      });

      return {
        translatedCaption: parsed.translatedCaption,
        targetLanguage,
        originalCaption: caption,
      };
    } catch (error) {
      logger.error('Translate caption error:', { error: error instanceof Error ? error.message : 'Unknown' });
      return {
        translatedCaption: caption,
        targetLanguage,
        originalCaption: caption,
      };
    }
  }

  /**
   * Set brand voice
   */
  async setBrandVoice(data: BrandVoiceData): Promise<BrandVoiceData> {
    const existing = await BrandVoice.findOne({ brandId: data.brandId });

    if (existing) {
      await BrandVoice.findByIdAndUpdate(existing._id, {
        ...data,
        updatedAt: new Date(),
      });
    } else {
      await BrandVoice.create({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    return data;
  }

  /**
   * Get brand voice
   */
  async getBrandVoice(brandId: string): Promise<BrandVoiceData | null> {
    const bv = await BrandVoice.findOne({ brandId });
    if (!bv) return null;

    return {
      brandId: bv.brandId,
      name: bv.name,
      style: bv.style,
      tone: bv.tone,
      commonPhrases: bv.commonPhrases,
      avoidPhrases: bv.avoidPhrases,
      personality: bv.personality,
    };
  }

  /**
   * Learn from caption usage (for brand voice adaptation)
   */
  async learnFromCaption(brandId: string, caption: string, style: string, engagement?: number): Promise<void> {
    const bv = await BrandVoice.findOne({ brandId });
    if (!bv) return;

    bv.captionHistory.push({
      caption,
      style,
      engagement,
      createdAt: new Date(),
    });

    // Keep only last 100 captions
    if (bv.captionHistory.length > 100) {
      bv.captionHistory = bv.captionHistory.slice(-100);
    }

    await bv.save();
  }

  /**
   * Record caption usage
   */
  async recordUsage(
    caption: string,
    hashtags: string[],
    style: string,
    tone: string,
    platform: string,
    userId?: string,
    brandId?: string
  ): Promise<void> {
    await CaptionHistory.create({
      historyId: `hist-${generateId()}`,
      caption,
      hashtags,
      style,
      tone,
      characterCount: caption.length,
      platform,
      userId,
      brandId,
      usedAt: new Date(),
    });
  }

  // ==================== PRIVATE HELPERS ====================

  private buildBrandContext(bv: any): string {
    let context = `\n\nBRAND VOICE CONTEXT:\n`;
    context += `Brand: ${bv.name}\n`;

    if (bv.style) context += `Style: ${bv.style}\n`;
    if (bv.tone) context += `Tone: ${bv.tone}\n`;

    if (bv.commonPhrases?.length) {
      context += `Use these phrases: ${bv.commonPhrases.join(', ')}\n`;
    }

    if (bv.avoidPhrases?.length) {
      context += `Avoid these phrases: ${bv.avoidPhrases.join(', ')}\n`;
    }

    if (bv.personality?.length) {
      context += `Personality traits: ${bv.personality.join(', ')}\n`;
    }

    return context;
  }

  private optimizeForPlatform(caption: string, platform: string, hashtags: string[]): string {
    const limits = PLATFORM_LIMITS[platform] || PLATFORM_LIMITS.instagram;
    const maxChars = limits.maxChars;

    // If caption fits, add hashtags at the end
    if (caption.length + hashtags.join(' ').length <= maxChars) {
      return `${caption}\n\n${hashtags.join(' ')}`;
    }

    // Otherwise, truncate and add what fits
    const availableSpace = maxChars - hashtags.join(' ').length - 3; // 3 for \n\n
    if (availableSpace > 50) {
      return `${caption.substring(0, availableSpace)}...\n\n${hashtags.slice(0, limits.hashtagLimit).join(' ')}`;
    }

    // Just return truncated caption
    return caption.substring(0, maxChars - 3) + '...';
  }

  private generateSimpleHashtags(content: string): string[] {
    // Simple keyword extraction for fallback
    const words = content
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 3)
      .slice(0, 5);

    return words.map(w => `#${w.replace(/\s+/g, '')}`);
  }
}
