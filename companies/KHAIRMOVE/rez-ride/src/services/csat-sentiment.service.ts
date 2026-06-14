import { Injectable, Logger } from '@nestjs/common';

/**
 * Sentiment Analysis & CSAT Service
 * Uses ReZ Intelligence for NLP analysis
 */

export interface SentimentAnalysis {
  text: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  score: number; // -1 to +1
  emotions: Emotion[];
  keywords: string[];
  intent: string;
}

export interface Emotion {
  type: 'anger' | 'frustration' | 'satisfaction' | 'confusion' | 'urgency';
  confidence: number;
}

export interface RideFeedback {
  rideId: string;
  userId: string;
  rating: number;
  comment?: string;
  sentiment: SentimentAnalysis;
  driverFeedback?: DriverFeedback;
  autoEscalate: boolean;
}

export interface DriverFeedback {
  driverId: string;
  concerns: string[];
  coachingNeeded: string[];
  appreciation: string[];
}

export interface CSATReport {
  period: string;
  responseRate: number;
  avgRating: number;
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
  };
  topComplaints: string[];
  topPraises: string[];
  driverScores: DriverPerformance[];
}

export interface DriverPerformance {
  driverId: string;
  name: string;
  avgRating: number;
  tripsCount: number;
  sentimentTrend: 'improving' | 'declining' | 'stable';
  coachingNeeded: string[];
}

@Injectable()
export class SentimentService {
  private readonly logger = new Logger(SentimentService.name);

  // Common complaint keywords
  private readonly COMPLAINTS = [
    'late', 'dirty', 'rude', 'overcharged', 'cancelled', 'wait', 'long', 'worst',
    'terrible', 'avoid', 'never', 'refused', 'argue', 'smoking', 'music', 'AC', 'ac'
  ];

  // Praise keywords
  private readonly PRAISES = [
    'great', 'excellent', 'smooth', 'polite', 'friendly', 'on_time', 'clean', 'best',
    'awesome', 'thank', 'perfect', 'professional', 'helpful', 'comfortable'
  ];

  constructor() {}

  // ===========================================
  // SENTIMENT ANALYSIS (ReZ Intelligence)
  // ===========================================

  /**
   * Analyze text sentiment using NLP
   */
  async analyzeSentiment(text: string): Promise<SentimentAnalysis> {
    // In production, call ReZ Intelligence NLP service
    // const response = await axios.post(`${REZ_INTEL_URL}/api/nlp/sentiment`, { text });

    const normalized = text.toLowerCase();

    // Detect sentiment
    const sentiment = this.detectSentiment(normalized);
    const emotions = this.detectEmotions(normalized);
    const keywords = this.extractKeywords(normalized);
    const intent = this.detectIntent(normalized);

    return {
      text,
      ...sentiment,
      emotions,
      keywords,
      intent,
    };
  }

  private detectSentiment(text: string): { sentiment: 'positive' | 'neutral' | 'negative'; score: number } {
    let score = 0;
    let matches = 0;

    // Check praises
    for (const praise of this.PRAISES) {
      if (text.includes(praise)) {
        score += 0.3;
        matches++;
      }
    }

    // Check complaints
    for (const complaint of this.COMPLAINTS) {
      if (text.includes(complaint)) {
        score -= 0.4;
        matches++;
      }
    }

    // Normalize
    score = matches > 0 ? score / Math.sqrt(matches) : 0;
    score = Math.max(-1, Math.min(1, score));

    const sentiment = score > 0.2 ? 'positive' : score < -0.2 ? 'negative' : 'neutral';

    return { sentiment, score: Math.round(score * 100) / 100 };
  }

  private detectEmotions(text: string): Emotion[] {
    const emotions: Emotion[] = [];

    if (text.includes('angry') || text.includes('worst') || text.includes('terrible')) {
      emotions.push({ type: 'anger', confidence: 0.9 });
    }

    if (text.includes('confused') || text.includes('unclear') || text.includes('don\'t understand')) {
      emotions.push({ type: 'confusion', confidence: 0.8 });
    }

    if (text.includes('urgent') || text.includes('immediately') || text.includes('emergency')) {
      emotions.push({ type: 'urgency', confidence: 0.85 });
    }

    if (text.includes('frustrated') || text.includes('disappointed')) {
      emotions.push({ type: 'frustration', confidence: 0.85 });
    }

    if (text.includes('thank') || text.includes('great') || text.includes('excellent')) {
      emotions.push({ type: 'satisfaction', confidence: 0.9 });
    }

    return emotions;
  }

  private extractKeywords(text: string): string[] {
    const keywords: string[] = [];
    const words = text.split(/\s+/);

    for (const word of words) {
      if (word.length > 3 && /^[a-z]+$/.test(word)) {
        keywords.push(word);
      }
    }

    return keywords.slice(0, 10);
  }

  private detectIntent(text: string): string {
    if (text.includes('refund')) return 'refund_request';
    if (text.includes('complaint')) return 'complaint';
    if (text.includes('suggestion')) return 'feedback';
    if (text.includes('thank')) return 'appreciation';
    if (text.includes('help')) return 'support_request';
    return 'general_feedback';
  }

  // ===========================================
  // FEEDBACK ANALYSIS
  // ===========================================

  /**
   * Process ride feedback
   */
  async processFeedback(
    rideId: string,
    userId: string,
    rating: number,
    comment?: string
  ): Promise<RideFeedback> {
    let sentiment: SentimentAnalysis;
    let driverFeedback: DriverFeedback | undefined;
    let autoEscalate = false;

    if (comment) {
      sentiment = await this.analyzeSentiment(comment);

      // Check if needs immediate escalation
      const negativeEmotions = sentiment.emotions.filter(e =>
        e.type === 'anger' || e.type === 'urgency'
      );

      if (sentiment.score < -0.5 || negativeEmotions.length > 0) {
        autoEscalate = true;
        await this.escalateToSupport(rideId, sentiment);
      }

      // Generate driver feedback if negative
      if (sentiment.score < 0 && rating < 3) {
        driverFeedback = this.generateDriverFeedback(comment, sentiment);
      }
    } else {
      sentiment = { text: '', sentiment: 'neutral', score: 0, emotions: [], keywords: [], intent: 'rating_only' };
    }

    return {
      rideId,
      userId,
      rating,
      comment,
      sentiment,
      driverFeedback,
      autoEscalate,
    };
  }

  /**
   * Auto-escalate to support
   */
  private async escalateToSupport(rideId: string, sentiment: SentimentAnalysis): Promise<void> {
    // In production, create ticket in REZ-care-service
    this.logger.warn(`Auto-escalated ride ${rideId} - Sentiment: ${sentiment.sentiment}`);
  }

  /**
   * Generate driver coaching feedback
   */
  private generateDriverFeedback(
    comment: string,
    sentiment: SentimentAnalysis
  ): DriverFeedback {
    const concerns: string[] = [];
    const coachingNeeded: string[] = [];
    const appreciation: string[] = [];

    const lowerComment = comment.toLowerCase();

    // Check specific issues
    if (lowerComment.includes('late') || lowerComment.includes('delay')) {
      concerns.push('Driver arrived late');
      coachingNeeded.push('Time management training');
    }

    if (lowerComment.includes('dirty')) {
      concerns.push('Vehicle cleanliness');
      coachingNeeded.push('Vehicle hygiene standards');
    }

    if (lowerComment.includes('rude') || lowerComment.includes('polite')) {
      concerns.push('Driver behavior');
      coachingNeeded.push('Customer service training');
    }

    if (lowerComment.includes('overcharge') || lowerComment.includes('charged')) {
      concerns.push('Pricing concern');
      coachingNeeded.push('Fare explanation');
    }

    return { driverId: '', concerns, coachingNeeded, appreciation };
  }

  // ===========================================
  // CSAT REPORTING
  // ===========================================

  /**
   * Generate CSAT report
   */
  async generateCSATReport(period: 'today' | 'week' | 'month'): Promise<CSATReport> {
    // In production, aggregate from ReZ Intelligence data
    const multiplier = period === 'today' ? 1 : period === 'week' ? 7 : 30;

    const responseRate = 0.75;
    const avgRating = 4.2;

    return {
      period,
      responseRate: Math.round(responseRate * 100),
      avgRating,
      sentiment: {
        positive: 65,
        neutral: 20,
        negative: 15,
      },
      topComplaints: [
        'Driver late arrival',
        'Fare calculation',
        'Vehicle cleanliness',
        'Driver behavior',
      ],
      topPraises: [
        'Smooth ride experience',
        'Polite drivers',
        'Clean vehicles',
        'Quick booking',
      ],
      driverScores: [
        { driverId: 'D001', name: 'Rajesh K', avgRating: 4.9, tripsCount: 150, sentimentTrend: 'improving', coachingNeeded: [] },
        { driverId: 'D002', name: 'Priya S', avgRating: 4.7, tripsCount: 120, sentimentTrend: 'stable', coachingNeeded: [] },
        { driverId: 'D003', name: 'Amit M', avgRating: 3.8, tripsCount: 80, sentimentTrend: 'declining', coachingNeeded: ['Customer service'] },
      ],
    };
  }
}
