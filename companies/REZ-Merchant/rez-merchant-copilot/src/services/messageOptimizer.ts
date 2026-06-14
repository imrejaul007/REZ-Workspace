/**
 * Message Optimizer Service
 * AI-powered message content optimization
 *
 * Features:
 * - Content analysis and scoring
 * - A/B test generation
 * - Personalization suggestions
 * - Performance prediction
 * - Compliance checking
 */

export interface MessageAnalysis {
  original: string;
  channel: 'whatsapp' | 'voice' | 'sms';
  scores: {
    overall: number;
    readability: number;
    engagement: number;
    conversion: number;
    compliance: number;
  };
  issues: Array<{
    type: 'warning' | 'error' | 'suggestion';
    code: string;
    message: string;
    position?: { start: number; end: number };
    suggestion?: string;
  }>;
  improvements: Array<{
    type: 'personalization' | 'urgency' | 'clarity' | 'cta' | 'length';
    original: string;
    suggested: string;
    reason: string;
    impact: 'high' | 'medium' | 'low';
  }>;
  metadata: {
    wordCount: number;
    characterCount: number;
    hasEmoji: boolean;
    hasLink: boolean;
    hasPhone: boolean;
    hasOffer: boolean;
    hasPersonalization: boolean;
    sentiment: 'positive' | 'neutral' | 'negative';
    tone: 'formal' | 'friendly' | 'urgent' | 'casual';
  };
}

export interface OptimizedMessage {
  original: string;
  optimized: string;
  variations: MessageVariation[];
  personalizationTokens: string[];
  metadata: {
    channel: string;
    estimatedReadTime: number;
    complianceFlags: string[];
    bestPractices: string[];
  };
}

export interface MessageVariation {
  id: string;
  content: string;
  type: 'A' | 'B' | 'C';
  changes: string[];
  predictedPerformance: {
    openRate: number;
    clickRate: number;
    conversionRate: number;
  };
  focus: string;
}

export interface ContentTemplate {
  id: string;
  category: string;
  name: string;
  channel: 'whatsapp' | 'voice' | 'sms';
  template: string;
  variables: string[];
  bestPractices: string[];
  examples: string[];
  avgPerformance: {
    openRate: number;
    responseRate: number;
    conversionRate: number;
  };
}

export interface ABTestResult {
  testId: string;
  campaignId: string;
  status: 'running' | 'completed' | 'paused';
  startDate: string;
  endDate?: string;
  variants: Array<{
    variantId: string;
    content: string;
    impressions: number;
    opens: number;
    clicks: number;
    conversions: number;
    openRate: number;
    clickRate: number;
    conversionRate: number;
  }>;
  winner?: {
    variantId: string;
    confidence: number;
    lift: number;
  };
  recommendations: string[];
}

export class MessageOptimizerService {
  /**
   * Analyze a message for optimization opportunities
   */
  analyzeMessage(
    message: string,
    channel: 'whatsapp' | 'voice' | 'sms'
  ): MessageAnalysis {
    const scores = this.calculateScores(message, channel);
    const issues = this.findIssues(message, channel);
    const improvements = this.suggestImprovements(message, channel, scores, issues);
    const metadata = this.extractMetadata(message, channel);

    return {
      original: message,
      channel,
      scores,
      issues,
      improvements,
      metadata,
    };
  }

  /**
   * Generate optimized version of a message
   */
  optimizeMessage(
    message: string,
    channel: 'whatsapp' | 'voice' | 'sms',
    options?: {
      includeVariations?: boolean;
      maxLength?: number;
      tone?: 'formal' | 'friendly' | 'urgent' | 'casual';
    }
  ): OptimizedMessage {
    const analysis = this.analyzeMessage(message, channel);
    let optimized = message;

    // Apply improvements
    for (const improvement of analysis.improvements) {
      if (improvement.impact === 'high') {
        optimized = optimized.replace(improvement.original, improvement.suggested);
      }
    }

    // Handle length constraints
    if (options?.maxLength && optimized.length > options.maxLength) {
      optimized = this.truncateMessage(optimized, options.maxLength);
    }

    // Generate variations for A/B testing
    const variations = options?.includeVariations
      ? this.generateVariations(message, channel, options.tone)
      : [];

    // Extract personalization tokens
    const personalizationTokens = this.extractPersonalizationTokens(optimized);

    return {
      original: message,
      optimized,
      variations,
      personalizationTokens,
      metadata: {
        channel,
        estimatedReadTime: Math.ceil(optimized.split(' ').length / 4), // ~4 words per second
        complianceFlags: this.checkCompliance(optimized, channel),
        bestPractices: this.getBestPractices(channel),
      },
    };
  }

  /**
   * Generate A/B test variants
   */
  generateABTest(
    message: string,
    channel: 'whatsapp' | 'voice' | 'sms',
    testType: 'headline' | 'cta' | 'offer' | 'length' | 'timing'
  ): MessageVariation[] {
    const variations: MessageVariation[] = [];
    const analysis = this.analyzeMessage(message, channel);

    switch (testType) {
      case 'headline':
        variations.push(this.createVariation('A', message, 'Original headline'));
        variations.push(this.createVariation('B', this.rephraseHeadline(message), 'Rephrased headline'));
        variations.push(this.createVariation('C', this.addQuestionHeadline(message), 'Question headline'));
        break;

      case 'cta':
        variations.push(this.createVariation('A', message, 'Original CTA'));
        variations.push(this.createVariation('B', this.changeCtaTone(message, 'urgent'), 'Urgent CTA'));
        variations.push(this.createVariation('C', this.changeCtaTone(message, 'friendly'), 'Friendly CTA'));
        break;

      case 'offer':
        variations.push(this.createVariation('A', message, 'No offer'));
        variations.push(this.createVariation('B', this.addDiscount(message, '10%'), '10% discount'));
        variations.push(this.createVariation('C', this.addDiscount(message, '20%'), '20% discount'));
        break;

      case 'length':
        variations.push(this.createVariation('A', message, 'Full message'));
        variations.push(this.createVariation('B', this.shortenMessage(message), 'Shortened'));
        variations.push(this.createVariation('C', this.ultraShortMessage(message), 'Ultra-short'));
        break;

      case 'timing':
        variations.push(this.createVariation('A', message, 'Morning send'));
        variations.push(this.createVariation('B', this.addTimeContext(message, 'afternoon'), 'Afternoon'));
        variations.push(this.createVariation('C', this.addTimeContext(message, 'evening'), 'Evening'));
        break;
    }

    // Calculate predicted performance for each variation
    for (const variation of variations) {
      variation.predictedPerformance = this.predictPerformance(variation.content, channel);
    }

    return variations;
  }

  /**
   * Get content templates
   */
  getTemplates(category?: string): ContentTemplate[] {
    const templates: ContentTemplate[] = [
      // WhatsApp Templates
      {
        id: 'wa_promo_001',
        category: 'promotion',
        name: 'Discount Announcement',
        channel: 'whatsapp',
        template: 'Hi {{name}}! Get {{discount}}% off on your next order. Use code {{code}} at checkout. Valid until {{expiry}}',
        variables: ['name', 'discount', 'code', 'expiry'],
        bestPractices: ['Include recipient name', 'Specify discount amount', 'Add urgency with expiry'],
        examples: [
          'Hi Sarah! Get 20% off your next meal. Use code SAVE20 at checkout. Valid until Friday!',
        ],
        avgPerformance: { openRate: 72, responseRate: 15, conversionRate: 8 },
      },
      {
        id: 'wa_reeng_001',
        category: 'reengagement',
        name: 'We Miss You',
        channel: 'whatsapp',
        template: 'Hey {{name}}! We noticed you haven\'t visited lately. Here\'s a special offer just for you: {{offer}}. Order now!',
        variables: ['name', 'offer'],
        bestPractices: ['Personalize with name', 'Create urgency', 'Offer exclusive deal'],
        examples: [
          'Hey John! We noticed you haven\'t visited lately. Here\'s a special offer just for you: Free delivery on your next order!',
        ],
        avgPerformance: { openRate: 68, responseRate: 12, conversionRate: 6 },
      },
      {
        id: 'wa_order_001',
        category: 'transactional',
        name: 'Order Confirmation',
        channel: 'whatsapp',
        template: 'Order #{{order_id}} confirmed! {{items}} - Total: {{total}}. Delivery by {{delivery_date}}. Track: {{track_url}}',
        variables: ['order_id', 'items', 'total', 'delivery_date', 'track_url'],
        bestPractices: ['Include order number', 'List items briefly', 'Provide tracking link'],
        examples: [
          'Order #12345 confirmed! 2x Burger, 1x Fries - Total: Rs.450. Delivery by 7 PM. Track: bit.ly/abc123',
        ],
        avgPerformance: { openRate: 95, responseRate: 5, conversionRate: 20 },
      },
      // Voice Templates
      {
        id: 'voice_follow_001',
        category: 'follow_up',
        name: 'Order Follow-up',
        channel: 'voice',
        template: 'Hi {{name}}, this is {{business}} calling. We wanted to follow up on your recent order. How was your experience? Press 1 for satisfied, 2 for needs attention.',
        variables: ['name', 'business'],
        bestPractices: ['State the business name', 'Be brief', 'Provide clear options'],
        examples: [
          'Hi customer, this is ABC Restaurant calling. We wanted to follow up on your recent order. How was your experience? Press 1 if satisfied, 2 if you need unknown attention.',
        ],
        avgPerformance: { openRate: 100, responseRate: 35, conversionRate: 15 },
      },
      {
        id: 'voice_iv_001',
        category: 'informational',
        name: 'Appointment Reminder',
        channel: 'voice',
        template: 'Hello {{name}}. This is a reminder from {{business}} about your appointment on {{date}} at {{time}}. Please call back to confirm or reschedule.',
        variables: ['name', 'business', 'date', 'time'],
        bestPractices: ['State appointment details', 'Offer to reschedule', 'Keep it brief'],
        examples: [
          'Hello Mr. Kumar. This is a reminder from Wellness Clinic about your appointment on 15th December at 10 AM. Please call back to confirm or reschedule.',
        ],
        avgPerformance: { openRate: 100, responseRate: 25, conversionRate: 85 },
      },
      // SMS Templates
      {
        id: 'sms_otp_001',
        category: 'authentication',
        name: 'OTP Verification',
        channel: 'sms',
        template: '{{otp}} is your verification code for {{business}}. Valid for {{minutes}} minutes. Do not share with anyone.',
        variables: ['otp', 'business', 'minutes'],
        bestPractices: ['Keep it short', 'State validity period', 'Add security warning'],
        examples: [
          '4532 is your verification code for ReZ. Valid for 5 minutes. Do not share with anyone.',
        ],
        avgPerformance: { openRate: 98, responseRate: 90, conversionRate: 95 },
      },
      {
        id: 'sms_promo_001',
        category: 'promotion',
        name: 'Flash Sale',
        channel: 'sms',
        template: '{{business}}: {{hours}}HRS ONLY! {{discount}}% off everything. Code: {{code}}. Shop now!',
        variables: ['business', 'hours', 'discount', 'code'],
        bestPractices: ['Create urgency', 'Clear discount', 'Short code'],
        examples: [
          'ABC Store: 24HRS ONLY! 50% off everything. Code: FLASH50. Shop now!',
        ],
        avgPerformance: { openRate: 85, responseRate: 18, conversionRate: 10 },
      },
    ];

    if (category) {
      return templates.filter(t => t.category === category);
    }

    return templates;
  }

  // Private helper methods

  private calculateScores(message: string, channel: string): MessageAnalysis['scores'] {
    const wordCount = message.split(' ').length;
    const hasPersonalization = /\{\{[^}]+\}\}/.test(message) || /{{/.test(message);
    const hasOffer = /\d+%|\d+\s*off|discount|save|special/i.test(message);
    const hasUrgency = /today|now|limited|only|hurry|expires|don't miss/i.test(message);
    const hasCta = /click|shop|buy|order|call|visit|check|get now/i.test(message);

    const readability = this.calculateReadability(message);
    const engagement = this.calculateEngagement(message, hasPersonalization, hasOffer, hasUrgency, hasCta);
    const conversion = this.calculateConversion(message, hasOffer, hasCta, hasUrgency);
    const compliance = this.calculateCompliance(message, channel);
    const overall = (readability * 0.2 + engagement * 0.3 + conversion * 0.3 + compliance * 0.2);

    return {
      overall: Math.round(overall),
      readability: Math.round(readability),
      engagement: Math.round(engagement),
      conversion: Math.round(conversion),
      compliance: Math.round(compliance),
    };
  }

  private calculateReadability(message: string): number {
    const words = message.split(' ').length;
    const sentences = message.split(/[.!?]+/).length;
    const avgWordsPerSentence = words / Math.max(sentences, 1);

    // Ideal is 15-20 words per sentence
    if (avgWordsPerSentence <= 10) return 100;
    if (avgWordsPerSentence <= 15) return 90;
    if (avgWordsPerSentence <= 20) return 80;
    if (avgWordsPerSentence <= 25) return 70;
    if (avgWordsPerSentence <= 30) return 60;
    return 50;
  }

  private calculateEngagement(
    message: string,
    hasPersonalization: boolean,
    hasOffer: boolean,
    hasUrgency: boolean,
    hasCta: boolean
  ): number {
    let score = 50;

    if (hasPersonalization) score += 15;
    if (hasOffer) score += 10;
    if (hasUrgency) score += 10;
    if (hasCta) score += 10;

    // Check for emojis
    if (/[\u{1F600}-\u{1F64F}]/u.test(message)) score += 5;

    return Math.min(100, score);
  }

  private calculateConversion(message: string, hasOffer: boolean, hasCta: boolean, hasUrgency: boolean): number {
    let score = 40;

    if (hasOffer) score += 20;
    if (hasCta) score += 20;
    if (hasUrgency) score += 15;

    // Check for clear value proposition
    if (/free|guarantee|save|get|try/i.test(message)) score += 10;

    return Math.min(100, score);
  }

  private calculateCompliance(message: string, channel: string): number {
    let score = 100;

    // Check for prohibited content
    const prohibited = [
      /\b(copyright|pirated|illegal)\b/i,
      /\b(free|cheap)\s+(iphone|laptop|samsung)\b/i,
      /\b(click here|act now|limited time)\b/i,
    ];

    for (const pattern of prohibited) {
      if (pattern.test(message)) score -= 20;
    }

    // Check for required elements in certain channels
    if (channel === 'sms' && !/\bstop\b/i.test(message)) {
      score -= 10; // SMS should have opt-out instruction
    }

    return Math.max(0, score);
  }

  private findIssues(message: string, channel: string): MessageAnalysis['issues'] {
    const issues: MessageAnalysis['issues'] = [];

    // Length issues
    if (channel === 'sms' && message.length > 160) {
      issues.push({
        type: 'warning',
        code: 'SMS_SEGMENT',
        message: 'Message exceeds 160 characters and will be split into multiple SMS segments',
        suggestion: 'Consider shortening to reduce costs',
      });
    }

    if (message.length > 500) {
      issues.push({
        type: 'suggestion',
        code: 'LONG_MESSAGE',
        message: 'Message is quite long and may reduce engagement',
        suggestion: 'Consider shortening or splitting into multiple messages',
      });
    }

    // Personalization issues
    if (/\{\{[^}]+\}\}/.test(message)) {
      issues.push({
        type: 'warning',
        code: 'UNFILLED_TOKEN',
        message: 'Message contains unfilled personalization tokens',
        suggestion: 'Ensure all {{token}} values are replaced before sending',
      });
    }

    // Compliance issues
    if (channel === 'whatsapp' && !/\bstop\b/i.test(message) && message.toLowerCase().includes('subscribe')) {
      issues.push({
        type: 'error',
        code: 'MISSING_OPT_OUT',
        message: 'Promotional messages must include opt-out instructions',
        suggestion: 'Add "Reply STOP to unsubscribe"',
      });
    }

    // Clarity issues
    if (/!!!|\?\?\?/.test(message)) {
      issues.push({
        type: 'suggestion',
        code: 'EXCESSIVE_PUNCTUATION',
        message: 'Excessive punctuation may appear unprofessional',
        suggestion: 'Use more moderate punctuation',
      });
    }

    // URL issues
    if (/bit\.ly|tinyurl|goo\.gl/.test(message)) {
      issues.push({
        type: 'suggestion',
        code: 'SHORTENED_URL',
        message: 'Shortened URLs may reduce trust',
        suggestion: 'Consider using a branded short domain',
      });
    }

    return issues;
  }

  private suggestImprovements(
    message: string,
    channel: string,
    scores: MessageAnalysis['scores'],
    issues: MessageAnalysis['issues']
  ): MessageAnalysis['improvements'] {
    const improvements: MessageAnalysis['improvements'] = [];

    // Personalization improvement
    if (!message.includes('{{') && !message.match(/\b(you|your|hi|hello|dear)\b/i)) {
      improvements.push({
        type: 'personalization',
        original: message.split('.')[0],
        suggested: `Hi {{name}}, ` + message.split('.')[0].toLowerCase(),
        reason: 'Personalized messages see 35% higher engagement',
        impact: 'high',
      });
    }

    // CTA improvement
    if (!/\b(click|shop|buy|order|call|visit|check|get now)\b/i.test(message)) {
      improvements.push({
        type: 'cta',
        original: message,
        suggested: message.trim() + ' Shop now!',
        reason: 'Clear calls-to-action increase conversions by 20%',
        impact: 'medium',
      });
    }

    // Urgency improvement
    if (!/\b(today|now|limited|only|hurry|expires|don't miss|valid until)\b/i.test(message)) {
      improvements.push({
        type: 'urgency',
        original: message,
        suggested: message.trim() + ' Valid until Friday!',
        reason: 'Adding urgency can increase conversion by 15%',
        impact: 'low',
      });
    }

    // Clarity improvement - sentence length
    const sentences = message.split(/[.!?]+/).filter(s => s.trim().length > 0);
    for (const sentence of sentences) {
      if (sentence.split(' ').length > 25) {
        improvements.push({
          type: 'clarity',
          original: sentence,
          suggested: this.splitLongSentence(sentence),
          reason: 'Shorter sentences improve readability',
          impact: 'medium',
        });
      }
    }

    // Length improvement
    if (scores.readability < 70) {
      improvements.push({
        type: 'length',
        original: message,
        suggested: this.shortenMessage(message),
        reason: 'Shorter messages have higher engagement rates',
        impact: 'medium',
      });
    }

    return improvements;
  }

  private extractMetadata(message: string, channel: string): MessageAnalysis['metadata'] {
    return {
      wordCount: message.split(' ').length,
      characterCount: message.length,
      hasEmoji: /[\u{1F600}-\u{1F64F}]/u.test(message),
      hasLink: /https?:\/\/|www\.|\.com|\.in/.test(message),
      hasPhone: /\d{10,}/.test(message),
      hasOffer: /\d+%|\d+\s*off|discount|save|special/i.test(message),
      hasPersonalization: /\{\{[^}]+\}\}/.test(message),
      sentiment: this.analyzeSentiment(message),
      tone: this.detectTone(message),
    };
  }

  private analyzeSentiment(message: string): 'positive' | 'neutral' | 'negative' {
    const positiveWords = /love|great|amazing|excellent|thank|appreciate|happy|excited|best|perfect/i;
    const negativeWords = /bad|poor|terrible|worst|hate|disappointed|sorry|issue|problem|complaint/i;

    if (positiveWords.test(message)) return 'positive';
    if (negativeWords.test(message)) return 'negative';
    return 'neutral';
  }

  private detectTone(message: string): 'formal' | 'friendly' | 'urgent' | 'casual' {
    if (/urgent|immediately|asap|hurry|expires today/i.test(message)) return 'urgent';
    if (/dear|kindly|please|yours sincerely/i.test(message)) return 'formal';
    if (/hey|hi there|thanks|gonna|wanna|awesome/i.test(message)) return 'casual';
    return 'friendly';
  }

  private extractPersonalizationTokens(message: string): string[] {
    const tokens: string[] = [];
    const regex = /\{\{([^}]+)\}\}/g;
    let match;

    while ((match = regex.exec(message)) !== null) {
      tokens.push(match[1]);
    }

    return [...new Set(tokens)];
  }

  private checkCompliance(message: string, channel: string): string[] {
    const flags: string[] = [];

    if (channel === 'sms') {
      if (!/\bstop\b/i.test(message)) {
        flags.push('Add STOP keyword for compliance');
      }
      if (message.length > 160) {
        flags.push('Message will be split into segments');
      }
    }

    if (channel === 'whatsapp') {
      if (/\bsubscribe\b/i.test(message) && !/\bstop\b/i.test(message)) {
        flags.push('Add opt-out option for promotional content');
      }
    }

    if (/\b\d{10,}\b/.test(message)) {
      flags.push('Phone number detected - ensure consent');
    }

    return flags;
  }

  private getBestPractices(channel: string): string[] {
    const practices: Record<string, string[]> = {
      whatsapp: [
        'Keep messages under 400 characters for best display',
        'Use personalization tokens for higher engagement',
        'Include a clear call-to-action',
        'Add urgency with expiry dates',
        'Use emojis sparingly for visual appeal',
        'Always include opt-out option for promotional messages',
      ],
      voice: [
        'Keep script under 30 seconds of reading time',
        'State your business name early',
        'Provide clear options for responses',
        'Thank the customer at the end',
        'Include callback option',
        'Avoid jargon and technical terms',
      ],
      sms: [
        'Keep under 160 characters when possible',
        'Include brand name',
        'Use short codes for offers',
        'Add STOP keyword for compliance',
        'Front-load important information',
        'Use standard punctuation',
      ],
    };

    return practices[channel] || practices.whatsapp;
  }

  // Variation generation helpers

  private generateVariations(
    message: string,
    channel: string,
    tone?: string
  ): MessageVariation[] {
    return [
      this.createVariation('A', message, 'Original'),
      this.createVariation('B', this.addPersonalization(message), 'Personalized'),
      this.createVariation('C', this.addUrgency(message), 'With urgency'),
    ];
  }

  private createVariation(
    type: 'A' | 'B' | 'C',
    content: string,
    focus: string
  ): MessageVariation {
    return {
      id: `var_${type.toLowerCase()}_${Date.now()}`,
      content,
      type,
      changes: [focus],
      predictedPerformance: { openRate: 0, clickRate: 0, conversionRate: 0 },
      focus,
    };
  }

  private rephraseHeadline(message: string): string {
    const firstSentence = message.split(/[.!?]/)[0];
    return 'Discover: ' + firstSentence.toLowerCase() + '. ' + message.slice(firstSentence.length);
  }

  private addQuestionHeadline(message: string): string {
    const firstSentence = message.split(/[.!?]/)[0];
    return 'Ready to order? ' + firstSentence + ' Shop now!';
  }

  private changeCtaTone(message: string, tone: string): string {
    if (tone === 'urgent') {
      return message.replace(/shop now/i, 'ORDER NOW - Limited time!')
        .replace(/check out/i, 'Grab this deal NOW!');
    }
    return message.replace(/shop now/i, 'Browse our selection')
      .replace(/click here/i, 'Take a look');
  }

  private addDiscount(message: string, discount: string): string {
    return message + ` Use code SAVE${discount.replace('%', '')} for ${discount} off!`;
  }

  private shortenMessage(message: string): string {
    const sentences = message.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length <= 2) return message;

    return sentences[0] + '. ' + sentences[1].trim() + ' Shop now!';
  }

  private ultraShortMessage(message: string): string {
    const mainPoint = message.match(/\b[A-Z][^.!?]*[.!?]/);
    if (mainPoint) {
      return mainPoint[0] + ' Shop now!';
    }
    return message.slice(0, 100) + '...';
  }

  private addTimeContext(message: string, context: string): string {
    const greetings: Record<string, string> = {
      morning: 'Good morning! ',
      afternoon: 'Good afternoon! ',
      evening: 'Good evening! ',
    };
    return greetings[context] + message;
  }

  private addPersonalization(message: string): string {
    if (message.match(/^(hi|hello|hey|dear)/i)) {
      return message.replace(/^(hi|hello|hey|dear)\b/i, 'Hi {{name}}');
    }
    return 'Hi {{name}}, ' + message;
  }

  private addUrgency(message: string): string {
    if (!/today|now|limited/i.test(message)) {
      return message.replace(/\./, ' - Limited time!').replace(/$/, '');
    }
    return message;
  }

  private splitLongSentence(sentence: string): string {
    const words = sentence.split(' ');
    const midpoint = Math.floor(words.length / 2);
    return words.slice(0, midpoint).join(' ') + '. ' + words.slice(midpoint).join(' ');
  }

  private truncateMessage(message: string, maxLength: number): string {
    if (message.length <= maxLength) return message;

    const truncated = message.slice(0, maxLength - 20);
    const lastSpace = truncated.lastIndexOf(' ');

    return truncated.slice(0, lastSpace) + '... Shop now!';
  }

  private predictPerformance(content: string, channel: string): MessageVariation['predictedPerformance'] {
    let baseOpen = 70;
    let baseClick = 10;
    let baseConversion = 5;

    if (channel === 'whatsapp') {
      baseOpen = 75;
      baseClick = 12;
      baseConversion = 6;
    } else if (channel === 'sms') {
      baseOpen = 85;
      baseClick = 8;
      baseConversion = 4;
    }

    if (/{{/.test(content)) {
      baseOpen += 10;
      baseClick += 5;
      baseConversion += 3;
    }

    if (/\d+%/.test(content)) {
      baseClick += 8;
      baseConversion += 5;
    }

    if (/urgent|limited|hurry/i.test(content)) {
      baseClick += 5;
      baseConversion += 3;
    }

    return {
      openRate: Math.min(99, baseOpen),
      clickRate: Math.min(50, baseClick),
      conversionRate: Math.min(30, baseConversion),
    };
  }
}

export const messageOptimizerService = new MessageOptimizerService();
