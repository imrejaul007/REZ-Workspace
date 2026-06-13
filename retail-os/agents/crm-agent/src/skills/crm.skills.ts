export interface CRMSkill {
  name: string;
  description: string;
  actions: string[];
  confidence: number;
}

export const crmSkills: CRMSkill[] = [
  {
    name: 'customer_segmentation',
    description: 'Segment customers based on behavior, preferences, and value',
    actions: ['identify_customer_segments', 'analyze_segment_characteristics', 'recommend_segment_strategies', 'track_segment_performance'],
    confidence: 0.88,
  },
  {
    name: 'loyalty_management',
    description: 'Manage loyalty programs and rewards',
    actions: ['check_loyalty_status', 'award_points', 'redeem_points', 'analyze_loyalty_performance', 'suggest_loyalty_improvements'],
    confidence: 0.92,
  },
  {
    name: 'customer_communication',
    description: 'Manage customer outreach and messaging',
    actions: ['send_personalized_email', 'send_sms', 'send_push_notification', 'schedule_communication', 'track_delivery'],
    confidence: 0.90,
  },
  {
    name: 'abandoned_cart_recovery',
    description: 'Recover abandoned shopping carts through targeted outreach',
    actions: ['identify_abandoned_carts', 'send_recovery_email', 'offer_recovery_incentive', 'track_recovery_rate'],
    confidence: 0.85,
  },
  {
    name: 'customer_insights',
    description: 'Analyze customer behavior and generate insights',
    actions: ['analyze_purchase_history', 'identify_shopping_patterns', 'predict_churn_risk', 'recommend_next_best_action'],
    confidence: 0.86,
  },
  {
    name: 'campaign_management',
    description: 'Create and manage marketing campaigns',
    actions: ['create_campaign', 'target_campaign', 'track_campaign_performance', 'optimize_campaign'],
    confidence: 0.88,
  },
  {
    name: 'review_management',
    description: 'Manage product reviews and customer feedback',
    actions: ['respond_to_review', 'analyze_sentiment', 'identify_review_trends', 'flag_issues'],
    confidence: 0.82,
  },
];

export const skillDescriptions: Record<string, string> = {
  customer_segmentation: 'I can segment your customers into groups based on their shopping behavior, preferences, purchase history, and value to help you target them more effectively.',
  loyalty_management: 'I can help manage your loyalty program, check customer points, award bonuses, and analyze how well your loyalty program is performing.',
  customer_communication: 'I can help you send personalized messages to customers via email, SMS, or push notifications at the right time.',
  abandoned_cart_recovery: 'I can identify customers who abandoned their carts and send them targeted recovery messages with incentives to complete their purchase.',
  customer_insights: 'I can analyze customer behavior patterns, predict which customers might churn, and recommend the best actions to take for each customer.',
  campaign_management: 'I can help you create, target, and optimize marketing campaigns to drive engagement and sales.',
  review_management: 'I can help you respond to customer reviews, analyze sentiment, and identify trends in customer feedback.',
};
