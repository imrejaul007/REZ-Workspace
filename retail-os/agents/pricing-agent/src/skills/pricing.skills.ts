export interface PricingSkill {
  name: string;
  description: string;
  actions: string[];
  confidence: number;
}

export const pricingSkills: PricingSkill[] = [
  {
    name: 'price_optimization',
    description: 'Optimize prices based on demand, competition, and margin targets',
    actions: ['analyze_price_elasticity', 'calculate_optimal_price', 'suggest_price_adjustments', 'monitor_competitor_prices'],
    confidence: 0.88,
  },
  {
    name: 'promotion_management',
    description: 'Create and manage promotional campaigns and discounts',
    actions: ['create_promotion', 'schedule_promotion', 'analyze_promotion_performance', 'end_promotion_early'],
    confidence: 0.92,
  },
  {
    name: 'markdown_management',
    description: 'Manage price markdowns for slow-moving or seasonal inventory',
    actions: ['identify_markdown_candidates', 'calculate_markdown_depth', 'schedule_markdowns', 'track_markdown_performance'],
    confidence: 0.85,
  },
  {
    name: 'competitive_pricing',
    description: 'Monitor and respond to competitor pricing changes',
    actions: ['track_competitor_prices', 'analyze_price_gaps', 'respond_to_competitor_changes', 'maintain_price_position'],
    confidence: 0.80,
  },
  {
    name: 'margin_analysis',
    description: 'Analyze and optimize product margins',
    actions: ['calculate_current_margins', 'identify_margin_opportunities', 'set_margin_targets', 'track_margin_trends'],
    confidence: 0.90,
  },
  {
    name: 'price_testing',
    description: 'Design and analyze price testing experiments',
    actions: ['design_price_test', 'analyze_test_results', 'implement_winning_price', 'calculate_test_significance'],
    confidence: 0.82,
  },
];

export const skillDescriptions: Record<string, string> = {
  price_optimization: 'I can help optimize your prices based on demand elasticity, competitor prices, and your margin targets to maximize revenue and profit.',
  promotion_management: 'I can create and manage promotional campaigns, schedule sales events, and analyze promotion performance to drive traffic and conversions.',
  markdown_management: 'I can identify items that need price markdowns, calculate optimal markdown depth, and schedule markdowns to clear slow-moving inventory.',
  competitive_pricing: 'I can monitor competitor prices, identify pricing gaps, and help you maintain a competitive price position in the market.',
  margin_analysis: 'I can analyze your current product margins, identify opportunities for margin improvement, and track margin trends over time.',
  price_testing: 'I can design price testing experiments, analyze results statistically, and help you implement winning price points.',
};
