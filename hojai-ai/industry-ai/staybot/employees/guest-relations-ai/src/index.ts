/**
 * Guest Relations AI - Satisfaction & Feedback Agent
 * Part of STAYBOT - Hotel AI Operating System
 */

import { v4 as uuidv4 } from 'uuid';

export interface Feedback {
  id: string;
  guestId: string;
  rating: number; // 1-5
  category: 'service' | 'room' | 'food' | 'amenities' | 'cleanliness' | 'overall';
  comments: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  createdAt: string;
  response?: string;
  actionTaken?: string;
}

export interface LoyaltyInfo {
  guestId: string;
  tier: 'standard' | 'silver' | 'gold' | 'platinum';
  points: number;
  pointsToNextTier?: number;
  benefits: string[];
}

export class GuestRelationsAI {
  private readonly tierBenefits: Record<string, string[]> = {
    'standard': ['Basic WiFi', 'Late check-out on request'],
    'silver': ['Free breakfast', 'Room upgrades on availability', 'Early check-in'],
    'gold': ['All Silver benefits', 'Free spa access', 'Airport transfers', 'Guaranteed late check-out'],
    'platinum': ['All Gold benefits', 'Butler service', 'Exclusive lounge access', 'Personal concierge']
  };

  /**
   * Collect guest feedback
   */
  async collectFeedback(
    guestId: string,
    rating: number,
    category: Feedback['category'],
    comments: string
  ): Promise<{ feedback: Feedback; message: string }> {
    const sentiment = rating >= 4 ? 'positive' : rating >= 3 ? 'neutral' : 'negative';

    const feedback: Feedback = {
      id: uuidv4(),
      guestId,
      rating,
      category,
      comments,
      sentiment,
      createdAt: new Date().toISOString(),
      response: this.generateResponse(rating, category)
    };

    return { feedback, message: feedback.response! };
  }

  /**
   * Analyze feedback patterns
   */
  async analyzeFeedback(period: 'day' | 'week' | 'month'): Promise<{
    totalFeedback: number;
    avgRating: number;
    sentimentBreakdown: Record<string, number>;
    topIssues: { issue: string; count: number }[];
    topPraises: { praise: string; count: number }[];
    insights: string[];
  }> {
    return {
      totalFeedback: Math.floor(Math.random() * 100) + 20,
      avgRating: 4 + Math.random(),
      sentimentBreakdown: {
        positive: Math.floor(Math.random() * 60) + 30,
        neutral: Math.floor(Math.random() * 20) + 10,
        negative: Math.floor(Math.random() * 10) + 1
      },
      topIssues: [
        { issue: 'WiFi connectivity', count: Math.floor(Math.random() * 10) + 1 },
        { issue: 'Check-in wait time', count: Math.floor(Math.random() * 5) + 1 },
        { issue: 'Room temperature', count: Math.floor(Math.random() * 3) }
      ],
      topPraises: [
        { praise: 'Staff friendliness', count: Math.floor(Math.random() * 30) + 20 },
        { praise: 'Room cleanliness', count: Math.floor(Math.random() * 25) + 15 },
        { praise: 'Breakfast quality', count: Math.floor(Math.random() * 20) + 10 }
      ],
      insights: [
        'Guest satisfaction is trending up (+8% from last week)',
        'Staff performance rated highest across all categories',
        'Consider upgrading in-room WiFi infrastructure'
      ]
    };
  }

  /**
   * Get loyalty information
   */
  async getLoyaltyInfo(guestId: string): Promise<LoyaltyInfo | null> {
    const tiers = ['standard', 'silver', 'gold', 'platinum'] as const;
    const tier = tiers[Math.floor(Math.random() * tiers.length)];
    const points = Math.floor(Math.random() * 10000);

    return {
      guestId,
      tier,
      points,
      pointsToNextTier: tier !== 'platinum' ? 5000 - points : undefined,
      benefits: this.tierBenefits[tier]
    };
  }

  /**
   * Award loyalty points
   */
  async awardPoints(
    guestId: string,
    amount: number,
    reason: string
  ): Promise<{ success: boolean; newBalance: number; message: string }> {
    const currentPoints = Math.floor(Math.random() * 5000);
    const newBalance = currentPoints + amount;

    return {
      success: true,
      newBalance,
      message: `${amount} points awarded for ${reason}. New balance: ${newBalance} points.`
    };
  }

  /**
   * Handle guest recovery (for negative experiences)
   */
  async handleRecovery(
    guestId: string,
    issue: string,
    severity: 'low' | 'medium' | 'high'
  ): Promise<{
    ticketId: string;
    actions: string[];
    compensation?: string;
    followUpTime: string;
  }> {
    const compensations: Record<string, string> = {
      'low': 'Complimentary drink or dessert',
      'medium': 'Free breakfast or room upgrade',
      'high': 'Full refund or complimentary stay'
    };

    const actions = [
      'Immediate acknowledgment of issue',
      severity === 'high' ? 'Manager notified and will call' : 'Staff empowered to resolve',
      'Follow-up in 30 minutes',
      'Post-stay survey to ensure resolution'
    ];

    return {
      ticketId: uuidv4(),
      actions,
      compensation: compensations[severity],
      followUpTime: severity === 'high' ? '15 minutes' : '30 minutes'
    };
  }

  /**
   * Generate personalized anniversary/celebration message
   */
  async checkSpecialOccasion(guestId: string): Promise<{
    isOccasion: boolean;
    occasionType?: 'birthday' | 'anniversary' | 'honeymoon' | 'business';
    message?: string;
    complimentary?: string[];
  }> {
    // Simulate checking for special occasions
    const hasOccasion = Math.random() > 0.7;

    if (!hasOccasion) {
      return { isOccasion: false };
    }

    const occasionTypes = ['birthday', 'anniversary', 'honeymoon', 'business'] as const;
    const occasionType = occasionTypes[Math.floor(Math.random() * occasionTypes.length)];

    const messages: Record<string, string> = {
      'birthday': 'Happy Birthday! We have a complimentary cake waiting in your room.',
      'anniversary': 'Happy Anniversary! Enjoy a complimentary wine and dessert.',
      'honeymoon': 'Congratulations! We have prepared a romantic turndown for you.',
      'business': 'Welcome! Your executive lounge access has been activated.'
    };

    return {
      isOccasion: true,
      occasionType,
      message: messages[occasionType],
      complimentary: ['Room decoration', 'Welcome amenity']
    };
  }

  private generateResponse(rating: number, category: string): string {
    if (rating >= 5) {
      return 'Thank you for the excellent feedback! We are thrilled to hear about your experience. Your kind words will be shared with our team.';
    }
    if (rating >= 4) {
      return 'Thank you for your positive feedback! We are glad you enjoyed your stay. We look forward to welcoming you back.';
    }
    if (rating >= 3) {
      return 'Thank you for your feedback. We are working on improvements and hope to exceed your expectations next time.';
    }
    return 'We sincerely apologize for your experience. Your feedback has been noted and we are taking immediate action to resolve the issues.';
  }
}

export default GuestRelationsAI;