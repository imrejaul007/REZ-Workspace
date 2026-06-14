import OpenAI from 'openai';
import { config } from '../config';
import { logger } from 'utils/logger.js';
import {
  ParsedIntent,
  GoalType,
  ChannelType,
  Product,
  CampaignGoal,
  AudienceTargeting,
  BudgetConfig
} from '../types';

// Intent patterns for rule-based fallback
interface IntentPattern {
  goal: GoalType;
  keywords: string[];
  channels: ChannelType[];
}

const INTENT_PATTERNS: IntentPattern[] = [
  {
    goal: 'sales',
    keywords: ['sell', 'sales', 'buy', 'purchase', 'order', 'transaction', 'revenue', 'convert'],
    channels: ['google', 'facebook', 'instagram']
  },
  {
    goal: 'leads',
    keywords: ['leads', 'generate', 'inquiry', 'enquiry', 'contact', 'signup', 'register', 'sign up'],
    channels: ['google', 'facebook', 'linkedin']
  },
  {
    goal: 'bookings',
    keywords: ['book', 'booking', 'appointment', 'schedule', 'reserve', 'reservation'],
    channels: ['google', 'facebook', 'instagram']
  },
  {
    goal: 'traffic',
    keywords: ['traffic', 'visitors', 'visits', 'views', 'clicks', 'reach', 'traffic to'],
    channels: ['google', 'display', 'native']
  },
  {
    goal: 'awareness',
    keywords: ['brand', 'awareness', 'reach', 'exposure', 'visibility', 'recognition', 'launch'],
    channels: ['facebook', 'instagram', 'youtube', 'tiktok']
  }
];

// Location patterns
const LOCATION_PATTERNS = [
  /in\s+([A-Za-z\s,]+?)(?:\s+with|\s+for|\s+to|\s+within|$)/gi,
  /across\s+([A-Za-z\s,]+?)(?:\s+with|\s+for|$)/gi,
  /targeting?\s+([A-Za-z\s,]+?)(?:\s+with|$)/gi,
  /in\s+([A-Za-z\s]+?)(?:\s+region|location|area)/gi
];

// Budget patterns
const BUDGET_PATTERNS = [
  /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:INR|₹|rupees?|rs\.?)/gi,
  /budget\s+(?:of\s+)?(\d+(?:,\d{3})*(?:\.\d{2})?)/gi,
  /spend\s+(\d+(?:,\d{3})*(?:\.\d{2})?)/gi,
  /₹\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/gi
];

// Target quantity patterns
const TARGET_PATTERNS = [
  /(\d+(?:,\d{3})*)\s*(?:phones?|units?|products?|customers?|leads?|sales?|bookings?)/gi,
  /sell\s+(\d+(?:,\d{3})*)/gi,
  /(\d+(?:,\d{3})*)\s*(?:customers?|people|users?)/gi
];

// Product patterns
const PRODUCT_PATTERNS = [
  /(\d+)\s+([A-Za-z\s]+?)(?:\s+in|\s+at|\s+with|$)/gi,
  /([A-Za-z\s]+?)\s+(?:phones?|products?|items?)/gi,
  /(?:selling?|offering?)\s+([A-Za-z\s]+?)(?:\s+for|\s+in)/gi
];

export class NLPParserService {
  private openai: OpenAI | null = null;
  private useOpenAI: boolean;

  constructor() {
    this.useOpenAI = !!config.openai.apiKey;
    if (this.useOpenAI) {
      this.openai = new OpenAI({
        apiKey: config.openai.apiKey
      });
    }
  }

  async parse(naturalLanguage: string, context?: Record<string, unknown>): Promise<{
    parsed: ParsedIntent;
    confidence: number;
    warnings: string[];
  }> {
    const startTime = Date.now();
    const warnings: string[] = [];

    try {
      // Try OpenAI parsing first
      if (this.useOpenAI && this.openai) {
        return await this.parseWithOpenAI(naturalLanguage, context);
      }

      // Fallback to rule-based parsing
      return this.parseWithRules(naturalLanguage, context);
    } catch (error) {
      logger.error('NLP parsing failed, falling back to rules:', error);
      return this.parseWithRules(naturalLanguage, context);
    }
  }

  private async parseWithOpenAI(naturalLanguage: string, context?: Record<string, unknown>): Promise<{
    parsed: ParsedIntent;
    confidence: number;
    warnings: string[];
  }> {
    const systemPrompt = `You are an expert digital marketing campaign builder. Parse the advertiser's natural language input into a structured campaign configuration.

Extract:
1. Campaign goal (leads, sales, bookings, traffic, awareness)
2. Target quantity and timeline
3. Target audience (locations, demographics, interests)
4. Budget (amount and currency)
5. Products/services mentioned
6. Preferred channels

Return a JSON object with this structure:
{
  "goal": { "type": "sales|leads|bookings|traffic|awareness", "target": number, "timeline": "string" },
  "audience": { "location": ["city1", "city2"], "demographics": { "age": "25-35", "gender": "all" }, "interests": ["tech", "gadgets"] },
  "budget": { "amount": number, "currency": "INR" },
  "products": [{ "name": "string", "price": number }],
  "channels": ["google", "facebook", "instagram"]
}

Be precise and extract all available information. Infer missing details when reasonable.`;

    const response = await this.openai!.chat.completions.create({
      model: config.openai.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: naturalLanguage }
      ],
      temperature: config.openai.temperature,
      max_tokens: config.openai.maxTokens,
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const parsed = JSON.parse(content);
    const tokensUsed = response.usage?.total_tokens || 0;
    const processingTime = Date.now() - startTime;

    // Validate and normalize the parsed result
    return this.validateAndNormalize(parsed, tokensUsed, processingTime, naturalLanguage);
  }

  private validateAndNormalize(
    parsed: Record<string, unknown>,
    tokensUsed: number,
    processingTime: number,
    originalText: string
  ): { parsed: ParsedIntent; confidence: number; warnings: string[] } {
    const warnings: string[] = [];

    // Validate goal
    const goalType = parsed.goal?.type as GoalType;
    if (!['leads', 'sales', 'bookings', 'traffic', 'awareness'].includes(goalType)) {
      warnings.push('Goal type not explicitly specified, inferred from context');
    }

    // Validate budget
    const budgetAmount = parsed.budget?.amount as number;
    if (!budgetAmount || budgetAmount < 1000) {
      warnings.push('Budget seems low, recommended minimum is ₹10,000 for effective campaigns');
    }

    // Validate locations
    const locations = parsed.audience?.location as string[];
    if (!locations || locations.length === 0) {
      warnings.push('No specific locations found, targeting all India by default');
    }

    // Calculate confidence based on completeness
    let confidence = 0.5;
    if (goalType) confidence += 0.15;
    if (budgetAmount >= 10000) confidence += 0.15;
    if (locations && locations.length > 0) confidence += 0.1;
    if (parsed.channels) confidence += 0.1;

    // Build the parsed intent
    const parsedIntent: ParsedIntent = {
      goal: {
        type: goalType || this.inferGoal(originalText),
        target: (parsed.goal?.target as number) || this.inferTarget(originalText),
        timeline: parsed.goal?.timeline as string || this.inferTimeline(originalText)
      },
      audience: {
        location: locations || ['India'],
        demographics: parsed.audience?.demographics as any || this.inferDemographics(originalText),
        interests: parsed.audience?.interests as string[] || this.inferInterests(parsed.goal?.type as GoalType),
        income: parsed.audience?.income as string
      },
      budget: {
        amount: budgetAmount || this.inferBudget(originalText),
        currency: (parsed.budget?.currency as string) || 'INR',
        optimization: 'moderate'
      },
      products: this.extractProducts(parsed, originalText),
      channels: (parsed.channels as ChannelType[]) || this.inferChannels(parsed.goal?.type as GoalType)
    };

    return { parsed: parsedIntent, confidence: Math.min(confidence, 0.95), warnings };
  }

  private parseWithRules(naturalLanguage: string, context?: Record<string, unknown>): {
    parsed: ParsedIntent;
    confidence: number;
    warnings: string[];
  } {
    const warnings: string[] = [];
    const text = naturalLanguage.toLowerCase();

    // Parse goal
    const goalType = this.detectGoal(text);
    const target = this.extractTarget(text);
    const timeline = this.extractTimeline(text);

    // Parse locations
    const locations = this.extractLocations(naturalLanguage);

    // Parse budget
    const budget = this.extractBudget(naturalLanguage);

    // Parse products
    const products = this.extractProductsRule(text);

    // Parse channels
    const channels = this.detectChannels(text);

    // Calculate confidence
    let confidence = 0.4;
    if (goalType) confidence += 0.15;
    if (target > 0) confidence += 0.1;
    if (locations.length > 0) confidence += 0.1;
    if (budget > 0) confidence += 0.1;
    if (channels.length > 0) confidence += 0.05;

    if (confidence < 0.7) {
      warnings.push('Rule-based parsing has lower confidence, consider providing more details');
    }

    const parsedIntent: ParsedIntent = {
      goal: {
        type: goalType,
        target,
        timeline
      },
      audience: {
        location: locations.length > 0 ? locations : ['India'],
        demographics: this.inferDemographics(text),
        interests: this.inferInterests(goalType)
      },
      budget: {
        amount: budget > 0 ? budget : 50000,
        currency: 'INR',
        optimization: 'moderate'
      },
      products,
      channels
    };

    return { parsed: parsedIntent, confidence, warnings };
  }

  private detectGoal(text: string): GoalType {
    for (const pattern of INTENT_PATTERNS) {
      if (pattern.keywords.some(keyword => text.includes(keyword))) {
        return pattern.goal;
      }
    }
    return 'awareness'; // Default
  }

  private extractTarget(text: string): number {
    for (const pattern of TARGET_PATTERNS) {
      const match = pattern.exec(text);
      if (match) {
        const numStr = match[1].replace(/,/g, '');
        const num = parseInt(numStr, 10);
        if (num > 0) return num;
      }
    }
    return 100; // Default target
  }

  private extractTimeline(text: string): string {
    const timelinePatterns = [
      /(\d+)\s*(?:day|week|month)s?/gi,
      /(?:within|in)\s+(\d+)\s*(?:day|week|month)s?/gi,
      /(?:by|before)\s+([A-Za-z]+\s+\d{4})/gi
    ];

    for (const pattern of timelinePatterns) {
      const match = pattern.exec(text);
      if (match) return match[0];
    }
    return '30 days'; // Default
  }

  private extractLocations(text: string): string[] {
    const locations: string[] = [];
    const cityPatterns = [
      /bangalore|bengaluru/i,
      /mumbai/i,
      /delhi|new delhi/i,
      /chennai/i,
      /hyderabad/i,
      /kolkata/i,
      /pune/i,
      /ahmedabad/i,
      /jaipur/i,
      /lucknow/i,
      /kochi|cochin/i,
      /goa/i,
      /chandigarh/i,
      /india/i
    ];

    for (const pattern of cityPatterns) {
      const match = text.match(pattern);
      if (match) {
        const city = match[0].toLowerCase();
        if (city === 'delhi') locations.push('New Delhi');
        else if (city === 'kochi' || city === 'cochin') locations.push('Kochi');
        else if (city === 'bangalore') locations.push('Bengaluru');
        else locations.push(city.charAt(0).toUpperCase() + city.slice(1));
      }
    }

    return [...new Set(locations)]; // Remove duplicates
  }

  private extractBudget(text: string): number {
    for (const pattern of BUDGET_PATTERNS) {
      const match = pattern.exec(text);
      if (match) {
        const numStr = match[1].replace(/,/g, '');
        const num = parseFloat(numStr);
        if (num > 0) return num;
      }
    }
    return 0; // Will be inferred
  }

  private extractProductsRule(text: string): Product[] {
    const products: Product[] = [];

    // Common product patterns
    const phonePatterns = /(\d+)?\s*(?:phones?|mobile|mobiles|smartphones?)/gi;
    let match;
    while ((match = phonePatterns.exec(text)) !== null) {
      products.push({
        name: 'phones',
        category: 'electronics'
      });
    }

    // Generic product mentions
    const productWords = ['shirt', 'shoes', 'laptop', 'tablet', 'watch', 'bag', ' cosmetics', 'food', 'restaurant'];
    for (const word of productWords) {
      if (text.includes(word)) {
        products.push({ name: word });
      }
    }

    return products;
  }

  private detectChannels(text: string): ChannelType[] {
    const channels: ChannelType[] = [];
    const channelMap: Record<string, ChannelType[]> = {
      'google': ['google'],
      'facebook': ['facebook'],
      'fb': ['facebook'],
      'instagram': ['instagram', 'facebook'],
      'ig': ['instagram', 'facebook'],
      'youtube': ['youtube'],
      'yt': ['youtube'],
      'linkedin': ['linkedin'],
      'twitter': ['twitter'],
      'tiktok': ['tiktok'],
      'display': ['display'],
      'native': ['native']
    };

    for (const [keyword, channelList] of Object.entries(channelMap)) {
      if (text.includes(keyword)) {
        channels.push(...channelList);
      }
    }

    return [...new Set(channels)].slice(0, 3);
  }

  private inferGoal(text: string): GoalType {
    return this.detectGoal(text);
  }

  private inferTarget(text: string): number {
    return this.extractTarget(text);
  }

  private inferTimeline(text: string): string {
    return this.extractTimeline(text);
  }

  private inferDemographics(text: string): any {
    const demographics: any = {};

    // Age patterns
    const agePatterns = [
      /(\d+)-(\d+)\s*(?:years?|yrs?)?/gi,
      /(?:age|aged?)\s+(\d+)/gi
    ];

    for (const pattern of agePatterns) {
      const match = pattern.exec(text);
      if (match) {
        demographics.age = match[0];
        break;
      }
    }

    // Gender patterns
    if (text.includes('men') || text.includes('male')) demographics.gender = 'male';
    else if (text.includes('women') || text.includes('female')) demographics.gender = 'female';

    return demographics;
  }

  private inferInterests(goalType?: GoalType): string[] {
    const interestMap: Record<GoalType, string[]> = {
      'sales': ['shopping', 'electronics', 'deals'],
      'leads': ['business', 'technology', 'professional'],
      'bookings': ['travel', 'dining', 'services'],
      'traffic': ['news', 'entertainment', 'social'],
      'awareness': ['entertainment', 'lifestyle', 'trending']
    };

    return interestMap[goalType || 'awareness'];
  }

  private extractProducts(parsed: Record<string, unknown>, text: string): Product[] {
    const products = parsed.products as Product[] | undefined;
    if (products && products.length > 0) return products;

    return this.extractProductsRule(text);
  }

  private inferChannels(goalType?: GoalType): ChannelType[] {
    for (const pattern of INTENT_PATTERNS) {
      if (pattern.goal === goalType) {
        return pattern.channels;
      }
    }
    return ['google', 'facebook', 'instagram'];
  }
}

export const nlpParserService = new NLPParserService();
export default nlpParserService;