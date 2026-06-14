import axios from 'axios';
import { logger } from 'utils/logger.js';
import { v4 as uuidv4 } from 'uuid';
import { Creative } from '../models/Creative';

export interface GenerateCreativeOptions {
  type: 'banner' | 'video' | 'native' | 'text' | 'carousel';
  campaignId: string;
  advertiserId: string;
  productName?: string;
  productDescription?: string;
  targetAudience?: {
    ageRange?: [number, number];
    gender?: string[];
    interests?: string[];
    locations?: string[];
  };
  industry?: string;
  platform?: string;
  tone?: string;
  keyMessage?: string;
  ctaText?: string;
  brandGuidelines?: {
    colors?: string[];
    fonts?: string[];
    logo?: string;
  };
}

export interface GeneratedContent {
  headline: string;
  body: string;
  cta: string;
  imagePrompt?: string;
  variations: string[];
  recommendations: string[];
}

interface HOJAIMemoryConfig {
  baseUrl: string;
  apiKey: string;
}

export class GenerationService {
  private hojaiConfig: HOJAIMemoryConfig | null = null;

  constructor() {
    // Initialize HOJAI connection if configured
    const hojaiUrl = process.env.HOJAI_API_URL;
    const hojaiKey = process.env.HOJAI_API_KEY;
    if (hojaiUrl && hojaiKey) {
      this.hojaiConfig = { baseUrl: hojaiUrl, apiKey: hojaiKey };
    }
  }

  async generateCreative(options: GenerateCreativeOptions): Promise<GeneratedContent> {
    try {
      logger.info('Generating creative with AI', { type: options.type, campaignId: options.campaignId });

      // Generate content using AI (mock implementation - would connect to HOJAI in production)
      const content = await this.generateWithAI(options);

      // Create the creative in the database
      const creative = new Creative({
        name: `${options.productName || 'Generated'} - ${new Date().toISOString().split('T')[0]}`,
        type: options.type,
        content: {
          headline: content.headline,
          body: content.body,
          cta: content.cta
        },
        campaignId: options.campaignId,
        advertiserId: options.advertiserId,
        status: 'draft',
        tags: ['ai-generated', options.type],
        createdBy: 'ai-generation-service'
      });
      await creative.save();

      logger.info(`Creative generated and saved: ${creative._id}`);
      return content;
    } catch (error) {
      logger.error('Failed to generate creative:', error);
      throw error;
    }
  }

  private async generateWithAI(options: GenerateCreativeOptions): Promise<GeneratedContent> {
    // Mock AI generation - in production, this would call HOJAI or other AI service
    const headlines = [
      `Discover the Best ${options.productName || 'Product'} Today!`,
      `Transform Your ${options.industry || 'Business'} with ${options.productName || 'Our Solution'}`,
      `Get Started with ${options.productName || 'Premium Quality'} - Limited Time Offer`,
      `Experience ${options.productName || 'Excellence'} Like Never Before`
    ];

    const bodies = [
      options.productDescription || `Unlock the full potential of ${options.productName || 'our product'} with our cutting-edge solution. Designed for modern users who demand excellence.`,
      `Join thousands of satisfied customers who have already transformed their ${options.industry || 'experience'}. ${options.keyMessage || 'Premium quality meets affordable pricing.'}`,
      `Don't miss out on this incredible opportunity. ${options.keyMessage || 'Act now and get exclusive benefits.'}`
    ];

    const ctas = [
      options.ctaText || 'Get Started Now',
      'Learn More',
      'Shop Today',
      'Claim Your Offer'
    ];

    const headline = headlines[Math.floor(Math.random() * headlines.length)];
    const body = bodies[Math.floor(Math.random() * bodies.length)];
    const cta = ctas[Math.floor(Math.random() * ctas.length)];

    // Generate variations
    const variations = [
      headline,
      headline.replace('!', ' - Special Offer'),
      headline.toUpperCase(),
      `🔥 ${headline}`
    ];

    const recommendations = [
      'Keep headline under 8 words for better engagement',
      'Include a clear value proposition',
      'Use action-oriented CTA buttons',
      'A/B test different color schemes for your banner',
      'Consider mobile-first design for better performance'
    ];

    return {
      headline,
      body,
      cta,
      imagePrompt: this.generateImagePrompt(options),
      variations,
      recommendations
    };
  }

  private generateImagePrompt(options: GenerateCreativeOptions): string {
    const templates = [
      `Professional ${options.type} banner for ${options.productName || 'product'}, clean modern design, ${options.industry || 'general'} industry, vibrant colors, high resolution`,
      `Minimalist ${options.type} advertisement featuring ${options.productName || 'product'}, professional lighting, modern aesthetic, ${options.tone || 'friendly'} tone`,
      `Eye-catching ${options.type} creative with ${options.keyMessage || 'premium quality'}, dynamic composition, bold typography, suitable for digital advertising`
    ];
    return templates[Math.floor(Math.random() * templates.length)];
  }

  async generateVariations(
    creativeId: string,
    count: number = 3,
    style: 'headline' | 'visual' | 'cta' | 'all' = 'all'
  ): Promise<Array<{ type: string; content: string }>> {
    try {
      const creative = await Creative.findById(creativeId).exec();
      if (!creative) throw new Error('Creative not found');

      const variations: Array<{ type: string; content: string }> = [];

      if (style === 'headline' || style === 'all') {
        // Generate headline variations
        const baseHeadline = creative.content.headline || '';
        variations.push(
          { type: 'headline', content: this.varyHeadline(baseHeadline, 'question') },
          { type: 'headline', content: this.varyHeadline(baseHeadline, 'urgency') },
          { type: 'headline', content: this.varyHeadline(baseHeadline, 'benefit') }
        );
      }

      if (style === 'cta' || style === 'all') {
        // Generate CTA variations
        const baseCTA = creative.content.cta || 'Get Started';
        variations.push(
          { type: 'cta', content: this.varyCTA(baseCTA, 'action') },
          { type: 'cta', content: this.varyCTA(baseCTA, 'benefit') },
          { type: 'cta', content: this.varyCTA(baseCTA, 'urgency') }
        );
      }

      if (style === 'visual' || style === 'all') {
        // Generate visual prompt variations
        variations.push(
          { type: 'visual', content: `Modern minimalist design with bright colors, clean typography` },
          { type: 'visual', content: `Bold vibrant design with gradient background, professional photography` },
          { type: 'visual', content: `Warm inviting design with soft lighting, lifestyle imagery` }
        );
      }

      return variations.slice(0, count);
    } catch (error) {
      logger.error('Failed to generate variations:', error);
      throw error;
    }
  }

  private varyHeadline(headline: string, style: string): string {
    const styles: Record<string, string[]> = {
      question: [
        `Ready for ${headline}?`,
        `Why Choose ${headline}?`,
        `What if ${headline}?`
      ],
      urgency: [
        `${headline} - Limited Time!`,
        `Don't Miss: ${headline}`,
        `${headline} - Ends Soon!`
      ],
      benefit: [
        `Get ${headline} Today`,
        `Experience ${headline}`,
        `${headline} - Just for You`
      ]
    };
    const options = styles[style] || [headline];
    return options[Math.floor(Math.random() * options.length)];
  }

  private varyCTA(cta: string, style: string): string {
    const styles: Record<string, string[]> = {
      action: ['Get Started', 'Shop Now', 'Sign Up'],
      benefit: ['Save Today', 'Get Free', 'Try Premium'],
      urgency: ['Act Now', 'Limited Time', 'Don\'t Wait']
    };
    const options = styles[style] || [cta];
    return options[Math.floor(Math.random() * options.length)];
  }

  async improveContent(
    creativeId: string,
    goal: 'ctr' | 'conversions' | 'engagement' | 'clarity'
  ): Promise<{ original: any; improved: any; suggestions: string[] }> {
    try {
      const creative = await Creative.findById(creativeId).exec();
      if (!creative) throw new Error('Creative not found');

      const improvements: Record<string, { headline: string; body: string; suggestions: string[] }> = {
        ctr: {
          headline: this.improveHeadlineForCTR(creative.content.headline),
          body: this.shortenBody(creative.content.body),
          suggestions: [
            'Use power words like "Free", "New", "Limited"',
            'Keep headline under 6 words',
            'Add numbers or statistics to increase credibility'
          ]
        },
        conversions: {
          headline: creative.content.headline,
          body: this.addSocialProof(creative.content.body),
          suggestions: [
            'Include customer testimonials',
            'Add trust badges',
            'Use specific pricing or discounts'
          ]
        },
        engagement: {
          headline: creative.content.headline,
          body: creative.content.body,
          suggestions: [
            'Ask a question to engage readers',
            'Use emojis strategically',
            'Add interactive elements'
          ]
        },
        clarity: {
          headline: this.simplifyHeadline(creative.content.headline),
          body: this.simplifyBody(creative.content.body),
          suggestions: [
            'Remove jargon and complex language',
            'Use simple, direct sentences',
            'Focus on one main message'
          ]
        }
      };

      return {
        original: creative.content,
        improved: improvements[goal],
        suggestions: improvements[goal].suggestions
      };
    } catch (error) {
      logger.error('Failed to improve content:', error);
      throw error;
    }
  }

  private improveHeadlineForCTR(headline: string): string {
    const prefixes = ['LIMITED:', 'NEW:', 'FREE:', 'EXCLUSIVE:'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    return `${prefix} ${headline}`;
  }

  private shortenBody(body: string): string {
    const sentences = body.split('.');
    return sentences.slice(0, 2).join('.') + '.';
  }

  private addSocialProof(body: string): string {
    return `Trusted by 10,000+ customers. ${body}`;
  }

  private simplifyHeadline(headline: string): string {
    return headline.length > 50 ? headline.substring(0, 47) + '...' : headline;
  }

  private simplifyBody(body: string): string {
    return body.replace(/\s+/g, ' ').trim();
  }

  async generateWithTemplate(templateId: string, data: Record<string, string>): Promise<GeneratedContent> {
    // This would integrate with the template service
    // For now, return mock content
    return {
      headline: data.headline || 'Generated Headline',
      body: data.body || 'Generated body text',
      cta: data.cta || 'Get Started',
      variations: ['Variation 1', 'Variation 2', 'Variation 3'],
      recommendations: ['Use A/B testing', 'Monitor performance']
    };
  }
}

export const generationService = new GenerationService();